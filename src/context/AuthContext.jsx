import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { onUnauthorized, tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(() => !tokenStore.get())

  // Token eskirsa yoki noto'g'ri bo'lsa backend 401 qaytaradi: sessiyani tozalaymiz.
  useEffect(() => {
    onUnauthorized(() => {
      tokenStore.clear()
      setUser(null)
    })
  }, [])

  // Sahifa yangilanganda userni token orqali tiklaymiz.
  useEffect(() => {
    if (!tokenStore.get()) return
    const ac = new AbortController()
    api
      .me(ac.signal)
      .then(setUser)
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (err.status === 401) tokenStore.clear()
      })
      .finally(() => {
        if (!ac.signal.aborted) setReady(true)
      })
    return () => ac.abort()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password })
    tokenStore.set(res.accessToken)
    setUser(res.user)
    return res.user
  }, [])

  // Register token qaytarmaydi, shuning uchun darhol login qilamiz.
  const register = useCallback(
    async (data) => {
      await api.register(data)
      return login(data.email, data.password)
    },
    [login],
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return ctx
}
