import { IMAGE_MAX_BYTES, IMAGE_TYPES } from '../config'

export const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  currency: 'USD',
  listingType: 'SALE',
  categoryId: '',
  city: '',
  address: '',
  area: '',
  rooms: '',
  bathrooms: '1',
  lat: '',
  lng: '',
}

export function formFromProperty(p) {
  return {
    title: p.title ?? '',
    description: p.description ?? '',
    price: String(p.price ?? ''),
    currency: p.currency || 'USD',
    listingType: p.listingType || 'SALE',
    categoryId: String(p.categoryId ?? p.category?.id ?? ''),
    city: p.city ?? '',
    address: p.address ?? '',
    area: String(p.area ?? ''),
    rooms: String(p.rooms ?? ''),
    bathrooms: String(p.bathrooms ?? ''),
    lat: p.lat === null || p.lat === undefined ? '' : String(p.lat),
    lng: p.lng === null || p.lng === undefined ? '' : String(p.lng),
  }
}

// "85 000" va "72,5" ko'rinishlarini ham son sifatida o'qiymiz
export function toNumber(value) {
  return Number(String(value).replace(/\s/g, '').replace(',', '.'))
}

/** Backend qoidalari: title 5–150, description ≥20, price>0, area>0, rooms≥1 (butun), bathrooms≥0 (butun). */
export function validateForm(f) {
  const e = {}
  const title = f.title.trim()
  if (title.length < 5 || title.length > 150) e.title = "Sarlavha 5 dan 150 gacha belgi bo'lsin."
  if (f.description.trim().length < 20) e.description = "Tavsif kamida 20 belgidan iborat bo'lsin."
  const price = toNumber(f.price)
  if (!f.price.trim() || !Number.isFinite(price) || price <= 0) e.price = "Narx noldan katta son bo'lsin."
  if (!f.categoryId) e.categoryId = 'Kategoriyani tanlang.'
  if (!f.city.trim()) e.city = 'Shaharni kiriting.'
  if (!f.address.trim()) e.address = 'Manzilni kiriting.'
  const area = toNumber(f.area)
  if (!f.area.trim() || !Number.isFinite(area) || area <= 0) e.area = "Maydon noldan katta son bo'lsin."
  if (!/^\d+$/.test(f.rooms.trim()) || Number(f.rooms) < 1) e.rooms = "Kamida 1 ta xona, butun son."
  if (!/^\d+$/.test(f.bathrooms.trim())) e.bathrooms = "0 yoki undan katta butun son."
  return e
}

/** Sonlarni son sifatida yuboramiz ("85000", emas 85000). status va ownerId yuborilmaydi. */
export function buildBody(f) {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    price: toNumber(f.price),
    currency: f.currency,
    listingType: f.listingType,
    categoryId: Number(f.categoryId),
    address: f.address.trim(),
    city: f.city.trim(),
    area: toNumber(f.area),
    rooms: Number(f.rooms),
    bathrooms: Number(f.bathrooms),
    lat: f.lat !== '' && f.lng !== '' ? Number(f.lat) : null,
    lng: f.lat !== '' && f.lng !== '' ? Number(f.lng) : null,
  }
}

/** PATCH uchun faqat o'zgargan maydonlar. */
export function changedFields(body, property) {
  const original = buildBody(formFromProperty(property))
  const diff = {}
  for (const key of Object.keys(body)) {
    if (body[key] !== original[key]) diff[key] = body[key]
  }
  return diff
}

/** Tanlangan fayllarni backend qoidalariga qarab ajratadi. */
export function checkImageFiles(files) {
  const ok = []
  const problems = []
  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type)) problems.push(`${file.name}: faqat jpg, png yoki webp.`)
    else if (file.size > IMAGE_MAX_BYTES) problems.push(`${file.name}: 5 MB dan katta.`)
    else ok.push(file)
  }
  return { ok, problems }
}

/** Har bir qadamda tekshiriladigan maydonlar. */
export const STEP_FIELDS = [['listingType', 'categoryId'], ['city', 'address'], ['area', 'rooms', 'bathrooms'], ['title', 'price', 'description'], [], []]

/** Faqat berilgan maydonlar bo'yicha xatolar. */
export function validateStep(form, step) {
  const all = validateForm(form)
  const out = {}
  for (const key of STEP_FIELDS[step] || []) if (all[key]) out[key] = all[key]
  return out
}

/** Birinchi xatosi bor qadam (yoki -1). */
export function firstInvalidStep(form) {
  const all = validateForm(form)
  return STEP_FIELDS.findIndex((fields) => fields.some((k) => all[k]))
}

/** Avvalgi javoblardan sarlavha taklifi: "3 xonali kvartira, Chilonzor, Toshkent". */
export function suggestTitle(form, categoryName) {
  const parts = []
  const rooms = Number(form.rooms)
  const cat = (categoryName || '').toLocaleLowerCase('uz')
  if (rooms >= 1 && cat && !/yer/.test(cat)) parts.push(`${rooms} xonali ${cat}`)
  else if (cat) parts.push(categoryName)
  const place = [form.address.split(',')[0].trim(), form.city.trim()].filter(Boolean).join(', ')
  if (place) parts.push(place)
  const title = parts.join(', ')
  return title.length >= 5 ? title.slice(0, 150) : ''
}

const DRAFT_KEY = 'uyma_listing_draft'

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? { ...EMPTY_FORM, ...data } : null
  } catch {
    return null
  }
}

export function saveDraft(form) {
  try {
    const empty = Object.keys(EMPTY_FORM).every((k) => form[k] === EMPTY_FORM[k])
    if (empty) localStorage.removeItem(DRAFT_KEY)
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  } catch {
    /* localStorage yopiq bo'lishi mumkin */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* e'tiborsiz */
  }
}
