import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, FlaskConical, BookOpen, Code2, MessageSquare,
  User, Trophy, ChevronLeft, ChevronRight, Zap, Activity,
  Users, Settings, Target
} from 'lucide-react'
import { useNexusStore } from '../../store/nexusStore'
import { useAuthStore } from '../../store/authStore'
import { RankBadge } from '../ui/StatBadge'
import clsx from 'clsx'

const NAV_ITEMS = [
  { path: '/arena', label: 'ARENA', icon: Shield, description: 'CTF Challenges', color: 'cyan' },
  { path: '/labyrinth', label: 'LABYRINTH', icon: FlaskConical, description: 'Labs & Machines', color: 'violet' },
  { path: '/codex', label: 'CODEX', icon: BookOpen, description: 'Knowledge Base', color: 'cyan' },
  { path: '/forge', label: 'FORGE', icon: Code2, description: 'Terminal · IDE', color: 'violet' },
  { path: '/signal', label: 'SIGNAL', icon: MessageSquare, description: 'Encrypted Chat', color: 'magenta' },
  { path: '/teams', label: 'TEAMS', icon: Users, description: 'Red · Blue · Purple', color: 'gold' },
  { path: '/leaderboard', label: 'RANKINGS', icon: Trophy, description: 'Leaderboard', color: 'gold' },
]

const colorMap = {
  cyan:    { active: 'text-htb-green',  glow: 'rgba(159,239,0,0.12)',   border: 'rgba(159,239,0,0.28)',   bg: 'rgba(159,239,0,0.06)' },
  violet:  { active: 'text-purple-400', glow: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.28)',  bg: 'rgba(124,58,237,0.06)' },
  magenta: { active: 'text-red-400',    glow: 'rgba(255,71,87,0.12)',   border: 'rgba(255,71,87,0.28)',   bg: 'rgba(255,71,87,0.06)' },
  gold:    { active: 'text-yellow-400', glow: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.28)',   bg: 'rgba(255,215,0,0.06)' },
}

