import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Send, Trash2, Bot, Minimize2, Maximize2,
  Copy, Check, ChevronDown, Cpu, Zap,
  Search, Globe, Github, Terminal, Database, Loader
} from 'lucide-react'
import { useAIStore } from '../../store/aiStore'

const TOOL_META = {
  search_web:        { label: 'Web Search',    Icon: Search,   color: '#00ffcc' },
  fetch_url:         { label: 'Fetch URL',     Icon: Globe,    color: '#56d4fa' },
  search_github:     { label: 'GitHub',        Icon: Github,   color: '#c9d1d9' },
  search_kali_tools: { label: 'Kali Tools',   Icon: Terminal, color: '#00ff88' },
  search_exploits:   { label: 'ExploitDB',    Icon: Database, color: '#ff4444' },
}

function ToolBadge({ tool }) {
  const meta = TOOL_META[tool.name] || { label: tool.name, Icon: Zap, color: '#c678dd' }
  const { Icon } = meta
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono"
      style={{
        background: `${meta.color}10`,
        border: `1px solid ${meta.color}30`,
        color: meta.color,
      }}
    >
      {tool.status === 'running'
        ? <Loader size={9} className="animate-spin" />
        : <Icon size={9} />
      }
      <span>{meta.label}</span>
      {tool.args?.query && (
        <span className="text-gray-600 max-w-[120px] truncate">"{tool.args.query}"</span>
      )}
      {tool.args?.url && (
        <span className="text-gray-600 max-w-[120px] truncate">{tool.args.url.replace(/^https?:\/\//, '')}</span>
      )}
    </motion.div>
  )
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────

function renderContent(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let inCode = false
  let codeLang = ''
  let codeLines = []
  let key = 0

  const flushCode = () => {
    if (codeLines.length) {
      elements.push(
        <CodeBlock key={key++} lang={codeLang} code={codeLines.join('\n')} />
      )
      codeLines = []
      codeLang = ''
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
      } else {
        inCode = false
        flushCode()
      }
      continue
    }
    if (inCode) {
      codeLines.push(line)
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key++} className="font-mono text-xs font-bold text-cyan-400 mt-3 mb-1">{line.slice(4)}</h4>)
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={key++} className="font-mono text-xs font-bold text-cyan-300 mt-3 mb-1 tracking-wide">{line.slice(3)}</h3>)
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={key++} className="font-mono text-sm font-bold text-cyan-200 mt-3 mb-1">{line.slice(2)}</h2>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-2">
          <span className="text-cyan-500 mt-0.5 flex-shrink-0">▸</span>
          <span className="text-gray-300 text-xs leading-relaxed">{inlineFormat(line.slice(2))}</span>
        </div>
      )
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)[1]
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-2">
          <span className="text-cyan-500 font-mono text-xs flex-shrink-0">{num}.</span>
          <span className="text-gray-300 text-xs leading-relaxed">{inlineFormat(line.replace(/^\d+\. /, ''))}</span>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1.5" />)
    } else {
      elements.push(
        <p key={key++} className="text-gray-300 text-xs leading-relaxed">{inlineFormat(line)}</p>
      )
    }
  }
  if (inCode) flushCode()
  return elements
}

