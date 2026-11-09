import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { EmptyState, Spinner } from '../components/States'

export default function VerifyEmail() {
  usePageTitle('Emailni tasdiqlash')
  const [params] = useSearchParams()
  const token = (params.get('token') || '').trim()
  const { refreshUser, user } = useAuth()
  const [state, setState] = useState(token ? 'loading' : 'invalid')
  const [message, setMessage] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true // StrictMode ikki marta chaqirib, tokenni ikki ishlatmasin
    api
      .verifyEmail(token)
      .then(() => {
        setState('ok')
        refreshUser()
      })
      .catch((err) => {
        setMessage(errorText(err))
        setState('invalid')
      })
  }, [token, refreshUser])

  if (state === 'loading') return <Spinner />

  return (
    <div className="container">
      {state === 'ok' ? (
        <EmptyState
          title="Email tasdiqlandi"
          text="Endi e'lon joylashingiz mumkin."
          action={
            <Link className="btn btn--primary" to="/dashboard/new">
              E'lon joylash
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Havola yaroqsiz"
          text={message || "Havola noto'g'ri yoki muddati tugagan."}
          action={
            <Link className="btn btn--primary" to={user ? '/dashboard' : '/login'}>
              {user ? "Yangi xat so'rash" : 'Kirish'}
            </Link>
          }
        />
      )}
    </div>
  )
}
