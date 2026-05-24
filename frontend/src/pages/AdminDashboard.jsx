import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, Server, Activity, Settings, Database, AlertTriangle, Zap, Eye, Ban, CheckCircle, BarChart3, Terminal, Globe, Lock, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ADMIN_STATS = [
  { label: 'TOTAL USERS', value: '12,847', change: '+342', icon: Users, color: '#9fef00' },
  { label: 'ACTIVE MACHINES', value: '96', change: '+8', icon: Server, color: '#60a5fa' },
  { label: 'CHALLENGES', value: '384', change: '+12', icon: Shield, color: '#a78bfa' },
  { label: 'FLAGS TODAY', value: '1,432', change: '+891', icon: Zap, color: '#fbbf24' },
]

const RECENT_USERS = [
  { id: 1, username: 'ph4ntom_r00t', email: 'ph4ntom@nexus.io', rank: 'NEXUS', xp: 48200, status: 'active', joined: '2024-01-15', ip: '185.x.x.x' },
  { id: 2, username: 'cyb3r_witch', email: 'cyber@nexus.io', rank: 'ELITE', xp: 42800, status: 'active', joined: '2024-02-01', ip: '91.x.x.x' },
  { id: 3, username: 'null_ptr', email: 'null@nexus.io', rank: 'ELITE', xp: 38500, status: 'away', joined: '2024-03-10', ip: '46.x.x.x' },
  { id: 4, username: 'sus_h4x0r', email: 'sus@mail.com', rank: 'BRONZE', xp: 120, status: 'suspended', joined: '2026-05-24', ip: '193.x.x.x' },
  { id: 5, username: 'binary_wolf', email: 'wolf@nexus.io', rank: 'PLATINUM', xp: 31200, status: 'active', joined: '2024-04-20', ip: '77.x.x.x' },
]

const ALERTS = [
  { id: 1, level: 'CRITICAL', msg: 'Brute force attempt detected from 193.142.x.x (342 req/min)', time: '2m ago' },
  { id: 2, level: 'HIGH', msg: 'User sus_h4x0r attempted flag submission with SQLi payload', time: '15m ago' },
  { id: 3, level: 'MEDIUM', msg: 'Machine VulnBox-42 CPU spike 98% — possible cryptomining', time: '1h ago' },
  { id: 4, level: 'LOW', msg: 'New user registration spike +120 in last hour', time: '1h ago' },
  { id: 5, level: 'INFO', msg: 'Backup completed successfully: 2.4GB snapshot', time: '3h ago' },
]

const MACHINES = [
  { id: 1, name: 'VulnBox-42', ip: '10.10.10.42', os: 'Linux', diff: 'MEDIUM', status: 'online', players: 14, cpu: 67, mem: 45 },
  { id: 2, name: 'WinServer-2019', ip: '10.10.10.87', os: 'Windows', diff: 'HARD', status: 'online', players: 8, cpu: 45, mem: 72 },
  { id: 3, name: 'ActiveDirectory-Lab', ip: '10.10.10.100', os: 'Windows', diff: 'INSANE', status: 'online', players: 3, cpu: 89, mem: 91 },
  { id: 4, name: 'WebApp-Vulnerable', ip: '10.10.10.55', os: 'Linux', diff: 'EASY', status: 'maintenance', players: 0, cpu: 0, mem: 0 },
]

