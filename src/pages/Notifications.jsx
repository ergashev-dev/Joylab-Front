import { Link } from 'react-router-dom'
import { api } from '../api'
import { errorText } from '../api/client'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'

const fmt = (iso) => new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
const changed = () => window.dispatchEvent(new Event('notifications:changed'))

export default function Notifications() {
  usePageTitle('Bildirishnomalar')
  const { push } = useToast()
  const { data, error, loading, reload } = useAsync((signal) => api.notifications(signal), [])

  async function readAll() {
    try {
      await api.markAllNotificationsRead()
      changed()
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  async function open(n) {
    if (n.readAt) return
    try {
      await api.markNotificationRead(n.id)
      changed()
    } catch {
      /* e'tiborsiz */
    }
  }

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  const items = data?.items || []

  return (
    <div>
      <div className="page__head">
        <h1 className="page__title">Bildirishnomalar</h1>
        {data?.unread > 0 ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={readAll}>
            Hammasini o'qilgan qilish
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState title="Bildirishnoma yo'q" text="E'lon tasdiqlansa, rad etilsa, muddati tugayotgan bo'lsa yoki murojaat kelsa shu yerda ko'rinadi." />
      ) : (
        <ul className="notif">
          {items.map((n) => (
            <li key={n.id} className={n.readAt ? '' : 'is-unread'}>
              {n.link ? (
                <Link to={n.link} onClick={() => open(n)}>
                  {n.text}
                </Link>
              ) : (
                <span>{n.text}</span>
              )}
              <p className="muted">{fmt(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
