import { useMemo, useState } from 'react'
import { api } from '../../api'
import { errorText } from '../../api/client'
import ConfirmDialog from '../../components/ConfirmDialog'
import { EmptyState, ErrorState } from '../../components/States'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { formatDate, initials } from '../../lib/format'

const ROLE_LABEL = { ADMIN: 'Administrator', USER: 'Foydalanuvchi' }

export default function AdminUsers() {
  const { user: me } = useAuth()
  const { push } = useToast()
  const { data, error, loading, reload } = useAsync((signal) => api.adminUsers(signal), [])
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [change, setChange] = useState(null) // { user, role }
  const [busy, setBusy] = useState(false)

  const users = Array.isArray(data) ? data : []
  const visible = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('uz')
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (!needle) return true
      return [u.fullName, u.email, u.phone].some((v) => (v || '').toLocaleLowerCase('uz').includes(needle))
    })
  }, [users, q, roleFilter])

  async function confirmChange() {
    setBusy(true)
    try {
      await api.adminSetRole(change.user.id, change.role)
      push(`${change.user.fullName}: ${ROLE_LABEL[change.role].toLocaleLowerCase('uz')} qilindi`, 'success')
      setChange(null)
      reload()
    } catch (err) {
      push(err.status === 404 ? "Serverda rol o'zgartirish endpoint'i topilmadi (PATCH /admin/users/:id/role)." : errorText(err), 'error')
      setChange(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Foydalanuvchilar</h1>
        {data ? <p className="page__count">{users.length} ta</p> : null}
      </div>

      <div className="userbar">
        <div className="field userbar__search">
          <label className="sr-only" htmlFor="user-q">
            Qidirish
          </label>
          <input id="user-q" type="search" placeholder="Ism, email yoki telefon" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips" role="radiogroup" aria-label="Rol bo'yicha filtr">
          {[
            ['', 'Hammasi'],
            ['USER', 'Foydalanuvchilar'],
            ['ADMIN', 'Adminlar'],
          ].map(([value, label]) => (
            <label key={label} className={`chip ${roleFilter === value ? 'is-checked' : ''}`}>
              <input type="radio" name="role-filter" checked={roleFilter === value} onChange={() => setRoleFilter(value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <p className="muted">Yuklanmoqda…</p>
      ) : visible.length === 0 ? (
        <EmptyState title="Hech kim topilmadi" text="Qidiruvni o'zgartirib ko'ring." />
      ) : (
        <ul className="userlist">
          {visible.map((u) => {
            const self = me?.id === u.id
            const nextRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN'
            return (
              <li key={u.id} className="userrow">
                <span className="avatar">{initials(u.fullName)}</span>
                <span className="userrow__main">
                  <span className="userrow__name">
                    {u.fullName}
                    {self ? <span className="userrow__self"> (siz)</span> : null}
                  </span>
                  <span className="muted">
                    {u.email}
                    {u.phone ? `, ${u.phone}` : ''}
                  </span>
                </span>
                <span className="userrow__meta muted">
                  {u._count?.properties ?? 0} ta e'lon, {formatDate(u.createdAt)}
                </span>
                <span className={`role role--${u.role.toLowerCase()}`}>{ROLE_LABEL[u.role] || u.role}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={self}
                  title={self ? "O'z rolingizni o'zgartira olmaysiz" : undefined}
                  onClick={() => setChange({ user: u, role: nextRole })}
                >
                  {u.role === 'ADMIN' ? 'Adminlikni olish' : 'Admin qilish'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(change)}
        title={change?.role === 'ADMIN' ? 'Administrator qilasizmi?' : 'Adminlikni olasizmi?'}
        text={
          change
            ? change.role === 'ADMIN'
              ? `${change.user.fullName} barcha e'lonlarni moderatsiya qila, kategoriya va rollarni o'zgartira oladi.`
              : `${change.user.fullName} oddiy foydalanuvchi bo'lib qoladi.`
            : ''
        }
        confirmLabel={change?.role === 'ADMIN' ? 'Admin qilish' : 'Adminlikni olish'}
        busyLabel="Saqlanmoqda…"
        tone={change?.role === 'ADMIN' ? 'primary' : 'danger'}
        busy={busy}
        onConfirm={confirmChange}
        onCancel={() => setChange(null)}
      />
    </>
  )
}
