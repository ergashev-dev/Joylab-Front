import { Link } from 'react-router-dom'
import { api } from '../../api'
import CountUp from '../../components/CountUp'
import { ArrowUpRightIcon } from '../../components/Icons'
import Placeholder from '../../components/Placeholder'
import { ErrorState } from '../../components/States'
import { STATUS } from '../../config'
import { useAsync } from '../../hooks/useAsync'
import { formatDate, formatPrice, imageSrc } from '../../lib/format'

const STATS = [
  { key: 'PENDING', label: STATUS.PENDING.label, tone: 'amber', to: '/admin/moderation' },
  { key: 'APPROVED', label: STATUS.APPROVED.label, tone: 'green', to: '/admin/moderation?status=APPROVED' },
  { key: 'REJECTED', label: STATUS.REJECTED.label, tone: 'red', to: '/admin/moderation?status=REJECTED' },
]

async function load(signal) {
  const [pending, approved, rejected, recent, users, categories] = await Promise.all([
    api.adminProperties({ status: 'PENDING', limit: 5 }, signal),
    api.adminProperties({ status: 'APPROVED', limit: 1 }, signal),
    api.adminProperties({ status: 'REJECTED', limit: 1 }, signal),
    api.adminProperties({ limit: 6 }, signal),
    api.adminUsers(signal),
    api.categories(signal),
  ])
  return {
    counts: { PENDING: pending.meta.total, APPROVED: approved.meta.total, REJECTED: rejected.meta.total },
    pending: pending.data,
    recent: recent.data,
    users: Array.isArray(users) ? users : [],
    categories: Array.isArray(categories) ? categories : [],
  }
}

export default function AdminDashboard() {
  const { data, error, loading, reload } = useAsync(load, [])

  if (error) return <ErrorState error={error} onRetry={reload} />

  const admins = data?.users.filter((u) => u.role === 'ADMIN').length ?? 0

  return (
    <>
      <h1 className="page__title">Boshqaruv</h1>

      <div className="stats">
        {STATS.map((s, i) => (
          <Link key={s.key} to={s.to} className={`stat stat--${s.tone}`} style={{ '--i': i }}>
            <span className="stat__label">{s.label}</span>
            <span className="stat__num">{loading ? '–' : <CountUp value={data.counts[s.key]} duration={1100} />}</span>
            <span className="stat__go" aria-hidden="true">
              <ArrowUpRightIcon size={18} />
            </span>
          </Link>
        ))}
        <Link to="/admin/users" className="stat" style={{ '--i': 3 }}>
          <span className="stat__label">Foydalanuvchilar</span>
          <span className="stat__num">{loading ? '–' : <CountUp value={data.users.length} duration={1100} />}</span>
          <span className="stat__sub">{loading ? '' : `${admins} ta administrator`}</span>
        </Link>
        <Link to="/admin/categories" className="stat" style={{ '--i': 4 }}>
          <span className="stat__label">Kategoriyalar</span>
          <span className="stat__num">{loading ? '–' : <CountUp value={data.categories.length} duration={1100} />}</span>
          {!loading && data.categories.length === 0 ? <span className="stat__sub stat__sub--warn">Hali yo'q, qo'shing</span> : null}
        </Link>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2>Tekshirish kutayotganlar</h2>
          <Link to="/admin/moderation" className="pill-link">
            Hammasi <ArrowUpRightIcon size={18} />
          </Link>
        </div>
        {loading ? (
          <p className="muted">Yuklanmoqda…</p>
        ) : data.pending.length === 0 ? (
          <p className="muted">Hozircha tekshiriladigan e'lon yo'q.</p>
        ) : (
          <ul className="minilist">
            {data.pending.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/moderation?open=${p.id}`} className="miniitem">
                  <span className="miniitem__thumb">
                    {p.images?.[0] ? <img src={imageSrc(p.images[0].url)} alt="" /> : <Placeholder />}
                  </span>
                  <span className="miniitem__main">
                    <span className="miniitem__title">{p.title}</span>
                    <span className="muted">
                      {p.owner?.fullName}, {formatDate(p.createdAt)}
                    </span>
                  </span>
                  <span className="miniitem__price">{formatPrice(p.price, p.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Oxirgi e'lonlar</h2>
        </div>
        {loading ? null : data.recent.length === 0 ? (
          <p className="muted">E'lonlar hali yo'q.</p>
        ) : (
          <ul className="minilist">
            {data.recent.map((p) => (
              <li key={p.id} className="miniitem miniitem--static">
                <span className="miniitem__thumb">{p.images?.[0] ? <img src={imageSrc(p.images[0].url)} alt="" /> : <Placeholder />}</span>
                <span className="miniitem__main">
                  <span className="miniitem__title">{p.title}</span>
                  <span className="muted">
                    {p.owner?.fullName}, {formatDate(p.createdAt)}
                  </span>
                </span>
                <span className={`status status--${p.status.toLowerCase()}`}>{STATUS[p.status]?.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
