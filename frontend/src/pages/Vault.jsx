import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Trophy, Zap, Star, Activity,
  Calendar, Globe, Twitter, Github, Edit3,
  CheckCircle, Award
} from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import HologramText from '../components/ui/HologramText'
import { RankBadge, XPBadge } from '../components/ui/StatBadge'
import { useAuthStore } from '../store/authStore'

// Mock user data
const getMockUser = (username) => ({
  username: username || 'ph4ntom_r00t',
  displayName: username || 'ph4ntom_r00t',
  bio: 'Full-stack hacker. CTF addict. ex-redteam @ unknown corp. Currently pwning everything.',
  avatar: null,
  xp: 48200,
  level: 49,
  rank: 'NEXUS',
  globalRank: 1,
  solved: 192,
  labs: 34,
  streak: 47,
  joined: '2024-08-12',
  country: '🇺🇸',
  socials: { github: 'ph4ntom', twitter: '@ph4ntom_r00t' },
  recentSolves: [
    { id: 1, title: 'Heap Feng Shui', category: 'PWN', points: 700, date: '2026-05-20' },
    { id: 2, title: 'ECC Fault Attack', category: 'CRYPTO', points: 600, date: '2026-05-18' },
    { id: 3, title: 'Memory Forensics', category: 'FORENSICS', points: 500, date: '2026-05-15' },
    { id: 4, title: 'K8s Privilege Escalation', category: 'PWN', points: 500, date: '2026-05-12' },
    { id: 5, title: 'Packed Binary', category: 'REVERSE', points: 400, date: '2026-05-10' },
    { id: 6, title: 'GraphQL Injection', category: 'WEB', points: 400, date: '2026-05-08' },
  ],
  achievements: [
    { icon: '⚡', title: 'Speed Demon', description: 'Solved a challenge in under 5 minutes', date: '2026-04-10' },
    { icon: '🩸', title: 'First Blood', description: 'First to solve a challenge', date: '2026-03-22' },
    { icon: '👑', title: 'The Architect', description: 'Ranked #1 globally', date: '2026-05-01' },
    { icon: '🔥', title: 'Inferno', description: '30-day solve streak', date: '2026-04-30' },
    { icon: '💀', title: 'INSANE Solver', description: 'Solved 10 INSANE challenges', date: '2026-05-15' },
    { icon: '🌐', title: 'Web Wizard', description: 'Solved all web challenges', date: '2026-02-14' },
  ],
  categoryBreakdown: [
    { cat: 'WEB', solved: 45, color: '#00ffcc' },
    { cat: 'PWN', solved: 52, color: '#ffa500' },
    { cat: 'CRYPTO', solved: 38, color: '#7b2fff' },
    { cat: 'REVERSE', solved: 29, color: '#ff0080' },
    { cat: 'FORENSICS', solved: 18, color: '#32ff64' },
    { cat: 'MISC', solved: 10, color: '#64c8ff' },
  ],
})

const categoryColors = {
  WEB: '#00ffcc', CRYPTO: '#7b2fff', REVERSE: '#ff0080',
  PWN: '#ffa500', FORENSICS: '#32ff64', MISC: '#64c8ff',
}

