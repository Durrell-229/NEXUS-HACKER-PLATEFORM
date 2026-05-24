import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import { Shield, FlaskConical, BookOpen, Trophy, Users, Zap, ArrowRight, Terminal, Lock, Globe, Code2, ChevronRight } from 'lucide-react'

// ── Lottie animations
import cyberScanData from '../assets/animations/cyber-scan.json'
import shieldPulseData from '../assets/animations/shield-pulse.json'
import matrixRainData from '../assets/animations/matrix-rain.json'

// ── Constants
const STATS = [
  { value: '12,847', label: 'HACKERS', icon: Users },
  { value: '384',    label: 'CHALLENGES', icon: Shield },
  { value: '96',     label: 'ACTIVE LABS', icon: FlaskConical },
  { value: '2.1M',   label: 'FLAGS CAPTURED', icon: Trophy },
]

const MODULES = [
  {
    key: 'ARENA',
    icon: Shield,
    title: 'Challenge Arena',
    desc: 'Web · Crypto · Reverse · Pwn · Forensics. Real challenges, real XP, real ranking.',
    tags: ['384 Challenges', '6 Categories', 'Live CTF'],
    color: '#9fef00',
    diff: 'EASY → INSANE',
  },
  {
    key: 'LABYRINTH',
    icon: FlaskConical,
    title: 'Machine Labs',
    desc: 'Spin vulnerable machines. Get root. Capture flags. VPN-isolated environments.',
    tags: ['96 Machines', 'Docker Isolated', 'VPN Access'],
    color: '#a78bfa',
    diff: 'MEDIUM → HARD',
  },
  {
    key: 'CODEX',
    icon: BookOpen,
    title: 'Knowledge Base',
    desc: 'Community writeups, exploit chains, methodology guides. Peer-reviewed.',
    tags: ['1,240 Articles', 'Peer Reviewed', 'Always Fresh'],
    color: '#ff6b7a',
    diff: 'ALL LEVELS',
  },
  {
    key: 'FORGE',
    icon: Code2,
    title: 'Code Forge',
    desc: 'Collaborative code editor with exploit templates, sandbox execution.',
    tags: ['Multi-lang', 'Sandbox', 'Collab'],
    color: '#60a5fa',
    diff: 'BUILDER',
  },
]

const TERMINAL_LINES = [
  { prompt: '$ nexus auth --user operator --key ****', out: '✓ Authentication successful. Welcome back.', c: '#9fef00', delay: 0 },
  { prompt: '$ nexus arena scan --category=pwn --diff=hard', out: 'Found 23 challenges · 4 unsolved · Recommended: buffer_overflow_101', c: '#a4b1cd', delay: 0.4 },
  { prompt: '$ nexus solve buffer_overflow_101 --flag=NEXUS{h0p_n3xt_lvl}', out: '🎯 FLAG ACCEPTED · +500 XP · RANK: Silver → Gold', c: '#ffd700', delay: 0.8 },
  { prompt: '$ nexus lab spawn --machine=vulnbox-42 --vpn', out: '↑ Spawning environment · IP: 10.10.10.42 · Ready in 12s', c: '#a78bfa', delay: 1.2 },
]

// ── Matrix Canvas background
function MatrixCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const cols = Math.floor(canvas.width / 20)
    const drops = Array(cols).fill(1)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ'

    let raf
    const draw = () => {
      ctx.fillStyle = 'rgba(13,17,23,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(159,239,0,0.15)'
      ctx.font = '13px monospace'

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * 20, drops[i] * 20)
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" />
}

// ── Hexagon Grid
function HexGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute htb-hex-clip border border-htb-green/5"
          style={{
            width: 60 + Math.random() * 40,
            height: 60 + Math.random() * 40,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: 'rgba(159,239,0,0.01)',
          }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}
    </div>
  )
}

// ── Difficulty Dot
function DiffDot({ label }) {
  const colors = { EASY: '#9fef00', MEDIUM: '#ffaf00', HARD: '#ff4757', INSANE: '#ff0000' }
  return (
    <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: colors[label] || '#9fef00' }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: colors[label] || '#9fef00', boxShadow: `0 0 4px ${colors[label] || '#9fef00'}` }} />
      {label}
    </span>
  )
}

