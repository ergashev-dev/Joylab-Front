import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { isValidEmail } from '../lib/format'

export default function Login() {
  usePageTitle('Kirish')
  const { user, ready, login } = useAuth()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (ready && user) return <Navigate to={from} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    const found = {}
    if (!isValidEmail(email)) found.email = "Email manzilni to'g'ri kiriting."
    if (!password) found.password = 'Parolni kiriting.'
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setFormError(errorText(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="container auth">
      <form className="auth__card" onSubmit={onSubmit} noValidate>
        <h1 className="auth__title">Kirish</h1>
        {location.state?.from ? <p className="muted">Davom etish uchun hisobingizga kiring.</p> : null}

        <div className={`field ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            placeholder="ali@mail.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-err' : undefined}
          />
          {errors.email ? (
            <p className="field__error" id="login-email-err">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className={`field ${errors.password ? 'has-error' : ''}`}>
          <label htmlFor="login-password">Parol</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-err' : undefined}
          />
          {errors.password ? (
            <p className="field__error" id="login-password-err">
              {errors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="form-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? 'Kirilmoqda…' : 'Kirish'}
        </button>

        <p className="auth__alt">
          Hisobingiz yo'qmi?{' '}
          <Link to="/register" state={location.state} className="link">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </form>
    </div>
  )
}
