// Xarita uchun standart markazlar (shahar tanlanganda xarita shu yerga ochiladi)
export const UZ_CENTER = [41.3, 64.6]
export const UZ_ZOOM = 5

export const CITY_CENTERS = {
  toshkent: [41.311, 69.279],
  samarqand: [39.654, 66.975],
  buxoro: [39.768, 64.421],
  namangan: [40.998, 71.673],
  andijon: [40.783, 72.344],
  "farg'ona": [40.384, 71.784],
  qarshi: [38.861, 65.789],
  nukus: [42.46, 59.603],
  urganch: [41.55, 60.633],
  navoiy: [40.103, 65.374],
  jizzax: [40.115, 67.842],
  termiz: [37.224, 67.278],
  guliston: [40.489, 68.784],
}

export function cityCenter(city) {
  return CITY_CENTERS[String(city || '').trim().toLowerCase()] || null
}

export const isCoord = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && lat !== null && lng !== null && lat !== '' && lng !== ''

// bbox: "minLat,minLng,maxLat,maxLng"
export function parseBbox(value) {
  const parts = String(value || '').split(',').map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null
  const [minLat, minLng, maxLat, maxLng] = parts
  if (minLat > maxLat || minLng > maxLng || Math.abs(minLat) > 90 || Math.abs(maxLat) > 90 || Math.abs(minLng) > 180 || Math.abs(maxLng) > 180) return null
  return { minLat, minLng, maxLat, maxLng }
}

export function bboxFromBounds(b) {
  const r = (n) => Number(n.toFixed(5))
  return `${r(b.getSouth())},${r(b.getWest())},${r(b.getNorth())},${r(b.getEast())}`
}
