import { useState } from 'react'
import { api } from '../../api'
import { errorText } from '../../api/client'
import ConfirmDialog from '../../components/ConfirmDialog'
import { EmptyState, ErrorState } from '../../components/States'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { resetCategoriesCache } from '../../hooks/useCategories'
import { slugify } from '../../lib/slug'

const SLUG_RE = /^[a-z0-9-]+$/

function CategoryForm({ initial, submitLabel, busy, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [touchedSlug, setTouchedSlug] = useState(Boolean(initial))
  const [error, setError] = useState('')

  function onName(value) {
    setName(value)
    if (!touchedSlug) setSlug(slugify(value))
    setError('')
  }

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Nomini kiriting.')
    if (!SLUG_RE.test(slug)) return setError("Slug faqat kichik harf, raqam va tiredan iborat bo'lsin.")
    onSubmit({ name: name.trim(), slug }, setError)
  }

  return (
    <form className="catform" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`cat-name-${initial?.id ?? 'new'}`}>Nomi</label>
        <input id={`cat-name-${initial?.id ?? 'new'}`} value={name} onChange={(e) => onName(e.target.value)} placeholder="Masalan: Kvartira" />
      </div>
      <div className="field">
        <label htmlFor={`cat-slug-${initial?.id ?? 'new'}`}>Slug</label>
        <input
          id={`cat-slug-${initial?.id ?? 'new'}`}
          value={slug}
          onChange={(e) => {
            setTouchedSlug(true)
            setSlug(e.target.value)
            setError('')
          }}
          placeholder="kvartira"
        />
      </div>
      <div className="catform__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Saqlanmoqda…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Bekor qilish
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export default function AdminCategories() {
  const { push } = useToast()
  const { data, error, loading, reload } = useAsync((signal) => api.categories(signal), [])
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const items = Array.isArray(data) ? data : []

  async function save(action, success, setError, done) {
    setBusy(true)
    try {
      await action()
      resetCategoriesCache()
      push(success, 'success')
      done?.()
      reload()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api.deleteCategory(toDelete.id)
      resetCategoriesCache()
      push("Kategoriya o'chirildi", 'success')
      setToDelete(null)
      reload()
    } catch (err) {
      push(errorText(err), 'error')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <h1 className="page__title">Kategoriyalar</h1>

      <section className="panel">
        <div className="panel__head">
          <h2>Yangi kategoriya</h2>
        </div>
        <CategoryForm
          key={formKey}
          submitLabel="Qo'shish"
          busy={busy}
          onSubmit={(body, setError) => save(() => api.createCategory(body), "Kategoriya qo'shildi", setError, () => setFormKey((k) => k + 1))}
        />
      </section>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <p className="muted">Yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Kategoriyalar yo'q" text="Kamida bitta kategoriya bo'lmasa, foydalanuvchilar e'lon joylay olmaydi." />
      ) : (
        <ul className="catrows">
          {items.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="catrow catrow--edit">
                <CategoryForm
                  initial={c}
                  submitLabel="Saqlash"
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(body, setError) => save(() => api.updateCategory(c.id, body), 'Kategoriya yangilandi', setError, () => setEditingId(null))}
                />
              </li>
            ) : (
              <li key={c.id} className="catrow">
                <span className="catrow__name">{c.name}</span>
                <code className="catrow__slug">{c.slug}</code>
                <span className="catrow__actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingId(c.id)}>
                    Tahrirlash
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm btn--text-danger" onClick={() => setToDelete(c)}>
                    O'chirish
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Kategoriyani o'chirasizmi?"
        text={toDelete ? `«${toDelete.name}». Agar bu kategoriyada e'lonlar bo'lsa, o'chirib bo'lmaydi.` : ''}
        confirmLabel="O'chirish"
        busyLabel="O'chirilmoqda…"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
