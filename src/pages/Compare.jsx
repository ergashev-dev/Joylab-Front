import { Link } from 'react-router-dom'
import { api } from '../api'
import { EmptyState, Spinner } from '../components/States'
import { LISTING_TYPES } from '../config'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { compareStore, useCompareIds } from '../lib/compare'
import { formatNumber, formatPrice, imageSrc } from '../lib/format'

const ROWS = [
  { label: 'Narx', get: (p) => formatPrice(p.price, p.currency) },
  { label: "1 m² narxi", get: (p) => (p.area > 0 ? formatPrice(Math.round(p.price / p.area), p.currency) : '—') },
  { label: 'Turi', get: (p) => LISTING_TYPES[p.listingType] || p.listingType },
  { label: 'Kategoriya', get: (p) => p.category?.name || '—' },
  { label: 'Shahar', get: (p) => p.city },
  { label: 'Manzil', get: (p) => p.address },
  { label: 'Maydon', get: (p) => `${formatNumber(p.area)} m²` },
  { label: 'Xonalar', get: (p) => p.rooms },
  { label: 'Hammom', get: (p) => p.bathrooms },
]

export default function Compare() {
  usePageTitle('Taqqoslash')
  const ids = useCompareIds()
  const key = ids.join(',')
  const { data, loading } = useAsync(
    async (signal) => {
      const res = await Promise.allSettled(ids.map((id) => api.property(id, signal)))
      return res.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    },
    [key],
  )

  if (ids.length === 0) {
    return (
      <div className="container">
        <EmptyState
          title="Taqqoslash uchun e'lon tanlanmagan"
          text="E'lon kartochkasidagi «Taqqoslash» tugmasini bosib, 3 tagacha e'lonni yonma-yon ko'ring."
          action={
            <Link className="btn btn--primary" to="/properties">
              E'lonlarni ko'rish
            </Link>
          }
        />
      </div>
    )
  }
  if (loading && !data) return <Spinner />
  const items = data || []

  return (
    <div className="container page">
      <div className="page__head">
        <h1 className="page__title">Taqqoslash</h1>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => compareStore.clear()}>
          Tozalash
        </button>
      </div>
      <div className="cmptable__wrap">
        <table className="cmptable">
          <thead>
            <tr>
              <th scope="col" />
              {items.map((p) => (
                <th key={p.id} scope="col">
                  <Link to={`/properties/${p.id}`}>
                    {imageSrc(p.images?.[0]?.url) ? <img src={imageSrc(p.images[0].url)} alt="" loading="lazy" /> : null}
                    <span>{p.title}</span>
                  </Link>
                  <button type="button" className="linkbtn" onClick={() => compareStore.toggle(p.id)}>
                    Olib tashlash
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {items.map((p) => (
                  <td key={p.id}>{r.get(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
