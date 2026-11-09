import { NavLink, Outlet } from 'react-router-dom'
import { useUnread } from '../hooks/useUnread'

export default function AccountLayout() {
  const unread = useUnread()
  const links = [
    ['/dashboard', "Mening e'lonlarim"],
    ['/inquiries', 'Murojaatlar'],
    ['/favorites', 'Saqlanganlar'],
    ['/notifications', 'Bildirishnomalar'],
    ['/profile', 'Profil'],
  ]
  return (
    <div className="container account">
      <nav className="account__nav" aria-label="Shaxsiy kabinet">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `account__link ${isActive ? 'active' : ''}`}>
            <span>{label}</span>
            {to === '/notifications' && unread > 0 ? <span className="count">{unread}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="account__body">
        <Outlet />
      </div>
    </div>
  )
}