function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(item.path)
  const c = colorMap[item.color] || colorMap.cyan
  const Icon = item.icon

  return (
    <NavLink to={item.path}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 3 }}
        className={clsx(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group',
          isActive ? 'text-current' : 'text-nexus-text-dim hover:text-nexus-text'
        )}
        style={
          isActive
            ? { background: c.bg, border: `1px solid ${c.border}`, boxShadow: `0 0 12px ${c.glow}` }
            : { border: '1px solid transparent' }
        }
      >
        {/* Active left indicator */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
            style={{ background: c.border.replace('0.3', '1') }}
          />
        )}

        <Icon
          size={17}
          className={clsx('flex-shrink-0 transition-all duration-200', isActive ? c.active : 'opacity-60 group-hover:opacity-90')}
          style={isActive ? { filter: `drop-shadow(0 0 4px ${c.border.replace('0.3', '0.8')})` } : {}}
        />

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className={clsx('text-xs font-mono font-semibold tracking-wider', isActive ? c.active : '')}>
                {item.label}
              </div>
              <div className="text-[10px] text-nexus-text-dim mt-0.5 opacity-70">{item.description}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip for collapsed */}
        {collapsed && (
          <div className="absolute left-full ml-3 px-2 py-1 bg-nexus-darker border border-htb-border rounded text-xs font-mono text-nexus-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {item.label}
          </div>
        )}
      </motion.div>
    </NavLink>
  )
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen } = useNexusStore()
  const { user } = useAuthStore()

  const xpPercent = user ? Math.min(100, (user.xp % 1000) / 10) : 45

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={clsx(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden transition-transform duration-300',
        // Mobile: hidden by default, shown when mobileMenuOpen
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      style={{
        background: 'rgba(13, 17, 23, 0.97)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo area */}
      <div className="relative flex items-center px-4 h-[60px] border-b border-htb-border/50 flex-shrink-0">
        <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          {/* Logo icon */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex-shrink-0 w-8 h-8 relative"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <polygon
                points="16,2 28,10 28,22 16,30 4,22 4,10"
                stroke="#9fef00"
                strokeWidth="1.5"
                fill="rgba(159,239,0,0.04)"
                style={{ filter: 'drop-shadow(0 0 4px rgba(159,239,0,0.5))' }}
              />
              <polygon
                points="16,8 24,13 24,19 16,24 8,19 8,13"
                stroke="rgba(159,239,0,0.3)"
                strokeWidth="1"
                fill="rgba(159,239,0,0.02)"
              />
              <circle cx="16" cy="16" r="3" fill="#9fef00" style={{ filter: 'drop-shadow(0 0 4px #9fef00)' }} />
            </svg>
          </motion.div>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <div
                  className="text-lg font-display font-black tracking-[0.2em] text-htb-green"
                  style={{ textShadow: '0 0 10px rgba(0,255,204,0.6)' }}
                >
                  NEXUS
                </div>
                <div className="text-[9px] font-mono text-nexus-text-dim tracking-[0.3em] -mt-0.5 opacity-60">
                  PLATFORM
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </NavLink>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded border border-htb-border text-nexus-text-dim hover:text-htb-green hover:border-nexus-cyan/40 transition-colors"
        >
          {sidebarCollapsed
            ? <ChevronRight size={12} />
            : <ChevronLeft size={12} />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {/* Dashboard link */}
        <NavLink to="/dashboard">
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group mb-3',
                isActive ? 'text-htb-green' : 'text-nexus-text-dim hover:text-nexus-text'
              )}
              style={
                isActive
                  ? { background: 'rgba(0,255,204,0.06)', border: '1px solid rgba(0,255,204,0.3)' }
                  : { border: '1px solid transparent' }
              }
            >
              <Activity
                size={17}
                className={clsx('flex-shrink-0', isActive ? 'text-htb-green' : 'opacity-60 group-hover:opacity-90')}
                style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(0,255,204,0.8))' } : {}}
              />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <div className={clsx('text-xs font-mono font-semibold tracking-wider', isActive ? 'text-htb-green' : '')}>
                      HUB
                    </div>
                    <div className="text-[10px] text-nexus-text-dim mt-0.5 opacity-70">Dashboard</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </NavLink>

        {/* Separator */}
        <div className="border-t border-htb-border/30 my-2" />

        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
        ))}

        {/* Separator */}
        <div className="border-t border-htb-border/30 my-2" />

        {/* Admin link */}
        <NavLink to="/admin">
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group',
                isActive ? 'text-red-400' : 'text-nexus-text-dim hover:text-nexus-text'
              )}
              style={
                isActive
                  ? { background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.25)' }
                  : { border: '1px solid transparent' }
              }
            >
              <Settings size={17} className={clsx('flex-shrink-0', isActive ? 'text-red-400' : 'opacity-60 group-hover:opacity-90')} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                    <div className={clsx('text-xs font-mono font-semibold tracking-wider', isActive ? 'text-red-400' : '')}>ADMIN</div>
                    <div className="text-[10px] text-nexus-text-dim mt-0.5 opacity-70">Control Center</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </NavLink>

        {/* Vault link */}
        {user && (
          <NavLink to={`/vault/${user.username}`}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group',
                  isActive ? 'text-nexus-violet' : 'text-nexus-text-dim hover:text-nexus-text'
                )}
                style={
                  isActive
                    ? { background: 'rgba(123,47,255,0.06)', border: '1px solid rgba(123,47,255,0.3)' }
                    : { border: '1px solid transparent' }
                }
              >
                <User size={17} className="flex-shrink-0 opacity-60 group-hover:opacity-90" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      <div className="text-xs font-mono font-semibold tracking-wider">VAULT</div>
                      <div className="text-[10px] text-nexus-text-dim mt-0.5 opacity-70">My Profile</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        )}
      </nav>

      {/* User status panel */}
      <AnimatePresence>
        {!sidebarCollapsed && user && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-htb-border/50 p-3 flex-shrink-0"
          >
            <div className="glass-card p-3 rounded-md">
              {/* Avatar + name */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-nexus-dark font-display"
                    style={{ background: 'linear-gradient(135deg, #9fef00, #7c3aed)' }}
                  >
                    {user.username?.[0]?.toUpperCase() || 'N'}
                  </div>
                  {/* Online dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-nexus-cyan border border-nexus-dark"
                    style={{ boxShadow: '0 0 4px rgba(159,239,0,0.8)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-nexus-text truncate">{user.username || 'n3xus_user'}</div>
                  <RankBadge rank={user.rank || 'BRONZE'} />
                </div>
              </div>

              {/* XP bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-nexus-text-dim flex items-center gap-1">
                    <Zap size={9} className="text-htb-green" /> XP
                  </span>
                  <span className="text-htb-green">{user.xp || 1240}/{(Math.floor((user.xp || 1240) / 1000) + 1) * 1000}</span>
                </div>
                <div className="xp-bar-track">
                  <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  />
                </div>
                <div className="text-[10px] font-mono text-nexus-text-dim">
                  LVL {user.level || Math.floor((user.xp || 1240) / 1000) + 1}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed avatar */}
      {sidebarCollapsed && user && (
        <div className="p-3 border-t border-htb-border/50 flex justify-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-nexus-dark font-display"
            style={{ background: 'linear-gradient(135deg, #9fef00, #7c3aed)' }}
          >
            {user.username?.[0]?.toUpperCase() || 'N'}
          </div>
        </div>
      )}
    </motion.aside>
  )
}
