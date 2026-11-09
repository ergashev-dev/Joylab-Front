import { useState } from 'react'
import { api } from '../api'
import { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// Backend emailVerificationRequired=true bersagina (SMTP sozlangan va user tasdiqlamagan) ko'rinadi.
export default function VerifyBanner() {
  const { user } = useAuth()
  const { push } = useToast()
  const [busy, setBusy] = useState(false)
  if (!user || user.emailVerificationRequired !== true) return null

  async function resend() {
    setBusy(true)
    try {
      await api.resendVerification()
      push(`Tasdiqlash xati ${user.email} manziliga yuborildi`, 'success')
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="verifybanner" role="status">
      <span>
        Emailingiz tasdiqlanmagan: <strong>{user.email}</strong>. E'lon joylash uchun xatdagi havolani bosing.
      </span>
      <button type="button" className="linkbtn" onClick={resend} disabled={busy}>
        {busy ? 'Yuborilmoqda…' : 'Xatni qayta yuborish'}
      </button>
    </div>
  )
}
