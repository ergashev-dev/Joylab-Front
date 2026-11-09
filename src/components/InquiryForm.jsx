import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { errorText } from '../api/client'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cleanPhone, isValidPhone } from '../lib/format'

const MAX = 1000

export default function InquiryForm({ property }) {
  const { user } = useAuth()
  const { push } = useToast()
  const location = useLocation()

  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  // Login qilmagan user uchun forma o'rniga taklif
  if (!user) {
    return (
      <div className="inquiry">
        <h2 className="inquiry__title">Sotuvchiga yozing</h2>
        <p className="muted">Murojaat yuborish uchun hisobingizga kiring.</p>
        <Link className="btn btn--primary btn--block" to="/login" state={{ from: location.pathname }}>
          Murojaat uchun kiring
        </Link>
      </div>
    )
  }

  // E'lon egasiga forma ko'rsatilmaydi
  if (property.owner?.id === user.id) {
    return (
      <div className="inquiry">
        <p className="muted">Bu sizning e'loningiz. Xaridorlar murojaatini shu yerda ko'rmaysiz, ular telefon orqali bog'lanadi.</p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="inquiry" role="status">
        <h2 className="inquiry__title">Murojaat yuborildi</h2>
        <p className="muted">Sotuvchi ko'rib chiqib, ko'rsatgan raqamingizga qo'ng'iroq qiladi.</p>
        <Link className="btn btn--ghost btn--block" to="/inquiries">
          Murojaatlarimni ko'rish
        </Link>
      </div>
    )
  }

  function validate() {
    const next = {}
    const text = message.trim()
    if (text.length < 10) next.message = "Xabar kamida 10 belgidan iborat bo'lsin."
    else if (text.length > MAX) next.message = `Xabar ${MAX} belgidan oshmasin.`
    if (!phone.trim()) next.phone = 'Telefon raqamingizni kiriting.'
    else if (!isValidPhone(phone)) next.phone = 'Raqam +998901234567 yoki 901234567 ko\'rinishida bo\'lsin.'
    return next
  }

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await api.sendInquiry(property.id, { message: message.trim(), phone: cleanPhone(phone) })
      setSent(true)
      push('Murojaat yuborildi', 'success')
    } catch (err) {
      setFormError(errorText(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="inquiry" onSubmit={onSubmit} noValidate>
      <h2 className="inquiry__title">Sotuvchiga yozing</h2>

      <div className={`field ${errors.message ? 'has-error' : ''}`}>
        <label htmlFor="inq-message">Xabar</label>
        <textarea
          id="inq-message"
          rows={4}
          value={message}
          maxLength={MAX}
          onChange={(e) => {
            setMessage(e.target.value)
            if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
          }}
          placeholder="Salom, uy hali sotilmadimi? Ko'rib chiqsam bo'ladimi?"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'inq-message-err' : undefined}
        />
        <div className="field__row">
          {errors.message ? (
            <p className="field__error" id="inq-message-err">
              {errors.message}
            </p>
          ) : (
            <span />
          )}
          <span className="field__count">
            {message.length}/{MAX}
          </span>
        </div>
      </div>

      <div className={`field ${errors.phone ? 'has-error' : ''}`}>
        <label htmlFor="inq-phone">Telefon raqamingiz</label>
        <input
          id="inq-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
          }}
          placeholder="+998901234567"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'inq-phone-err' : undefined}
        />
        {errors.phone ? (
          <p className="field__error" id="inq-phone-err">
            {errors.phone}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="form-error" role="alert">
          {formError}
        </p>
      ) : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting ? 'Yuborilmoqda…' : 'Murojaat yuborish'}
      </button>
    </form>
  )
}
