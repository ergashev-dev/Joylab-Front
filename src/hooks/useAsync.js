import { useEffect, useState } from 'react'

/**
 * fn(signal) => Promise. deps o'zgarsa qayta ishlaydi, eski so'rov bekor qilinadi.
 * keepPrevious=true bo'lsa yuklanayotganda eski natija ko'rinib turadi (ro'yxat sahifalari uchun).
 */
export function useAsync(fn, deps, { keepPrevious = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ac = new AbortController()
    setState((s) => ({ data: keepPrevious ? s.data : null, error: null, loading: true }))

    fn(ac.signal)
      .then((data) => {
        if (!ac.signal.aborted) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (error.name === 'AbortError' || ac.signal.aborted) return
        setState((s) => ({ data: keepPrevious ? s.data : null, error, loading: false }))
      })

    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, reload: () => setTick((t) => t + 1) }
}
