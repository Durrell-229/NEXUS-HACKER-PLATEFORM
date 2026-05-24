import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Terminal, AlertTriangle, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ParticleField from '../components/ui/ParticleField'
import NeonButton from '../components/ui/NeonButton'
import GlitchText from '../components/ui/GlitchText'

function InputField({ label, type = 'text', value, onChange, placeholder, icon, error, hint }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-nexus-text-dim uppercase">
        {icon && <span className="text-nexus-cyan">{icon}</span>}
        {label}
      </label>
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-md border transition-all duration-200 ${
          focused
            ? 'border-nexus-cyan/50 bg-nexus-cyan/3 shadow-neon-cyan'
            : error
            ? 'border-nexus-magenta/50 bg-nexus-magenta/3'
            : 'border-nexus-border bg-nexus-surface'
        }`}
      >
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm font-mono text-nexus-text placeholder:text-nexus-text-dim/40 outline-none caret-nexus-cyan"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)} className="text-nexus-text-dim hover:text-nexus-cyan transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && <p className="text-[10px] font-mono text-nexus-magenta">{error}</p>}
      {hint && !error && <p className="text-[10px] font-mono text-nexus-text-dim opacity-60">{hint}</p>}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.password) errs.password = 'Password required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    const result = await login(form.email, form.password)
    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center relative overflow-hidden">
      {/* Particles */}
      <ParticleField className="z-0" particleCount={1500} />

      {/* Grid */}
      <div className="absolute inset-0 nexus-grid-bg opacity-20 z-[1]" />

      {/* Scan lines */}
      <div className="scanline-overlay" />
      <div className="scan-lines absolute inset-0 pointer-events-none z-[1] opacity-15" />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(0,255,204,0.04) 0%, transparent 70%)' }}
      />

      {/* Form card */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Corner decorations */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-nexus-cyan/60" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-nexus-cyan/60" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-nexus-cyan/30" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-nexus-cyan/30" />

        <div
          className="rounded-xl p-8"
          style={{
            background: 'rgba(2, 5, 12, 0.92)',
            border: '1px solid rgba(0,255,204,0.2)',
            boxShadow: '0 0 40px rgba(0,255,204,0.05), 0 24px 80px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 mx-auto mb-4"
            >
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <polygon
                  points="28,4 50,17 50,39 28,52 6,39 6,17"
                  stroke="#00ffcc"
                  strokeWidth="1.5"
                  fill="rgba(0,255,204,0.06)"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,204,0.5))' }}
                />
                <polygon
                  points="28,14 42,22 42,34 28,42 14,34 14,22"
                  stroke="#7b2fff"
                  strokeWidth="1"
                  fill="rgba(123,47,255,0.06)"
                />
                <circle cx="28" cy="28" r="5" fill="#00ffcc"
                  style={{ filter: 'drop-shadow(0 0 6px #00ffcc)' }} />
              </svg>
            </motion.div>

            <div
              className="text-3xl font-display font-black tracking-[0.3em] text-nexus-cyan mb-1"
              style={{ textShadow: '0 0 15px rgba(0,255,204,0.5)' }}
            >
              NEXUS
            </div>
            <div className="text-[10px] font-mono text-nexus-text-dim tracking-[0.3em] mb-4">
              AUTHENTICATION REQUIRED
            </div>

            {/* Terminal prompt style */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-nexus-surface border border-nexus-border">
              <Terminal size={11} className="text-nexus-cyan flex-shrink-0" />
              <span className="text-[10px] font-mono text-nexus-text-dim">
                nexus@platform:~$ <span className="text-nexus-cyan animate-pulse">_</span>
              </span>
            </div>
          </div>

          {/* Global error */}
          {error && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-6 rounded-md border border-nexus-magenta/30 bg-nexus-magenta/5"
            >
              <AlertTriangle size={14} className="text-nexus-magenta flex-shrink-0" />
              <span className="text-xs font-mono text-nexus-magenta">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="EMAIL"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="operator@nexus.io"
              icon=">"
              error={fieldErrors.email}
            />
            <InputField
              label="PASSWORD"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••••••"
              icon=">"
              error={fieldErrors.password}
              hint="Case sensitive"
            />

            <NeonButton
              type="submit"
              variant="solid"
              size="lg"
              fullWidth
              loading={isLoading}
              rightIcon={<LogIn size={15} />}
            >
              AUTHENTICATE
            </NeonButton>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-[11px] font-mono text-nexus-text-dim">
              No access credentials?{' '}
              <Link to="/register" className="text-nexus-cyan hover:text-nexus-cyan/80 transition-colors">
                REGISTER NODE
              </Link>
            </p>
            <p className="text-[10px] font-mono text-nexus-text-dim/50">
              // Unauthorized access attempts are logged and prosecuted
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
