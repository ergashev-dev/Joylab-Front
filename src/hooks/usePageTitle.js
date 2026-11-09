import { useEffect } from 'react'

const BASE = 'Uyma-uy'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : `${BASE}: uy-joy e'lonlari`
  }, [title])
}
