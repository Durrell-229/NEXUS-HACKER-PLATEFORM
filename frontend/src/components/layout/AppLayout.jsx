import React, { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AIPanel from '../ai/AIPanel'
import { useNexusStore } from '../../store/nexusStore'
import { PageLoader } from '../ui/LoadingScreen'

function ToastContainer() {
  const { toasts, removeToast } = useNexusStore()
  const variantColors = {
    success: 'border-htb-green/40 bg-htb-green/5 text-htb-green',
    error:   'border-red-400/40 bg-red-400/5 text-red-400',
    warning: 'border-yellow-400/40 bg-yellow-400/5 text-yellow-400',
    info:    'border-blue-400/40 bg-blue-400/5 text-blue-400',
  }
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl font-mono text-xs ${variantColors[toast.type] || variantColors.info}`}
          >
            <div className="flex-1">{toast.message}</div>
            <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 mt-0.5">×</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Mobile overlay backdrop
function MobileBackdrop() {
  const { mobileMenuOpen, closeMobileMenu } = useNexusStore()
  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeMobileMenu}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}
    </AnimatePresence>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useNexusStore()

  // CSS var for sidebar width (desktop only)
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', sidebarCollapsed ? '64px' : '260px')
  }, [sidebarCollapsed])

  // Close mobile menu on route change
  useEffect(() => { closeMobileMenu() }, [location.pathname, closeMobileMenu])

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', minHeight: '100dvh' }}>
      {/* Scanline */}
      <div className="scanline-overlay" />

      {/* Grid bg */}
      <div className="fixed inset-0 nexus-grid-bg opacity-15 pointer-events-none z-0" />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 20% 20%, rgba(159,239,0,0.02) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(124,58,237,0.02) 0%, transparent 60%)'
      }} />

      {/* Mobile backdrop */}
      <MobileBackdrop />

      {/* Sidebar */}
      <Sidebar />

      {/* TopBar */}
      <TopBar />

      {/* Main content */}
      <main
        className="relative z-10 pt-[60px] transition-all duration-300"
        style={{
          marginLeft: 0,
          minHeight: 'calc(100dvh - 60px)',
        }}
      >
        {/* Desktop margin via CSS class */}
        <div className="lg-sidebar-margin" style={{ '--desktop-margin': sidebarCollapsed ? '64px' : '260px' }}>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      <ToastContainer />
      <AIPanel />

      {/* Responsive sidebar margin via style tag */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar-margin {
            margin-left: var(--desktop-margin, 260px);
          }
        }
      `}</style>
    </div>
  )
}
