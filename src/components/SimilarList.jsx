import { api } from '../api'
import { useAsync } from '../hooks/useAsync'
import PropertyCard, { CardGrid } from './PropertyCard'

export default function SimilarList({ propertyId }) {
  const { data } = useAsync((signal) => api.similar(propertyId, signal), [propertyId])
  if (!Array.isArray(data) || data.length === 0) return null
  return (
    <section className="detail__section">
      <h2>O'xshash e'lonlar</h2>
      <CardGrid>
        {data.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </CardGrid>
    </section>
  )
}
