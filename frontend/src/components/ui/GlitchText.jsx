import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function GlitchText({
  children,
  className = '',
  as: Tag = 'span',
  intense = false,
}) {
  return (
    <span className={clsx('relative inline-block', className)} data-text={children}>
      {/* Main text */}
      <motion.span
        className="relative z-10"
        animate={
          intense
            ? {
                x: [0, -2, 2, -1, 1, 0],
                opacity: [1, 0.9, 1, 0.95, 1],
              }
            : {
                x: [0, 0, -1, 1, 0, 0, 0],
                opacity: [1, 1, 0.8, 1, 1, 1],
              }
        }
        transition={{
          duration: intense ? 0.15 : 3,
          repeat: Infinity,
          repeatDelay: intense ? 0.5 : 4,
          ease: 'linear',
        }}
      >
        {children}
      </motion.span>

      {/* Cyan glitch layer */}
      <motion.span
        className="absolute inset-0 text-nexus-cyan pointer-events-none"
        style={{ clipPath: 'polygon(0 20%, 100% 20%, 100% 45%, 0 45%)' }}
        animate={{
          x: [-3, 3, -2, 0],
          opacity: [0, 0.7, 0.5, 0],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          repeatDelay: intense ? 0.8 : 5,
          ease: 'steps(4)',
        }}
        aria-hidden
      >
        {children}
      </motion.span>

      {/* Magenta glitch layer */}
      <motion.span
        className="absolute inset-0 text-nexus-magenta pointer-events-none"
        style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 80%, 0 80%)' }}
        animate={{
          x: [3, -3, 2, 0],
          opacity: [0, 0.6, 0.4, 0],
        }}
        transition={{
          duration: 0.12,
          repeat: Infinity,
          repeatDelay: intense ? 0.8 : 5,
          delay: 0.05,
          ease: 'steps(3)',
        }}
        aria-hidden
      >
        {children}
      </motion.span>
    </span>
  )
}
