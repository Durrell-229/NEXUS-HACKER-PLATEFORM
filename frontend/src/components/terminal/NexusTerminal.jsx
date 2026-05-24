import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { useAuthStore } from '../../store/authStore'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export default function NexusTerminal({ className = '', onStatusChange }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  const wsRef = useRef(null)
  const inputBufferRef = useRef('')
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const { getToken } = useAuthStore()
  const [status, setStatus] = useState('disconnected') // connecting | connected | disconnected | error

  const updateStatus = useCallback((s) => {
    setStatus(s)
    onStatusChange?.(s)
  }, [onStatusChange])

  // Write to xterm
  const write = useCallback((data) => {
    termRef.current?.write(data)
  }, [])

  // Send input to WebSocket
  const sendInput = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: text }))
    }
  }, [])

  // Connect WebSocket
  const connect = useCallback(() => {
    const token = getToken()
    if (!token) {
      write('\r\n\x1b[1;31m  ERROR: No authentication token. Please log in.\x1b[0m\r\n')
      updateStatus('error')
      return
    }

    updateStatus('connecting')
    const ws = new WebSocket(`${WS_BASE}/ws/forge/terminal/?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      updateStatus('connected')
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'output') {
          // Convert \r\n line endings for xterm
          write(msg.data.replace(/\n/g, '\r\n'))
        }
      } catch {
        write(e.data)
      }
    }

    ws.onclose = (e) => {
      updateStatus('disconnected')
      if (e.code !== 1000) {
        write('\r\n\x1b[90m  [Connection closed. Press Enter to reconnect.]\x1b[0m\r\n')
      }
    }

    ws.onerror = () => {
      updateStatus('error')
      write('\r\n\x1b[1;31m  [WebSocket error — server may be offline]\x1b[0m\r\n')
    }
  }, [getToken, write, updateStatus])

  useEffect(() => {
    if (!containerRef.current) return

    // Init xterm
    const term = new Terminal({
      theme: {
        background:    '#020508',
        foreground:    '#c9d1d9',
        cursor:        '#00ffcc',
        cursorAccent:  '#020508',
        black:         '#1e1e2e',
        red:           '#ff4444',
        green:         '#00ff88',
        yellow:        '#ffcc00',
        blue:          '#4d9de0',
        magenta:       '#c678dd',
        cyan:          '#00ffcc',
        white:         '#ddd6fe',
        brightBlack:   '#444466',
        brightRed:     '#ff6b6b',
        brightGreen:   '#00ffcc',
        brightYellow:  '#ffd700',
        brightBlue:    '#79b8ff',
        brightMagenta: '#e879f9',
        brightCyan:    '#56d4fa',
        brightWhite:   '#ffffff',
        selectionBackground: 'rgba(0,255,204,0.2)',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      letterSpacing: 0.5,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowTransparency: true,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Handle keyboard input
    term.onKey(({ key, domEvent }) => {
      const ws = wsRef.current
      const isConnected = ws?.readyState === WebSocket.OPEN

      // Enter
      if (domEvent.key === 'Enter') {
        const cmd = inputBufferRef.current.trim()
        if (cmd) {
          historyRef.current.push(cmd)
          historyIndexRef.current = historyRef.current.length
        }
        inputBufferRef.current = ''

        if (!isConnected) {
          connect()
          return
        }
        sendInput(cmd)
        return
      }

      // Backspace
      if (domEvent.key === 'Backspace') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1)
          term.write('\b \b')
        }
        return
      }

      // Arrow Up — history
      if (domEvent.key === 'ArrowUp') {
        const h = historyRef.current
        if (h.length === 0) return
        const newIdx = Math.max(0, historyIndexRef.current - 1)
        historyIndexRef.current = newIdx
        const prev = h[newIdx] || ''
        // Clear current input
        term.write('\b \b'.repeat(inputBufferRef.current.length))
        inputBufferRef.current = prev
        term.write(prev)
        return
      }

      // Arrow Down — history
      if (domEvent.key === 'ArrowDown') {
        const h = historyRef.current
        const newIdx = Math.min(h.length, historyIndexRef.current + 1)
        historyIndexRef.current = newIdx
        const next = h[newIdx] || ''
        term.write('\b \b'.repeat(inputBufferRef.current.length))
        inputBufferRef.current = next
        term.write(next)
        return
      }

      // Ctrl+C
      if (domEvent.ctrlKey && domEvent.key === 'c') {
        term.write('^C\r\n')
        inputBufferRef.current = ''
        if (isConnected) sendInput('\x03')
        return
      }

      // Ctrl+L
      if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.write('\x1b[2J\x1b[H')
        return
      }

      // Printable characters
      if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
        inputBufferRef.current += key
        term.write(key)
      }
    })

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit() } catch {}
    })
    resizeObserver.observe(containerRef.current)

    // Connect
    connect()

    return () => {
      resizeObserver.disconnect()
      term.dispose()
      wsRef.current?.close(1000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', padding: '8px' }}
    />
  )
}
