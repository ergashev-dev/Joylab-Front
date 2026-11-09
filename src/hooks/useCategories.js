import { useEffect, useState } from 'react'
import { api } from '../api'

// Kategoriyalar kamdan-kam o'zgaradi: bir marta olib, modulda saqlaymiz.
let cache = null
let inflight = null

/** Admin kategoriya o'zgartirgach keshni tozalaydi. */
export function resetCategoriesCache() {
  cache = null
}

export function useCategories() {
  const [categories, setCategories] = useState(cache || [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    let alive = true
    if (!inflight) {
      inflight = api
        .categories()
        .then((data) => {
          cache = Array.isArray(data) ? data : []
          return cache
        })
        .finally(() => {
          inflight = null
        })
    }
    inflight
      .then((data) => {
        if (alive) {
          setCategories(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { categories, loading }
}
