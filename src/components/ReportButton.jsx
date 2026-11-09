import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { errorText } from '../api/client'
import { REPORT_REASONS } from '../config'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ReportButton({ propertyId }) {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const dialog = useRef(null)
  const [reason, setReason] = useState('SPAM')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function open() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    dialog.current?.showModal()
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.reportProperty(propertyId, { reason, message: message.trim() || undefined })
      push('Shikoyat qabul qilindi. Rahmat!', 'success')
      dialog.current?.close()
      setMessage('')
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="linkbtn" onClick={open}>
        Shikoyat qilish
      </button>
      <dialog ref={dialog} className="reportdlg" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
        <form onSubmit={submit} className="reportdlg__form">
          <h2>Shikoyat qilish</h2>
          <div className="field">
            <label htmlFor="rep-reason">Sabab</label>
            <select id="rep-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rep-msg">Izoh (ixtiyoriy)</label>
            <textarea id="rep-msg" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="reportdlg__actions">
            <button type="button" className="btn btn--ghost" onClick={() => dialog.current?.close()}>
              Bekor qilish
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Yuborilmoqda…' : 'Yuborish'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
