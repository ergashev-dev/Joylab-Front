import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT } from './ease'

/** Sarlavha so'zlari ko'rinishga kirganda pastdan ko'tarilib chiqadi. */
export default function SplitTitle({ as = 'h2', className = '', children, delay = 0 }) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  const words = String(children).split(' ')
  if (reduce) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }
  return (
    <Tag
      className={`split ${className}`}
      aria-label={children}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ staggerChildren: 0.07, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <span key={i} className="split__mask" aria-hidden="true">
          <motion.span
            className="split__word"
            variants={{ hidden: { y: '110%', rotate: 4 }, show: { y: '0%', rotate: 0 } }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  )
}
