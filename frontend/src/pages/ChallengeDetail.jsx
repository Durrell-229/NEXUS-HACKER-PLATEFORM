import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ArrowLeft, Users, Clock, Star, Flag,
  Download, Eye, EyeOff, CheckCircle, XCircle, Lightbulb, Lock
} from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import HologramText from '../components/ui/HologramText'

// Mock challenge data
const MOCK_CHALLENGE = {
  id: 1,
  title: 'SQL Injection Labyrinth',
  category: 'WEB',
  difficulty: 'MEDIUM',
  points: 250,
  solves: 1204,
  author: 'ph4ntom_r00t',
  createdAt: '2026-03-15',
  description: `## Challenge Description

A seemingly innocent web application hides a dangerous SQL injection vulnerability. The developers thought they were safe with their custom WAF, but they were wrong.

**Objective**: Extract the admin password from the database and log in as admin to retrieve the flag.

**URL**: \`http://chall.nexus.io:8080\`

### Hints are available if you get stuck.

\`\`\`
Username: user1
Password: password123
\`\`\`

The flag format is: \`NEXUS{...}\``,
  files: [
    { name: 'source.zip', size: '24.8 KB' },
    { name: 'docker-compose.yml', size: '1.2 KB' },
  ],
  hints: [
    { id: 1, cost: 25, unlocked: false, text: 'The WAF only checks for single quotes. What about other quote types?' },
    { id: 2, cost: 50, unlocked: false, text: 'Try UNION-based injection with 3 columns.' },
    { id: 3, cost: 75, unlocked: true, text: 'The users table has columns: id, username, password, is_admin' },
  ],
  solvers: [
    { rank: 1, username: 'cyb3r_witch', time: '0:14:23', date: '2026-03-15' },
    { rank: 2, username: 'null_ptr', time: '0:21:07', date: '2026-03-15' },
    { rank: 3, username: 'binary_wolf', time: '0:28:44', date: '2026-03-16' },
    { rank: 4, username: 'x0r_master', time: '0:35:12', date: '2026-03-16' },
    { rank: 5, username: 'h4x0r_elite', time: '0:42:18', date: '2026-03-16' },
  ],
}

const categoryColors = {
  WEB: '#00ffcc', CRYPTO: '#7b2fff', REVERSE: '#ff0080', PWN: '#ffa500', FORENSICS: '#32ff64', MISC: '#64c8ff',
}
const diffColors = { EASY: '#32ff64', MEDIUM: '#ffa500', HARD: '#ff0080', INSANE: '#7b2fff' }

