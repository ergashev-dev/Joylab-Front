import { Suspense, lazy } from 'react'

const ListingMapLazy = lazy(() => import('./MapViews'))
const StaticMapLazy = lazy(() => import('./MapViews').then((m) => ({ default: m.StaticMap })))
const MapPickerLazy = lazy(() => import('./MapViews').then((m) => ({ default: m.MapPicker })))

const fallback = <div className="map map--loading" aria-busy="true" />

export const ListingMap = (props) => (
  <Suspense fallback={fallback}>
    <ListingMapLazy {...props} />
  </Suspense>
)
export const StaticMap = (props) => (
  <Suspense fallback={fallback}>
    <StaticMapLazy {...props} />
  </Suspense>
)
export const MapPicker = (props) => (
  <Suspense fallback={fallback}>
    <MapPickerLazy {...props} />
  </Suspense>
)
