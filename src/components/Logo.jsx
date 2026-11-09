import { Link } from 'react-router-dom'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label="Uyma-uy, bosh sahifa">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#e9b44c" />
        <path d="M8 25V14.5L16 7l8 7.5V25h-5.5v-6.5a2.5 2.5 0 0 0-5 0V25z" fill="#061214" />
      </svg>
      <span>Uyma-uy</span>
    </Link>
  )
}
