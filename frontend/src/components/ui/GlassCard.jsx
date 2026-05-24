import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  glowColor = 'cyan',
  padding = 'p-6',
  animate = false,
  onClick,
  style = {},
}) {
  const glowStyles = {
    cyan: 'hover:shadow-neon-cyan hover:border-nexus-border-bright',
    violet: 'hover:border-nexus-violet/40 hover:shadow-neon-violet',
    magenta: 'hover:border-nexus-magenta/40 hover:shadow-neon-magenta',
  }

  const Component = animate ? motion.div : 'div'
  const motionProps = animate ? {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  } : {}

  return (
    <Component
      className={clsx(
        'glass-card',
        padding,
        hover && 'cursor-pointer',
        hover && (glowStyles[glowColor] || glowStyles.cyan),
        glow && 'shadow-neon-cyan',
        className
      )}
      onClick={onClick}
      style={style}
      {...motionProps}
    >
      {children}
    </Component>
  )
}

// Variant with corner decorations
export function HologramCard({ children, className = '', padding = 'p-6', ...props }) {
  return (
    <div className={clsx('relative', className)} {...props}>
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-nexus-cyan/60 z-10" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-nexus-cyan/60 z-10" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-nexus-cyan/60 z-10" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-nexus-cyan/60 z-10" />

      <GlassCard padding={padding} className="h-full">
        {children}
      </GlassCard>
    </div>
  )
}
