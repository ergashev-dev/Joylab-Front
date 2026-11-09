import { API_URL } from '../config'

const TOKEN_KEY = 'uyma_token'

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* private mode: token faqat sessiya davomida yo'q bo'ladi */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

let unauthorizedHandler = null

export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export class ApiError extends Error {
  constructor(status, messages, raw) {
    super(messages[0] || 'Xatolik yuz berdi')
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
    this.raw = raw
  }
}

function defaultMessage(status) {
  switch (status) {
    case 400:
      return "Kiritilgan ma'lumotlar noto'g'ri."
    case 401:
      return 'Sessiya tugagan. Qayta kiring.'
    case 403:
      return "Bu amal uchun ruxsat yo'q."
    case 404:
      return 'Topilmadi.'
    case 409:
      return 'Bunday yozuv allaqachon mavjud.'
    case 413:
      return 'Rasm juda katta. 5 MB dan oshmasin.'
    default:
      return "Serverda xatolik. Birozdan keyin qayta urinib ko'ring."
  }
}

/**
 * Backend xatolari NestJS formatida: message matn yoki massiv bo'lishi mumkin.
 */
export async function request(path, { method = 'GET', body, query, auth = true, signal } = {}) {
  const url = new URL(API_URL + path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    }
  }

  const headers = {}
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body // Content-Type ni brauzer o'zi qo'yadi
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, { method, headers, body: payload, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, ["Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."])
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const raw = data && typeof data === 'object' ? data.message : null
    const messages = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [defaultMessage(res.status)]
    if (res.status === 401 && auth && token && unauthorizedHandler) unauthorizedHandler()
    throw new ApiError(res.status, messages, data)
  }

  return data
}

export function errorText(err) {
  if (err instanceof ApiError) return err.messages.join('. ')
  return "Kutilmagan xatolik. Qayta urinib ko'ring."
}
