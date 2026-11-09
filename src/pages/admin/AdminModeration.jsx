import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { errorText } from '../../api/client'
import { CloseIcon } from '../../components/Icons'
import Pagination from '../../components/Pagination'
import Placeholder from '../../components/Placeholder'
import { EmptyState, ErrorState } from '../../components/States'
import { LISTING_TYPES, STATUS } from '../../config'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { formatDate, formatNumber, formatPrice, imageSrc } from '../../lib/format'

const FILTERS = [
  { value: 'PENDING', label: STATUS.PENDING.label },
  { value: 'APPROVED', label: STATUS.APPROVED.label },
  { value: 'REJECTED', label: STATUS.REJECTED.label },
  { value: '', label: 'Hammasi' },
]
const LIMIT = 10

function ReviewDialog({ property, busy, onClose, onDecide }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (property && !d.open) d.showModal()
    if (!property && d.open) d.close()
  }, [property])

  const p = property
  const src = p?.images?.[0] ? imageSrc(p.images[0].url) : null

  return (
    <dialog
      ref={ref}
      className="review"
      aria-labelledby="review-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      {p ? (
        <div className="review__body">
          <button type="button" className="review__close" onClick={onClose} aria-label="Yopish" disabled={busy}>
            <CloseIcon size={20} />
          </button>
          <div className="review__media">{src ? <img src={src} alt="" /> : <Placeholder />}</div>
          <div className="review__content">
            <span className={`status status--${p.status.toLowerCase()}`}>{STATUS[p.status]?.label}</span>
            <h2 id="review-title" className="review__title">
              {p.title}
            </h2>
            <p className="review__price">{formatPrice(p.price, p.currency)}</p>
            <dl className="review__facts">
              <div>
                <dt>Turi</dt>
                <dd>
                  {LISTING_TYPES[p.listingType]}, {p.category?.name}
                </dd>
              </div>
              <div>
                <dt>Manzil</dt>
                <dd>
                  {p.city}, {p.address}
                </dd>
              </div>
              <div>
                <dt>Xususiyat</dt>
                <dd>
                  {p.rooms} xona, {p.bathrooms} hammom, {formatNumber(p.area)} m²
                </dd>
              </div>
              <div>
                <dt>Sotuvchi</dt>
                <dd>
                  {p.owner?.fullName} ({p.owner?.email})
                </dd>
              </div>
              <div>
                <dt>Joylangan</dt>
                <dd>{formatDate(p.createdAt)}</dd>
              </div>
            </dl>
            <p className="review__desc">{p.description}</p>
            <div className="review__actions">
              <button type="button" className="btn btn--primary" disabled={busy || p.status === 'APPROVED'} onClick={() => onDecide(p, 'APPROVED')}>
                Tasdiqlash
              </button>
              <button type="button" className="btn btn--ghost btn--text-danger" disabled={busy || p.status === 'REJECTED'} onClick={() => onDecide(p, 'REJECTED')}>
                Rad etish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}

export default function AdminModeration() {
  const [params, setParams] = useSearchParams()
  const { push } = useToast()
  const status = params.has('status') ? params.get('status') : 'PENDING'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const openId = Number(params.get('open')) || null

  const { data, error, loading, reload } = useAsync(
    (signal) => api.adminProperties({ status: status || undefined, page, limit: LIMIT }, signal),
    [status, page],
    { keepPrevious: true },
  )
  const [selected, setSelected] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const items = data?.data || []
  const meta = data?.meta

  // /admin?open=ID havolasi: ro'yxat kelgach o'sha e'lonni ochamiz
  useEffect(() => {
    if (openId && items.length) {
      const found = items.find((p) => p.id === openId)
      if (found) setSelected(found)
    }
  }, [openId, items])

  function setFilter(value) {
    const next = new URLSearchParams()
    next.set('status', value)
    setParams(next)
  }

  function closeReview() {
    setSelected(null)
    if (params.has('open')) {
      const next = new URLSearchParams(params)
      next.delete('open')
      setParams(next, { replace: true })
    }
  }

  async function decide(property, newStatus) {
    setBusyId(property.id)
    try {
      await api.adminSetStatus(property.id, newStatus)
      push(newStatus === 'APPROVED' ? "E'lon tasdiqlandi" : "E'lon rad etildi", 'success')
      closeReview()
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Moderatsiya</h1>
        {meta ? <p className="page__count">{meta.total} ta e'lon</p> : null}
      </div>

      <div className="chips filterbar" role="radiogroup" aria-label="Holat bo'yicha filtr">
        {FILTERS.map((f) => (
          <label key={f.label} className={`chip ${status === f.value ? 'is-checked' : ''}`}>
            <input type="radio" name="mod-status" value={f.value} checked={status === f.value} onChange={() => setFilter(f.value)} />
            <span>{f.label}</span>
          </label>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data && loading ? (
        <p className="muted">Yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <EmptyState title={status === 'PENDING' ? "Tekshiriladigan e'lon yo'q" : "Bu holatda e'lon yo'q"} text="Yangi e'lonlar shu yerda paydo bo'ladi." />
      ) : (
        <ul className={`mylist ${loading ? 'is-loading' : ''}`}>
          {items.map((p) => (
            <li key={p.id} className="myitem myitem--admin">
              <div className="myitem__thumb" aria-hidden="true">
                {p.images?.[0] ? <img src={imageSrc(p.images[0].url)} alt="" loading="lazy" /> : <Placeholder />}
              </div>
              <div className="myitem__body">
                <div className="myitem__top">
                  <span className={`status status--${p.status.toLowerCase()}`}>{STATUS[p.status]?.label}</span>
                  <span className="muted">
                    {LISTING_TYPES[p.listingType]}, {p.category?.name}
                  </span>
                </div>
                <h2 className="myitem__title">{p.title}</h2>
                <p className="myitem__price">{formatPrice(p.price, p.currency)}</p>
                <p className="muted">
                  {p.owner?.fullName}, {p.city}, {formatDate(p.createdAt)}
                </p>
              </div>
              <div className="myitem__actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected(p)}>
                  Ko'rib chiqish
                </button>
                {p.status !== 'APPROVED' ? (
                  <button type="button" className="btn btn--primary btn--sm" disabled={busyId === p.id} onClick={() => decide(p, 'APPROVED')}>
                    Tasdiqlash
                  </button>
                ) : null}
                {p.status !== 'REJECTED' ? (
                  <button type="button" className="btn btn--ghost btn--sm btn--text-danger" disabled={busyId === p.id} onClick={() => decide(p, 'REJECTED')}>
                    Rad etish
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={meta?.totalPages}
        onChange={(n) => {
          const next = new URLSearchParams(params)
          next.set('page', String(n))
          if (!next.has('status')) next.set('status', status)
          setParams(next)
        }}
      />

      <ReviewDialog property={selected} busy={busyId === selected?.id} onClose={closeReview} onDecide={decide} />
    </>
  )
}
