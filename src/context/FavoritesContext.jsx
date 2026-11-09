import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [ids, setIds] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const busy = useRef(new Set())

  const applyList = useCallback((list) => {
    setItems(list)
    setIds(new Set(list.map((f) => f.propertyId)))
  }, [])

  // Login qilgan user uchun ro'yxatni bir marta olamiz: ♥ holati shundan olinadi.
  useEffect(() => {
    if (!user) {
      setItems([])
      setIds(new Set())
      setLoading(false)
      return
    }
    const ac = new AbortController()
    setLoading(true)
    api
      .favorites(ac.signal)
      .then(applyList)
      .catch(() => {})
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [user, applyList])

  const toggle = useCallback(
    async (propertyId) => {
      if (busy.current.has(propertyId)) return
      busy.current.add(propertyId)
      const had = ids.has(propertyId)

      setIds((prev) => {
        const next = new Set(prev)
        if (had) next.delete(propertyId)
        else next.add(propertyId)
        return next
      })
      if (had) setItems((list) => list.filter((f) => f.propertyId !== propertyId))

      try {
        if (had) {
          try {
            await api.removeFavorite(propertyId)
          } catch (err) {
            if (err.status !== 404) throw err // ro'yxatda yo'q edi: baribir maqsadga erishildi
          }
        } else {
          try {
            await api.addFavorite(propertyId)
          } catch (err) {
            if (err.status !== 409) throw err // allaqachon saqlangan
          }
          api.favorites().then(applyList).catch(() => {})
        }
      } catch (err) {
        // Optimistik o'zgarishni qaytaramiz
        setIds((prev) => {
          const next = new Set(prev)
          if (had) next.add(propertyId)
          else next.delete(propertyId)
          return next
        })
        if (had) api.favorites().then(applyList).catch(() => {})
        throw err
      } finally {
        busy.current.delete(propertyId)
      }
    },
    [ids, applyList],
  )

  const value = useMemo(() => ({ items, ids, loading, toggle }), [items, ids, loading, toggle])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites FavoritesProvider ichida ishlatilishi kerak')
  return ctx
}
