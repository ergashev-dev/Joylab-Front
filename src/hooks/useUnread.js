import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

/** O'qilmagan bildirishnomalar soni (har 60 soniyada yangilanadi). */
export function useUnread() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (!user) {
      setUnread(0)
      return undefined
    }
    let alive = true
    const load = () =>
      api
        .unreadCount()
        .then((r) => alive && setUnread(r.unread || 0))
        .catch(() => {})
    load()
    const t = setInterval(load, 60_000)
    window.addEventListener('notifications:changed', load)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('notifications:changed', load)
    }
  }, [user])
  return unread
}
