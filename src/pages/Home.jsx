import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import CountUp from '../components/CountUp'
import { ArrowUpRightIcon } from '../components/Icons'
import Placeholder from '../components/Placeholder'
import PropertyCard, { CardGrid, CardSkeleton } from '../components/PropertyCard'
import SearchSentence from '../components/SearchSentence'
import { EmptyState, ErrorState } from '../components/States'
import { CITY_SUGGESTIONS } from '../config'
import { useAsync } from '../hooks/useAsync'
import { useCategories } from '../hooks/useCategories'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatPrice, imageSrc } from '../lib/format'
import { EASE_OUT } from '../motion/ease'
import Magnetic from '../motion/Magnetic'
import Marquee from '../motion/Marquee'
import SplitTitle from '../motion/SplitTitle'

function HeroPattern() {
  return (
    <svg className="hero__pattern" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hero-star" width="72" height="72" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#e9b44c" strokeOpacity=".13" strokeWidth="1.2">
            <rect x="15" y="15" width="42" height="42" />
            <rect x="15" y="15" width="42" height="42" transform="rotate(45 36 36)" />
            <circle cx="36" cy="36" r="7" />
          </g>
        </pattern>
        <radialGradient id="hero-fade" cx="70%" cy="40%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="hero-mask">
          <rect width="100%" height="100%" fill="url(#hero-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-star)" mask="url(#hero-mask)" />
    </svg>
  )
}

/** Shisha sharlar: scroll'da har xil tezlikda ko'tariladi, sichqonchaga qarab siljiydi (CSS --px/--py). */
function Orbs({ target }) {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end start'] })
  const yA = useTransform(scrollYProgress, [0, 1], [0, -140])
  const yB = useTransform(scrollYProgress, [0, 1], [0, -260])
  const yC = useTransform(scrollYProgress, [0, 1], [0, -60])
  const style = (y) => (reduce ? undefined : { y })
  return (
    <div className="orbs" aria-hidden="true">
      <motion.span className="orb-wrap orb-wrap--a" style={style(yA)}>
        <span className="orb orb--a" />
      </motion.span>
      <motion.span className="orb-wrap orb-wrap--b" style={style(yB)}>
        <span className="orb orb--b" />
      </motion.span>
      <motion.span className="orb-wrap orb-wrap--c" style={style(yC)}>
        <span className="orb orb--c" />
      </motion.span>
    </div>
  )
}

const tileIn = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, delay: 0.1 + i * 0.1, ease: EASE_OUT } }),
}

const MotionLink = motion.create(Link)

function Tile({ i, className, children, as = 'div', ...rest }) {
  const reduce = useReducedMotion()
  const Comp = as === 'link' ? MotionLink : motion.div
  return (
    <Comp className={`tile ${className}`} custom={i} variants={tileIn} initial={reduce ? false : 'hidden'} animate="show" data-spotlight {...rest}>
      {children}
    </Comp>
  )
}

function FeatureTile({ property, loading }) {
  if (loading) return <div className="tile tile--feature skeleton" aria-hidden="true" />
  if (!property) {
    return (
      <Tile i={2} as="link" to="/dashboard/new" className="tile--feature tile--empty">
        <p className="tile__title">Birinchi e'lon sizniki bo'lsin</p>
        <span className="tile__go" aria-hidden="true">
          <ArrowUpRightIcon size={22} />
        </span>
      </Tile>
    )
  }
  const src = imageSrc(property.images?.[0]?.url)
  return (
    <Tile i={2} as="link" to={`/properties/${property.id}`} className="tile--feature">
      <span className="feature__media">{src ? <img src={src} alt="" /> : <Placeholder />}</span>
      <span className="feature__chip">Eng yangi</span>
      <span className="feature__info">
        <span className="feature__price">{formatPrice(property.price, property.currency)}</span>
        <span className="feature__title">{property.title}</span>
      </span>
      <span className="tile__go" aria-hidden="true">
        <ArrowUpRightIcon size={22} />
      </span>
    </Tile>
  )
}

export default function Home() {
  usePageTitle('')
  const heroRef = useRef(null)
  const { categories } = useCategories()
  const { data, error, loading, reload } = useAsync((signal) => api.properties({ limit: 8, sort: 'newest' }, signal), [])

  const items = data?.data || []
  const total = data?.meta?.total ?? 0

  return (
    <>
      <section className="container bento" aria-label="Qidiruv" ref={heroRef}>
        <Tile i={0} className="tile--search">
          <div className="aurora" aria-hidden="true">
            <span />
            <span />
          </div>
          <HeroPattern />
          <Orbs target={heroRef} />
          <SearchSentence />
        </Tile>

        <Tile i={1} className="tile--count">
          <p className="tile__label">Saytdagi e'lonlar</p>
          <p className="count__num">{loading ? '–' : <CountUp value={total} />}</p>
          <p className="muted">Hammasi moderatordan o'tgan. Sotuvchi bilan to'g'ridan-to'g'ri bog'laning.</p>
        </Tile>

        <FeatureTile property={items[0]} loading={loading && !error} />

        <Tile i={3} as="link" to="/dashboard/new" className="tile--post">
          <p className="tile__title">Uy-joyingiz bormi? E'lonni bepul joylang</p>
          <p className="tile__sub">Rasm va ma'lumot kiriting, moderator tasdiqlaydi.</p>
          <span className="tile__go tile__go--dark" aria-hidden="true">
            <ArrowUpRightIcon size={22} />
          </span>
        </Tile>

        <Tile i={4} className="tile--cats">
          <p className="tile__label">Kategoriyalar</p>
          {categories.length > 0 ? (
            <ul className="catlist" aria-label="Kategoriyalar">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/properties?category=${c.slug}`} className="catlist__item">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Kategoriyalar hali qo'shilmagan.</p>
          )}
        </Tile>
      </section>

      <Marquee items={CITY_SUGGESTIONS} />

      <section className="container section">
        <div className="section__head">
          <SplitTitle className="section__title">Yangi e'lonlar</SplitTitle>
          <Magnetic>
            <Link to="/properties" className="pill-link">
              Hammasini ko'rish <ArrowUpRightIcon size={18} />
            </Link>
          </Magnetic>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <CardGrid>
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </CardGrid>
        ) : items.length === 0 ? (
          <EmptyState title="Hozircha e'lonlar yo'q" text="Tasdiqlangan e'lonlar shu yerda ko'rinadi." />
        ) : (
          <CardGrid>
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </CardGrid>
        )}
      </section>
    </>
  )
}
