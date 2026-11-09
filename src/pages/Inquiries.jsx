import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { errorText } from '../api/client'
import Placeholder from '../components/Placeholder'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, formatPrice, imageSrc } from '../lib/format'

function Sent() {
  const { data, error, loading, reload } = useAsync((signal) => api.myInquiries(signal), [])
  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  const items = data || []
  if (items.length === 0) {
    return (
      <EmptyState
        title="Murojaat yubormagansiz"
        text="E'lon sahifasidagi formadan sotuvchiga yozishingiz mumkin."
        action={
          <Link className="btn btn--primary" to="/properties">
            E'lonlarni ko'rish
          </Link>
        }
      />
    )
  }
  return (
    <ul className="inqlist">
      {items.map((q) => {
        const src = imageSrc(q.property?.images?.[0]?.url)
        return (
          <li key={q.id} className="inqitem">
            <Link to={`/properties/${q.propertyId}`} className="inqitem__thumb" aria-hidden="true" tabIndex={-1}>
              {src ? <img src={src} alt="" loading="lazy" /> : <Placeholder />}
            </Link>
            <div className="inqitem__body">
              <Link to={`/properties/${q.propertyId}`} className="inqitem__title">
                {q.property?.title || "O'chirilgan e'lon"}
              </Link>
              {q.property ? (
                <p className="muted">
                  {formatPrice(q.property.price, q.property.currency)}, {q.property.city}
                </p>
              ) : null}
              <p className="inqitem__msg">{q.message}</p>
              <p className="muted">
                {formatDate(q.createdAt)}, tel: {q.phone}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Received() {
  const { push } = useToast()
  const [page, setPage] = useState(1)
  const [readIds, setReadIds] = useState(() => new Set())
  const { data, error, loading, reload } = useAsync((signal) => api.receivedInquiries({ page, limit: 12 }, signal), [page], { keepPrevious: true })

  async function markRead(q) {
    try {
      await api.markInquiryRead(q.id)
      setReadIds((s) => new Set(s).add(q.id))
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  if (loading && !data) return <Spinner />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  const items = data?.data || []
  const meta = data?.meta
  if (items.length === 0) {
    return <EmptyState title="Hozircha murojaat yo'q" text="E'lonlaringizga kelgan murojaatlar shu yerda ko'rinadi." />
  }

  return (
    <>
      <ul className="inqlist">
        {items.map((q) => {
          const unread = !q.readAt && !readIds.has(q.id)
          const tel = String(q.phone || '').replace(/\s/g, '')
          return (
            <li key={q.id} className={`inqitem inqitem--received ${unread ? 'is-unread' : ''}`}>
              <div className="inqitem__body">
                <Link to={`/properties/${q.propertyId}`} className="inqitem__title">
                  {q.property?.title || "O'chirilgan e'lon"}
                </Link>
                <p className="inqitem__msg">{q.message}</p>
                <p className="muted">
                  {q.sender?.fullName}, {formatDate(q.createdAt)}
                  {unread ? ' · yangi' : ''}
                </p>
                <p className="inqitem__actions">
                  <a className="btn btn--primary btn--sm" href={`tel:${tel}`}>
                    Qo'ng'iroq: {q.phone}
                  </a>
                  <a className="btn btn--ghost btn--sm" href={`https://t.me/${tel.startsWith('+') ? tel : `+998${tel}`}`} target="_blank" rel="noopener noreferrer">
                    Telegram
                  </a>
                  {q.sender?.email ? (
                    <a className="btn btn--ghost btn--sm" href={`mailto:${q.sender.email}?subject=${encodeURIComponent(`Re: ${q.property?.title || "E'lon"}`)}`}>
                      Email
                    </a>
                  ) : null}
                  {unread ? (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => markRead(q)}>
                      O'qilgan deb belgilash
                    </button>
                  ) : null}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {meta && meta.totalPages > 1 ? (
        <div className="pager">
          <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Oldingi
          </button>
          <span className="muted">
            {meta.page} / {meta.totalPages}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            Keyingi
          </button>
        </div>
      ) : null}
    </>
  )
}

export default function Inquiries() {
  usePageTitle('Murojaatlar')
  const [tab, setTab] = useState('received')
  return (
    <div className="container page">
      <div className="page__head">
        <h1 className="page__title">Murojaatlar</h1>
      </div>
      <div className="chips filterbar" role="tablist" aria-label="Murojaat turi">
        <button type="button" role="tab" aria-selected={tab === 'received'} className={`chip ${tab === 'received' ? 'is-checked' : ''}`} onClick={() => setTab('received')}>
          <span>Kelgan</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'sent'} className={`chip ${tab === 'sent' ? 'is-checked' : ''}`} onClick={() => setTab('sent')}>
          <span>Yuborgan</span>
        </button>
      </div>
      {tab === 'received' ? <Received /> : <Sent />}
    </div>
  )
}
