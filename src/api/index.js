import { request } from './client'

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  me: (signal) => request('/auth/me', { signal }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token }, auth: false }),
  resendVerification: () => request('/auth/resend-verification', { method: 'POST' }),

  categories: (signal) => request('/categories', { signal, auth: false }),

  properties: (query, signal) => request('/properties', { query, signal, auth: false }),
  property: (id, signal) => request(`/properties/${id}`, { signal, auth: false }),

  // Seller: faqat o'z e'lonlari (PENDING va REJECTED ham shu yerda ko'rinadi)
  myProperties: (signal) => request('/properties/my', { signal }),
  createProperty: (body) => request('/properties', { method: 'POST', body }),
  updateProperty: (id, body) => request(`/properties/${id}`, { method: 'PATCH', body }),
  deleteProperty: (id) => request(`/properties/${id}`, { method: 'DELETE' }),
  // Bitta so'rovda bitta rasm, kalit nomi aynan "image"
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('image', file)
    return request(`/properties/${id}/images`, { method: 'POST', body: form })
  },
  deleteImage: (id, imageId) => request(`/properties/${id}/images/${imageId}`, { method: 'DELETE' }),

  // Admin
  adminProperties: (query, signal) => request('/admin/properties', { query, signal }),
  adminSetStatus: (id, status) => request(`/admin/properties/${id}/status`, { method: 'PATCH', body: { status } }),
  adminUsers: (signal) => request('/admin/users', { signal }),
  adminSetRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  favorites: (signal) => request('/favorites', { signal }),
  addFavorite: (propertyId) => request(`/favorites/${propertyId}`, { method: 'POST' }),
  removeFavorite: (propertyId) => request(`/favorites/${propertyId}`, { method: 'DELETE' }),

  sendInquiry: (propertyId, body) => request(`/properties/${propertyId}/inquiries`, { method: 'POST', body }),
  myInquiries: (signal) => request('/inquiries/my', { signal }),
  receivedInquiries: (query, signal) => request('/inquiries/received', { query, signal }),
  markInquiryRead: (id) => request(`/inquiries/${id}/read`, { method: 'PATCH' }),

  similar: (id, signal) => request(`/properties/${id}/similar`, { signal, auth: false }),
  setClosed: (id, closed) => request(`/properties/${id}/closed`, { method: 'PATCH', body: { closed } }),
  renewProperty: (id) => request(`/properties/${id}/renew`, { method: 'POST' }),
  reportProperty: (id, body) => request(`/properties/${id}/report`, { method: 'POST', body }),
  adminReports: (signal) => request('/admin/reports', { signal }),
  adminResolveReport: (id) => request(`/admin/reports/${id}/resolve`, { method: 'PATCH' }),
}
