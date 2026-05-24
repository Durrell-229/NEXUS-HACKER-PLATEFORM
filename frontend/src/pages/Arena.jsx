import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Search, Filter, Users, Star, Lock, CheckCircle } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import HologramText from '../components/ui/HologramText'

const CATEGORIES = ['ALL', 'WEB', 'CRYPTO', 'REVERSE', 'PWN', 'FORENSICS', 'MISC']
const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD', 'INSANE']

const categoryColors = {
  WEB: { text: '#00ffcc', bg: 'rgba(0,255,204,0.12)', border: 'rgba(0,255,204,0.3)' },
  CRYPTO: { text: '#7b2fff', bg: 'rgba(123,47,255,0.12)', border: 'rgba(123,47,255,0.3)' },
  REVERSE: { text: '#ff0080', bg: 'rgba(255,0,128,0.12)', border: 'rgba(255,0,128,0.3)' },
  PWN: { text: '#ffa500', bg: 'rgba(255,165,0,0.12)', border: 'rgba(255,165,0,0.3)' },
  FORENSICS: { text: '#32ff64', bg: 'rgba(50,255,100,0.12)', border: 'rgba(50,255,100,0.3)' },
  MISC: { text: '#64c8ff', bg: 'rgba(100,200,255,0.12)', border: 'rgba(100,200,255,0.3)' },
}

const difficultyColors = {
  EASY: { text: '#32ff64', bg: 'rgba(50,255,100,0.08)', border: 'rgba(50,255,100,0.25)' },
  MEDIUM: { text: '#ffa500', bg: 'rgba(255,165,0,0.08)', border: 'rgba(255,165,0,0.25)' },
  HARD: { text: '#ff0080', bg: 'rgba(255,0,128,0.08)', border: 'rgba(255,0,128,0.25)' },
  INSANE: { text: '#7b2fff', bg: 'rgba(123,47,255,0.08)', border: 'rgba(123,47,255,0.25)' },
}

// Mock challenges data
const CHALLENGES = [
  { id: 1, title: 'SQL Injection Labyrinth', category: 'WEB', difficulty: 'EASY', points: 100, solves: 2847, solved: true, author: 'ph4ntom_r00t', description: 'A classic SQL injection with a twist. Can you bypass the WAF?' },
  { id: 2, title: 'JWT Forgery', category: 'WEB', difficulty: 'MEDIUM', points: 250, solves: 1204, solved: false, author: 'cyb3r_witch', description: 'The JWT implementation has a fatal flaw. Find it.' },
  { id: 3, title: 'GraphQL Injection', category: 'WEB', difficulty: 'HARD', points: 400, solves: 387, solved: false, author: 'null_ptr', description: 'Advanced GraphQL exploitation vectors.' },
  { id: 4, title: 'RSA Small Exponent', category: 'CRYPTO', difficulty: 'EASY', points: 150, solves: 1893, solved: true, author: 'binary_wolf', description: 'Classic low exponent RSA attack.' },
  { id: 5, title: 'AES-CBC Padding Oracle', category: 'CRYPTO', difficulty: 'HARD', points: 450, solves: 342, solved: false, author: 'x0r_master', description: 'Exploit the padding oracle to decrypt the ciphertext.' },
  { id: 6, title: 'ECC Fault Attack', category: 'CRYPTO', difficulty: 'INSANE', points: 600, solves: 89, solved: false, author: 'ph4ntom_r00t', description: 'Differential fault analysis on an ECC implementation.' },
  { id: 7, title: 'Buffer Overflow 101', category: 'PWN', difficulty: 'EASY', points: 150, solves: 2201, solved: false, author: 'null_ptr', description: 'Classic stack buffer overflow. ret2win.' },
  { id: 8, title: 'Format String Exploit', category: 'PWN', difficulty: 'MEDIUM', points: 300, solves: 876, solved: false, author: 'cyb3r_witch', description: 'Leak libc, overwrite GOT, get shell.' },
  { id: 9, title: 'Heap Feng Shui', category: 'PWN', difficulty: 'INSANE', points: 700, solves: 54, solved: false, author: 'ph4ntom_r00t', description: 'Full heap exploitation chain with tcache poisoning.' },
  { id: 10, title: 'ARM Reversing Challenge', category: 'REVERSE', difficulty: 'MEDIUM', points: 250, solves: 943, solved: false, author: 'binary_wolf', description: 'Reverse engineer an ARM binary to find the key.' },
  { id: 11, title: 'Packed Binary', category: 'REVERSE', difficulty: 'HARD', points: 400, solves: 412, solved: false, author: 'x0r_master', description: 'UPX-packed binary with anti-debug tricks.' },
  { id: 12, title: 'PCAP Analysis', category: 'FORENSICS', difficulty: 'EASY', points: 100, solves: 3201, solved: true, author: 'cyb3r_witch', description: 'Extract the flag from network traffic.' },
  { id: 13, title: 'Memory Forensics', category: 'FORENSICS', difficulty: 'HARD', points: 500, solves: 231, solved: false, author: 'ph4ntom_r00t', description: 'Analyze a Windows memory dump to find the attacker.' },
  { id: 14, title: 'Steganography Gauntlet', category: 'MISC', difficulty: 'MEDIUM', points: 200, solves: 1102, solved: false, author: 'null_ptr', description: 'Multi-layer steganography challenge.' },
  { id: 15, title: 'QR Code Maze', category: 'MISC', difficulty: 'EASY', points: 50, solves: 4892, solved: true, author: 'binary_wolf', description: 'Decode the nested QR codes to find the flag.' },
]

