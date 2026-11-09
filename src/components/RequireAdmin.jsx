import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner } from './States'

export default function RequireAdmin({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (user.role !== 'ADMIN') {
    return (
      <div className="container page">
        <EmptyState
          title="Bu sahifa faqat administratorlar uchun"
          text="Hisobingizda administrator huquqi yo'q."
          action={
            <Link to="/" className="btn btn--primary">
              Bosh sahifa
            </Link>
          }
        />
      </div>
    )
  }
  return children
}
