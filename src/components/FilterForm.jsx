import { useEffect, useRef, useState } from 'react'
import { CITY_SUGGESTIONS } from '../config'
import { EMPTY_FILTERS, activeFilterCount, priceRangeInvalid, sameFilters } from '../lib/filters'

const ROOM_OPTIONS = ['1', '2', '3', '4', '5']
const DEBOUNCE_MS = 450

function Radio({ name, value, checked, onChange, children }) {
  return (
    <label className={`chip ${checked ? 'is-checked' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span>{children}</span>
    </label>
  )
}

/**
 * values: URL'dagi joriy filtrlar. onChange(next): tasdiqlangan yangi filtrlar.
 * Matn va narx maydonlari debounce bilan, tugmalar darhol qo'llanadi.
 */
export default function FilterForm({ values, categories, onChange, idPrefix = 'f' }) {
  const [draft, setDraft] = useState(values)
  const latest = useRef(values)
  const committed = useRef(values)
  const timer = useRef(null)

  // URL tashqaridan o'zgarsa (masalan, orqaga tugmasi) formani sinxronlaymiz
  useEffect(() => {
    if (!sameFilters(values, committed.current)) {
      committed.current = values
      latest.current = values
      setDraft(values)
    }
  }, [values])

  useEffect(() => () => clearTimeout(timer.current), [])

  function commit(next) {
    if (priceRangeInvalid(next)) return // backend 400 qaytaradi: yubormaymiz
    committed.current = next
    onChange(next)
  }

  function update(patch, immediate = false) {
    const next = { ...latest.current, ...patch }
    latest.current = next
    setDraft(next)
    clearTimeout(timer.current)
    if (immediate) commit(next)
    else timer.current = setTimeout(() => commit(latest.current), DEBOUNCE_MS)
  }

  function clearAll() {
    clearTimeout(timer.current)
    const next = { ...EMPTY_FILTERS, sort: latest.current.sort }
    latest.current = next
    setDraft(next)
    commit(next)
  }

  const rangeError = priceRangeInvalid(draft)
  const hasActive = activeFilterCount(draft) > 0

  return (
    <div className="filters">
      <div className="field">
        <label htmlFor={`${idPrefix}-city`}>Shahar</label>
        <input
          id={`${idPrefix}-city`}
          type="text"
          list={`${idPrefix}-cities`}
          autoComplete="off"
          placeholder="Masalan, Toshkent"
          value={draft.city}
          onChange={(e) => update({ city: e.target.value })}
        />
        <datalist id={`${idPrefix}-cities`}>
          {CITY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <fieldset className="field fieldset">
        <legend>Turi</legend>
        <div className="chips" role="radiogroup">
          <Radio name={`${idPrefix}-type`} value="" checked={draft.type === ''} onChange={(v) => update({ type: v }, true)}>
            Hammasi
          </Radio>
          <Radio name={`${idPrefix}-type`} value="SALE" checked={draft.type === 'SALE'} onChange={(v) => update({ type: v }, true)}>
            Sotuv
          </Radio>
          <Radio name={`${idPrefix}-type`} value="RENT" checked={draft.type === 'RENT'} onChange={(v) => update({ type: v }, true)}>
            Ijara
          </Radio>
        </div>
      </fieldset>

      {categories.length > 0 ? (
        <fieldset className="field fieldset">
          <legend>Kategoriya</legend>
          <div className="chips" role="radiogroup">
            <Radio name={`${idPrefix}-cat`} value="" checked={draft.category === ''} onChange={(v) => update({ category: v }, true)}>
              Hammasi
            </Radio>
            {categories.map((c) => (
              <Radio
                key={c.id}
                name={`${idPrefix}-cat`}
                value={c.slug}
                checked={draft.category === c.slug}
                onChange={(v) => update({ category: v }, true)}
              >
                {c.name}
              </Radio>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className={`field fieldset ${rangeError ? 'has-error' : ''}`}>
        <legend>Narx</legend>
        <div className="range">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Dan"
            aria-label="Minimal narx"
            value={draft.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Gacha"
            aria-label="Maksimal narx"
            value={draft.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
          />
        </div>
        {rangeError ? (
          <p className="field__error">Minimal narx maksimaldan katta bo'lmasin.</p>
        ) : (
          <p className="field__hint">Filtr valyutani ajratmaydi: dollar va so'm e'lonlari birga solishtiriladi.</p>
        )}
      </fieldset>

      <fieldset className="field fieldset">
        <legend>Xonalar soni</legend>
        <div className="chips" role="radiogroup">
          <Radio name={`${idPrefix}-rooms`} value="" checked={draft.rooms === ''} onChange={(v) => update({ rooms: v }, true)}>
            Hammasi
          </Radio>
          {ROOM_OPTIONS.map((r) => (
            <Radio key={r} name={`${idPrefix}-rooms`} value={r} checked={draft.rooms === r} onChange={(v) => update({ rooms: v }, true)}>
              {r}
            </Radio>
          ))}
        </div>
      </fieldset>

      {hasActive ? (
        <button type="button" className="btn btn--ghost btn--block" onClick={clearAll}>
          Filtrlarni tozalash
        </button>
      ) : null}
    </div>
  )
}
