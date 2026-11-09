import { Link } from 'react-router-dom'
import { errorText } from '../api/client'

export function EmptyState({ title, text, action }) {
  return (
    <div className="state">
      <h2 className="state__title">{title}</h2>
      {text ? <p className="state__text">{text}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state" role="alert">
      <h2 className="state__title">Yuklab bo'lmadi</h2>
      <p className="state__text">{errorText(error)}</p>
      {onRetry ? (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Qayta urinish
        </button>
      ) : null}
    </div>
  )
}

export function Spinner({ label = 'Yuklanmoqda…' }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__dot" />
      <span>{label}</span>
    </div>
  )
}

export function BackLink({ to, children }) {
  return (
    <Link className="back-link" to={to}>
      {children}
    </Link>
  )
}
