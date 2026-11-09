import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EASE_OUT } from '../motion/ease'

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function Chevron() {
  return (
    <svg className="select__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const GAP = 8
const MAX_H = 320

/**
 * Native <select> o'rnini bosuvchi tanlash maydoni (ARIA "select-only combobox").
 * Ro'yxat portal orqali body'ga chiqariladi: overflow: hidden konteynerlar uni kesmaydi.
 *
 * options: [{ value: string, label: string }]
 * variant: 'field' (forma maydoni) | 'inline' (hero gapidagi so'z)
 */
export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder = 'Tanlang',
  variant = 'field',
  invalid = false,
  describedBy,
  ariaLabel,
  className = '',
  minWidth = 220,
}) {
  const reduce = useReducedMotion()
  const autoId = useId()
  const listId = `${id || autoId}-list`
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const typeahead = useRef({ text: '', timer: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState(null)

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value))
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  // Tugma ostida (joy yetmasa ustida) joylashtiramiz
  const place = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(r.width, minWidth)
    const below = window.innerHeight - r.bottom - GAP
    const above = r.top - GAP
    const up = below < Math.min(MAX_H, options.length * 46 + 16) && above > below
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
    setPos({
      left,
      width,
      top: up ? undefined : r.bottom + GAP,
      bottom: up ? window.innerHeight - r.top + GAP : undefined,
      maxHeight: Math.max(160, Math.min(MAX_H, up ? above : below) - 8),
      up,
    })
  }, [minWidth, options.length])

  useLayoutEffect(() => {
    if (!open) return undefined
    place()
    const onMove = () => place()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open, place])

  // Tashqariga bosilganda yopiladi
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (buttonRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Faol variant ko'rinib tursin
  useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function openList(index = selectedIndex >= 0 ? selectedIndex : 0) {
    setActive(index)
    setOpen(true)
  }

  function choose(index) {
    const opt = options[index]
    if (!opt) return
    if (String(opt.value) !== String(value)) onChange(opt.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onKeyDown(e) {
    const last = options.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openList()
        else setActive((i) => Math.min(last, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openList()
        else setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActive(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActive(last)
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) choose(active)
        else openList()
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
        }
        break
      case 'Tab':
        if (open) setOpen(false)
        break
      default:
        // Harf terib qidirish
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const t = typeahead.current
          clearTimeout(t.timer)
          t.text += e.key.toLocaleLowerCase('uz')
          t.timer = setTimeout(() => (t.text = ''), 600)
          const from = open ? active : selectedIndex
          const order = [...options.slice(from + 1), ...options.slice(0, from + 1)]
          const hit = order.find((o) => o.label.toLocaleLowerCase('uz').startsWith(t.text))
          if (hit) {
            const idx = options.indexOf(hit)
            if (open) setActive(idx)
            else onChange(hit.value)
          }
        }
    }
  }

  const activeId = open && active >= 0 ? `${listId}-${active}` : undefined

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        data-value={value ?? ''}
        className={`select select--${variant} ${open ? 'is-open' : ''} ${selected ? '' : 'is-empty'} ${invalid ? 'is-invalid' : ''} ${className}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="select__value">{selected ? selected.label : placeholder}</span>
        <Chevron />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && pos ? (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={id}
              tabIndex={-1}
              data-lenis-prevent
              className={`select__list select__list--${variant}`}
              style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight, transformOrigin: pos.up ? 'bottom center' : 'top center' }}
              initial={reduce ? false : { opacity: 0, y: pos.up ? 8 : -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.up ? 6 : -6, scale: 0.97, transition: { duration: 0.14 } }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              {options.map((o, i) => {
                const isSel = i === selectedIndex
                return (
                  <motion.li
                    key={String(o.value)}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={isSel}
                    data-index={i}
                    data-value={o.value}
                    className={`select__option ${i === active ? 'is-active' : ''} ${isSel ? 'is-selected' : ''}`}
                    initial={reduce ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.025, ease: EASE_OUT }}
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => choose(i)}
                  >
                    <span>{o.label}</span>
                    {isSel ? <Check /> : null}
                  </motion.li>
                )
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
