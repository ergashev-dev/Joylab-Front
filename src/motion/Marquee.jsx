import { Link } from 'react-router-dom'

function Star() {
  return (
    <svg className="marquee__star" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2l2.6 4.8L20 5.4l-1.4 5.3L23 13l-4.8 2.4.9 5.4-5.3-1.7L12 23l-2-4.9-5.3 1.7.9-5.4L1 13l4.4-2.3L4 5.4l5.4 1.4z" fill="currentColor" />
    </svg>
  )
}

/** Shaharlar lentasi: cheksiz harakatlanadi, ustiga kelinsa to'xtaydi. Har bir shahar filtrga olib boradi. */
export default function Marquee({ items }) {
  const row = (hidden) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((city) => (
        <li key={city}>
          <Link to={`/properties?city=${encodeURIComponent(city)}`} tabIndex={hidden ? -1 : undefined}>
            {city}
          </Link>
          <Star />
        </li>
      ))}
    </ul>
  )
  return (
    <nav className="marquee" aria-label="Shaharlar bo'yicha">
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </nav>
  )
}
