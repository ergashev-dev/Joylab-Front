import { NavLink, Outlet } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'

const LINKS = [
  { to: '/admin', label: 'Boshqaruv', end: true },
  { to: '/admin/moderation', label: 'Moderatsiya' },
  { to: '/admin/reports', label: 'Shikoyatlar' },
  { to: '/admin/categories', label: 'Kategoriyalar' },
  { to: '/admin/users', label: 'Foydalanuvchilar' },
]

export default function AdminLayout() {
  usePageTitle('Admin')
  return (
    <div className="container admin">
      <nav className="admin__nav" aria-label="Admin bo'limlari">
        <p className="admin__brand">Admin panel</p>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="admin__link">
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="admin__body">
        <Outlet />
      </div>
    </div>
  )
}
