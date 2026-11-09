export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

export const PAGE_SIZE = 12

export const LISTING_TYPES = {
  SALE: 'Sotuv',
  RENT: 'Ijara',
}

export const STATUS = {
  PENDING: { label: 'Tekshiruvda', hint: "Moderator ko'rib chiqmoqda. Tasdiqlangach saytda ko'rinadi." },
  APPROVED: { label: 'Faol', hint: "Saytda ko'rinib turibdi." },
  REJECTED: { label: 'Rad etilgan', hint: "Tahrirlab qayta yuboring: tahrirdan keyin e'lon yana tekshiruvga tushadi." },
}

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'UZS', label: "UZS (so'm)" },
]

// Rasm yuklash qoidalari backend bilan bir xil: jpg/png/webp, 5 MB gacha.
// MAX_IMAGES: frontend chegarasi (backend soniga cheklov qo'ymagan).
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const MAX_IMAGES = 10

export const SORT_OPTIONS = [
  { value: '', label: 'Yangilari birinchi' },
  { value: 'price_asc', label: 'Arzonlari birinchi' },
  { value: 'price_desc', label: 'Qimmatlari birinchi' },
  { value: 'area_desc', label: 'Maydoni katta' },
  { value: 'area_asc', label: 'Maydoni kichik' },
  { value: 'popular', label: "Ko'p ko'rilgan" },
]

export const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam yoki reklama' },
  { value: 'WRONG_INFO', label: "Ma'lumotlar noto'g'ri" },
  { value: 'SOLD', label: 'Allaqachon sotilgan / ijaraga berilgan' },
  { value: 'SCAM', label: 'Firibgarlikka o\'xshaydi' },
  { value: 'OTHER', label: 'Boshqa sabab' },
]

export const closedLabel = (listingType) => (listingType === 'RENT' ? 'Ijaraga berilgan' : 'Sotilgan')

export const CITY_SUGGESTIONS = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  "Farg'ona",
  'Qarshi',
  'Nukus',
  'Urganch',
  'Navoiy',
  'Jizzax',
  'Termiz',
  'Guliston',
]
