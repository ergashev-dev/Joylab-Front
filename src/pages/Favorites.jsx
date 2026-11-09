import { Link } from 'react-router-dom'
import PropertyCard, { CardGrid, CardSkeleton } from '../components/PropertyCard'
import { EmptyState } from '../components/States'
import { useFavorites } from '../context/FavoritesContext'
import { usePageTitle } from '../hooks/usePageTitle'

export default function Favorites() {
  usePageTitle('Saqlanganlar')
  const { items, loading } = useFavorites()

  return (
    <div className="container page">
      <div className="page__head">
        <h1 className="page__title">Saqlanganlar</h1>
        <p className="page__count">{!loading && items.length > 0 ? `${items.length} ta e'lon` : ' '}</p>
      </div>

      {loading && items.length === 0 ? (
        <CardGrid>
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </CardGrid>
      ) : items.length === 0 ? (
        <EmptyState
          title="Saqlangan e'lonlar yo'q"
          text="E'londagi yurakcha tugmasini bosing, u shu yerda paydo bo'ladi."
          action={
            <Link className="btn btn--primary" to="/properties">
              E'lonlarni ko'rish
            </Link>
          }
        />
      ) : (
        <CardGrid>
          {items.map((f) => (
            <PropertyCard key={f.id} property={f.property} />
          ))}
        </CardGrid>
      )}
    </div>
  )
}
