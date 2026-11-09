import { useCallback, useMemo, useRef } from 'react'
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
                  <button type="button" className="btn btn--primary" onClick={() => applyFilters({ ...filters, city: '', type: '', category: '', minPrice: '', maxPrice: '', rooms: '' })}>
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
