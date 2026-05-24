import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Zap, Shield, TrendingUp, Crown } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import HologramText from '../components/ui/HologramText'
import { RankBadge } from '../components/ui/StatBadge'

const FILTERS = ['GLOBAL', 'THIS WEEK', 'THIS MONTH', 'CTF EVENTS']

const LEADERBOARD = [
  { rank: 1, username: 'ph4ntom_r00t', xp: 48200, solved: 192, badge: 'NEXUS', country: '🇺🇸', streak: 47 },
  { rank: 2, username: 'cyb3r_witch', xp: 42800, solved: 178, badge: 'NEXUS', country: '🇩🇪', streak: 32 },
  { rank: 3, username: 'null_ptr', xp: 38500, solved: 163, badge: 'ELITE', country: '🇫🇷', streak: 21 },
  { rank: 4, username: 'binary_wolf', xp: 31200, solved: 144, badge: 'ELITE', country: '🇯🇵', streak: 18 },
  { rank: 5, username: 'x0r_master', xp: 28900, solved: 131, badge: 'ELITE', country: '🇧🇷', streak: 15 },
  { rank: 6, username: 'h4x0r_elite', xp: 24100, solved: 118, badge: 'PLATINUM', country: '🇨🇳', streak: 12 },
  { rank: 7, username: 'stack_smasher', xp: 21700, solved: 102, badge: 'PLATINUM', country: '🇬🇧', streak: 9 },
  { rank: 8, username: 'r00t_kit', xp: 19400, solved: 94, badge: 'PLATINUM', country: '🇰🇷', streak: 7 },
  { rank: 9, username: 'rop_chain_girl', xp: 17200, solved: 87, badge: 'PLATINUM', country: '🇨🇦', streak: 6 },
  { rank: 10, username: 'pwnage_99', xp: 15800, solved: 79, badge: 'GOLD', country: '🇦🇺', streak: 5 },
  { rank: 11, username: 'hex_dumper', xp: 14100, solved: 71, badge: 'GOLD', country: '🇮🇳', streak: 4 },
  { rank: 12, username: 'n00b_pwner', xp: 12400, solved: 64, badge: 'GOLD', country: '🇪🇸', streak: 3 },
  { rank: 13, username: 'ret2libc', xp: 10900, solved: 58, badge: 'SILVER', country: '🇮🇹', streak: 2 },
  { rank: 14, username: 'shellc0de', xp: 9700, solved: 52, badge: 'SILVER', country: '🇲🇽', streak: 0 },
  { rank: 15, username: 'exploit_dev', xp: 8200, solved: 45, badge: 'SILVER', country: '🇸🇪', streak: 1 },
]

const podiumConfig = [
  { rank: 2, height: 'h-24', labelY: 'top-[-48px]', color: '#c0c0c0', glow: 'rgba(192,192,192,0.3)' },
  { rank: 1, height: 'h-32', labelY: 'top-[-56px]', color: '#ffd700', glow: 'rgba(255,215,0,0.4)' },
  { rank: 3, height: 'h-16', labelY: 'top-[-40px]', color: '#cd7f32', glow: 'rgba(205,127,50,0.3)' },
]