function ChallengeCard({ challenge, index }) {
  const navigate = useNavigate()
  const cat = categoryColors[challenge.category] || categoryColors.WEB
  const diff = difficultyColors[challenge.difficulty] || difficultyColors.EASY

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -3 }}
      onClick={() => navigate(`/arena/${challenge.id}`)}
      className="glass-card p-4 cursor-pointer group relative overflow-hidden"
      style={{ borderColor: challenge.solved ? 'rgba(0,255,204,0.2)' : undefined }}
    >
      {/* Solved overlay */}
      {challenge.solved && (
        <div
          className="absolute top-0 right-0 w-0 h-0"
          style={{
            borderLeft: '32px solid transparent',
            borderTop: '32px solid rgba(0,255,204,0.3)',
          }}
        />
      )}
      {challenge.solved && (
        <CheckCircle size={12} className="absolute top-1.5 right-1.5 text-nexus-cyan" />
      )}

      {/* Category & difficulty row */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
          style={{ color: cat.text, background: cat.bg, border: `1px solid ${cat.border}` }}
        >
          {challenge.category}
        </span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{ color: diff.text, background: diff.bg, border: `1px solid ${diff.border}` }}
        >
          {challenge.difficulty}
        </span>
        <span className="ml-auto text-xs font-mono font-bold text-nexus-cyan">
          {challenge.points} <span className="text-[10px] text-nexus-text-dim">pts</span>
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-mono font-bold text-nexus-text group-hover:text-white transition-colors mb-2 line-clamp-1">
        {challenge.title}
      </h3>

      {/* Description */}
      <p className="text-[11px] font-mono text-nexus-text-dim line-clamp-2 mb-3 leading-relaxed">
        {challenge.description}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] font-mono text-nexus-text-dim">
          <Users size={10} />
          <span>{challenge.solves.toLocaleString()} solves</span>
        </div>
        <div className="text-[10px] font-mono text-nexus-text-dim">
          by <span className="text-nexus-violet">{challenge.author}</span>
        </div>
      </div>

      {/* Bottom glow on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${cat.text}, transparent)` }}
      />
    </motion.div>
  )
}

export default function Arena() {
  const [category, setCategory] = useState('ALL')
  const [difficulty, setDifficulty] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showSolved, setShowSolved] = useState(true)

  const filtered = useMemo(() => {
    return CHALLENGES.filter((ch) => {
      if (category !== 'ALL' && ch.category !== category) return false
      if (difficulty !== 'ALL' && ch.difficulty !== difficulty) return false
      if (!showSolved && ch.solved) return false
      if (search && !ch.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [category, difficulty, search, showSolved])

  const stats = useMemo(() => ({
    total: CHALLENGES.length,
    solved: CHALLENGES.filter((c) => c.solved).length,
    categories: [...new Set(CHALLENGES.map((c) => c.category))].length,
  }), [])

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield size={20} className="text-nexus-cyan" style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,204,0.6))' }} />
            <HologramText as="h1" className="text-2xl font-display font-bold">ARENA</HologramText>
          </div>
          <p className="text-xs font-mono text-nexus-text-dim">
            {stats.solved}/{stats.total} challenges solved · {stats.categories} categories
          </p>
        </div>
        <NeonButton variant="primary" size="sm" leftIcon={<Star size={13} />}>
          MY SOLVES
        </NeonButton>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6 space-y-4"
      >
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded border border-nexus-border bg-nexus-surface focus-within:border-nexus-cyan/40">
            <Search size={13} className="text-nexus-text-dim flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH CHALLENGES..."
              className="flex-1 bg-transparent text-xs font-mono text-nexus-text placeholder:text-nexus-text-dim/40 outline-none caret-nexus-cyan"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-8 h-4 rounded-full transition-all ${showSolved ? 'bg-nexus-cyan' : 'bg-nexus-border'}`}
              onClick={() => setShowSolved((v) => !v)}
              style={{ boxShadow: showSolved ? '0 0 8px rgba(0,255,204,0.4)' : 'none' }}
            >
              <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${showSolved ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[10px] font-mono text-nexus-text-dim">SHOW SOLVED</span>
          </label>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-mono text-nexus-text-dim flex items-center mr-1">CATEGORY:</span>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat
            const c = cat !== 'ALL' ? categoryColors[cat] : null
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="text-[10px] font-mono px-3 py-1 rounded border transition-all"
                style={
                  isActive && c
                    ? { color: c.text, background: c.bg, borderColor: c.border }
                    : isActive
                    ? { color: '#00ffcc', background: 'rgba(0,255,204,0.1)', borderColor: 'rgba(0,255,204,0.4)' }
                    : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Difficulty filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-mono text-nexus-text-dim flex items-center mr-1">DIFFICULTY:</span>
          {DIFFICULTIES.map((diff) => {
            const isActive = difficulty === diff
            const c = diff !== 'ALL' ? difficultyColors[diff] : null
            return (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className="text-[10px] font-mono px-3 py-1 rounded border transition-all"
                style={
                  isActive && c
                    ? { color: c.text, background: c.bg, borderColor: c.border }
                    : isActive
                    ? { color: '#00ffcc', background: 'rgba(0,255,204,0.1)', borderColor: 'rgba(0,255,204,0.4)' }
                    : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {diff}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={12} className="text-nexus-text-dim" />
        <span className="text-xs font-mono text-nexus-text-dim">
          <span className="text-nexus-cyan font-bold">{filtered.length}</span> challenges found
        </span>
      </div>

      {/* Challenge grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <Shield size={40} className="text-nexus-text-dim mx-auto mb-4 opacity-30" />
            <p className="font-mono text-nexus-text-dim text-sm">No challenges match your filters</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((ch, i) => (
              <ChallengeCard key={ch.id} challenge={ch} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
