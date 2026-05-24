import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, Zap, Users, Target, Activity, ChevronRight, Lock, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TEAMS = [
  {
    id: 'red',
    name: 'RED TEAM',
    codename: 'PHANTOM FORCE',
    icon: Target,
    color: '#ff4757',
    bg: 'rgba(255,71,87,0.06)',
    border: 'rgba(255,71,87,0.2)',
    role: 'Offensive Security · Penetration Testing · Adversary Simulation',
    desc: 'Elite offensive operators executing adversary simulations, red team engagements, and full-scope penetration testing. Breach defenses. Prove risk.',
    members: 24,
    ops: 147,
    win_rate: '94%',
    skills: ['MITRE ATT&CK', 'C2 Operations', 'Social Engineering', 'Physical Pentesting', 'APT Simulation', 'Malware Dev'],
    active_op: 'Operation BLACKOUT — Financial sector adversary emulation',
    tools: ['Cobalt Strike', 'Havoc C2', 'Metasploit', 'Burp Suite Pro', 'BloodHound'],
    status: 'ACTIVE OP',
    badge_color: '#ff4757',
  },
  {
    id: 'blue',
    name: 'BLUE TEAM',
    codename: 'SENTINEL',
    icon: Shield,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.2)',
    role: 'Defense · Detection · Incident Response · Threat Hunting',
    desc: 'Defenders who protect infrastructure, hunt threats, and respond to incidents. Build detection rules. Investigate breaches. Protect the perimeter.',
    members: 31,
    ops: 289,
    win_rate: '87%',
    skills: ['SIEM/SOAR', 'Threat Intelligence', 'Malware Analysis', 'Forensics', 'Detection Engineering', 'IR Playbooks'],
    active_op: 'Monitoring financial sector infrastructure — 24/7 SOC operations',
    tools: ['Elastic SIEM', 'Splunk', 'Velociraptor', 'YARA', 'Zeek/Suricata'],
    status: 'MONITORING',
    badge_color: '#60a5fa',
  },
  {
    id: 'purple',
    name: 'PURPLE TEAM',
    codename: 'CONVERGENCE',
    icon: Zap,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.06)',
    border: 'rgba(167,139,250,0.2)',
    role: 'Collaboration · Validation · Control Testing · Knowledge Transfer',
    desc: 'The bridge between offense and defense. Purple team operators collaborate with both red and blue to validate controls, test detection, and improve posture together.',
    members: 18,
    ops: 93,
    win_rate: '99%',
    skills: ['Purple Team Framework', 'MITRE D3FEND', 'Atomic Red Team', 'Control Validation', 'Gap Analysis', 'TTP Mapping'],
    active_op: 'Validating EDR detection coverage against MITRE ATT&CK T1059',
    tools: ['Atomic Red Team', 'VECTR', 'AttackIQ', 'Caldera', 'Prelude Operator'],
    status: 'EXERCISE',
    badge_color: '#a78bfa',
  },
]

const RECENT_OPS = [
  { id: 1, name: 'Operation BLACKOUT', team: 'red', status: 'ACTIVE', score: 94, date: '2026-05-24' },
  { id: 2, name: 'SIEM Rule Deployment', team: 'blue', status: 'COMPLETE', score: 100, date: '2026-05-23' },
  { id: 3, name: 'T1059 Coverage Test', team: 'purple', status: 'ACTIVE', score: 78, date: '2026-05-22' },
  { id: 4, name: 'AD Kerberoasting Sim', team: 'red', status: 'COMPLETE', score: 89, date: '2026-05-21' },
  { id: 5, name: 'Threat Hunt: APT29 TTP', team: 'blue', status: 'COMPLETE', score: 92, date: '2026-05-20' },
]

const teamColors = { red: '#ff4757', blue: '#60a5fa', purple: '#a78bfa' }

