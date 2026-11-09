import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { cleanPhone, isValidEmail, isValidPhone } from '../lib/format'

export default function Register() {
  usePageTitle("Ro'yxatdan o'tish")
  const { user, ready, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from || '/'

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (ready && user) return <Navigate to={from} replace />

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const found = {}
    const name = form.fullName.trim()
    if (name.length < 2 || name.length > 100) found.fullName = "Ism 2 dan 100 gacha belgi bo'lsin."
    if (!isValidEmail(form.email)) found.email = "Email manzilni to'g'ri kiriting."
    if (form.password.length < 8) found.password = "Parol kamida 8 belgidan iborat bo'lsin."
    if (form.phone.trim() && !isValidPhone(form.phone)) found.phone = "Raqam +998901234567 yoki 901234567 ko'rinishida bo'lsin."
    return found
  }

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
    }
    if (form.phone.trim()) payload.phone = cleanPhone(form.phone)

    try {
      await register(payload)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: err.message })
      } else {
        setFormError(errorText(err))
      }
      setSubmitting(false)
      // Hisob yaratilgan, lekin avtomatik kirish bajarilmagan bo'lishi mumkin
      if (err instanceof ApiError && err.status === 401) navigate('/login', { replace: true })
    }
  }

  return (
    <div className="container auth">
      <form className="auth__card" onSubmit={onSubmit} noValidate>
        <h1 className="auth__title">Ro'yxatdan o'tish</h1>

        <div className={`field ${errors.fullName ? 'has-error' : ''}`}>
          <label htmlFor="reg-name">To'liq ism</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={set('fullName')}
            placeholder="Ali Valiyev"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'reg-name-err' : undefined}
          />
          {errors.fullName ? (
            <p className="field__error" id="reg-name-err">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className={`field ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            placeholder="ali@mail.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'reg-email-err' : undefined}
          />
          {errors.email ? (
            <p className="field__error" id="reg-email-err">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className={`field ${errors.password ? 'has-error' : ''}`}>
          <label htmlFor="reg-password">Parol</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="reg-password-hint"
          />
          {errors.password ? (
            <p className="field__error" id="reg-password-hint">
              {errors.password}
            </p>
          ) : (
            <p className="field__hint" id="reg-password-hint">
              Kamida 8 belgi.
            </p>
          )}
        </div>

        <div className={`field ${errors.phone ? 'has-error' : ''}`}>
          <label htmlFor="reg-phone">Telefon (ixtiyoriy)</label>
          <input
            id="reg-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+998901234567"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'reg-phone-err' : undefined}
          />
          {errors.phone ? (
            <p className="field__error" id="reg-phone-err">
              {errors.phone}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="form-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? 'Yaratilmoqda…' : "Ro'yxatdan o'tish"}
        </button>

        <p className="auth__alt">
          Hisobingiz bormi?{' '}
          <Link to="/login" state={location.state} className="link">
            Kiring
          </Link>
        </p>
      </form>
    </div>
  )
}
