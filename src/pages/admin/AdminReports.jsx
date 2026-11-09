import { Link } from 'react-router-dom'
import { api } from '../../api'
import { errorText } from '../../api/client'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { REPORT_REASONS } from '../../config'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { formatDate } from '../../lib/format'

export default function AdminReports() {
  const { push } = useToast()
  const { data, error, loading, reload } = useAsync((signal) => api.adminReports(signal), [])

  async function resolve(id) {
    try {
      await api.adminResolveReport(id)
      push('Shikoyat yopildi', 'success')
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  const items = data || []

  return (
    <div>
      <h1 className="page__title">Shikoyatlar</h1>
      {items.length === 0 ? (
        <EmptyState title="Ochiq shikoyat yo'q" text="Foydalanuvchilar shikoyat qilsa, shu yerda ko'rinadi." />
      ) : (
        <ul className="inqlist">
          {items.map((r) => (
            <li key={r.id} className="inqitem">
              <div className="inqitem__body">
                <Link to={`/properties/${r.propertyId}`} className="inqitem__title">
                  {r.property?.title || "O'chirilgan e'lon"}
                </Link>
                <p className="inqitem__msg">{REPORT_REASONS.find((x) => x.value === r.reason)?.label || r.reason}</p>
                {r.message ? <p className="muted">{r.message}</p> : null}
                <p className="muted">
                  {r.reporter?.fullName} ({r.reporter?.email}), {formatDate(r.createdAt)}
                </p>
                <p className="inqitem__actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => resolve(r.id)}>
                    Yopish
                  </button>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