export default function Vault() {
  const { username } = useParams()
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const profileUser = getMockUser(username)
  const isOwn = currentUser?.username === username

  const maxSolves = Math.max(...profileUser.categoryBreakdown.map((c) => c.solved))

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Profile header */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard padding="p-6" className="mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-black text-nexus-dark"
                style={{
                  background: 'linear-gradient(135deg, #00ffcc, #7b2fff)',
                  boxShadow: '0 0 20px rgba(0,255,204,0.3), 0 0 40px rgba(123,47,255,0.2)',
                }}
              >
                {profileUser.username[0].toUpperCase()}
              </div>
              {/* Online indicator */}
              <div
                className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-nexus-dark"
                style={{ background: '#32ff64', boxShadow: '0 0 6px rgba(50,255,100,0.8)' }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <HologramText as="h1" className="text-2xl font-display font-bold">
                  {profileUser.username}
                </HologramText>
                <RankBadge rank={profileUser.rank} size="lg" />
                <span className="text-lg">{profileUser.country}</span>
              </div>

              <p className="text-xs font-mono text-nexus-text-dim mb-3 leading-relaxed max-w-lg">
                {profileUser.bio}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-[10px] font-mono text-nexus-text-dim">
                <span className="flex items-center gap-1"><Calendar size={10} /> Joined {profileUser.joined}</span>
                {profileUser.socials.github && (
                  <span className="flex items-center gap-1 hover:text-nexus-cyan cursor-pointer transition-colors">
                    <Github size={10} /> {profileUser.socials.github}
                  </span>
                )}
                {profileUser.socials.twitter && (
                  <span className="flex items-center gap-1 hover:text-nexus-cyan cursor-pointer transition-colors">
                    <Twitter size={10} /> {profileUser.socials.twitter}
                  </span>
                )}
                <span className="flex items-center gap-1 text-orange-400">
                  🔥 {profileUser.streak} day streak
                </span>
              </div>
            </div>

            {/* Stats + actions */}
            <div className="flex flex-col items-end gap-3">
              {isOwn && (
                <NeonButton variant="ghost" size="sm" leftIcon={<Edit3 size={12} />}>
                  EDIT PROFILE
                </NeonButton>
              )}

              {/* Quick stats */}
              <div className="flex gap-4 text-center">
                {[
                  { label: 'RANK', value: `#${profileUser.globalRank}`, color: '#ffd700' },
                  { label: 'XP', value: `${(profileUser.xp / 1000).toFixed(1)}K`, color: '#00ffcc' },
                  { label: 'SOLVES', value: profileUser.solved, color: '#7b2fff' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-lg font-display font-black" style={{ color: s.color, textShadow: `0 0 8px ${s.color}80` }}>
                      {s.value}
                    </div>
                    <div className="text-[9px] font-mono text-nexus-text-dim">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4 pt-4 border-t border-nexus-border">
            <div className="flex justify-between text-[10px] font-mono mb-1.5">
              <span className="text-nexus-text-dim">LVL {profileUser.level}</span>
              <span className="text-nexus-cyan">{profileUser.xp % 1000}/{1000} XP to next level</span>
            </div>
            <div className="xp-bar-track">
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(profileUser.xp % 1000) / 10}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard padding="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-nexus-cyan" />
              <span className="text-sm font-mono font-bold text-nexus-text">SOLVE BREAKDOWN</span>
            </div>
            <div className="space-y-3">
              {profileUser.categoryBreakdown.map((c) => (
                <div key={c.cat}>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span style={{ color: c.color }}>{c.cat}</span>
                    <span className="text-nexus-text-dim">{c.solved} solves</span>
                  </div>
                  <div className="xp-bar-track">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: c.color, boxShadow: `0 0 6px ${c.color}60` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.solved / maxSolves) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent solves */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <GlassCard padding="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={14} className="text-nexus-cyan" />
              <span className="text-sm font-mono font-bold text-nexus-text">RECENT SOLVES</span>
            </div>
            <div className="space-y-2">
              {profileUser.recentSolves.map((solve) => (
                <div
                  key={solve.id}
                  onClick={() => navigate(`/arena/${solve.id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-md border border-nexus-border hover:border-nexus-cyan/30 cursor-pointer transition-all group"
                >
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0"
                    style={{
                      color: categoryColors[solve.category] || '#00ffcc',
                      background: `${categoryColors[solve.category] || '#00ffcc'}15`,
                      border: `1px solid ${categoryColors[solve.category] || '#00ffcc'}30`,
                    }}
                  >
                    {solve.category}
                  </span>
                  <span className="flex-1 text-xs font-mono text-nexus-text group-hover:text-white transition-colors truncate">
                    {solve.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-nexus-cyan flex-shrink-0">{solve.points} pts</span>
                  <span className="text-[10px] font-mono text-nexus-text-dim flex-shrink-0">{solve.date}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3">
          <GlassCard padding="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award size={14} className="text-yellow-400" />
              <span className="text-sm font-mono font-bold text-nexus-text">ACHIEVEMENTS</span>
              <span className="text-[10px] font-mono text-nexus-text-dim ml-1">({profileUser.achievements.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {profileUser.achievements.map((ach, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4, scale: 1.04 }}
                  className="p-3 rounded-lg text-center cursor-pointer"
                  style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}
                  title={ach.description}
                >
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <div className="text-[10px] font-mono text-yellow-400 font-bold">{ach.title}</div>
                  <div className="text-[9px] font-mono text-nexus-text-dim mt-0.5 leading-tight">{ach.description}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
