import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Sahifa topilmadi')
  return (
    <div className="container">
      <EmptyState
        title="Sahifa topilmadi"
        text="Manzil noto'g'ri yoki sahifa ko'chirilgan."
        action={
          <Link className="btn btn--primary" to="/">
            Bosh sahifaga
          </Link>
        }
      />
    </div>
  )
}
