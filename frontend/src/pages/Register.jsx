import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Terminal, AlertTriangle, UserPlus, Check } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ParticleField from '../components/ui/ParticleField'
import NeonButton from '../components/ui/NeonButton'

function InputField({ label, type = 'text', value, onChange, placeholder, error, hint, success }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono tracking-widest text-nexus-text-dim uppercase">
        &gt; {label}
      </label>
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-md border transition-all duration-200 ${
          focused
            ? 'border-nexus-cyan/50 bg-nexus-cyan/3'
            : error
            ? 'border-nexus-magenta/50 bg-nexus-magenta/3'
            : success
            ? 'border-nexus-cyan/30 bg-nexus-cyan/2'
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
          autoComplete="off"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)} className="text-nexus-text-dim hover:text-nexus-cyan transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {success && !isPassword && (
          <Check size={14} className="text-nexus-cyan flex-shrink-0" />
        )}
      </div>
      {error && <p className="text-[10px] font-mono text-nexus-magenta">{error}</p>}
      {hint && !error && <p className="text-[10px] font-mono text-nexus-text-dim opacity-60">{hint}</p>}
    </div>
  )
}

function PasswordStrength({ password }) {
  const checks = [
    { label: 'MIN 8 CHARS', ok: password.length >= 8 },
    { label: 'UPPERCASE', ok: /[A-Z]/.test(password) },
    { label: 'NUMBER', ok: /\d/.test(password) },
    { label: 'SPECIAL CHAR', ok: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['border-nexus-magenta bg-nexus-magenta', 'border-orange-400 bg-orange-400', 'border-yellow-400 bg-yellow-400', 'border-nexus-cyan bg-nexus-cyan']

  if (!password) return null

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-nexus-border'}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((c, i) => (
          <span
            key={i}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              c.ok ? 'text-nexus-cyan border border-nexus-cyan/30 bg-nexus-cyan/5' : 'text-nexus-text-dim/50 border border-nexus-border'
            }`}
          >
            {c.ok ? '✓ ' : '○ '}{c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [agreed, setAgreed] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username required'
    else if (form.username.length < 3) errs.username = 'Min 3 characters'
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) errs.username = 'Only letters, numbers, _ and -'
    if (!form.email.trim()) errs.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.password) errs.password = 'Password required'
    else if (form.password.length < 8) errs.password = 'Min 8 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (!agreed) errs.agree = 'You must accept the terms'
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
    const result = await register({
      username: form.username,
      email: form.email,
      password: form.password,
    })
    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center relative overflow-hidden py-8">
      <ParticleField className="z-0" particleCount={1500} secondaryColor="#ff0080" />
      <div className="absolute inset-0 nexus-grid-bg opacity-20 z-[1]" />
      <div className="scanline-overlay" />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(123,47,255,0.04) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Corner decorations */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-nexus-violet/60" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-nexus-violet/60" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-nexus-violet/30" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-nexus-violet/30" />

        <div
          className="rounded-xl p-8"
          style={{
            background: 'rgba(2, 5, 12, 0.92)',
            border: '1px solid rgba(123,47,255,0.2)',
            boxShadow: '0 0 40px rgba(123,47,255,0.05), 0 24px 80px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="text-3xl font-display font-black tracking-[0.3em] text-nexus-violet mb-1"
              style={{ textShadow: '0 0 15px rgba(123,47,255,0.5)' }}
            >
              NEXUS
            </div>
            <div className="text-[10px] font-mono text-nexus-text-dim tracking-[0.3em] mb-4">
              NEW NODE REGISTRATION
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-nexus-surface border border-nexus-border">
              <Terminal size={11} className="text-nexus-violet flex-shrink-0" />
              <span className="text-[10px] font-mono text-nexus-text-dim">
                nexus@platform:~$ register_node <span className="text-nexus-violet animate-pulse">_</span>
              </span>
            </div>
          </div>

          {/* Error */}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="USERNAME"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="your_handle"
              error={fieldErrors.username}
              hint="Letters, numbers, _ and - only"
              success={form.username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(form.username)}
            />
            <InputField
              label="EMAIL"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="operator@nexus.io"
              error={fieldErrors.email}
              success={/\S+@\S+\.\S+/.test(form.email)}
            />
            <div>
              <InputField
                label="PASSWORD"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
                error={fieldErrors.password}
              />
              <PasswordStrength password={form.password} />
            </div>
            <InputField
              label="CONFIRM PASSWORD"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              error={fieldErrors.confirmPassword}
              success={form.confirmPassword && form.confirmPassword === form.password}
            />

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    agreed
                      ? 'bg-nexus-violet/20 border-nexus-violet'
                      : fieldErrors.agree
                      ? 'border-nexus-magenta/50'
                      : 'border-nexus-border group-hover:border-nexus-violet/40'
                  }`}
                  onClick={() => setAgreed((v) => !v)}
                >
                  {agreed && <Check size={10} className="text-nexus-violet" />}
                </div>
                <span className="text-[10px] font-mono text-nexus-text-dim leading-relaxed">
                  I accept the{' '}
                  <span className="text-nexus-violet hover:underline cursor-pointer">Terms of Service</span>
                  {' '}and understand this platform is for educational and ethical hacking purposes only.
                </span>
              </label>
              {fieldErrors.agree && (
                <p className="text-[10px] font-mono text-nexus-magenta mt-1">{fieldErrors.agree}</p>
              )}
            </div>

            <NeonButton
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              loading={isLoading}
              rightIcon={<UserPlus size={15} />}
            >
              INITIALIZE NODE
            </NeonButton>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-[11px] font-mono text-nexus-text-dim">
              Already have access?{' '}
              <Link to="/login" className="text-nexus-cyan hover:text-nexus-cyan/80 transition-colors">
                AUTHENTICATE
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
