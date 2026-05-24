import React from 'react'
import clsx from 'clsx'

const rankConfig = {
  BRONZE: { label: 'BRONZE', class: 'rank-bronze', bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.3)' },
  SILVER: { label: 'SILVER', class: 'rank-silver', bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)' },
  GOLD: { label: 'GOLD', class: 'rank-gold', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)' },
  PLATINUM: { label: 'PLATINUM', class: 'rank-platinum', bg: 'rgba(0,255,204,0.1)', border: 'rgba(0,255,204,0.3)' },
  ELITE: { label: 'ELITE', class: 'rank-elite', bg: 'rgba(123,47,255,0.1)', border: 'rgba(123,47,255,0.3)' },
  NEXUS: { label: 'NEXUS', class: 'rank-nexus', bg: 'rgba(255,0,128,0.1)', border: 'rgba(255,0,128,0.3)' },
}

export function RankBadge({ rank = 'BRONZE', size = 'sm' }) {
  const config = rankConfig[rank] || rankConfig.BRONZE
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xxs'

  return (
    <span
      className={clsx(
        'font-mono font-bold tracking-wider rounded inline-flex items-center gap-1',
        config.class,
        sizeClass
      )}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {rank === 'NEXUS' && <span className="text-[8px]">◆</span>}
      {rank === 'ELITE' && <span className="text-[8px]">★</span>}
      {config.label}
    </span>
  )
}

export function XPBadge({ xp, className = '' }) {
  const formatted = xp >= 1000 ? `${(xp / 1000).toFixed(1)}K` : xp

  return (
    <span
      className={clsx(
        'font-mono font-bold text-nexus-cyan text-xs px-2 py-0.5 rounded',
        className
      )}
      style={{
        background: 'rgba(0,255,204,0.08)',
        border: '1px solid rgba(0,255,204,0.2)',
        textShadow: '0 0 8px rgba(0,255,204,0.6)',
      }}
    >
      {formatted} XP
    </span>
  )
}

export function StatCard({ label, value, icon, color = 'cyan', className = '' }) {
  const colorMap = {
    cyan: { text: 'text-nexus-cyan', border: 'rgba(0,255,204,0.15)', bg: 'rgba(0,255,204,0.04)' },
    violet: { text: 'text-nexus-violet', border: 'rgba(123,47,255,0.15)', bg: 'rgba(123,47,255,0.04)' },
    magenta: { text: 'text-nexus-magenta', border: 'rgba(255,0,128,0.15)', bg: 'rgba(255,0,128,0.04)' },
    gold: { text: 'text-yellow-400', border: 'rgba(255,215,0,0.15)', bg: 'rgba(255,215,0,0.04)' },
  }
  const c = colorMap[color] || colorMap.cyan

  return (
    <div
      className={clsx('rounded-lg p-4 relative overflow-hidden', className)}
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.border.replace('0.15', '0.4')}, transparent)` }}
      />
      {icon && (
        <div className={clsx('text-2xl mb-2 opacity-80', c.text)}>{icon}</div>
      )}
      <div className={clsx('text-2xl font-display font-bold', c.text)}>{value}</div>
      <div className="text-nexus-text-dim text-xs font-mono mt-1 uppercase tracking-wider">{label}</div>
    </div>
  )
}

export default function StatBadge({ label, value, variant = 'default' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-nexus-text-dim text-xs font-mono">{label}:</span>
      <span className="text-nexus-cyan font-mono font-bold text-sm">{value}</span>
    </div>
  )
}