function TeamCard({ team, onClick }) {
  const Icon = team.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="relative p-6 rounded-xl cursor-pointer group overflow-hidden"
      style={{ background: team.bg, border: `1px solid ${team.border}` }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${team.color}, transparent)` }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: team.color + '18', border: `1px solid ${team.color}35` }}>
            <Icon size={22} style={{ color: team.color, filter: `drop-shadow(0 0 6px ${team.color}80)` }} />
          </div>
          <div>
            <div className="text-xs font-mono font-black tracking-[0.2em]" style={{ color: team.color }}>{team.name}</div>
            <div className="text-[10px] font-mono" style={{ color: '#3d4f62' }}>CODENAME: {team.codename}</div>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-1 rounded animate-pulse" style={{ background: team.color + '20', color: team.color, border: `1px solid ${team.color}40` }}>
          {team.status}
        </span>
      </div>

      <p className="text-[11px] font-mono leading-relaxed mb-5" style={{ color: '#5a6a7e' }}>{team.desc}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'MEMBERS', value: team.members },
          { label: 'OPS', value: team.ops },
          { label: 'WIN RATE', value: team.win_rate },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-sm font-display font-black" style={{ color: team.color }}>{s.value}</div>
            <div className="text-[9px] font-mono mt-0.5" style={{ color: '#3d4f62' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active op */}
      <div className="px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${team.color}15` }}>
        <div className="text-[9px] font-mono mb-1" style={{ color: team.color }}>● CURRENT OPERATION</div>
        <div className="text-[10px] font-mono" style={{ color: '#a4b1cd' }}>{team.active_op}</div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {team.skills.slice(0, 4).map((s) => (
          <span key={s} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: team.color + '10', color: team.color, border: `1px solid ${team.color}20` }}>{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${team.color}15` }}>
        <div className="flex items-center gap-2">
          <Users size={11} style={{ color: team.color }} />
          <span className="text-[10px] font-mono" style={{ color: '#3d4f62' }}>{team.members} operators</span>
        </div>
        <motion.div
          className="flex items-center gap-1 text-[10px] font-mono group-hover:opacity-100 opacity-0 transition-opacity"
          style={{ color: team.color }}
        >
          JOIN TEAM <ChevronRight size={10} />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Teams() {
  const navigate = useNavigate()
  const [selectedTeam, setSelectedTeam] = useState(null)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="text-[9px] font-mono tracking-[0.4em] mb-2" style={{ color: '#3d4f62' }}>NEXUS PLATFORM</div>
        <h1 className="text-3xl font-display font-black mb-2" style={{ color: '#e4e8f0' }}>
          TEAM <span style={{ color: '#9fef00', textShadow: '0 0 20px rgba(159,239,0,0.3)' }}>OPERATIONS</span>
        </h1>
        <p className="text-xs font-mono" style={{ color: '#3d4f62' }}>
          Join specialized teams. Collaborate. Run real security operations.
        </p>
      </motion.div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {TEAMS.map((team, i) => (
          <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <TeamCard team={team} onClick={() => setSelectedTeam(team)} />
          </motion.div>
        ))}
      </div>

      {/* Ops Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} style={{ color: '#9fef00' }} />
            <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>RECENT OPERATIONS</span>
          </div>
          <div className="space-y-2">
            {RECENT_OPS.map((op) => (
              <div key={op.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: teamColors[op.team], boxShadow: `0 0 4px ${teamColors[op.team]}` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono truncate" style={{ color: '#a4b1cd' }}>{op.name}</div>
                  <div className="text-[9px] font-mono" style={{ color: '#3d4f62' }}>{op.date} · {op.team.toUpperCase()} TEAM</div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded flex-shrink-0" style={{
                  color: op.status === 'ACTIVE' ? '#9fef00' : '#5a6a7e',
                  background: op.status === 'ACTIVE' ? 'rgba(159,239,0,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${op.status === 'ACTIVE' ? 'rgba(159,239,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {op.status}
                </span>
                <div className="text-xs font-mono font-bold" style={{ color: teamColors[op.team] }}>{op.score}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Radio size={14} style={{ color: '#9fef00' }} />
            <span className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>LIVE COMMS CHANNELS</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'red-team-ops', color: '#ff4757', members: 8, msg: 'Lateral movement phase 2 initiated' },
              { name: 'blue-alert', color: '#60a5fa', members: 12, msg: 'Suspicious PowerShell detected on DC01' },
              { name: 'purple-sync', color: '#a78bfa', members: 6, msg: 'TTP T1059.001 coverage gap identified' },
              { name: 'intel-drop', color: '#fbbf24', members: 19, msg: 'New IOCs from ThreatConnect feed' },
              { name: 'incident-response', color: '#ff4757', members: 5, msg: '🔴 ACTIVE IR: Ransomware precursor activity' },
            ].map((ch) => (
              <div key={ch.name} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.04)' }}
                onClick={() => navigate('/signal')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: ch.color + '15', color: ch.color }}>
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-bold" style={{ color: ch.color }}>#{ch.name}</div>
                  <div className="text-[10px] font-mono truncate" style={{ color: '#5a6a7e' }}>{ch.msg}</div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: '#3d4f62' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9fef00', boxShadow: '0 0 3px #9fef00' }} />
                  {ch.members}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
