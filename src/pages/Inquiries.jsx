import { Link } from 'react-router-dom'
import { api } from '../api'
import Placeholder from '../components/Placeholder'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatDate, formatPrice, imageSrc } from '../lib/format'

export default function Inquiries() {
  usePageTitle('Murojaatlarim')
  const { data, error, loading, reload } = useAsync((signal) => api.myInquiries(signal), [])

  if (loading) return <Spinner />
  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  const items = data || []

  return (
    <div className="container page">
      <div className="page__head">
        <h1 className="page__title">Murojaatlarim</h1>
        <p className="page__count">{items.length > 0 ? `${items.length} ta murojaat` : ' '}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Murojaat yubormagansiz"
          text="E'lon sahifasidagi formadan sotuvchiga yozishingiz mumkin."
          action={
            <Link className="btn btn--primary" to="/properties">
              E'lonlarni ko'rish
            </Link>
          }
        />
      ) : (
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
      )}
    </div>
  )
}
