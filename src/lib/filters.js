import { SORT_OPTIONS } from '../config'
import { parseBbox } from './geo'

export const EMPTY_FILTERS = {
  view: '',
  bbox: '',
  q: '',
  city: '',
  type: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  rooms: '',
  sort: '',
}

const SORTS = SORT_OPTIONS.map((s) => s.value).filter(Boolean)

const nonNegative = (v) => (v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? String(Number(v)) : '')
const positiveInt = (v) => (/^\d+$/.test(v) && Number(v) >= 1 ? String(Number(v)) : '')

/** URL parametrlarini xavfsiz filtrlarga aylantiradi (qo'lda yozilgan noto'g'ri qiymatlar backend'da 400 bermasin). */
export function filtersFromParams(sp) {
  const get = (k) => (sp.get(k) || '').trim()
  const type = get('type')
  const sort = get('sort')
  return {
    view: get('view') === 'map' ? 'map' : '',
    bbox: parseBbox(get('bbox')) ? get('bbox') : '',
    q: get('q').slice(0, 100),
    city: get('city'),
    type: type === 'SALE' || type === 'RENT' ? type : '',
    category: /^[a-z0-9-]+$/.test(get('category')) ? get('category') : '',
    minPrice: nonNegative(get('minPrice')),
    maxPrice: nonNegative(get('maxPrice')),
    rooms: positiveInt(get('rooms')),
    sort: SORTS.includes(sort) ? sort : '',
  }
}

export function pageFromParams(sp) {
  const n = Number(sp.get('page'))
  return Number.isInteger(n) && n >= 1 ? n : 1
}

export function paramsFromFilters(filters, page = 1) {
  const out = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined && value !== null) out[key] = value
  }
  if (page > 1) out.page = String(page)
  return out
}

export function sameFilters(a, b) {
  return Object.keys(EMPTY_FILTERS).every((k) => (a[k] || '') === (b[k] || ''))
}

export function priceRangeInvalid(f) {
  return f.minPrice !== '' && f.maxPrice !== '' && Number(f.minPrice) > Number(f.maxPrice)
}

export function activeFilterCount(f) {
  return ['q', 'bbox', 'city', 'type', 'category', 'minPrice', 'maxPrice', 'rooms'].filter((k) => f[k] !== '').length
}

/** Backend'ga faqat u biladigan parametrlar ketadi (ortiqcha kalit 400 beradi). */
export function apiQueryFromFilters(filters) {
  const { view, bbox, ...rest } = paramsFromFilters(filters)
  const out = { ...rest }
  const b = parseBbox(bbox)
  if (b) Object.assign(out, b)
  return out
}
