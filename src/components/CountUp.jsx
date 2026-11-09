import { useEffect, useState } from 'react'
import { formatNumber } from '../lib/format'

/** Raqam 0 dan qiymatgacha sanaladi. prefers-reduced-motion bo'lsa darrov chiqadi. */
export default function CountUp({ value, duration = 1500 }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value)
      return undefined
    }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <>
      <span className="sr-only">{formatNumber(value)}</span>
      <span aria-hidden="true">{formatNumber(n)}</span>
    </>
  )
}
