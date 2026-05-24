import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, FlaskConical, Trophy, BookOpen,
  Zap, Activity, Clock, TrendingUp, Star, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import HologramText from '../components/ui/HologramText'
import { RankBadge, StatCard } from '../components/ui/StatBadge'

// Mock data
const RECENT_CHALLENGES = [
  { id: 1, title: 'SQL Injection Labyrinth', category: 'WEB', points: 250, solved: true, time: '2h ago' },
  { id: 2, title: 'Buffer Overflow 101', category: 'PWN', points: 400, solved: false, time: '5h ago' },
  { id: 3, title: 'RSA Decrypt Me', category: 'CRYPTO', points: 300, solved: true, time: '1d ago' },
  { id: 4, title: 'ARM Reversing Challenge', category: 'REVERSE', points: 500, solved: false, time: '2d ago' },
]

const ACTIVE_LABS = [
  { id: 1, name: 'VulnBox-42', os: 'Linux', difficulty: 'MEDIUM', status: 'running', ip: '10.10.10.42', progress: 60 },
  { id: 2, name: 'WinServer-2019', os: 'Windows', difficulty: 'HARD', status: 'paused', ip: '10.10.10.87', progress: 25 },
]

const TOP_HACKERS = [
  { rank: 1, username: 'ph4ntom_r00t', xp: 48200, solved: 192, badge: 'NEXUS' },
  { rank: 2, username: 'cyb3r_witch', xp: 42800, solved: 178, badge: 'ELITE' },
  { rank: 3, username: 'null_ptr', xp: 38500, solved: 163, badge: 'ELITE' },
  { rank: 4, username: 'binary_wolf', xp: 31200, solved: 144, badge: 'PLATINUM' },
  { rank: 5, username: 'x0r_master', xp: 28900, solved: 131, badge: 'PLATINUM' },
]

const RECENT_CODEX = [
  { slug: 'heap-exploitation', title: 'Heap Exploitation Techniques: tcache poisoning', author: 'null_ptr', readTime: '12 min', tags: ['PWN', 'HEAP'] },
  { slug: 'web3-reentrancy', title: 'Web3 Reentrancy Attacks Deep Dive', author: 'ph4ntom_r00t', readTime: '8 min', tags: ['WEB', 'BLOCKCHAIN'] },
  { slug: 'fuzzing-101', title: 'Coverage-guided Fuzzing with AFL++', author: 'cyb3r_witch', readTime: '15 min', tags: ['FUZZING', 'REVERSE'] },
]

const categoryColors = {
  WEB: '#00ffcc', CRYPTO: '#7b2fff', REVERSE: '#ff0080',
  PWN: '#ffa500', MISC: '#64c8ff', FORENSICS: '#32ff64',
}

