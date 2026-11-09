import { motion, useReducedMotion, useSpring } from 'framer-motion'
import { Children, cloneElement, isValidElement } from 'react'
import { Link } from 'react-router-dom'
import { LISTING_TYPES, closedLabel } from '../config'
import CompareButton from './CompareButton'
import { formatNumber, formatPrice, imageSrc } from '../lib/format'
import { EASE_OUT } from '../motion/ease'
import { AreaIcon, ArrowUpRightIcon, BathIcon, BedIcon, PinIcon } from './Icons'
import HeartButton from './HeartButton'
import Placeholder from './Placeholder'

const SPRING = { stiffness: 260, damping: 22, mass: 0.5 }

export default function PropertyCard({ property, showHeart = true, index = 0 }) {
  const { id, title, price, currency, listingType, city, area, rooms, bathrooms, images, category, closedAt } = property
  const src = imageSrc(images?.[0]?.url)
  const href = `/properties/${id}`
  const reduce = useReducedMotion()
  const rx = useSpring(0, SPRING)
  const ry = useSpring(0, SPRING)

  // 3D tilt + yaltiroq nur sichqoncha ortidan (faqat sichqoncha bilan)
  function onMove(e) {
    if (reduce || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 10)
    rx.set(-(py - 0.5) * 10)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }
  function onLeave() {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.article
      className={`card ${closedAt ? 'card--closed' : ''}`}
      initial={reduce ? false : { opacity: 0, y: 48, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: EASE_OUT }}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="card__glare" aria-hidden="true" />
      <Link to={href} className="card__media" tabIndex={-1} aria-hidden="true">
        {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <Placeholder />}
        <span className="card__go">
          <ArrowUpRightIcon size={20} />
        </span>
      </Link>
      <span className={`badge badge--${listingType === 'RENT' ? 'rent' : 'sale'}`}>{LISTING_TYPES[listingType] || listingType}</span>
      {closedAt ? <span className="card__closed">{closedLabel(listingType)}</span> : null}
      {showHeart ? <HeartButton propertyId={id} className="card__heart" /> : null}

      <Link to={href} className="card__body">
        <span className="card__price">{formatPrice(price, currency)}</span>
        <h3 className="card__title">{title}</h3>
        <span className="card__facts">
          <span title="Xonalar">
            <BedIcon size={16} /> {rooms}
          </span>
          <span title="Hammom">
            <BathIcon size={16} /> {bathrooms}
          </span>
          <span title="Maydon">
            <AreaIcon size={16} /> {formatNumber(area)} m²
          </span>
        </span>
        <span className="card__place">
          <PinIcon size={15} /> {city}
          {category?.name ? <span className="card__cat">{category.name}</span> : null}
        </span>
      </Link>
      {showHeart ? <CompareButton propertyId={id} className="card__cmp" /> : null}
    </motion.article>
  )
}

export function CardSkeleton() {
  return (
    <div className="card card--skeleton" aria-hidden="true">
      <div className="card__media skeleton" />
      <div className="skeleton skeleton--line skeleton--w60" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line skeleton--w40" />
    </div>
  )
}

export function CardGrid({ children }) {
  return (
    <div className="grid">
      {Children.map(children, (child, i) => (isValidElement(child) && child.type === PropertyCard ? cloneElement(child, { index: i }) : child))}
    </div>
  )
}