const alertColors = { CRITICAL: '#ff4757', HIGH: '#ff6b35', MEDIUM: '#fbbf24', LOW: '#9fef00', INFO: '#60a5fa' }
const diffColors = { EASY: '#9fef00', MEDIUM: '#fbbf24', HARD: '#ff6b35', INSANE: '#ff4757' }
const statusColors = { active: '#9fef00', away: '#fbbf24', suspended: '#ff4757', online: '#9fef00', offline: '#ff4757', maintenance: '#fbbf24' }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [suspendedUsers, setSuspendedUsers] = useState(['sus_h4x0r'])

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: BarChart3 },
    { id: 'users', label: 'USERS', icon: Users },
    { id: 'machines', label: 'MACHINES', icon: Server },
    { id: 'alerts', label: 'ALERTS', icon: AlertTriangle },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-[9px] font-mono tracking-[0.4em] mb-2 flex items-center gap-2" style={{ color: '#ff4757' }}>
            <Lock size={10} /> ADMINISTRATOR ACCESS
          </div>
          <h1 className="text-2xl font-display font-black mb-1" style={{ color: '#e4e8f0' }}>
            ADMIN <span style={{ color: '#9fef00' }}>CONTROL CENTER</span>
          </h1>
          <p className="text-[11px] font-mono" style={{ color: '#3d4f62' }}>
            Full system access · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(159,239,0,0.06)', border: '1px solid rgba(159,239,0,0.15)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#9fef00', boxShadow: '0 0 4px #9fef00' }} />
            <span className="text-[10px] font-mono" style={{ color: '#9fef00' }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ADMIN_STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-start justify-between mb-3">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(159,239,0,0.1)', color: '#9fef00' }}>{s.change}</span>
            </div>
            <div className="text-2xl font-display font-black mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-mono tracking-[0.15em]" style={{ color: '#3d4f62' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.04)' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-mono font-bold tracking-widest transition-all"
            style={activeTab === tab.id
              ? { background: '#1a2332', color: '#9fef00', border: '1px solid rgba(159,239,0,0.2)' }
              : { color: '#5a6a7e', border: '1px solid transparent' }
            }>
            <tab.icon size={12} />{tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts panel */}
          <div className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} style={{ color: '#ff4757' }} />
              <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>SECURITY ALERTS</span>
            </div>
            <div className="space-y-2">
              {ALERTS.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#0d1117', border: `1px solid ${alertColors[a.level]}18` }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: alertColors[a.level], boxShadow: `0 0 4px ${alertColors[a.level]}` }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono leading-relaxed" style={{ color: '#a4b1cd' }}>{a.msg}</div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: '#3d4f62' }}>{a.time}</div>
                  </div>
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: alertColors[a.level], background: alertColors[a.level] + '15' }}>{a.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live activity */}
          <div className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} style={{ color: '#9fef00' }} />
              <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>LIVE PLATFORM ACTIVITY</span>
            </div>
            <div className="space-y-2">
              {[
                { action: 'FLAG_CAPTURED', user: 'ph4ntom_r00t', detail: 'Buffer Overflow 101 · +500 XP', time: '10s', color: '#9fef00' },
                { action: 'MACHINE_SPAWN', user: 'binary_wolf', detail: 'ActiveDirectory-Lab · VPN assigned', time: '45s', color: '#60a5fa' },
                { action: 'SUSPICIOUS', user: 'sus_h4x0r', detail: 'SQLi in flag submission', time: '2m', color: '#ff4757' },
                { action: 'RANK_UP', user: 'x0r_master', detail: 'Bronze → Silver · 5000 XP', time: '5m', color: '#fbbf24' },
                { action: 'NEW_USER', user: 'd4rk_n3t', detail: 'Registration from TOR exit node', time: '8m', color: '#ff6b35' },
                { action: 'CHALLENGE_SOLVE', user: 'cyb3r_witch', detail: 'RSA Decrypt Me · +300 XP', time: '10m', color: '#9fef00' },
              ].map((ev, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded" style={{ background: '#0d1117', borderLeft: `2px solid ${ev.color}40` }}>
                  <div className="text-[9px] font-mono font-bold flex-shrink-0" style={{ color: ev.color }}>{ev.action}</div>
                  <div className="flex-1 text-[10px] font-mono truncate" style={{ color: '#5a6a7e' }}>
                    <span style={{ color: '#a4b1cd' }}>{ev.user}</span> · {ev.detail}
                  </div>
                  <span className="text-[9px] font-mono flex-shrink-0" style={{ color: '#3d4f62' }}>{ev.time} ago</span>
                </div>
              ))}
            </div>
          </div>

          {/* Machine health */}
          <div className="p-5 rounded-xl lg:col-span-2" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Server size={14} style={{ color: '#60a5fa' }} />
              <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>MACHINE HEALTH</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {MACHINES.map((m) => (
                <div key={m.id} className="p-4 rounded-lg" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold truncate" style={{ color: '#a4b1cd' }}>{m.name}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[m.status] || '#5a6a7e' }} />
                  </div>
                  <div className="text-[10px] font-mono mb-3" style={{ color: '#3d4f62' }}>{m.ip} · {m.os}</div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="flex justify-between text-[9px] font-mono mb-0.5" style={{ color: '#3d4f62' }}>
                        <span>CPU</span><span style={{ color: m.cpu > 80 ? '#ff4757' : '#9fef00' }}>{m.cpu}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${m.cpu}%`, background: m.cpu > 80 ? '#ff4757' : '#9fef00' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] font-mono mb-0.5" style={{ color: '#3d4f62' }}>
                        <span>MEM</span><span style={{ color: m.mem > 85 ? '#ff4757' : '#60a5fa' }}>{m.mem}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded-full" style={{ width: `${m.mem}%`, background: m.mem > 85 ? '#ff4757' : '#60a5fa' }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono" style={{ color: diffColors[m.diff] }}>{m.diff}</span>
                    <span className="text-[9px] font-mono" style={{ color: '#3d4f62' }}>{m.players} active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>USER MANAGEMENT</span>
            <button className="htb-btn text-[10px] px-3 py-1.5">+ ADD USER</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['USER', 'EMAIL', 'RANK', 'XP', 'STATUS', 'JOINED', 'IP', 'ACTIONS'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[9px] font-mono tracking-widest" style={{ color: '#3d4f62' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_USERS.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-white/2" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td className="py-3 px-3 text-xs font-mono font-bold" style={{ color: '#9fef00' }}>{u.username}</td>
                    <td className="py-3 px-3 text-[10px] font-mono" style={{ color: '#5a6a7e' }}>{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(159,239,0,0.1)', color: '#9fef00' }}>{u.rank}</span>
                    </td>
                    <td className="py-3 px-3 text-[10px] font-mono" style={{ color: '#a4b1cd' }}>{u.xp.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[u.status] }} />
                        <span className="text-[9px] font-mono" style={{ color: statusColors[u.status] }}>{u.status.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[10px] font-mono" style={{ color: '#3d4f62' }}>{u.joined}</td>
                    <td className="py-3 px-3 text-[10px] font-mono" style={{ color: '#3d4f62' }}>{u.ip}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 rounded hover:bg-white/5 transition-colors" title="View Profile">
                          <Eye size={11} style={{ color: '#60a5fa' }} />
                        </button>
                        <button
                          onClick={() => setSuspendedUsers((prev) => prev.includes(u.username) ? prev.filter((x) => x !== u.username) : [...prev, u.username])}
                          className="p-1 rounded hover:bg-white/5 transition-colors"
                          title={suspendedUsers.includes(u.username) ? 'Unsuspend' : 'Suspend'}
                        >
                          {suspendedUsers.includes(u.username) ? <CheckCircle size={11} style={{ color: '#9fef00' }} /> : <Ban size={11} style={{ color: '#ff4757' }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} style={{ color: '#ff4757' }} />
            <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>SECURITY ALERTS — ALL</span>
          </div>
          <div className="space-y-2">
            {ALERTS.map((a) => (
              <div key={a.id} className="flex items-start gap-4 p-4 rounded-lg" style={{ background: '#0d1117', border: `1px solid ${alertColors[a.level]}20` }}>
                <span className="text-[9px] font-mono font-bold px-2 py-1 rounded flex-shrink-0 w-20 text-center" style={{ background: alertColors[a.level] + '18', color: alertColors[a.level] }}>{a.level}</span>
                <div className="flex-1">
                  <div className="text-xs font-mono" style={{ color: '#a4b1cd' }}>{a.msg}</div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: '#3d4f62' }}>{a.time}</div>
                </div>
                <button className="htb-btn-ghost text-[9px] px-2 py-1 flex-shrink-0">ACK</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: 'PLATFORM CONFIG', icon: Settings, items: ['Site name', 'Maintenance mode', 'Registration open', 'Flag format', 'Max team size'] },
            { title: 'SECURITY', icon: Lock, items: ['Rate limiting', '2FA enforcement', 'IP whitelist', 'VPN required', 'Session timeout'] },
            { title: 'DATABASE', icon: Database, items: ['Connection pool', 'Backup schedule', 'Retention policy', 'Query cache', 'Replication'] },
            { title: 'INFRASTRUCTURE', icon: Globe, items: ['CDN settings', 'Load balancer', 'Docker registry', 'SSL certs', 'DNS records'] },
          ].map((section) => (
            <div key={section.title} className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-4">
                <section.icon size={14} style={{ color: '#9fef00' }} />
                <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>{section.title}</span>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#0d1117' }}>
                    <span className="text-[11px] font-mono" style={{ color: '#5a6a7e' }}>{item}</span>
                    <button className="htb-btn-ghost text-[9px] px-2 py-1">EDIT</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
