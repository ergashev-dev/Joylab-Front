import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { errorText } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { cleanPhone, isValidPhone } from '../lib/format'

export default function Profile() {
  usePageTitle('Profil')
  const { user, refreshUser, logout } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const [delOpen, setDelOpen] = useState(false)
  const [delPw, setDelPw] = useState('')
  const [delBusy, setDelBusy] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    if (fullName.trim().length < 2) return push("Ism kamida 2 belgi bo'lsin", 'error')
    if (phone.trim() && !isValidPhone(phone)) return push("Telefon formati: +998901234567", 'error')
    setSaving(true)
    try {
      const body = { fullName: fullName.trim() }
      if (phone.trim()) {
        const p = cleanPhone(phone)
        body.phone = p.startsWith('+') ? p : `+998${p}`
      }
      await api.updateMe(body)
      await refreshUser()
      push('Profil saqlandi', 'success')
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (next.length < 8) return push("Yangi parol kamida 8 belgi bo'lsin", 'error')
    setPwBusy(true)
    try {
      await api.changePassword({ currentPassword: cur, newPassword: next })
      setCur('')
      setNext('')
      push('Parol almashtirildi', 'success')
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setPwBusy(false)
    }
  }

  async function resend() {
    setResendBusy(true)
    try {
      await api.resendVerification()
      push(`Tasdiqlash xati ${user.email} manziliga yuborildi`, 'success')
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setResendBusy(false)
    }
  }

  async function removeAccount() {
    setDelBusy(true)
    try {
      await api.deleteAccount(delPw)
      push("Hisobingiz o'chirildi", 'success')
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      push(errorText(err), 'error')
      setDelOpen(false)
    } finally {
      setDelBusy(false)
    }
  }

  if (!user) return null

  return (
    <div>
      <h1 className="page__title">Profil</h1>

      <form className="card-block" onSubmit={saveProfile}>
        <h2>Shaxsiy ma'lumotlar</h2>
        <div className="field">
          <label htmlFor="pf-name">Ism</label>
          <input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="pf-phone">Telefon</label>
          <input id="pf-phone" inputMode="tel" placeholder="+998901234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="muted">E'lonlaringizda xaridorlarga ko'rinadi.</p>
        </div>
        <div className="field">
          <label htmlFor="pf-email">Email</label>
          <input id="pf-email" value={user.email} disabled />
          <p className="muted">
            {user.emailVerifiedAt ? (
              <span className="badge-soft badge-soft--ok">Tasdiqlangan</span>
            ) : (
              <>
                <span className="badge-soft">Tasdiqlanmagan</span>{' '}
                {user.emailVerificationRequired ? (
                  <button type="button" className="linkbtn" onClick={resend} disabled={resendBusy}>
                    {resendBusy ? 'Yuborilmoqda…' : 'Tasdiqlash xatini yuborish'}
                  </button>
                ) : null}
              </>
            )}
          </p>
        </div>
        <div>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>

      <form className="card-block" onSubmit={savePassword}>
        <h2>Parolni almashtirish</h2>
        <div className="field">
          <label htmlFor="pw-cur">Joriy parol</label>
          <input id="pw-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw-new">Yangi parol (kamida 8 belgi)</label>
          <input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <button type="submit" className="btn btn--primary" disabled={pwBusy || !cur || !next}>
            {pwBusy ? 'Saqlanmoqda…' : 'Parolni almashtirish'}
          </button>
        </div>
      </form>

      {user.role !== 'ADMIN' ? (
        <section className="card-block">
          <h2>Hisobni o'chirish</h2>
          <p className="muted">Hisobingiz, barcha e'lonlaringiz, rasmlaringiz, saqlanganlaringiz va murojaatlaringiz o'chadi. Buni qaytarib bo'lmaydi.</p>
          <div>
            <button type="button" className="btn btn--ghost btn--text-danger" onClick={() => setDelOpen(true)}>
              Hisobni o'chirish
            </button>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={delOpen}
        title="Hisobni o'chirasizmi?"
        text="Davom etish uchun parolingizni kiriting. Barcha ma'lumotlar o'chadi."
        confirmLabel="Butunlay o'chirish"
        busyLabel="O'chirilmoqda…"
        busy={delBusy}
        onConfirm={() => delPw && removeAccount()}
        onCancel={() => { setDelOpen(false); setDelPw('') }}
      >
        <div className="field">
          <label htmlFor="del-pw">Parol</label>
          <input id="del-pw" type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} />
        </div>
      </ConfirmDialog>
    </div>
  )
}