function inlineFormat(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="font-mono text-[11px] px-1 py-0.5 rounded text-green-400" style={{ background: 'rgba(0,255,136,0.08)' }}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="my-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,255,136,0.15)' }}>
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: 'rgba(0,255,136,0.06)' }}
      >
        <span className="font-mono text-[10px] text-green-400 tracking-widest">{lang || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 font-mono text-[10px] transition-colors"
          style={{ color: copied ? '#00ff88' : '#555577' }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre
        className="px-3 py-2.5 overflow-x-auto text-[11px] leading-relaxed text-green-300 font-mono"
        style={{ background: '#020508' }}
      >
        {code}
      </pre>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.error

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser
            ? 'rgba(0,255,204,0.1)'
            : isError
            ? 'rgba(255,68,68,0.1)'
            : 'rgba(123,47,255,0.15)',
          border: `1px solid ${isUser ? 'rgba(0,255,204,0.3)' : isError ? 'rgba(255,68,68,0.3)' : 'rgba(123,47,255,0.3)'}`,
        }}
      >
        {isUser
          ? <span className="font-mono text-[9px] font-bold" style={{ color: '#00ffcc' }}>YOU</span>
          : <Bot size={12} style={{ color: isError ? '#ff4444' : '#c678dd' }} />
        }
      </div>

      {/* Bubble */}
      <div
        className={`flex-1 rounded-lg px-3 py-2.5 max-w-[90%] ${isUser ? 'items-end' : ''}`}
        style={{
          background: isUser
            ? 'rgba(0,255,204,0.05)'
            : isError
            ? 'rgba(255,68,68,0.05)'
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isUser ? 'rgba(0,255,204,0.15)' : isError ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        {/* Tool calls display */}
        {!isUser && msg.tools?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {msg.tools.map((t, i) => <ToolBadge key={i} tool={t} />)}
          </div>
        )}

        {isUser ? (
          <p className="text-xs text-gray-200 leading-relaxed font-mono">{msg.content}</p>
        ) : msg.streaming && !msg.content && !msg.tools?.length ? (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex gap-1"
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#c678dd',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </motion.div>
            <span className="font-mono text-[10px] text-purple-400">Generating...</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {renderContent(msg.content)}
            {msg.streaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="inline-block w-2 h-3.5 ml-0.5 align-middle"
                style={{ background: '#c678dd' }}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Explique le fonctionnement d'un buffer overflow",
  'Écris un exploit Python pour un simple stack BOF',
  'Comment trouver des vulnérabilités SQL injection ?',
  'Montre-moi un exemple de Kerberoasting',
  'Analyse ce code pour des vulnérabilités :',
  'Comment bypass une WAF moderne ?',
]

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AIPanel() {
  const { open, messages, isStreaming, toggle, sendMessage, clearHistory } = useAIStore()
  const [input, setInput] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    await sendMessage(text)
  }, [input, isStreaming, sendMessage])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const width  = expanded ? '640px' : '420px'
  const height = minimized ? '48px' : expanded ? '80vh' : '580px'

  return (
    <>
      {/* ── Floating trigger button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7b2fff, #c678dd)',
              boxShadow: '0 0 24px rgba(123,47,255,0.5), 0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <Bot size={24} className="text-white" />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(123,47,255,0.6)' }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-xl overflow-hidden"
            style={{
              width,
              height,
              background: 'rgba(4, 6, 18, 0.97)',
              border: '1px solid rgba(123,47,255,0.3)',
              boxShadow: '0 0 40px rgba(123,47,255,0.15), 0 24px 80px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(24px)',
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 flex-shrink-0"
              style={{
                height: '48px',
                background: 'linear-gradient(90deg, rgba(123,47,255,0.15), rgba(198,120,221,0.08))',
                borderBottom: '1px solid rgba(123,47,255,0.2)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(123,47,255,0.3)', border: '1px solid rgba(123,47,255,0.4)' }}
                >
                  <Cpu size={14} style={{ color: '#c678dd' }} />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-white tracking-wide">NEXUS-AI</div>
                  <div className="font-mono text-[9px] text-gray-600 tracking-widest">
                    DeepSeek-V4-Flash · NIM
                  </div>
                </div>
                {isStreaming && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="flex items-center gap-1"
                  >
                    <Zap size={11} style={{ color: '#c678dd' }} />
                    <span className="font-mono text-[9px]" style={{ color: '#c678dd' }}>THINKING</span>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearHistory}
                  className="p-1.5 rounded text-gray-700 hover:text-red-400 transition-colors"
                  title="Clear history"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="p-1.5 rounded text-gray-700 hover:text-white transition-colors"
                  title={expanded ? 'Shrink' : 'Expand'}
                >
                  {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  onClick={() => setMinimized(m => !m)}
                  className="p-1.5 rounded text-gray-700 hover:text-white transition-colors"
                >
                  <ChevronDown
                    size={13}
                    style={{ transform: minimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>
                <button
                  onClick={toggle}
                  className="p-1.5 rounded text-gray-700 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.25)' }}
                      >
                        <Bot size={28} style={{ color: '#c678dd' }} />
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-xs text-white font-bold mb-1">NEXUS-AI prêt</p>
                        <p className="font-mono text-[10px] text-gray-600">Expert hacking & programmation</p>
                      </div>
                      <div className="w-full space-y-1.5">
                        <p className="font-mono text-[9px] text-gray-700 tracking-widest px-1">SUGGESTIONS</p>
                        {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(p); inputRef.current?.focus() }}
                            className="w-full text-left px-3 py-2 rounded text-[10px] font-mono text-gray-400 hover:text-white transition-colors"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map(msg => <Message key={msg.id} msg={msg} />)
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div
                  className="flex-shrink-0 p-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="flex items-end gap-2 rounded-lg p-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(123,47,255,0.2)' }}
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Pose une question sur le hacking ou la programmation..."
                      rows={1}
                      className="flex-1 bg-transparent resize-none outline-none font-mono text-xs text-gray-200 placeholder:text-gray-700 leading-relaxed"
                      style={{
                        caretColor: '#c678dd',
                        maxHeight: '120px',
                        overflowY: 'auto',
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto'
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                      }}
                      disabled={isStreaming}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      disabled={!input.trim() || isStreaming}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: input.trim() && !isStreaming
                          ? 'linear-gradient(135deg, #7b2fff, #c678dd)'
                          : 'rgba(255,255,255,0.05)',
                        opacity: !input.trim() || isStreaming ? 0.5 : 1,
                      }}
                    >
                      <Send size={13} className="text-white" />
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="font-mono text-[9px] text-gray-700">Enter pour envoyer · Shift+Enter pour nouvelle ligne</span>
                    <span className="font-mono text-[9px] text-gray-700">{messages.length} msgs</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
