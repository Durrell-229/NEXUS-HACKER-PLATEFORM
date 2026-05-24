import React, { useState, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, Wifi, WifiOff, Loader, Shield, Monitor,
  ChevronRight, Clock, Zap, Target, RefreshCw,
  Maximize2, Minimize2, Circle, AlertCircle,
  Cpu, Globe, Activity, Flag
} from 'lucide-react'

const KaliTerminal = lazy(() => import('../components/terminal/KaliTerminal'))

// ─── Data ─────────────────────────────────────────────────────────────────────

const MACHINES = [
  {
    id: 1, name: 'LunaSec', ip: '10.10.11.201', os: 'Linux',
    diff: 'EASY', pts: 20, status: 'active',
    desc: 'A misconfigured OAuth2 server leaks session tokens. Exploit the race condition.',
    tags: ['Web', 'OAuth', 'Race Condition'],
    services: [{ port: 22, name: 'SSH' }, { port: 80, name: 'HTTP' }, { port: 443, name: 'HTTPS' }],
    solves: 2841, released: '2026-04-01',
  },
  {
    id: 2, name: 'DarkForest', ip: '10.10.11.187', os: 'Linux',
    diff: 'MEDIUM', pts: 30, status: 'active',
    desc: 'A PHP application hides a serialization vulnerability behind WAF bypass techniques.',
    tags: ['PHP', 'Deserialization', 'WAF Bypass'],
    services: [{ port: 22, name: 'SSH' }, { port: 80, name: 'HTTP' }, { port: 8080, name: 'Proxy' }],
    solves: 1104, released: '2026-03-15',
  },
  {
    id: 3, name: 'Phantom', ip: '10.10.11.212', os: 'Windows',
    diff: 'HARD', pts: 40, status: 'active',
    desc: 'Active Directory misconfiguration allows Kerberoasting and lateral movement.',
    tags: ['AD', 'Kerberoasting', 'Privesc'],
    services: [{ port: 88, name: 'Kerberos' }, { port: 445, name: 'SMB' }, { port: 389, name: 'LDAP' }],
    solves: 387, released: '2026-05-01',
  },
  {
    id: 4, name: 'StackSmash', ip: '10.10.11.143', os: 'Linux',
    diff: 'MEDIUM', pts: 30, status: 'active',
    desc: 'Classic stack buffer overflow with NX enabled. ROP chain required to get shell.',
    tags: ['Pwn', 'ROP', 'Buffer Overflow'],
    services: [{ port: 22, name: 'SSH' }, { port: 1337, name: 'Custom' }],
    solves: 943, released: '2026-02-28',
  },
]

const DIFF_STYLES = {
  EASY:   { color: '#00ff88', bg: 'rgba(0,255,136,0.08)',   border: 'rgba(0,255,136,0.25)' },
  MEDIUM: { color: '#ffcc00', bg: 'rgba(255,204,0,0.08)',   border: 'rgba(255,204,0,0.25)' },
  HARD:   { color: '#ff4444', bg: 'rgba(255,68,68,0.08)',   border: 'rgba(255,68,68,0.25)' },
  INSANE: { color: '#c678dd', bg: 'rgba(198,120,221,0.08)', border: 'rgba(198,120,221,0.25)' },
}

const OS_ICON = { Linux: '🐧', Windows: '🪟' }

// ─── StatusDot ────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const map = {
    connected:    { color: '#00ff88', label: 'CONNECTED',     Icon: Wifi },
    connecting:   { color: '#ffcc00', label: 'CONNECTING...', Icon: Loader, spin: true },
    disconnected: { color: '#666688', label: 'DISCONNECTED',  Icon: WifiOff },
    error:        { color: '#ff4444', label: 'ERROR',         Icon: AlertCircle },
  }
  const { color, label, Icon, spin } = map[status] || map.disconnected
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={status === 'connected' ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: status === 'connected' ? `0 0 6px ${color}` : 'none' }}
      />
      <Icon size={12} className={spin ? 'animate-spin' : ''} style={{ color }} />
      <span className="font-mono text-[10px] tracking-widest" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── MachineCard ──────────────────────────────────────────────────────────────

function MachineCard({ machine, selected, onSelect }) {
  const diff = DIFF_STYLES[machine.diff]
  const isActive = selected?.id === machine.id

  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={() => onSelect(machine)}
      className="relative p-3 rounded-lg cursor-pointer transition-all duration-200"
      style={{
        background: isActive ? 'rgba(0,255,204,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? 'rgba(0,255,204,0.3)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isActive ? '0 0 16px rgba(0,255,204,0.08)' : 'none',
      }}
    >
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
          style={{ background: '#00ffcc', boxShadow: '0 0 8px #00ffcc' }}
        />
      )}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs font-bold text-white">{machine.name}</span>
        <span
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
          style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}
        >
          {machine.diff}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px]" style={{ color: '#ffcc00' }}>{machine.ip}</span>
        <span className="font-mono text-[10px] text-gray-600">{OS_ICON[machine.os]} {machine.os}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <Flag size={9} className="text-gray-700" />
        <Flag size={9} className="text-gray-700" />
        <span className="ml-auto font-mono text-[9px] text-gray-700">{machine.solves.toLocaleString()} solves</span>
      </div>
    </motion.div>
  )
}

