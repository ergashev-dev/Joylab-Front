import { useId } from 'react'
import { HomeIcon } from './Icons'

// Rasm bo'lmasa ko'rsatiladigan o'rinbosar: sharq yulduz-naqshi va uy belgisi.
export default function Placeholder({ label }) {
  const id = useId()
  return (
    <div className="placeholder" role="img" aria-label={label || "Rasm yo'q"}>
      <svg className="placeholder__pattern" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.2">
              <rect x="10" y="10" width="28" height="28" />
              <rect x="10" y="10" width="28" height="28" transform="rotate(45 24 24)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      <HomeIcon size={34} />
      {label ? <span>{label}</span> : null}
    </div>
  )
}
