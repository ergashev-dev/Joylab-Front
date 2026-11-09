import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Sichqoncha ortidan yurgan yumshoq nur va halqa. Faqat aniq ko'rsatkichli qurilmalarda.
 * Halqa havola yoki tugma ustida kattalashadi. Native kursor o'chirilmaydi.
 */
export default function Cursor() {
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [hover, setHover] = useState(false)
  const [down, setDown] = useState(false)
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const glowX = useSpring(x, { stiffness: 60, damping: 20, mass: 0.6 })
  const glowY = useSpring(y, { stiffness: 60, damping: 20, mass: 0.6 })
  const ringX = useSpring(x, { stiffness: 520, damping: 38, mass: 0.4 })
  const ringY = useSpring(y, { stiffness: 520, damping: 38, mass: 0.4 })

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!fine || reduce) return undefined
    setEnabled(true)
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setHover(Boolean(e.target.closest?.('a, button, label, select, [role="button"]')))
    }
    const press = () => setDown(true)
    const release = () => setDown(false)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
    }
  }, [reduce, x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div className="cursor-glow" style={{ x: glowX, y: glowY }} aria-hidden="true" />
      <motion.div
        className={`cursor-ring ${hover ? 'is-hover' : ''}`}
        style={{ x: ringX, y: ringY }}
        animate={{ scale: down ? 0.75 : hover ? 1.9 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        aria-hidden="true"
      />
    </>
  )
}
