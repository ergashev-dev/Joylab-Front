import Lenis from 'lenis'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

let lenis = null

/** Lenis silliq scroll. Reduced-motion yoki sensorli ekranda native scroll qoladi. */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Dialog va ichki scroll bloklarida native scroll ishlasin
      prevent: (node) => Boolean(node.closest?.('dialog, [data-lenis-prevent]')),
    })
    let id = 0
    const raf = (time) => {
      lenis.raf(time)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenis = null
    }
  }, [])
  return null
}

/** Sahifa almashganda tepaga qaytish (Lenis bilan ham, usiz ham). */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])
  return null
}