export default function ChallengeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [flag, setFlag] = useState('')
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'correct' | 'wrong' | 'submitting'
  const [hints, setHints] = useState(MOCK_CHALLENGE.hints)
  const [revealedHints, setRevealedHints] = useState(new Set([3]))
  const [activeTab, setActiveTab] = useState('description')

  // Use mock data
  const challenge = MOCK_CHALLENGE

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!flag.trim()) return
    setSubmitStatus('submitting')
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    if (flag.includes('NEXUS{')) {
      setSubmitStatus('correct')
    } else {
      setSubmitStatus('wrong')
      setTimeout(() => setSubmitStatus(null), 3000)
    }
  }

  const unlockHint = (hintId, cost) => {
    setHints((prev) => prev.map((h) => h.id === hintId ? { ...h, unlocked: true } : h))
    setRevealedHints((prev) => new Set([...prev, hintId]))
  }

  const catColor = categoryColors[challenge.category] || '#00ffcc'
  const diffColor = diffColors[challenge.difficulty] || '#ffa500'

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Back button */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }}>
        <NeonButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/arena')}
          leftIcon={<ArrowLeft size={13} />}
          className="mb-6"
        >
          BACK TO ARENA
        </NeonButton>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge header */}
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard padding="p-6">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                  style={{ color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30` }}
                >
                  {challenge.category}
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ color: diffColor, background: `${diffColor}10`, border: `1px solid ${diffColor}25` }}
                >
                  {challenge.difficulty}
                </span>
                <span className="ml-auto text-lg font-mono font-black text-nexus-cyan">
                  {challenge.points} <span className="text-sm text-nexus-text-dim font-normal">pts</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-display font-bold text-nexus-text mb-3">
                {challenge.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-4 text-[11px] font-mono text-nexus-text-dim">
                <span className="flex items-center gap-1">
                  <Users size={11} /> {challenge.solves.toLocaleString()} solves
                </span>
                <span className="flex items-center gap-1">
                  <Star size={11} /> by{' '}
                  <span
                    className="text-nexus-violet hover:underline cursor-pointer"
                    onClick={() => navigate(`/vault/${challenge.author}`)}
                  >
                    {challenge.author}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {challenge.createdAt}
                </span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex gap-2 mb-4">
              {['description', 'files', 'solvers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="text-xs font-mono px-4 py-2 rounded border transition-all"
                  style={
                    activeTab === tab
                      ? { color: '#00ffcc', background: 'rgba(0,255,204,0.08)', borderColor: 'rgba(0,255,204,0.3)' }
                      : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }
                  }
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <GlassCard padding="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'description' && (
                  <motion.div
                    key="desc"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="prose prose-invert max-w-none"
                  >
                    <div className="font-mono text-sm text-nexus-text leading-relaxed space-y-4">
                      {challenge.description.split('\n\n').map((para, i) => {
                        if (para.startsWith('## ')) {
                          return <h2 key={i} className="text-lg font-display font-bold text-nexus-cyan">{para.slice(3)}</h2>
                        }
                        if (para.startsWith('### ')) {
                          return <h3 key={i} className="text-base font-display font-bold text-nexus-text">{para.slice(4)}</h3>
                        }
                        if (para.startsWith('**') && para.endsWith('**')) {
                          return <p key={i} className="font-bold text-nexus-text">{para.slice(2, -2)}</p>
                        }
                        if (para.includes('```')) {
                          const code = para.replace(/```\w*\n?/g, '').trim()
                          return (
                            <pre key={i} className="p-3 rounded bg-nexus-surface border border-nexus-border text-nexus-cyan overflow-x-auto">
                              <code>{code}</code>
                            </pre>
                          )
                        }
                        return <p key={i} className="text-nexus-text-dim">{para}</p>
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'files' && (
                  <motion.div key="files" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {challenge.files.length === 0 ? (
                      <p className="text-xs font-mono text-nexus-text-dim">No files attached</p>
                    ) : (
                      <div className="space-y-2">
                        {challenge.files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded border border-nexus-border hover:border-nexus-cyan/30 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-nexus-surface border border-nexus-border flex items-center justify-center">
                                <Download size={13} className="text-nexus-cyan" />
                              </div>
                              <div>
                                <div className="text-xs font-mono text-nexus-text">{f.name}</div>
                                <div className="text-[10px] font-mono text-nexus-text-dim">{f.size}</div>
                              </div>
                            </div>
                            <NeonButton variant="ghost" size="xs" leftIcon={<Download size={11} />}>
                              DOWNLOAD
                            </NeonButton>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'solvers' && (
                  <motion.div key="solvers" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-2">
                      {challenge.solvers.map((s) => (
                        <div key={s.rank} className="flex items-center gap-3 p-2 rounded hover:bg-nexus-surface transition-colors">
                          <span
                            className="w-5 text-center text-xs font-mono font-bold"
                            style={{ color: s.rank <= 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][s.rank - 1] : '#6b7a8d' }}
                          >
                            {s.rank}
                          </span>
                          <span
                            className="flex-1 text-xs font-mono text-nexus-violet hover:underline cursor-pointer"
                            onClick={() => navigate(`/vault/${s.username}`)}
                          >
                            {s.username}
                          </span>
                          <span className="text-[10px] font-mono text-nexus-cyan">{s.time}</span>
                          <span className="text-[10px] font-mono text-nexus-text-dim">{s.date}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Flag submission */}
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard padding="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flag size={15} className="text-nexus-cyan" />
                <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">SUBMIT FLAG</span>
              </div>

              <AnimatePresence mode="wait">
                {submitStatus === 'correct' ? (
                  <motion.div
                    key="correct"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <CheckCircle size={40} className="text-nexus-cyan mx-auto mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,204,0.6))' }} />
                    <div className="text-lg font-display font-bold text-nexus-cyan mb-1">FLAG ACCEPTED</div>
                    <div className="text-xs font-mono text-nexus-text-dim">+{challenge.points} XP earned</div>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <input
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        placeholder="NEXUS{your_flag_here}"
                        className="w-full bg-nexus-surface border border-nexus-border rounded px-3 py-2.5 text-xs font-mono text-nexus-cyan placeholder:text-nexus-text-dim/40 outline-none focus:border-nexus-cyan/40 caret-nexus-cyan transition-colors"
                      />
                    </div>

                    {submitStatus === 'wrong' && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-[11px] font-mono text-nexus-magenta"
                      >
                        <XCircle size={12} /> Incorrect flag. Try again.
                      </motion.div>
                    )}

                    <NeonButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      fullWidth
                      loading={submitStatus === 'submitting'}
                      leftIcon={<Flag size={13} />}
                    >
                      SUBMIT FLAG
                    </NeonButton>
                  </motion.form>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>

          {/* Hints */}
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard padding="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={15} className="text-yellow-400" />
                <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">HINTS</span>
              </div>
              <div className="space-y-3">
                {hints.map((hint) => (
                  <div
                    key={hint.id}
                    className="rounded-md border p-3 transition-all"
                    style={{
                      borderColor: hint.unlocked ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)',
                      background: hint.unlocked ? 'rgba(255,215,0,0.04)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-nexus-text-dim">HINT {hint.id}</span>
                      {!hint.unlocked ? (
                        <button
                          onClick={() => unlockHint(hint.id, hint.cost)}
                          className="flex items-center gap-1 text-[10px] font-mono text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          <Lock size={10} /> -{hint.cost} XP
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-yellow-400">UNLOCKED</span>
                      )}
                    </div>
                    {hint.unlocked ? (
                      <p className="text-xs font-mono text-nexus-text leading-relaxed">{hint.text}</p>
                    ) : (
                      <p className="text-xs font-mono text-nexus-text-dim/40 blur-[3px] select-none">
                        {hint.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
