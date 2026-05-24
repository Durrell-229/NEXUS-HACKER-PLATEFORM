import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function HologramText({
  children,
  as: Tag = 'span',
  className = '',
  animate = true,
  size,
  color = 'cyan',
}) {
  const colors = {
    cyan: {
      text: 'text-nexus-cyan',
      shadow: '0 0 10px #00ffcc, 0 0 20px rgba(0,255,204,0.5), 0 0 40px rgba(0,255,204,0.3)',
      shadowBright: '0 0 15px #00ffcc, 0 0 30px rgba(0,255,204,0.6), 0 0 60px rgba(0,255,204,0.4)',
    },
    violet: {
      text: 'text-nexus-violet',
      shadow: '0 0 10px #7b2fff, 0 0 20px rgba(123,47,255,0.5), 0 0 40px rgba(123,47,255,0.3)',
      shadowBright: '0 0 15px #7b2fff, 0 0 30px rgba(123,47,255,0.6), 0 0 60px rgba(123,47,255,0.4)',
    },
    magenta: {
      text: 'text-nexus-magenta',
      shadow: '0 0 10px #ff0080, 0 0 20px rgba(255,0,128,0.5), 0 0 40px rgba(255,0,128,0.3)',
      shadowBright: '0 0 15px #ff0080, 0 0 30px rgba(255,0,128,0.6), 0 0 60px rgba(255,0,128,0.4)',
    },
  }

  const c = colors[color] || colors.cyan

  if (!animate) {
    return (
      <Tag
        className={clsx(c.text, 'font-display', size, className)}
        style={{ textShadow: c.shadow }}
      >
        {children}
      </Tag>
    )
  }

  return (
    <motion.span
      className={clsx(c.text, 'font-display', size, className)}
      style={{ display: 'inline-block' }}
      animate={{
        textShadow: [c.shadow, c.shadowBright, c.shadow],
        opacity: [1, 0.95, 1],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.span>
  )
}
