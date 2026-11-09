import { COMPARE_MAX, compareStore, useCompareIds } from '../lib/compare'
import { useToast } from '../context/ToastContext'

export default function CompareButton({ propertyId, className = '' }) {
  const ids = useCompareIds()
  const { push } = useToast()
  const active = ids.includes(propertyId)

  function onClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!compareStore.toggle(propertyId)) push(`Taqqoslash uchun ko'pi bilan ${COMPARE_MAX} ta e'lon tanlanadi`, 'error')
  }

  return (
    <button type="button" className={`cmp ${active ? 'is-active' : ''} ${className}`} onClick={onClick} aria-pressed={active}>
      {active ? '✓ Taqqoslashda' : '⇄ Taqqoslash'}
    </button>
  )
}
