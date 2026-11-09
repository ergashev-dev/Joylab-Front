import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import FilterForm from '../components/FilterForm'
import { CloseIcon, FilterIcon } from '../components/Icons'
import Pagination from '../components/Pagination'
import PropertyCard, { CardGrid, CardSkeleton } from '../components/PropertyCard'
import { EmptyState, ErrorState } from '../components/States'
import Select from '../components/Select'
import { PAGE_SIZE, SORT_OPTIONS } from '../config'
import { useAsync } from '../hooks/useAsync'
import { useCategories } from '../hooks/useCategories'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePageTitle } from '../hooks/usePageTitle'
import { activeFilterCount, filtersFromParams, pageFromParams, paramsFromFilters } from '../lib/filters'
import { formatNumber } from '../lib/format'

function chipsFor(f, categories) {
  const out = []
  if (f.q) out.push({ key: 'q', label: `«${f.q}»` })
  if (f.city) out.push({ key: 'city', label: f.city })
  if (f.type) out.push({ key: 'type', label: f.type === 'RENT' ? 'Ijara' : 'Sotuv' })
  if (f.category) out.push({ key: 'category', label: categories?.find((c) => c.slug === f.category)?.name || f.category })
  if (f.rooms) out.push({ key: 'rooms', label: `${f.rooms} xona` })
  if (f.minPrice) out.push({ key: 'minPrice', label: `dan ${formatNumber(f.minPrice)}` })
  if (f.maxPrice) out.push({ key: 'maxPrice', label: `gacha ${formatNumber(f.maxPrice)}` })
  return out
}

export default function Properties() {
  usePageTitle("E'lonlar")
  const [searchParams, setSearchParams] = useSearchParams()
  const { categories } = useCategories()
  const isDesktop = useMediaQuery('(min-width: 900px)')
  const sheet = useRef(null)

  const queryKey = searchParams.toString()
  const filters = useMemo(() => filtersFromParams(searchParams), [queryKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const page = pageFromParams(searchParams)

  const { data, error, loading, reload } = useAsync(
    (signal) => api.properties({ ...paramsFromFilters(filters), page, limit: PAGE_SIZE }, signal),
    [queryKey],
    { keepPrevious: true },
  )

  // Filtr o'zgarsa 1-sahifaga qaytamiz; matn yozayotganda tarix to'lib ketmasin
  const applyFilters = useCallback(
    (next) => {
      setSearchParams(paramsFromFilters(next, 1), { replace: true })
    },
    [setSearchParams],
  )

  function goToPage(next) {
    setSearchParams(paramsFromFilters(filters, next))
    window.scrollTo({ top: 0 })
  }

  const [qDraft, setQDraft] = useState(filters.q)
  useEffect(() => setQDraft(filters.q), [filters.q])
  useEffect(() => {
    if (qDraft === filters.q) return undefined
    const t = setTimeout(() => applyFilters({ ...filters, q: qDraft }), 450)
    return () => clearTimeout(t)
  }, [qDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  const chips = chipsFor(filters, categories)

  const items = data?.data || []
  const meta = data?.meta
  const activeCount = activeFilterCount(filters)
  const firstLoad = loading && !data

  return (
    <div className="container page">
      <div className="page__head">
        <h1 className="page__title">E'lonlar</h1>
        <p className="page__count" aria-live="polite">
          {meta ? (meta.total > 0 ? `${meta.total} ta e'lon topildi` : "E'lon topilmadi") : ' '}
        </p>
      </div>

      <div className="listing">
        {isDesktop ? (
          <aside className="listing__side" aria-label="Filtrlar">
            <FilterForm values={filters} categories={categories} onChange={applyFilters} idPrefix="side" />
          </aside>
        ) : null}

        <div className="listing__main">
          <div className="searchbar">
            <label htmlFor="q" className="sr-only">
              Qidiruv
            </label>
            <input
              id="q"
              type="search"
              placeholder="Sarlavha, manzil yoki tavsif bo'yicha qidirish…"
              value={qDraft}
              maxLength={100}
              onChange={(e) => setQDraft(e.target.value)}
            />
          </div>
          {chips.length > 0 ? (
            <div className="activechips" aria-label="Tanlangan filtrlar">
              {chips.map((c) => (
                <button key={c.key} type="button" className="chip chip--active" onClick={() => applyFilters({ ...filters, [c.key]: '' })} aria-label={`${c.label} filtrini o'chirish`}>
                  {c.label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="toolbar">
            {!isDesktop ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => sheet.current?.showModal()}>
                <FilterIcon size={18} />
                Filtrlar
                {activeCount > 0 ? <span className="count">{activeCount}</span> : null}
              </button>
            ) : (
              <span />
            )}
            <div className="toolbar__sort">
              <label htmlFor="sort" className="sr-only">
                Saralash
              </label>
              <Select id="sort" value={filters.sort} onChange={(v) => applyFilters({ ...filters, sort: v })} options={SORT_OPTIONS} />
            </div>
          </div>

          {error && !data ? (
            <ErrorState error={error} onRetry={reload} />
          ) : firstLoad ? (
            <CardGrid>
              {Array.from({ length: 6 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </CardGrid>
          ) : items.length === 0 ? (
            activeCount > 0 ? (
              <EmptyState
                title="Mos e'lon topilmadi"
                text="Filtrlarni kengaytirib ko'ring: narx oralig'i yoki xonalar sonini o'zgartiring."
                action={
                  <button type="button" className="btn btn--primary" onClick={() => applyFilters({ ...filters, q: '', city: '', type: '', category: '', minPrice: '', maxPrice: '', rooms: '' })}>
                    Filtrlarni tozalash
                  </button>
                }
              />
            ) : (
              <EmptyState title="Hozircha e'lonlar yo'q" text="Tasdiqlangan e'lonlar shu yerda ko'rinadi." />
            )
          ) : (
            <>
              {error ? (
                <p className="form-error" role="alert">
                  Yangilab bo'lmadi: {error.message}
                </p>
              ) : null}
              <div className={loading ? 'is-loading' : ''}>
                <CardGrid>
                  {items.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </CardGrid>
              </div>
              <Pagination page={meta?.page || page} totalPages={meta?.totalPages || 1} onChange={goToPage} />
            </>
          )}
        </div>
      </div>

      {!isDesktop ? (
        <dialog
          ref={sheet}
          className="sheet"
          aria-label="Filtrlar"
          onClick={(e) => {
            if (e.target === e.currentTarget) sheet.current?.close()
          }}
        >
          <div className="sheet__inner">
            <div className="sheet__head">
              <h2>Filtrlar</h2>
              <button type="button" className="icon-btn" onClick={() => sheet.current?.close()} aria-label="Yopish">
                <CloseIcon size={22} />
              </button>
            </div>
            <div className="sheet__body">
              <FilterForm values={filters} categories={categories} onChange={applyFilters} idPrefix="sheet" />
            </div>
            <div className="sheet__foot">
              <button type="button" className="btn btn--primary btn--block" onClick={() => sheet.current?.close()}>
                {meta ? `${meta.total} ta e'lonni ko'rish` : "E'lonlarni ko'rish"}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  )
}
