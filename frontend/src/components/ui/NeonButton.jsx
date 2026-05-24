import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary: {
    base: 'border-nexus-cyan/40 text-nexus-cyan bg-nexus-cyan/5',
    hover: 'hover:bg-nexus-cyan/10 hover:border-nexus-cyan hover:shadow-neon-cyan',
    glow: '0 0 8px rgba(0,255,204,0.4), 0 0 20px rgba(0,255,204,0.2)',
  },
  secondary: {
    base: 'border-nexus-violet/40 text-nexus-violet bg-nexus-violet/5',
    hover: 'hover:bg-nexus-violet/10 hover:border-nexus-violet hover:shadow-neon-violet',
    glow: '0 0 8px rgba(123,47,255,0.4), 0 0 20px rgba(123,47,255,0.2)',
  },
  danger: {
    base: 'border-nexus-magenta/40 text-nexus-magenta bg-nexus-magenta/5',
    hover: 'hover:bg-nexus-magenta/10 hover:border-nexus-magenta hover:shadow-neon-magenta',
    glow: '0 0 8px rgba(255,0,128,0.4), 0 0 20px rgba(255,0,128,0.2)',
  },
  ghost: {
    base: 'border-white/10 text-nexus-text-dim bg-transparent',
    hover: 'hover:bg-white/5 hover:border-white/20 hover:text-nexus-text',
    glow: '0 0 8px rgba(200,216,232,0.1)',
  },
  solid: {
    base: 'border-nexus-cyan bg-nexus-cyan text-nexus-dark font-bold',
    hover: 'hover:bg-nexus-cyan/80 hover:shadow-neon-cyan-lg',
    glow: '0 0 15px rgba(0,255,204,0.5), 0 0 30px rgba(0,255,204,0.3)',
  },
}

const sizes = {
  xs: 'px-3 py-1 text-xs',
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
  xl: 'px-10 py-4 text-lg',
}

export default function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const v = variants[variant] || variants.primary
  const s = sizes[size] || sizes.md

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 font-mono font-medium',
        'border rounded transition-all duration-200',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-nexus-cyan',
        s,
        v.base,
        v.hover,
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* Shimmer line */}
      <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />

      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border border-current rounded-full border-t-transparent animate-spin" />
          <span>PROCESSING...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  )
}
