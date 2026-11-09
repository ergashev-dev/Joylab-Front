import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

function pageWindow(page, total) {
  const pages = new Set([1, total, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap-' + p)
    out.push(p)
  })
  return out
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Sahifalar">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Oldingi sahifa"
      >
        <ChevronLeftIcon size={18} />
      </button>

      {pageWindow(page, totalPages).map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="pagination__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pagination__btn ${item === page ? 'is-current' : ''}`}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`${item}-sahifa`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Keyingi sahifa"
      >
        <ChevronRightIcon size={18} />
      </button>
    </nav>
  )
}
