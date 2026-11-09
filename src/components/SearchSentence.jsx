import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CITY_SUGGESTIONS } from '../config'
import { useCategories } from '../hooks/useCategories'
import { paramsFromFilters, EMPTY_FILTERS } from '../lib/filters'
import { EASE_OUT } from '../motion/ease'
import Magnetic from '../motion/Magnetic'
import { SearchIcon } from './Icons'
import Select from './Select'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } } }
const word = {
  hidden: { y: '115%', rotate: 5, opacity: 0 },
  show: { y: '0%', rotate: 0, opacity: 1, transition: { duration: 0.9, ease: EASE_OUT } },
}

/** Gap bo'lagi: niqob ichida pastdan ko'tariladi. */
function Piece({ children, className = '' }) {
  return (
    <span className={`sentence__mask ${className}`}>
      <motion.span className="sentence__piece" variants={word}>
        {children}
      </motion.span>
    </span>
  )
}

/** Hero qidiruvi: filtr o'rniga gap. «Men [shahar] shahrida [kvartira] [sotib olmoqchiman]» */
export default function SearchSentence() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { categories } = useCategories()
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('SALE')
  const [ph, setPh] = useState(0)

  // Bo'sh maydonda shahar nomlari almashib turadi
  useEffect(() => {
    if (reduce) return undefined
    const id = setInterval(() => setPh((n) => n + 1), 2400)
    return () => clearInterval(id)
  }, [reduce])
  const placeholder = CITY_SUGGESTIONS.length ? CITY_SUGGESTIONS[ph % CITY_SUGGESTIONS.length].toLocaleLowerCase('uz') : 'shahar'

  function onSubmit(e) {
    e.preventDefault()
    const params = paramsFromFilters({ ...EMPTY_FILTERS, city: city.trim(), category, type })
    navigate({ pathname: '/properties', search: new URLSearchParams(params).toString() })
  }

  return (
    <form className="sentence" onSubmit={onSubmit} aria-label="E'lon qidirish">
      <motion.p className="sentence__text" variants={container} initial={reduce ? false : 'hidden'} animate="show">
        <Piece>Men</Piece>{' '}
        <Piece className="sentence__slot">
          <label className="sr-only" htmlFor="hero-city">
            Shahar
          </label>
          <input
            id="hero-city"
            className="sentence__input"
            type="text"
            list="hero-cities"
            autoComplete="off"
            placeholder={placeholder}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <datalist id="hero-cities">
            {CITY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Piece>{' '}
        <Piece>shahrida</Piece>{' '}
        <Piece className="sentence__slot">
          <label className="sr-only" htmlFor="hero-category">
            Kategoriya
          </label>
          <Select
            id="hero-category"
            variant="inline"
            value={category}
            onChange={setCategory}
            options={[{ value: '', label: 'istalgan uy-joyni' }, ...categories.map((c) => ({ value: c.slug, label: `${c.name.toLocaleLowerCase('uz')}ni` }))]}
          />
        </Piece>{' '}
        <Piece className="sentence__slot">
          <label className="sr-only" htmlFor="hero-type">
            Maqsad
          </label>
          <Select
            id="hero-type"
            variant="inline"
            value={type}
            onChange={setType}
            options={[
              { value: 'SALE', label: 'sotib olmoqchiman' },
              { value: 'RENT', label: 'ijaraga olmoqchiman' },
            ]}
          />
          .
        </Piece>
      </motion.p>
      <motion.div
        className="sentence__actions"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.85, ease: EASE_OUT }}
      >
        <Magnetic>
          <button type="submit" className="btn btn--accent btn--lg btn--shine">
            <SearchIcon size={20} />
            E'lonlarni ko'rish
          </button>
        </Magnetic>
      </motion.div>
    </form>
  )
}
