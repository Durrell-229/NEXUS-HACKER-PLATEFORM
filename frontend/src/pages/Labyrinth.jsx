import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, Play, Pause, Square, Wifi, HardDrive, Clock, RefreshCw } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import HologramText from '../components/ui/HologramText'

const LABS = [
  { id: 1, name: 'VulnBox-42', os: 'Linux', osIcon: '🐧', difficulty: 'MEDIUM', category: 'MACHINE', points: 30, status: 'running', ip: '10.10.10.42', rootFlag: false, userFlag: true, time: '02:14:33', description: 'A vulnerable Ubuntu machine running a web application with SSRF and privilege escalation vulnerabilities.' },
  { id: 2, name: 'WinServer-2019', os: 'Windows', osIcon: '🪟', difficulty: 'HARD', category: 'MACHINE', points: 40, status: 'paused', ip: '10.10.10.87', rootFlag: false, userFlag: false, time: '00:47:12', description: 'Windows Server 2019 with Active Directory misconfigurations and a path to Domain Admin.' },
  { id: 3, name: 'DockerEscape', os: 'Linux', osIcon: '🐧', difficulty: 'HARD', category: 'CONTAINER', points: 35, status: 'available', ip: null, rootFlag: false, userFlag: false, time: null, description: 'Escape the Docker container using misconfigured capabilities and mounted sockets.' },
  { id: 4, name: 'K8s-Cluster-1', os: 'Linux', osIcon: '☸️', difficulty: 'INSANE', category: 'KUBERNETES', points: 50, status: 'available', ip: null, rootFlag: false, userFlag: false, time: null, description: 'Attack and pivot through a Kubernetes cluster. Find secrets, escape namespaces, get cluster-admin.' },
  { id: 5, name: 'IoT-Router', os: 'Embedded', osIcon: '📡', difficulty: 'MEDIUM', category: 'IOT', points: 25, status: 'completed', ip: null, rootFlag: true, userFlag: true, time: '01:32:07', description: 'A consumer router with command injection and hardcoded credentials. Get root shell.' },
  { id: 6, name: 'Android-App', os: 'Android', osIcon: '🤖', difficulty: 'EASY', category: 'MOBILE', points: 20, status: 'available', ip: null, rootFlag: false, userFlag: false, time: null, description: 'Reverse the Android APK, bypass certificate pinning, intercept traffic to find the flag.' },
]

const diffColors = {
  EASY: { text: '#32ff64', border: 'rgba(50,255,100,0.3)', bg: 'rgba(50,255,100,0.08)' },
  MEDIUM: { text: '#ffa500', border: 'rgba(255,165,0,0.3)', bg: 'rgba(255,165,0,0.08)' },
  HARD: { text: '#ff0080', border: 'rgba(255,0,128,0.3)', bg: 'rgba(255,0,128,0.08)' },
  INSANE: { text: '#7b2fff', border: 'rgba(123,47,255,0.3)', bg: 'rgba(123,47,255,0.08)' },
}

const statusColors = {
  running: '#32ff64',
  paused: '#ffa500',
  available: '#6b7a8d',
  completed: '#00ffcc',
}

