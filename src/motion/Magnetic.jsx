import { motion, useReducedMotion, useSpring } from 'framer-motion'
import { useRef } from 'react'

/** Bolani sichqonchaga qarab tortadi (magnit tugma). */
export default function Magnetic({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const x = useSpring(0, { stiffness: 240, damping: 16, mass: 0.4 })
  const y = useSpring(0, { stiffness: 240, damping: 16, mass: 0.4 })

  if (reduce) return children

  function onMove(e) {
    if (e.pointerType !== 'mouse') return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  function onLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span ref={ref} className={`magnetic ${className}`} style={{ x, y }} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </motion.span>
  )
}
