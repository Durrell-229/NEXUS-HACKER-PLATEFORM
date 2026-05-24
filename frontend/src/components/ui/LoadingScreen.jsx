import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-60px)]">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 rounded-full"
          style={{ borderColor: 'rgba(0,255,204,0.15)', borderTopColor: '#00ffcc' }}
        />
        <span className="font-mono text-xs text-nexus-text-dim tracking-widest">LOADING...</span>
      </div>
    </div>
  )
}

const BOOT_LINES = [
  'NEXUS OS v4.2.0 — INITIALIZING...',
  'Loading kernel modules...',
  'Establishing encrypted connection... [OK]',
  'Mounting neural interface... [OK]',
  'Loading weapon systems... [OK]',
  'Syncing exploit database: 47,829 entries... [OK]',
  'Initializing holographic render engine... [OK]',
  'Loading challenge matrix... [OK]',
  'Connecting to grid... [OK]',
  'NEXUS ONLINE — ACCESS GRANTED',
]

function TerminalLine({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let timeout
    timeout = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i))
          i++
        } else {
          clearInterval(interval)
          setDone(true)
        }
      }, 18)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])

  const isLast = text === BOOT_LINES[BOOT_LINES.length - 1]

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
      className={`flex items-center gap-2 text-sm font-mono ${
        isLast ? 'text-nexus-cyan font-bold' : 'text-nexus-text-dim'
      }`}
    >
      <span className="text-nexus-cyan/40">&gt;</span>
      <span>{displayed}</span>
      {!done && (
        <span
          className="inline-block w-2 h-4 bg-nexus-cyan ml-0.5"
          style={{ animation: 'cursor-blink 1s step-end infinite' }}
        />
      )}
    </motion.div>
  )
}

export default function LoadingScreen() {
  const [visibleLines, setVisibleLines] = useState(1)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    let count = 1
    const interval = setInterval(() => {
      count++
      setVisibleLines(count)
      if (count >= BOOT_LINES.length) {
        clearInterval(interval)
        setTimeout(() => setComplete(true), 800)
      }
    }, 260)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {!complete && (
        <motion.div
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-nexus-dark"
        >
          {/* Scanlines */}
          <div className="scan-lines absolute inset-0 pointer-events-none opacity-30" />

          {/* Grid background */}
          <div className="absolute inset-0 nexus-grid-bg opacity-30" />

          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,255,204,0.05) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 w-full max-w-2xl px-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div
                className="text-6xl font-display font-black tracking-widest text-nexus-cyan mb-2"
                style={{
                  textShadow: '0 0 20px #00ffcc, 0 0 40px rgba(0,255,204,0.5)',
                }}
              >
                NEXUS
              </div>
              <div className="text-nexus-text-dim font-mono text-xs tracking-[0.4em] uppercase">
                PLATFORM // INITIALIZING
              </div>
            </motion.div>

            {/* Terminal box */}
            <div className="glass-card p-6 rounded-lg">
              {/* Terminal header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-nexus-border">
                <div className="w-2.5 h-2.5 rounded-full bg-nexus-magenta/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-nexus-cyan/80" />
                <span className="ml-2 font-mono text-xxs text-nexus-text-dim tracking-widest uppercase">
                  NEXUS TERMINAL — BOOT SEQUENCE
                </span>
              </div>

              {/* Boot lines */}
              <div className="space-y-1.5 min-h-[280px]">
                {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                  <TerminalLine
                    key={i}
                    text={line}
                    delay={0}
                  />
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="xp-bar-track">
                <motion.div
                  className="xp-bar-fill"
                  animate={{ width: `${(visibleLines / BOOT_LINES.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xxs font-mono text-nexus-text-dim">SYSTEM BOOT</span>
                <span className="text-xxs font-mono text-nexus-cyan">
                  {Math.round((visibleLines / BOOT_LINES.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