// ─── MachineDetail ────────────────────────────────────────────────────────────

function MachineDetail({ machine, onConnect }) {
  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
          style={{ background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.15)' }}
        >
          <Target size={28} style={{ color: 'rgba(0,255,204,0.4)' }} />
        </div>
        <p className="font-mono text-xs text-gray-600">Select a machine to view details</p>
      </div>
    )
  }

  const diff = DIFF_STYLES[machine.diff]

  return (
    <motion.div
      key={machine.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-4 space-y-4"
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-mono text-sm font-bold text-white tracking-wide">{machine.name}</h2>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
            style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}
          >
            {machine.diff}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs" style={{ color: '#ffcc00' }}>{machine.ip}</span>
          <span className="font-mono text-xs text-gray-500">{OS_ICON[machine.os]} {machine.os}</span>
          <span className="font-mono text-xs text-gray-600">{machine.pts} pts</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">{machine.desc}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {machine.tags.map(t => (
          <span
            key={t}
            className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,255,204,0.06)', border: '1px solid rgba(0,255,204,0.15)', color: '#00ffcc' }}
          >
            {t}
          </span>
        ))}
      </div>

      <div>
        <div className="text-[9px] font-mono text-gray-600 tracking-widest mb-2">OPEN SERVICES</div>
        <div className="space-y-1">
          {machine.services.map(s => (
            <div key={s.port} className="flex items-center gap-2">
              <Circle size={6} style={{ color: '#00ff88', fill: '#00ff88' }} />
              <span className="font-mono text-[11px]" style={{ color: '#ffcc00' }}>{s.port}</span>
              <span className="font-mono text-[11px] text-gray-500">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { val: machine.solves.toLocaleString(), label: 'SOLVES', color: 'white' },
          { val: machine.pts,                     label: 'PTS',    color: diff.color },
        ].map(({ val, label, color }) => (
          <div
            key={label}
            className="p-2 rounded text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="font-mono text-sm font-bold" style={{ color }}>{val}</div>
            <div className="font-mono text-[9px] text-gray-600 tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onConnect(machine)}
        className="w-full py-2.5 rounded font-mono text-xs font-bold tracking-widest"
        style={{
          background: 'rgba(0,255,204,0.1)',
          border: '1px solid rgba(0,255,204,0.4)',
          color: '#00ffcc',
          boxShadow: '0 0 20px rgba(0,255,204,0.08)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Terminal size={13} />
          CONNECT TO MACHINE
        </span>
      </motion.button>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Forge() {
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [terminalStatus, setTerminalStatus] = useState('disconnected')
  const [elapsed, setElapsed] = useState(0)
  const [startTimeRef] = useState({ t: null })
  const [fullscreen, setFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('terminal')
  const [notes, setNotes] = useState('')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const termKeyRef = useRef(0)

  // Timer
  React.useEffect(() => {
    if (terminalStatus !== 'connected') return
    if (!startTimeRef.t) startTimeRef.t = Date.now()
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.t) / 1000))
    }, 1000)
    return () => clearInterval(iv)
  }, [terminalStatus, startTimeRef])

  const fmt = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100dvh - 60px)', background: '#02050c', overflow: 'hidden' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: '44px',
          background: 'rgba(0,0,0,0.5)',
          borderBottom: '1px solid rgba(0,255,204,0.08)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal size={14} style={{ color: '#00ffcc' }} />
            <span className="font-mono text-xs font-bold tracking-widest" style={{ color: '#00ffcc' }}>
              NEXUS FORGE
            </span>
          </div>
          {/* Mobile: toggle machine list */}
          <button
            onClick={() => setMobilePanelOpen(v => !v)}
            className="lg:hidden flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold"
            style={{
              background: mobilePanelOpen ? 'rgba(0,255,204,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mobilePanelOpen ? 'rgba(0,255,204,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: mobilePanelOpen ? '#00ffcc' : '#666688',
            }}
          >
            <Monitor size={10} />
            MACHINES
          </button>
          {selectedMachine && (
            <>
              <ChevronRight size={12} className="text-gray-700" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{selectedMachine.name}</span>
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    color: DIFF_STYLES[selectedMachine.diff].color,
                    background: DIFF_STYLES[selectedMachine.diff].bg,
                    border: `1px solid ${DIFF_STYLES[selectedMachine.diff].border}`,
                  }}
                >
                  {selectedMachine.diff}
                </span>
                <span className="font-mono text-[10px]" style={{ color: '#ffcc00' }}>
                  {selectedMachine.ip}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <StatusDot status={terminalStatus} />
          {terminalStatus === 'connected' && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-600">
              <Clock size={10} />
              <span>{fmt(elapsed)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { termKeyRef.current += 1; setTerminalStatus('disconnected'); startTimeRef.t = null; setElapsed(0) }}
              className="p-1.5 rounded text-gray-700 hover:text-yellow-400 transition-colors"
              title="Reconnect"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={() => setFullscreen(f => !f)}
              className="p-1.5 rounded text-gray-700 hover:text-white transition-colors"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen terminal'}
            >
              {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: machine list + detail — desktop: inline, mobile: slide-over */}
        {!fullscreen && (
          <>
            {/* Mobile backdrop */}
            {mobilePanelOpen && (
              <div
                className="lg:hidden fixed inset-0 z-20 bg-black/60"
                onClick={() => setMobilePanelOpen(false)}
              />
            )}
          <div
            className={`flex flex-col flex-shrink-0 overflow-hidden
              lg:relative lg:translate-x-0 lg:z-auto
              fixed top-[104px] left-0 z-30 transition-transform duration-300
              ${mobilePanelOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            style={{
              width: '260px',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              background: '#02050c',
              height: 'calc(100dvh - 104px)',
            }}
          >
            {/* Machine list */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-widest text-gray-600">MACHINES</span>
                <span className="font-mono text-[9px] text-gray-700">{MACHINES.length} live</span>
              </div>
              <div className="px-2 pb-2 space-y-1.5" style={{ maxHeight: '210px', overflowY: 'auto' }}>
                {MACHINES.map(m => (
                  <MachineCard
                    key={m.id}
                    machine={m}
                    selected={selectedMachine}
                    onSelect={(m) => { setSelectedMachine(m); setMobilePanelOpen(false) }}
                  />
                ))}
              </div>
            </div>

            {/* Detail */}
            <div className="flex-1 overflow-y-auto">
              <MachineDetail machine={selectedMachine} onConnect={setSelectedMachine} />
            </div>
          </div>
          </>
        )}

        {/* Right: terminal / notes */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Tab bar */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              height: '36px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            {[
              { id: 'terminal', label: 'TERMINAL', Icon: Terminal },
              { id: 'notes',    label: 'NOTES',    Icon: Activity },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 h-full font-mono text-[10px] tracking-wider transition-all"
                style={{
                  color: activeTab === id ? '#00ffcc' : '#444466',
                  borderBottom: activeTab === id ? '2px solid #00ffcc' : '2px solid transparent',
                  background: activeTab === id ? 'rgba(0,255,204,0.04)' : 'transparent',
                }}
              >
                <Icon size={11} />
                {label}
                {id === 'terminal' && (
                  <div
                    className="w-1.5 h-1.5 rounded-full ml-0.5"
                    style={{
                      background: terminalStatus === 'connected' ? '#00ff88' :
                                  terminalStatus === 'connecting' ? '#ffcc00' : '#333355',
                    }}
                  />
                )}
              </button>
            ))}

            {/* macOS-style window decorations */}
            <div className="ml-auto flex items-center gap-1.5 px-4">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57', opacity: 0.7 }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e', opacity: 0.7 }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840', opacity: 0.7 }} />
            </div>
          </div>

          {/* Panel content */}
          <AnimatePresence mode="wait">
            {activeTab === 'terminal' ? (
              <motion.div
                key="terminal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex-1 overflow-hidden"
                style={{ background: '#020508' }}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full gap-3">
                      <Loader size={16} className="animate-spin" style={{ color: '#00ffcc' }} />
                      <span className="font-mono text-xs text-gray-600">Loading terminal...</span>
                    </div>
                  }
                >
                  <KaliTerminal
                    key={termKeyRef.current}
                    className="w-full h-full"
                    onStatusChange={setTerminalStatus}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex-1 flex flex-col"
                style={{ background: '#020508' }}
              >
                <div
                  className="px-4 py-2 font-mono text-[9px] text-gray-700 tracking-widest"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  OPERATOR NOTES · {selectedMachine?.name.toUpperCase() ?? 'NO MACHINE'}
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={`# ${selectedMachine?.name ?? 'Machine'}\n\n## Recon\n\n## Foothold\n\n## Privesc\n\n## Flags\nUser: \nRoot: `}
                  className="flex-1 resize-none outline-none font-mono text-xs leading-6 p-4 text-gray-300"
                  style={{ background: 'transparent', caretColor: '#00ffcc' }}
                  spellCheck={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: '24px',
          background: terminalStatus === 'connected' ? 'rgba(0,255,136,0.06)' : 'rgba(0,0,0,0.4)',
          borderTop: `1px solid ${terminalStatus === 'connected' ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)'}`,
          transition: 'all 0.4s',
        }}
      >
        <div className="flex items-center gap-4">
          <StatusDot status={terminalStatus} />
          {selectedMachine && (
            <span className="font-mono text-[9px] text-gray-700">
              {OS_ICON[selectedMachine.os]} {selectedMachine.os} · {selectedMachine.ip}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-gray-700">
            <Cpu size={8} className="inline mr-1" />UTF-8
          </span>
          <span className="font-mono text-[9px] text-gray-700">
            <Globe size={8} className="inline mr-1" />WS/TLS
          </span>
          {terminalStatus === 'connected' && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-mono text-[9px]"
              style={{ color: '#00ff88' }}
            >
              ● LIVE
            </motion.span>
          )}
        </div>
      </div>
    </div>
  )
}