function LabCard({ lab, index }) {
  const diff = diffColors[lab.difficulty] || diffColors.EASY

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
    >
      <GlassCard padding="p-5" className="h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{lab.osIcon}</span>
              <h3 className="text-sm font-display font-bold text-nexus-text">{lab.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ color: diff.text, background: diff.bg, border: `1px solid ${diff.border}` }}
              >
                {lab.difficulty}
              </span>
              <span className="text-[10px] font-mono text-nexus-text-dim border border-nexus-border rounded px-1.5 py-0.5">
                {lab.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: statusColors[lab.status], boxShadow: `0 0 4px ${statusColors[lab.status]}` }}
            />
            <span className="text-[10px] font-mono" style={{ color: statusColors[lab.status] }}>
              {lab.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] font-mono text-nexus-text-dim leading-relaxed mb-4 line-clamp-2">
          {lab.description}
        </p>

        {/* Flags */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 text-[10px] font-mono ${lab.userFlag ? 'text-nexus-cyan' : 'text-nexus-text-dim'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${lab.userFlag ? 'bg-nexus-cyan' : 'bg-nexus-border'}`} />
            USER FLAG {lab.userFlag ? '✓' : '○'}
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] font-mono ${lab.rootFlag ? 'text-nexus-magenta' : 'text-nexus-text-dim'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${lab.rootFlag ? 'bg-nexus-magenta' : 'bg-nexus-border'}`} />
            ROOT FLAG {lab.rootFlag ? '✓' : '○'}
          </div>
          <span className="ml-auto text-xs font-mono font-bold text-nexus-cyan">{lab.points} pts</span>
        </div>

        {/* IP & Time (if running) */}
        {lab.ip && (
          <div className="flex items-center gap-3 mb-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-nexus-text-dim"><Wifi size={10} /> {lab.ip}</span>
            {lab.time && <span className="flex items-center gap-1 text-nexus-text-dim"><Clock size={10} /> {lab.time}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {lab.status === 'available' && (
            <NeonButton variant="primary" size="sm" leftIcon={<Play size={12} />} fullWidth>
              SPAWN
            </NeonButton>
          )}
          {lab.status === 'running' && (
            <>
              <NeonButton variant="ghost" size="sm" leftIcon={<Pause size={12} />} className="flex-1">PAUSE</NeonButton>
              <NeonButton variant="danger" size="sm" leftIcon={<Square size={12} />} className="flex-1">STOP</NeonButton>
            </>
          )}
          {lab.status === 'paused' && (
            <>
              <NeonButton variant="primary" size="sm" leftIcon={<Play size={12} />} className="flex-1">RESUME</NeonButton>
              <NeonButton variant="danger" size="sm" leftIcon={<Square size={12} />} className="flex-1">STOP</NeonButton>
            </>
          )}
          {lab.status === 'completed' && (
            <NeonButton variant="ghost" size="sm" leftIcon={<RefreshCw size={12} />} fullWidth>REPLAY</NeonButton>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function Labyrinth() {
  const [filter, setFilter] = useState('ALL')
  const filters = ['ALL', 'RUNNING', 'AVAILABLE', 'COMPLETED']

  const filtered = LABS.filter((l) => filter === 'ALL' || l.status.toUpperCase() === filter || (filter === 'AVAILABLE' && l.status === 'available'))

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical size={20} className="text-nexus-violet" style={{ filter: 'drop-shadow(0 0 6px rgba(123,47,255,0.6))' }} />
          <HologramText as="h1" className="text-2xl font-display font-bold" color="violet">LABYRINTH</HologramText>
        </div>
        <p className="text-xs font-mono text-nexus-text-dim">Vulnerable machines and containers — exploit, escalate, own</p>
      </motion.div>

      {/* VPN Status */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6 flex items-center gap-4"
        style={{ borderColor: 'rgba(50,255,100,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px rgba(50,255,100,0.8)' }} />
          <span className="text-xs font-mono text-green-400">VPN CONNECTED</span>
        </div>
        <span className="text-[10px] font-mono text-nexus-text-dim">10.10.0.247 · UDP 1194 · 12ms latency</span>
        <NeonButton variant="ghost" size="xs" className="ml-auto">DOWNLOAD CONFIG</NeonButton>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-[10px] font-mono px-4 py-2 rounded border transition-all"
            style={
              filter === f
                ? { color: '#7b2fff', background: 'rgba(123,47,255,0.1)', borderColor: 'rgba(123,47,255,0.3)' }
                : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Labs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LABS.filter((l) => filter === 'ALL' || l.status.toUpperCase() === filter).map((lab, i) => (
          <LabCard key={lab.id} lab={lab} index={i} />
        ))}
      </div>
    </div>
  )
}