// ── HTB-style Machine Card
function MachineCard({ module, index }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => navigate('/register')}
      className="relative p-5 rounded-lg cursor-pointer group overflow-hidden"
      style={{
        background: '#1a2332',
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${module.color}40` }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${module.color}, transparent)` }}
      />

      {/* Icon + Label */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${module.color}14`, border: `1px solid ${module.color}30` }}
        >
          <module.icon size={18} style={{ color: module.color, filter: `drop-shadow(0 0 4px ${module.color}80)` }} />
        </div>
        <span
          className="text-[9px] font-mono font-bold px-2 py-1 rounded tracking-widest"
          style={{ background: `${module.color}12`, color: module.color, border: `1px solid ${module.color}25` }}
        >
          {module.key}
        </span>
      </div>

      <h3 className="text-sm font-display font-bold text-htb-text mb-2 group-hover:text-white transition-colors">
        {module.title}
      </h3>
      <p className="text-[11px] font-mono text-htb-text-dim leading-relaxed mb-4">{module.desc}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {module.tags.map((t) => (
          <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: '#0d1117', color: '#5a6a7e', border: '1px solid rgba(255,255,255,0.06)' }}>
            {t}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[10px] font-mono" style={{ color: module.color }}>
          {module.diff}
        </span>
        <motion.div
          className="flex items-center gap-1 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: module.color }}
        >
          ENTER <ChevronRight size={10} />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Terminal Line with typewriter
function TermLine({ line, visible }) {
  const [typed, setTyped] = useState('')
  const [showOut, setShowOut] = useState(false)

  useEffect(() => {
    if (!visible) return
    let i = 0
    const iv = setInterval(() => {
      setTyped(line.prompt.slice(0, ++i))
      if (i >= line.prompt.length) { clearInterval(iv); setTimeout(() => setShowOut(true), 200) }
    }, 20)
    return () => clearInterval(iv)
  }, [visible, line.prompt])

  return (
    <div className="mb-3">
      <div className="text-htb-green font-mono text-xs">
        {typed}
        {typed.length < line.prompt.length && <span className="animate-boot-blink">█</span>}
      </div>
      <AnimatePresence>
        {showOut && (
          <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="ml-4 font-mono text-xs opacity-80 mt-0.5" style={{ color: line.c }}>
            {line.out}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Landing
export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 600], [0, -60])
  const [activeTermLine, setActiveTermLine] = useState(0)
  const [termVisible, setTermVisible] = useState(false)

  // Sequentially show terminal lines
  useEffect(() => {
    if (!termVisible) return
    if (activeTermLine >= TERMINAL_LINES.length) return
    const t = setTimeout(() => setActiveTermLine((p) => p + 1), TERMINAL_LINES[activeTermLine]?.delay * 1000 + 1200 || 1400)
    return () => clearTimeout(t)
  }, [termVisible, activeTermLine])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0d1117' }}>
      <div className="scanline-overlay" />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <MatrixCanvas />
        <HexGrid />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(159,239,0,0.04) 0%, transparent 70%)' }} />

        {/* Lottie radar */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[420px] h-[420px] opacity-30 hidden lg:block pointer-events-none">
          <Lottie animationData={cyberScanData} loop autoplay />
        </div>
        <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-20 hidden xl:block pointer-events-none">
          <Lottie animationData={matrixRainData} loop autoplay />
        </div>

        {/* Content */}
        <motion.div style={{ y: parallaxY }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
            style={{ background: 'rgba(159,239,0,0.06)', border: '1px solid rgba(159,239,0,0.2)' }}
          >
            <span className="w-2 h-2 rounded-full bg-htb-green animate-pulse" style={{ boxShadow: '0 0 6px #9fef00' }} />
            <span className="text-[10px] font-mono text-htb-green tracking-[0.25em]">SYSTEM ONLINE · v4.2.0 · 12,847 CONNECTED</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-display font-black leading-none tracking-[0.08em] select-none mb-4"
            style={{
              fontSize: 'clamp(72px, 15vw, 160px)',
              color: '#9fef00',
              textShadow: '0 0 20px rgba(159,239,0,0.4), 0 0 60px rgba(159,239,0,0.15)',
            }}
          >
            NEXUS
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-base sm:text-xl font-display font-light tracking-[0.25em] mb-4"
            style={{ color: '#5a6a7e' }}
          >
            THE ULTIMATE HACKING PLATFORM
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs font-mono max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#3d4f62' }}
          >
            CTF · Vulnerable Machines · Knowledge Base · Real-time Competition · Elite Community
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={() => navigate('/register')}
              className="htb-btn text-sm px-8 py-3"
              style={{ fontSize: '11px', letterSpacing: '0.15em' }}
            >
              START HACKING <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="htb-btn-ghost text-sm px-8 py-3"
              style={{ fontSize: '11px', letterSpacing: '0.15em' }}
            >
              SIGN IN
            </button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute -bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[9px] font-mono tracking-[0.3em]" style={{ color: '#2d3d4d' }}>SCROLL</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #9fef00, transparent)' }} />
          </motion.div>
        </motion.div>

        {/* Corner brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-htb-green/20" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-htb-green/20" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-htb-green/15" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-htb-green/15" />
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-16 px-6" style={{ background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="text-center p-5 rounded-lg"
              style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <s.icon size={16} className="mx-auto mb-3 opacity-40" style={{ color: '#9fef00' }} />
              <div className="text-2xl font-display font-black mb-1" style={{ color: '#9fef00', textShadow: '0 0 12px rgba(159,239,0,0.3)' }}>
                {s.value}
              </div>
              <div className="text-[10px] font-mono tracking-[0.2em]" style={{ color: '#3d4f62' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ MODULES ═══ */}
      <section className="py-24 px-6" style={{ background: '#0d1117' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-[9px] font-mono tracking-[0.4em] mb-3" style={{ color: '#3d4f62' }}>PLATFORM MODULES</div>
            <h2 className="text-3xl font-display font-black mb-4" style={{ color: '#e4e8f0' }}>YOUR ARSENAL</h2>
            <div className="w-16 h-px mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #9fef00, transparent)' }} />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m, i) => <MachineCard key={m.key} module={m} index={i} />)}
          </div>
        </div>
      </section>

      {/* ═══ LOTTIE SHOWCASE ═══ */}
      <section className="py-24 px-6" style={{ background: '#141d2b' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Lottie animation */}
            <div className="flex items-center justify-center">
              <div className="relative w-72 h-72">
                {/* Outer decorative rings */}
                <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(159,239,0,0.08)' }} />
                <div className="absolute inset-6 rounded-full" style={{ border: '1px solid rgba(159,239,0,0.06)' }} />
                {/* Lottie */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64">
                    <Lottie animationData={shieldPulseData} loop autoplay />
                  </div>
                </div>
                {/* Corner badges */}
                {[
                  { label: 'WEB', color: '#9fef00', pos: 'top-0 right-0' },
                  { label: 'PWN', color: '#ffaf00', pos: 'bottom-0 left-0' },
                  { label: 'REV', color: '#a78bfa', pos: 'top-0 left-0' },
                  { label: 'CRYPTO', color: '#ff6b7a', pos: 'bottom-0 right-0' },
                ].map((b) => (
                  <div key={b.label} className={`absolute ${b.pos} text-[9px] font-mono font-bold px-2 py-1 rounded`} style={{ background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}30` }}>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Text */}
            <div>
              <div className="text-[9px] font-mono tracking-[0.4em] mb-3" style={{ color: '#3d4f62' }}>WHY NEXUS</div>
              <h2 className="text-3xl font-display font-black mb-6" style={{ color: '#e4e8f0' }}>
                BUILT FOR THE<br />
                <span style={{ color: '#9fef00', textShadow: '0 0 16px rgba(159,239,0,0.3)' }}>ELITE</span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Lock, label: 'Military-grade isolation', desc: 'Docker VMs, isolated networks, zero cross-contamination' },
                  { icon: Globe, label: 'Global community', desc: '12,847+ hackers competing across 180+ countries' },
                  { icon: Zap, label: 'Real-time scoring', desc: 'Live leaderboard, instant flag validation, XP awards' },
                  { icon: Terminal, label: 'Native terminal', desc: 'Full-featured browser terminal with VPN management' },
                ].map((f) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(159,239,0,0.08)', border: '1px solid rgba(159,239,0,0.15)' }}>
                      <f.icon size={14} style={{ color: '#9fef00' }} />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold mb-0.5" style={{ color: '#a4b1cd' }}>{f.label}</div>
                      <div className="text-[11px] font-mono leading-relaxed" style={{ color: '#3d4f62' }}>{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TERMINAL PREVIEW ═══ */}
      <section className="py-24 px-6" style={{ background: '#0d1117' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            onViewportEnter={() => setTermVisible(true)}
            viewport={{ once: true }}
          >
            <div className="text-center mb-10">
              <div className="text-[9px] font-mono tracking-[0.4em] mb-2" style={{ color: '#3d4f62' }}>LIVE DEMO</div>
              <h2 className="text-2xl font-display font-black" style={{ color: '#e4e8f0' }}>NEXUS SHELL</h2>
            </div>

            {/* Terminal window */}
            <div className="rounded-lg overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(159,239,0,0.12)' }}>
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#1a2332', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#9fef00' }} />
                <Terminal size={12} className="ml-3" style={{ color: '#5a6a7e' }} />
                <span className="text-[10px] font-mono ml-1" style={{ color: '#5a6a7e' }}>nexus-shell — operator@nexus:~</span>
              </div>

              {/* Terminal body */}
              <div className="p-6 min-h-[200px]">
                {TERMINAL_LINES.slice(0, activeTermLine + 1).map((line, i) => (
                  <TermLine key={i} line={line} visible={termVisible && i <= activeTermLine} />
                ))}
                {activeTermLine < TERMINAL_LINES.length && (
                  <div className="flex items-center gap-1">
                    <span className="text-htb-green font-mono text-xs">$ </span>
                    <span className="w-2 h-4 animate-boot-blink inline-block" style={{ background: '#9fef00' }} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-32 px-6 text-center overflow-hidden" style={{ background: '#141d2b' }}>
        <div className="absolute inset-0 pointer-events-none htb-hex-bg opacity-50" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(159,239,0,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[9px] font-mono tracking-[0.4em] mb-4" style={{ color: '#3d4f62' }}>READY TO HACK?</div>
            <h2
              className="text-5xl sm:text-6xl font-display font-black mb-6"
              style={{ color: '#9fef00', textShadow: '0 0 30px rgba(159,239,0,0.25)' }}
            >
              JOIN THE GRID
            </h2>
            <p className="text-xs font-mono mb-10 leading-relaxed" style={{ color: '#3d4f62' }}>
              Free access. Instant activation. Start hacking in 60 seconds.
            </p>

            <button
              onClick={() => navigate('/register')}
              className="htb-btn text-sm px-10 py-4 mx-auto"
              style={{ fontSize: '11px', letterSpacing: '0.2em' }}
            >
              ACCESS NEXUS <Zap size={14} />
            </button>

            <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-mono" style={{ color: '#3d4f62' }}>
              <span>✓ Free tier forever</span>
              <span>✓ No credit card</span>
              <span>✓ Instant access</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Creator signature — animated */}
        <div className="relative overflow-hidden py-12 px-6" style={{ background: 'linear-gradient(180deg, #0d1117 0%, #141d2b 100%)', borderBottom: '1px solid rgba(159,239,0,0.06)' }}>
          <div className="absolute inset-0 htb-hex-bg opacity-30 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 80% at 50% 100%, rgba(159,239,0,0.05) 0%, transparent 70%)' }} />

          <div className="relative z-10 text-center">
            <div className="text-[9px] font-mono tracking-[0.5em] mb-4" style={{ color: '#3d4f62' }}>CRAFTED WITH PRECISION BY</div>

            {/* Main signature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex items-center justify-center gap-4 mb-3"
            >
              {/* Animated left line */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 80 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #9fef00)' }}
              />

              {/* Creator name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="relative"
              >
                {/* Glow */}
                <div className="absolute inset-0 blur-xl" style={{ background: 'rgba(159,239,0,0.15)', borderRadius: '50%' }} />
                <h3
                  className="relative text-3xl sm:text-4xl font-display font-black tracking-[0.15em]"
                  style={{ color: '#9fef00', textShadow: '0 0 20px rgba(159,239,0,0.5), 0 0 60px rgba(159,239,0,0.2)' }}
                >
                  leoDUrrell
                </h3>
              </motion.div>

              {/* Animated right line */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 80 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-px"
                style={{ background: 'linear-gradient(90deg, #9fef00, transparent)' }}
              />
            </motion.div>

            {/* TEAM badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <motion.div
                className="flex items-center gap-2 px-6 py-2 rounded-full"
                style={{ background: 'rgba(159,239,0,0.06)', border: '1px solid rgba(159,239,0,0.2)' }}
                animate={{ boxShadow: ['0 0 8px rgba(159,239,0,0.1)', '0 0 20px rgba(159,239,0,0.2)', '0 0 8px rgba(159,239,0,0.1)'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#9fef00' }}
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs font-display font-black tracking-[0.3em]" style={{ color: '#9fef00' }}>TEAM</span>
              </motion.div>
            </motion.div>

            {/* Floating particles around signature */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ background: '#9fef00', left: `${20 + i * 8}%`, top: '50%' }}
                  animate={{
                    y: [0, -20 - i * 5, 0],
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            {/* Tech stack */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-3 flex-wrap"
            >
              {['React 18', 'Django 5', 'WebSockets', 'Docker', 'PostgreSQL', 'Redis', 'Kali Linux'].map((tech) => (
                <span key={tech} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ color: '#3d4f62', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-lg font-display font-black tracking-widest" style={{ color: '#9fef00', textShadow: '0 0 8px rgba(159,239,0,0.3)' }}>
              NEXUS
            </div>
            <div className="text-[10px] font-mono text-center" style={{ color: '#2d3d4d' }}>
              © 2026 NEXUS PLATFORM · ALL RIGHTS RESERVED · Created by leoDUrrell TEAM
            </div>
            <div className="flex items-center gap-5 text-[10px] font-mono" style={{ color: '#3d4f62' }}>
              {['DOCS', 'API', 'DISCORD', 'GITHUB'].map((l) => (
                <span key={l} className="hover:text-htb-green cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
