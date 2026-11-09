import { API_URL } from '../config'

export function imageSrc(url) {
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : API_URL + url
}

export function formatNumber(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  const [int, dec] = String(num).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec ? `${grouped},${dec}` : grouped
}

export function formatPrice(price, currency) {
  return currency === 'UZS' ? `${formatNumber(price)} so'm` : `$${formatNumber(price)}`
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

export function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

// +998901234567 yoki 901234567 (bo'shliq va tirelar e'tiborga olinmaydi)
const PHONE_RE = /^(\+998\d{9}|\d{9})$/

export function cleanPhone(value) {
  return String(value || '').replace(/[\s\-()]/g, '')
}

export function isValidPhone(value) {
  return PHONE_RE.test(cleanPhone(value))
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}
