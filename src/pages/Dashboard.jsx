import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BarChart from '../components/BarChart'
import { formFromProperty, saveDraft } from '../lib/propertyForm'
import { api } from '../api'
import { errorText } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import Placeholder from '../components/Placeholder'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { LISTING_TYPES, STATUS, closedLabel } from '../config'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, formatNumber, formatPrice, imageSrc } from '../lib/format'

const FILTERS = [
  { value: '', label: 'Hammasi' },
  { value: 'PENDING', label: STATUS.PENDING.label },
  { value: 'APPROVED', label: STATUS.APPROVED.label },
  { value: 'REJECTED', label: STATUS.REJECTED.label },
]

function StatusPill({ status }) {
  return <span className={`status status--${status.toLowerCase()}`}>{STATUS[status]?.label || status}</span>
}

export default function Dashboard() {
  usePageTitle("Mening e'lonlarim")
  const { push } = useToast()
  const { data, error, loading, reload } = useAsync((signal) => api.myProperties(signal), [])
  const navigate = useNavigate()
  const [statsFor, setStatsFor] = useState(null)
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const items = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const counts = useMemo(() => {
    const c = { '': items.length, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    for (const p of items) if (c[p.status] !== undefined) c[p.status]++
    return c
  }, [items])
  const visible = filter ? items.filter((p) => p.status === filter) : items

  // Nusxa: ma'lumotlar qoralama sifatida yangi e'lon formasiga ko'chadi (rasmlar qayta yuklanadi)
  function duplicate(p) {
    saveDraft(formFromProperty(p))
    navigate('/dashboard/new')
  }

  async function share(p) {
    const url = `${window.location.origin}/properties/${p.id}`
    try {
      if (navigator.share) await navigator.share({ title: p.title, url })
      else {
        await navigator.clipboard.writeText(url)
        push('Havola nusxalandi', 'success')
      }
    } catch {
      /* foydalanuvchi bekor qildi */
    }
  }

  async function toggleStats(p) {
    if (statsFor === p.id) return setStatsFor(null)
    setStatsFor(p.id)
    setStats(null)
    try {
      setStats(await api.propertyStats(p.id))
    } catch (err) {
      push(errorText(err), 'error')
      setStatsFor(null)
    }
  }

  async function toggleClosed(p) {
    try {
      await api.setClosed(p.id, !p.closedAt)
      push(p.closedAt ? "E'lon qayta faollashtirildi" : `E'lon «${closedLabel(p.listingType).toLowerCase()}» deb belgilandi`, 'success')
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  async function renew(p) {
    try {
      await api.renewProperty(p.id)
      push("E'lon muddati 60 kunga uzaytirildi", 'success')
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteProperty(toDelete.id)
      push("E'lon o'chirildi", 'success')
      setToDelete(null)
      reload()
    } catch (err) {
      push(errorText(err), 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading && !data) return <Spinner />
  if (error && !data) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  return (
    <div className="container page">
      <div className="page__head">
        <h1 className="page__title">Mening e'lonlarim</h1>
        <Link to="/dashboard/new" className="btn btn--primary">
          E'lon joylash
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Birinchi e'loningizni joylang"
          text="Ma'lumot va rasmlarni kiriting. Moderator tasdiqlagach e'lon saytda ko'rinadi."
          action={
            <Link to="/dashboard/new" className="btn btn--primary">
              E'lon joylash
            </Link>
          }
        />
      ) : (
        <>
          <div className="chips filterbar" role="radiogroup" aria-label="Holat bo'yicha filtr">
            {FILTERS.map((f) => (
              <label key={f.value} className={`chip ${filter === f.value ? 'is-checked' : ''}`}>
                <input type="radio" name="status" value={f.value} checked={filter === f.value} onChange={() => setFilter(f.value)} />
                <span>
                  {f.label} <span className="chip__n">{counts[f.value]}</span>
                </span>
              </label>
            ))}
          </div>

          {counts.REJECTED > 0 && filter !== 'REJECTED' ? (
            <p className="notice notice--warn">
              {counts.REJECTED} ta e'lon rad etilgan. {STATUS.REJECTED.hint}
            </p>
          ) : null}

          {visible.length === 0 ? (
            <EmptyState title="Bu holatda e'lon yo'q" text="Boshqa filtrni tanlang." />
          ) : (
            <ul className="mylist">
              {visible.map((p) => {
                const src = imageSrc(p.images?.[0]?.url)
                const live = p.status === 'APPROVED'
                const thumb = src ? <img src={src} alt="" loading="lazy" /> : <Placeholder />
                return (
                  <li key={p.id} className="myitem">
                    {live ? (
                      <Link to={`/properties/${p.id}`} className="myitem__thumb" tabIndex={-1} aria-hidden="true">
                        {thumb}
                      </Link>
                    ) : (
                      <div className="myitem__thumb" aria-hidden="true">
                        {thumb}
                      </div>
                    )}

                    <div className="myitem__body">
                      <div className="myitem__top">
                        <StatusPill status={p.status} />
                        <span className="muted">
                          {LISTING_TYPES[p.listingType]}, {p.category?.name}
                        </span>
                      </div>
                      <h2 className="myitem__title">{p.title}</h2>
                      <p className="myitem__price">{formatPrice(p.price, p.currency)}</p>
                      <p className="muted">
                        {p.city}, {p.rooms} xona, {formatNumber(p.area)} m², {p.images?.length || 0} ta rasm. Joylangan: {formatDate(p.createdAt)}
                      </p>
                      {p.status === 'REJECTED' && p.rejectReason ? (
                        <p className="notice notice--error">Rad etish sababi: {p.rejectReason}</p>
                      ) : p.status !== 'APPROVED' ? (
                        <p className="myitem__hint">{STATUS[p.status]?.hint}</p>
                      ) : null}
                      {p.closedAt ? <p className="myitem__hint">{closedLabel(p.listingType)}: saytda kulrang nishon bilan ko'rinadi.</p> : null}
                      {p.expiresAt ? (
                        <p className={`muted ${new Date(p.expiresAt) < new Date() ? 'is-expired' : ''}`}>
                          {new Date(p.expiresAt) < new Date() ? 'Muddati tugagan' : `Amal qilish muddati: ${formatDate(p.expiresAt)}`}
                        </p>
                      ) : null}
                      {p.status === 'APPROVED' ? (
                        <p className="muted">
                          {p.viewCount ?? 0} ko'rish · {p._count?.favorites ?? 0} saqlash · {p._count?.inquiries ?? 0} murojaat
                        </p>
                      ) : null}
                      {statsFor === p.id ? (
                        stats ? (
                          <BarChart data={stats.views} label="Kunlik ko'rishlar" />
                        ) : (
                          <p className="muted">Yuklanmoqda…</p>
                        )
                      ) : null}
                    </div>

                    <div className="myitem__actions">
                      {live ? (
                        <Link className="btn btn--ghost btn--sm" to={`/properties/${p.id}`}>
                          Ko'rish
                        </Link>
                      ) : null}
                      {live ? (
                        <>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleClosed(p)}>
                            {p.closedAt ? 'Qayta ochish' : closedLabel(p.listingType) + ' deb belgilash'}
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => renew(p)}>
                            Muddatni uzaytirish
                          </button>
                        </>
                      ) : null}
                      {live ? (
                        <>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleStats(p)}>
                            {statsFor === p.id ? 'Statistikani yopish' : 'Statistika'}
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => share(p)}>
                            Ulashish
                          </button>
                        </>
                      ) : null}
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => duplicate(p)}>
                        Nusxa
                      </button>
                      <Link className={`btn btn--sm ${p.status === 'REJECTED' ? 'btn--primary' : 'btn--ghost'}`} to={`/dashboard/${p.id}/edit`}>
                        {p.status === 'REJECTED' ? 'Tuzatib qayta yuborish' : 'Tahrirlash'}
                      </Link>
                      <button type="button" className="btn btn--ghost btn--sm btn--text-danger" onClick={() => setToDelete(p)}>
                        O'chirish
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="E'lonni o'chirasizmi?"
        text={
          toDelete
            ? `«${toDelete.title}», uning rasmlari, saqlanganlari va murojaatlari ham o'chadi. Buni qaytarib bo'lmaydi.`
            : ''
        }
        confirmLabel="O'chirish"
        busyLabel="O'chirilmoqda…"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
