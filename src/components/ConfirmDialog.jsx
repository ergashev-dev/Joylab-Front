import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, title, text, confirmLabel = 'Ha', tone = 'danger', busyLabel = 'Bajarilmoqda…', busy = false, onConfirm, onCancel, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault() // Esc: holatni o'zimiz boshqaramiz
        if (!busy) onCancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
    >
      <div className="confirm__body">
        <h2 id="confirm-title">{title}</h2>
        {text ? <p className="muted">{text}</p> : null}
        {children}
        <div className="confirm__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Bekor qilish
          </button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