const diffColors = {
  EASY: '#32ff64', MEDIUM: '#ffa500', HARD: '#ff0080', INSANE: '#7b2fff',
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const xpInLevel = (user?.xp || 1240) % 1000
  const xpNextLevel = 1000
  const xpPercent = (xpInLevel / xpNextLevel) * 100

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <div className="text-[10px] font-mono text-nexus-text-dim tracking-[0.3em] mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
          <h1 className="text-2xl font-display font-bold text-nexus-text">
            WELCOME BACK,{' '}
            <HologramText as="span" className="text-2xl">
              {user?.username?.toUpperCase() || 'OPERATOR'}
            </HologramText>
          </h1>
          <p className="text-xs font-mono text-nexus-text-dim mt-1">
            Your session is active — {user?.xp || 1240} XP total · LVL {user?.level || 2}
          </p>
        </div>
        <RankBadge rank={user?.rank || 'SILVER'} size="lg" />
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'CHALLENGES SOLVED', value: user?.solved || 24, icon: <Shield size={20} />, color: 'cyan' },
          { label: 'TOTAL XP', value: `${user?.xp || 1240}`, icon: <Zap size={20} />, color: 'violet' },
          { label: 'LABS COMPLETED', value: user?.labs || 7, icon: <FlaskConical size={20} />, color: 'magenta' },
          { label: 'GLOBAL RANK', value: `#${user?.globalRank || 847}`, icon: <Trophy size={20} />, color: 'gold' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <StatCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ===== RECENT CHALLENGES ===== */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-nexus-cyan" />
                <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">RECENT CHALLENGES</span>
              </div>
              <NeonButton variant="ghost" size="xs" onClick={() => navigate('/arena')} rightIcon={<ArrowRight size={11} />}>
                VIEW ALL
              </NeonButton>
            </div>
            <div className="space-y-2">
              {RECENT_CHALLENGES.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => navigate(`/arena/${ch.id}`)}
                  className="flex items-center gap-3 p-3 rounded-md border border-nexus-border hover:border-nexus-border-bright hover:bg-nexus-surface cursor-pointer transition-all group"
                >
                  {/* Category badge */}
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0"
                    style={{
                      color: categoryColors[ch.category] || '#00ffcc',
                      background: `${categoryColors[ch.category] || '#00ffcc'}15`,
                      border: `1px solid ${categoryColors[ch.category] || '#00ffcc'}30`,
                    }}
                  >
                    {ch.category}
                  </span>
                  <span className="flex-1 text-xs font-mono text-nexus-text group-hover:text-white transition-colors truncate">
                    {ch.title}
                  </span>
                  <span className="text-[10px] font-mono text-nexus-text-dim flex-shrink-0">{ch.time}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-nexus-cyan">{ch.points}</span>
                    <span className="text-[9px] font-mono text-nexus-text-dim">pts</span>
                  </div>
                  {ch.solved && (
                    <span className="text-nexus-cyan text-xs flex-shrink-0">✓</span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ===== XP PROGRESS ===== */}
        <motion.div variants={itemVariants}>
          <GlassCard padding="p-5" className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} className="text-nexus-cyan" />
              <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">XP PROGRESS</span>
            </div>

            {/* Level display */}
            <div className="text-center mb-6">
              <div className="relative w-24 h-24 mx-auto">
                <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(0,255,204,0.1)" strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r="40"
                    fill="none"
                    stroke="#00ffcc"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - xpPercent / 100)}`}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,204,0.6))', transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-display font-black text-nexus-cyan">
                    {user?.level || 2}
                  </div>
                  <div className="text-[9px] font-mono text-nexus-text-dim">LEVEL</div>
                </div>
              </div>
            </div>

            {/* XP breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-nexus-text-dim">CURRENT</span>
                <span className="text-nexus-cyan font-bold">{xpInLevel} XP</span>
              </div>
              <div className="xp-bar-track">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-nexus-text-dim">NEXT LEVEL</span>
                <span className="text-nexus-text-dim">{xpNextLevel - xpInLevel} XP needed</span>
              </div>

              {/* Rank info */}
              <div className="pt-2 border-t border-nexus-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-nexus-text-dim">CURRENT RANK</span>
                  <RankBadge rank={user?.rank || 'SILVER'} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-nexus-text-dim">NEXT RANK</span>
                  <RankBadge rank="GOLD" />
                </div>
                <div className="mt-2 text-[9px] font-mono text-nexus-text-dim/60">
                  Need 5000 XP for GOLD rank
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ===== ACTIVE LABS ===== */}
        <motion.div variants={itemVariants}>
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-nexus-violet" />
                <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">ACTIVE LABS</span>
              </div>
              <NeonButton variant="ghost" size="xs" onClick={() => navigate('/labyrinth')} rightIcon={<ArrowRight size={11} />}>
                ALL LABS
              </NeonButton>
            </div>
            <div className="space-y-3">
              {ACTIVE_LABS.map((lab) => (
                <div
                  key={lab.id}
                  className="p-3 rounded-md border border-nexus-border hover:border-nexus-violet/40 hover:bg-nexus-violet/3 cursor-pointer transition-all"
                  onClick={() => navigate('/labyrinth')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-nexus-text">{lab.name}</span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{
                        color: lab.status === 'running' ? '#32ff64' : '#ffa500',
                        background: lab.status === 'running' ? 'rgba(50,255,100,0.1)' : 'rgba(255,165,0,0.1)',
                        border: `1px solid ${lab.status === 'running' ? 'rgba(50,255,100,0.3)' : 'rgba(255,165,0,0.3)'}`,
                      }}
                    >
                      {lab.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-mono text-nexus-text-dim">{lab.os}</span>
                    <span className="text-[10px] font-mono text-nexus-text-dim">·</span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: diffColors[lab.difficulty] || '#00ffcc' }}
                    >
                      {lab.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-nexus-text-dim ml-auto">{lab.ip}</span>
                  </div>
                  <div className="xp-bar-track">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7b2fff, #00ffcc)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${lab.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-nexus-text-dim mt-1">{lab.progress}% complete</div>
                </div>
              ))}

              {ACTIVE_LABS.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs font-mono text-nexus-text-dim">No active labs</p>
                  <NeonButton variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/labyrinth')}>
                    SPAWN LAB
                  </NeonButton>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* ===== LEADERBOARD TOP 5 ===== */}
        <motion.div variants={itemVariants}>
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-yellow-400" />
                <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">TOP HACKERS</span>
              </div>
              <NeonButton variant="ghost" size="xs" onClick={() => navigate('/leaderboard')} rightIcon={<ArrowRight size={11} />}>
                FULL BOARD
              </NeonButton>
            </div>
            <div className="space-y-2">
              {TOP_HACKERS.map((hacker) => (
                <div
                  key={hacker.rank}
                  className="flex items-center gap-3 p-2 rounded hover:bg-nexus-surface transition-colors cursor-pointer"
                  onClick={() => navigate(`/vault/${hacker.username}`)}
                >
                  <span
                    className="w-5 text-center text-xs font-mono font-bold flex-shrink-0"
                    style={{
                      color: hacker.rank <= 3
                        ? ['#ffd700', '#c0c0c0', '#cd7f32'][hacker.rank - 1]
                        : '#6b7a8d'
                    }}
                  >
                    {hacker.rank <= 3 ? ['◆', '◆', '◆'][hacker.rank - 1] : hacker.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-nexus-text truncate">{hacker.username}</div>
                    <div className="text-[10px] font-mono text-nexus-text-dim">{hacker.solved} solves</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-mono font-bold text-nexus-cyan">
                      {hacker.xp >= 1000 ? `${(hacker.xp / 1000).toFixed(1)}K` : hacker.xp}
                    </span>
                    <RankBadge rank={hacker.badge} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ===== RECENT CODEX ===== */}
        <motion.div variants={itemVariants}>
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-nexus-magenta" />
                <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">LATEST CODEX</span>
              </div>
              <NeonButton variant="ghost" size="xs" onClick={() => navigate('/codex')} rightIcon={<ArrowRight size={11} />}>
                ALL ARTICLES
              </NeonButton>
            </div>
            <div className="space-y-3">
              {RECENT_CODEX.map((article) => (
                <div
                  key={article.slug}
                  className="p-3 rounded-md border border-nexus-border hover:border-nexus-magenta/30 hover:bg-nexus-magenta/3 cursor-pointer transition-all group"
                  onClick={() => navigate('/codex')}
                >
                  <p className="text-xs font-mono text-nexus-text group-hover:text-white transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded text-nexus-magenta border border-nexus-magenta/20 bg-nexus-magenta/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-nexus-text-dim">{article.readTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ===== ACTIVITY ===== */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <GlassCard padding="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-nexus-cyan" />
              <span className="text-sm font-mono font-bold text-nexus-text tracking-wider">RECENT ACTIVITY</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { action: 'FLAG_CAPTURED', detail: 'SQL Injection Labyrinth', xp: '+250', time: '2h', color: '#00ffcc' },
                { action: 'LAB_STARTED', detail: 'VulnBox-42 spawned', xp: '', time: '4h', color: '#7b2fff' },
                { action: 'CODEX_READ', detail: 'Heap Exploitation Techniques', xp: '+10', time: '5h', color: '#ff0080' },
                { action: 'FLAG_CAPTURED', detail: 'RSA Decrypt Me', xp: '+300', time: '1d', color: '#00ffcc' },
                { action: 'RANK_UP', detail: 'Promoted to SILVER', xp: '', time: '2d', color: '#ffd700' },
                { action: 'ACHIEVEMENT', detail: '"First Blood" unlocked', xp: '+50', time: '3d', color: '#ffd700' },
              ].map((event, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 p-3 rounded-md border border-nexus-border"
                  style={{ minWidth: 180, background: `${event.color}05`, borderColor: `${event.color}20` }}
                >
                  <div className="text-[10px] font-mono font-bold mb-1" style={{ color: event.color }}>
                    {event.action}
                  </div>
                  <div className="text-xs font-mono text-nexus-text mb-1">{event.detail}</div>
                  <div className="flex items-center justify-between">
                    {event.xp && <span className="text-[10px] font-mono text-nexus-cyan">{event.xp} XP</span>}
                    <span className="text-[10px] font-mono text-nexus-text-dim ml-auto">{event.time} ago</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
