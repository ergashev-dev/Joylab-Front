import { useEffect } from 'react'

const BASE = 'Uyma-uy'
const DEFAULT_DESC = "Uyma-uy: kvartira, hovli, ofis va yer uchastkalari e'lonlari. Sotuv va ijara."

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

export function usePageTitle(title, description) {
  useEffect(() => {
    const full = title ? `${title} | ${BASE}` : `${BASE}: uy-joy e'lonlari`
    const desc = description ? String(description).slice(0, 160) : DEFAULT_DESC
    document.title = full
    setMeta('meta[name="description"]', 'content', desc)
    setMeta('meta[property="og:title"]', 'content', full)
    setMeta('meta[property="og:description"]', 'content', desc)
    setMeta('meta[property="og:url"]', 'content', window.location.href)
  }, [title, description])
}
