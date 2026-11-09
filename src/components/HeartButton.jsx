import { useLocation, useNavigate } from 'react-router-dom'
import { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import { HeartIcon } from './Icons'

export default function HeartButton({ propertyId, className = '', withLabel = false }) {
  const { user } = useAuth()
  const { ids, toggle } = useFavorites()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const active = ids.has(propertyId)

  async function onClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    try {
      await toggle(propertyId)
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  const label = active ? 'Saqlanganlardan olib tashlash' : 'Saqlash'

  return (
    <button
      type="button"
      className={`heart ${active ? 'is-active' : ''} ${withLabel ? 'heart--label' : ''} ${className}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={withLabel ? undefined : label}
    >
      <HeartIcon size={20} filled={active} />
      {withLabel ? <span>{active ? 'Saqlangan' : 'Saqlash'}</span> : null}
    </button>
  )
}
