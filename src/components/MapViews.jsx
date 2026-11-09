import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UZ_CENTER, UZ_ZOOM, bboxFromBounds, cityCenter, isCoord } from '../lib/geo'
import { formatPrice } from '../lib/format'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'

function createMap(el, { center, zoom, interactive = true }) {
  const map = L.map(el, {
    center,
    zoom,
    scrollWheelZoom: interactive,
    dragging: interactive,
    zoomControl: interactive,
    doubleClickZoom: interactive,
    touchZoom: interactive,
    boxZoom: interactive,
    keyboard: interactive,
  })
  L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)
  return map
}

const pin = () => L.divIcon({ className: 'mappin', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 34] })

function pricePill(p) {
  return L.divIcon({
    className: 'pricepill',
    html: `<span>${formatPrice(p.price, p.currency).replace(/[<>&]/g, '')}</span>`,
    iconSize: null,
  })
}

/** E'lon sahifasida: bitta nuqta. */
export function StaticMap({ lat, lng }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !isCoord(lat, lng)) return undefined
    const pos = [Number(lat), Number(lng)]
    const map = createMap(ref.current, { center: pos, zoom: 15, interactive: false })
    L.marker(pos, { icon: pin(), interactive: false, keyboard: false }).addTo(map)
    return () => map.remove()
  }, [lat, lng])
  return <div ref={ref} className="map map--static" role="img" aria-label="E'lon joylashuvi xaritada" />
}

/** Muharrirda: bosib nuqta qo'yish, sudrab siljitish. */
export function MapPicker({ lat, lng, city, onChange }) {
  const ref = useRef(null)
  const state = useRef({})
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!ref.current) return undefined
    const has = isCoord(lat, lng)
    const start = has ? [Number(lat), Number(lng)] : cityCenter(city) || UZ_CENTER
    const map = createMap(ref.current, { center: start, zoom: has ? 16 : cityCenter(city) ? 12 : UZ_ZOOM })
    state.current.map = map

    const place = (latlng) => {
      if (!state.current.marker) {
        const m = L.marker(latlng, { icon: pin(), draggable: true }).addTo(map)
        m.on('dragend', () => onChangeRef.current(m.getLatLng().lat, m.getLatLng().lng))
        state.current.marker = m
      } else {
        state.current.marker.setLatLng(latlng)
      }
    }
    state.current.place = place
    if (has) place(start)
    map.on('click', (e) => {
      place(e.latlng)
      onChangeRef.current(e.latlng.lat, e.latlng.lng)
    })
    return () => {
      state.current = {}
      map.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Tashqaridan o'zgarsa (masalan, "o'chirish") markerni sinxronlaymiz
  useEffect(() => {
    const s = state.current
    if (!s.map) return
    if (isCoord(lat, lng)) s.place([Number(lat), Number(lng)])
    else if (s.marker) {
      s.marker.remove()
      s.marker = null
    }
  }, [lat, lng])

  // Shahar o'zgarsa va nuqta yo'q bo'lsa, xarita shu shaharga o'tadi
  useEffect(() => {
    const c = cityCenter(city)
    if (c && !isCoord(lat, lng) && state.current.map) state.current.map.setView(c, 12)
  }, [city]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className="map map--picker" aria-label="Xaritada joylashuvni belgilang" />
}

/** Ro'yxat xaritasi: narx belgilari + "shu hududda qidirish". */
export default function ListingMap({ items, onSearchArea, searching }) {
  const ref = useRef(null)
  const layer = useRef(null)
  const mapRef = useRef(null)
  const fitted = useRef(false)
  const navigate = useNavigate()
  const navRef = useRef(navigate)
  navRef.current = navigate

  useEffect(() => {
    if (!ref.current) return undefined
    const map = createMap(ref.current, { center: UZ_CENTER, zoom: UZ_ZOOM })
    mapRef.current = map
    layer.current = L.layerGroup().addTo(map)
    return () => {
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !layer.current) return
    layer.current.clearLayers()
    const points = []
    for (const p of items) {
      if (!isCoord(p.lat, p.lng)) continue
      const pos = [Number(p.lat), Number(p.lng)]
      points.push(pos)
      const m = L.marker(pos, { icon: pricePill(p), keyboard: true, title: p.title })
      const box = document.createElement('div')
      box.className = 'mappopup'
      const t = document.createElement('strong')
      t.textContent = p.title
      const meta = document.createElement('div')
      meta.textContent = `${formatPrice(p.price, p.currency)} · ${p.city}`
      const a = document.createElement('a')
      a.href = `/properties/${p.id}`
      a.textContent = "E'lonni ochish"
      a.addEventListener('click', (e) => {
        e.preventDefault()
        navRef.current(`/properties/${p.id}`)
      })
      box.append(t, meta, a)
      m.bindPopup(box)
      m.addTo(layer.current)
    }
    if (!fitted.current && points.length > 0) {
      fitted.current = true
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 })
    }
  }, [items])

  return (
    <div className="mapwrap">
      <div ref={ref} className="map map--listing" aria-label="E'lonlar xaritasi" />
      <button
        type="button"
        className="btn btn--primary btn--sm mapwrap__search"
        disabled={searching}
        onClick={() => mapRef.current && onSearchArea(bboxFromBounds(mapRef.current.getBounds()))}
      >
        Shu hududda qidirish
      </button>
    </div>
  )
}