export default function Leaderboard() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('GLOBAL')

  const top3 = LEADERBOARD.slice(0, 3)
  const rest = LEADERBOARD.slice(3)

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy size={22} className="text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />
          <HologramText as="h1" className="text-3xl font-display font-bold" color="cyan">RANKINGS</HologramText>
          <Trophy size={22} className="text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />
        </div>
        <p className="text-xs font-mono text-nexus-text-dim">Global hacker rankings — updated in real-time</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center gap-2 mb-10 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="text-[10px] font-mono px-4 py-2 rounded border transition-all"
            style={
              activeFilter === f
                ? { color: '#ffd700', background: 'rgba(255,215,0,0.1)', borderColor: 'rgba(255,215,0,0.3)' }
                : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }
            }
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Podium */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-end justify-center gap-4 mb-12 px-4"
      >
        {podiumConfig.map(({ rank, height, color, glow }) => {
          const hacker = LEADERBOARD.find((h) => h.rank === rank)
          if (!hacker) return null
          return (
            <motion.div
              key={rank}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + rank * 0.1 }}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-1">
                {rank === 1 && (
                  <Crown size={16} style={{ color, filter: `drop-shadow(0 0 6px ${glow})` }} />
                )}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-display font-black text-nexus-dark"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}80)`, boxShadow: `0 0 16px ${glow}` }}
                >
                  {hacker.username[0].toUpperCase()}
                </div>
                <div className="text-xs font-mono font-bold text-nexus-text">{hacker.username}</div>
                <div className="text-[10px] font-mono" style={{ color }}>{(hacker.xp / 1000).toFixed(1)}K XP</div>
              </div>

              {/* Podium block */}
              <div
                className={`w-24 ${height} rounded-t-md flex items-center justify-center relative`}
                style={{
                  background: `linear-gradient(180deg, ${color}20 0%, ${color}08 100%)`,
                  border: `1px solid ${color}30`,
                  borderBottom: 'none',
                  boxShadow: `0 -4px 20px ${glow}`,
                }}
              >
                <span
                  className="text-2xl font-display font-black"
                  style={{ color, textShadow: `0 0 10px ${glow}` }}
                >
                  #{rank}
                </span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Full rankings table */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <GlassCard padding="p-0" className="overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-nexus-border bg-nexus-surface">
            <div className="col-span-1 text-[10px] font-mono text-nexus-text-dim">#</div>
            <div className="col-span-4 text-[10px] font-mono text-nexus-text-dim">HACKER</div>
            <div className="col-span-2 text-[10px] font-mono text-nexus-text-dim">RANK</div>
            <div className="col-span-2 text-[10px] font-mono text-nexus-text-dim text-right">XP</div>
            <div className="col-span-2 text-[10px] font-mono text-nexus-text-dim text-right">SOLVES</div>
            <div className="col-span-1 text-[10px] font-mono text-nexus-text-dim text-right">🔥</div>
          </div>

          {/* Rest of rankings (4-15) */}
          {rest.map((hacker, i) => (
            <motion.div
              key={hacker.rank}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.04 }}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-nexus-border/40 hover:bg-nexus-surface cursor-pointer transition-colors group"
              onClick={() => navigate(`/vault/${hacker.username}`)}
            >
              <div className="col-span-1 text-xs font-mono text-nexus-text-dim">{hacker.rank}</div>
              <div className="col-span-4 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display font-black text-nexus-dark flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00ffcc, #7b2fff)' }}
                >
                  {hacker.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-mono text-nexus-text group-hover:text-white transition-colors">
                    {hacker.country} {hacker.username}
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex items-center">
                <RankBadge rank={hacker.badge} />
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-xs font-mono font-bold text-nexus-cyan">
                  {hacker.xp >= 1000 ? `${(hacker.xp / 1000).toFixed(1)}K` : hacker.xp}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-xs font-mono text-nexus-text-dim">{hacker.solved}</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-[10px] font-mono text-orange-400">
                  {hacker.streak > 0 ? `${hacker.streak}d` : '-'}
                </span>
              </div>
            </motion.div>
          ))}
        </GlassCard>
      </motion.div>

      {/* Your rank */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 glass-card p-4"
        style={{ borderColor: 'rgba(0,255,204,0.25)' }}
      >
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-1 text-xs font-mono text-nexus-cyan">#847</div>
          <div className="col-span-4 flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display font-black text-nexus-dark"
              style={{ background: 'linear-gradient(135deg, #00ffcc, #7b2fff)', boxShadow: '0 0 6px rgba(0,255,204,0.4)' }}
            >
              Y
            </div>
            <span className="text-xs font-mono text-nexus-cyan font-bold">you (your_handle)</span>
          </div>
          <div className="col-span-2 flex items-center"><RankBadge rank="SILVER" /></div>
          <div className="col-span-2 flex items-center justify-end">
            <span className="text-xs font-mono font-bold text-nexus-cyan">1.2K</span>
          </div>
          <div className="col-span-2 flex items-center justify-end">
            <span className="text-xs font-mono text-nexus-text-dim">24</span>
          </div>
          <div className="col-span-1 flex items-center justify-end">
            <span className="text-[10px] font-mono text-orange-400">3d</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
