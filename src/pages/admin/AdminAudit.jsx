import { useState } from 'react'
import { api } from '../../api'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { useAsync } from '../../hooks/useAsync'

const LABELS = {
  PROPERTY_APPROVE: "E'lon tasdiqlandi",
  PROPERTY_REJECT: "E'lon rad etildi",
  PROPERTY_EDIT: "E'lon tahrirlandi",
  PROPERTY_EXPIRY: "E'lon muddati o'zgardi",
  USER_ROLE: "Rol o'zgartirildi",
  USER_BLOCK: 'Foydalanuvchi bloklandi',
  USER_UNBLOCK: 'Blok olib tashlandi',
  REPORT_HIDE: "Shikoyat bo'yicha e'lon yashirildi",
  REPORT_WARN: 'Sotuvchi ogohlantirildi',
  REPORT_RESOLVE: 'Shikoyat yopildi',
}

const fmt = (iso) => new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })

export default function AdminAudit() {
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useAsync((signal) => api.adminAudit({ page }, signal), [page], { keepPrevious: true })

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  const items = data?.data || []
  const totalPages = Math.max(1, Math.ceil((data?.meta?.total || 0) / (data?.meta?.limit || 30)))

  return (
    <div>
      <h1 className="page__title">Audit jurnali</h1>
      {items.length === 0 ? (
        <EmptyState title="Yozuv yo'q" text="Adminlar amallari shu yerda saqlanadi." />
      ) : (
        <ul className="inqlist">
          {items.map((l) => (
            <li key={l.id} className="inqitem">
              <div className="inqitem__body">
                <p className="inqitem__title">{LABELS[l.action] || l.action}</p>
                <p className="muted">
                  {l.targetType} #{l.targetId ?? '—'}
                  {l.details ? `: ${l.details}` : ''}
                </p>
                <p className="muted">
                  {l.admin?.fullName || "O'chirilgan admin"} · {fmt(l.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 ? (
        <div className="pager">
          <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Oldingi
          </button>
          <span className="muted">
            {page} / {totalPages}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Keyingi
          </button>
        </div>
      ) : null}
    </div>
  )
}
