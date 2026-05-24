import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, LogOut, Settings, ChevronDown, Zap, Shield, Terminal, X, Check, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNexusStore } from '../../store/nexusStore'
import { RankBadge, XPBadge } from '../ui/StatBadge'
import clsx from 'clsx'

function NotificationItem({ notif, onRead }) {
  const icons = {
    challenge:   <Shield size={12} style={{ color: '#9fef00' }} />,
    achievement: <Zap size={12} style={{ color: '#ffd700' }} />,
    system:      <Terminal size={12} style={{ color: '#a78bfa' }} />,
    message:     <Bell size={12} style={{ color: '#ff6b7a' }} />,
  }
  return (
    <div
      className={clsx('flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors', notif.read ? 'opacity-40' : 'hover:bg-white/3')}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onClick={() => onRead(notif.id)}
    >
      <div className="mt-0.5 flex-shrink-0">{icons[notif.type] || icons.system}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono leading-relaxed" style={{ color: '#a4b1cd' }}>{notif.message}</p>
        <p className="text-[10px] mt-1" style={{ color: '#3d4f62' }}>{notif.time}</p>
      </div>
      {!notif.read && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#9fef00', boxShadow: '0 0 4px #9fef00' }} />}
    </div>
  )
}

export default function TopBar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isAdmin = user?.is_staff || user?.is_superuser
  const { notifications, markNotificationRead, markAllNotificationsRead, toggleMobileMenu, mobileMenuOpen } = useNexusStore()
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/codex?q=${encodeURIComponent(searchValue)}`)
      setSearchValue('')
      setSearchFocused(false)
    }
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4"
      style={{
        left: 0,
        height: '60px',
        background: 'rgba(13,17,23,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: hamburger (mobile) + desktop spacer */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.06)', color: mobileMenuOpen ? '#9fef00' : '#5a6a7e' }}
        >
          <Menu size={16} />
        </button>

        {/* Desktop brand */}
        <div className="hidden lg:block" style={{ width: 'var(--sidebar-w, 260px)', minWidth: 64 }} />
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xs sm:max-w-md mx-3">
        <div className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
          searchFocused
            ? 'bg-htb-surface'
            : 'bg-htb-surface'
        )}
          style={{ borderColor: searchFocused ? 'rgba(159,239,0,0.3)' : 'rgba(255,255,255,0.06)' }}
        >
          <Search size={13} style={{ color: searchFocused ? '#9fef00' : '#3d4f62', flexShrink: 0 }} />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search NEXUS..."
            className="flex-1 bg-transparent text-xs font-mono outline-none min-w-0"
            style={{ color: '#a4b1cd', caretColor: '#9fef00' }}
          />
          {searchValue && (
            <button type="button" onClick={() => setSearchValue('')}>
              <X size={11} style={{ color: '#5a6a7e' }} />
            </button>
          )}
        </div>
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false) }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.06)', color: notifOpen ? '#9fef00' : '#5a6a7e', background: notifOpen ? 'rgba(159,239,0,0.05)' : 'transparent' }}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono" style={{ background: '#9fef00', color: '#0d1117' }}>
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden z-50"
                style={{ background: '#0d1117', border: '1px solid rgba(159,239,0,0.15)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-mono font-bold tracking-wider" style={{ color: '#a4b1cd' }}>NOTIFICATIONS</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsRead} className="flex items-center gap-1 text-[10px] font-mono transition-colors" style={{ color: '#9fef00' }}>
                      <Check size={10} /> MARK ALL READ
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0
                    ? <div className="px-4 py-6 text-center text-xs font-mono" style={{ color: '#3d4f62' }}>No notifications</div>
                    : notifications.map((n) => <NotificationItem key={n.id} notif={n} onRead={markNotificationRead} />)
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all"
            style={{ borderColor: userMenuOpen ? 'rgba(159,239,0,0.2)' : 'rgba(255,255,255,0.06)', background: userMenuOpen ? 'rgba(159,239,0,0.04)' : 'transparent' }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #9fef00, #7c3aed)', color: '#0d1117' }}>
              {user?.username?.[0]?.toUpperCase() || 'N'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-mono font-bold" style={{ color: '#a4b1cd' }}>{user?.username || 'operator'}</div>
            </div>
            <ChevronDown size={12} style={{ color: '#5a6a7e', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="font-mono font-bold text-sm" style={{ color: '#e4e8f0' }}>{user?.username || 'operator'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <RankBadge rank={user?.rank || 'BRONZE'} />
                    <span className="text-[10px] font-mono" style={{ color: '#3d4f62' }}>LVL {user?.level || 1}</span>
                  </div>
                </div>
                <div className="py-1">
                  {[
                    { label: 'VIEW PROFILE', action: () => navigate(`/vault/${user?.username}`) },
                    { label: 'SETTINGS', action: () => navigate('/forge') },
                    ...(isAdmin ? [{ label: 'ADMIN', action: () => navigate('/admin') }] : []),
                  ].map((item) => (
                    <button key={item.label} onClick={() => { item.action(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono transition-colors text-left hover:bg-white/3"
                      style={{ color: '#5a6a7e' }}>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }} />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono transition-colors hover:bg-red-400/5"
                    style={{ color: '#ff4757' }}>
                    <LogOut size={12} /> DISCONNECT
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
