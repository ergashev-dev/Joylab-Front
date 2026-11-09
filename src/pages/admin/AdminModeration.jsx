import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { errorText } from '../../api/client'
import { CloseIcon } from '../../components/Icons'
import Pagination from '../../components/Pagination'
import Placeholder from '../../components/Placeholder'
import { EmptyState, ErrorState } from '../../components/States'
import { LISTING_TYPES, REJECT_TEMPLATES, STATUS } from '../../config'
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

function RejectDialog({ target, busy, onClose, onConfirm }) {
  const ref = useRef(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (target && !d.open) {
      setReason('')
      d.showModal()
    }
    if (!target && d.open) d.close()
  }, [target])

  const valid = reason.trim().length >= 3 && reason.trim().length <= 500
  return (
    <dialog ref={ref} className="reportdlg" onCancel={(e) => { e.preventDefault(); if (!busy) onClose() }}>
      <form
        className="reportdlg__form"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onConfirm(reason.trim())
        }}
      >
        <h2>Rad etish sababi</h2>
        <p className="muted">{target?.count > 1 ? `${target.count} ta e'lon uchun` : 'Sotuvchi sababni ko\'radi va tuzatib qayta yuboradi.'}</p>
        <div className="activechips">
          {REJECT_TEMPLATES.map((t) => (
            <button key={t} type="button" className="chip" onClick={() => setReason(t)}>
              <span>{t}</span>
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="rej-reason">Sabab</label>
          <textarea id="rej-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </div>
        <div className="reportdlg__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Bekor qilish
          </button>
          <button type="submit" className="btn btn--primary" disabled={!valid || busy}>
            {busy ? 'Yuborilmoqda…' : 'Rad etish'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

function ReviewDialog({ property, busy, onClose, onDecide, onNav }) {
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
            <p className="muted">Tugmalar: A tasdiqlash · R rad etish · J/← oldingi · K/→ keyingi</p>
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
  const [checked, setChecked] = useState(() => new Set())
  const [rejectTarget, setRejectTarget] = useState(null) // { ids, count, after }
  const [rejectBusy, setRejectBusy] = useState(false)

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
    if (newStatus === 'REJECTED') {
      setRejectTarget({ ids: [property.id], count: 1 })
      return
    }
    setBusyId(property.id)
    try {
      await api.adminSetStatus(property.id, newStatus)
      push("E'lon tasdiqlandi", 'success')
      advance(property)
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  // Tasdiqlangach keyingi e'longa o'tamiz (navbatni tez tozalash uchun)
  function advance(property) {
    const i = items.findIndex((x) => x.id === property.id)
    const next = items[i + 1] || items[i - 1]
    if (selected && next && next.id !== property.id) setSelected(next)
    else closeReview()
  }

  function nav(delta) {
    if (!selected) return
    const i = items.findIndex((x) => x.id === selected.id)
    const next = items[i + delta]
    if (next) setSelected(next)
  }

  async function confirmReject(reason) {
    setRejectBusy(true)
    try {
      if (rejectTarget.ids.length === 1) await api.adminSetStatus(rejectTarget.ids[0], 'REJECTED', reason)
      else await api.adminBulkStatus(rejectTarget.ids, 'REJECTED', reason)
      push(rejectTarget.ids.length > 1 ? `${rejectTarget.ids.length} ta e'lon rad etildi` : "E'lon rad etildi", 'success')
      const one = items.find((x) => x.id === rejectTarget.ids[0])
      setRejectTarget(null)
      setChecked(new Set())
      if (rejectTarget.ids.length === 1 && one) advance(one)
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setRejectBusy(false)
    }
  }

  async function bulkApprove() {
    const ids = [...checked]
    setBusyId(-1)
    try {
      const res = await api.adminBulkStatus(ids, 'APPROVED')
      push(`${res.done} ta e'lon tasdiqlandi`, 'success')
      setChecked(new Set())
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  function toggleChecked(id) {
    setChecked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  // Klaviatura: A, R, J/K yoki o'qlar (faqat ko'rib chiqish oynasi ochiq va matn yozilmayotganda)
  useEffect(() => {
    if (!selected || rejectTarget) return undefined
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
      const k = e.key.toLowerCase()
      if (k === 'a' && selected.status !== 'APPROVED' && busyId === null) decide(selected, 'APPROVED')
      else if (k === 'r' && selected.status !== 'REJECTED') decide(selected, 'REJECTED')
      else if (k === 'k' || k === 'arrowright') nav(1)
      else if (k === 'j' || k === 'arrowleft') nav(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

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
        <>
        {checked.size > 0 ? (
          <div className="bulkbar" role="region" aria-label="Tanlanganlar">
            <strong>{checked.size} ta tanlandi</strong>
            <button type="button" className="btn btn--primary btn--sm" disabled={busyId !== null} onClick={bulkApprove}>
              Tasdiqlash
            </button>
            <button type="button" className="btn btn--ghost btn--sm btn--text-danger" onClick={() => setRejectTarget({ ids: [...checked], count: checked.size })}>
              Rad etish
            </button>
            <button type="button" className="linkbtn" onClick={() => setChecked(new Set())}>
              Bekor qilish
            </button>
          </div>
        ) : (
          <button type="button" className="linkbtn" onClick={() => setChecked(new Set(items.filter((p) => p.status !== 'APPROVED').map((p) => p.id)))}>
            Hammasini tanlash
          </button>
        )}
        <ul className={`mylist ${loading ? 'is-loading' : ''}`}>
          {items.map((p) => (
            <li key={p.id} className="myitem myitem--admin">
              <input type="checkbox" className="myitem__check" checked={checked.has(p.id)} onChange={() => toggleChecked(p.id)} aria-label={`${p.title} ni tanlash`} />
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
        </>
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

      <ReviewDialog property={selected} busy={busyId === selected?.id} onClose={closeReview} onDecide={decide} onNav={nav} />
      <RejectDialog target={rejectTarget} busy={rejectBusy} onClose={() => setRejectTarget(null)} onConfirm={confirmReject} />
    </>
  )
}
