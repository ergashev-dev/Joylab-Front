import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import Gallery from '../components/Gallery'
import HeartButton from '../components/HeartButton'
import { AreaIcon, BathIcon, BedIcon, CalendarIcon, MailIcon, PhoneIcon, PinIcon, TagIcon } from '../components/Icons'
import InquiryForm from '../components/InquiryForm'
import { BackLink, EmptyState, ErrorState, Spinner } from '../components/States'
import { LISTING_TYPES } from '../config'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, formatNumber, formatPrice, initials } from '../lib/format'

function Fact({ icon, label, value }) {
  return (
    <div className="fact">
      <span className="fact__icon">{icon}</span>
      <span className="fact__value">{value}</span>
      <span className="fact__label">{label}</span>
    </div>
  )
}

export default function PropertyDetail() {
  const { id } = useParams()
  const { data: p, error, loading, reload } = useAsync((signal) => api.property(id, signal), [id])
  usePageTitle(p?.title)

  if (loading) return <Spinner />

  if (error?.status === 404 || (error?.status === 400 && !p)) {
    return (
      <div className="container">
        <EmptyState
          title="E'lon topilmadi"
          text="U o'chirilgan yoki hali moderatordan o'tmagan bo'lishi mumkin."
          action={
            <Link className="btn btn--primary" to="/properties">
              Barcha e'lonlar
            </Link>
          }
        />
      </div>
    )
  }
  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }
  if (!p) return null

  const ownerPhone = p.owner?.phone

  return (
    <div className="container detail">
      <BackLink to="/properties">E'lonlarga qaytish</BackLink>

      <div className="detail__layout">
        <div className="detail__main">
          <Gallery key={p.id} images={p.images} title={p.title} />

          <header className="detail__head">
            <div className="detail__tags">
              <span className={`badge badge--static badge--${p.listingType === 'RENT' ? 'rent' : 'sale'}`}>
                {LISTING_TYPES[p.listingType] || p.listingType}
              </span>
              {p.category?.name ? <span className="tag">{p.category.name}</span> : null}
            </div>
            <h1 className="detail__title">{p.title}</h1>
            <p className="detail__place">
              <PinIcon size={18} />
              {p.city}, {p.address}
            </p>
          </header>

          <div className="facts">
            <Fact icon={<AreaIcon size={22} />} value={`${formatNumber(p.area)} m²`} label="Maydon" />
            <Fact icon={<BedIcon size={22} />} value={p.rooms} label="Xonalar" />
            <Fact icon={<BathIcon size={22} />} value={p.bathrooms} label="Hammom" />
            <Fact icon={<TagIcon size={22} />} value={p.category?.name || '—'} label="Turi" />
          </div>

          <section className="detail__section">
            <h2>Tavsif</h2>
            <p className="prose">{p.description}</p>
          </section>

          <p className="detail__date">
            <CalendarIcon size={16} /> E'lon joylangan sana: {formatDate(p.createdAt)}
          </p>
        </div>

        <aside className="detail__side">
          <div className="buybox">
            <div className="buybox__top">
              <p className="buybox__price">{formatPrice(p.price, p.currency)}</p>
              <HeartButton propertyId={p.id} withLabel />
            </div>

            {p.owner ? (
              <div className="owner">
                <span className="avatar avatar--lg">{initials(p.owner.fullName)}</span>
                <div>
                  <p className="owner__name">{p.owner.fullName}</p>
                  <p className="muted">Sotuvchi</p>
                </div>
              </div>
            ) : null}

            <div className="contacts">
              {ownerPhone ? (
                <a className="btn btn--primary btn--block" href={`tel:${ownerPhone.replace(/\s/g, '')}`}>
                  <PhoneIcon size={18} />
                  {ownerPhone}
                </a>
              ) : null}
              {p.owner?.email ? (
                <a className="btn btn--ghost btn--block" href={`mailto:${p.owner.email}`}>
                  <MailIcon size={18} />
                  {p.owner.email}
                </a>
              ) : null}
            </div>
          </div>

          <div className="buybox buybox--form">
            <InquiryForm property={p} />
          </div>
        </aside>
      </div>
    </div>
  )
}
