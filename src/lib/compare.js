import { useSyncExternalStore } from 'react'

const KEY = 'joylab_compare'
export const COMPARE_MAX = 3
const listeners = new Set()
let cache = null

function read() {
  if (cache) return cache
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    cache = Array.isArray(parsed) ? parsed.filter(Number.isInteger).slice(0, COMPARE_MAX) : []
  } catch {
    cache = []
  }
  return cache
}

function write(ids) {
  cache = ids
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l())
}

export const compareStore = {
  toggle(id) {
    const ids = read()
    if (ids.includes(id)) {
      write(ids.filter((x) => x !== id))
      return true
    }
    if (ids.length >= COMPARE_MAX) return false
    write([...ids, id])
    return true
  },
  clear: () => write([]),
}

export function useCompareIds() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => [],
  )
}
