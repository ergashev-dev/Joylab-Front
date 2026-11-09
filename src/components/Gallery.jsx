import { useRef, useState } from 'react'
import { imageSrc } from '../lib/format'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './Icons'
import Placeholder from './Placeholder'

export default function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0)
  const dialog = useRef(null)
  const count = images.length

  if (count === 0) {
    return (
      <div className="gallery">
        <div className="gallery__main gallery__main--empty">
          <Placeholder label="Bu e'longa rasm qo'shilmagan" />
        </div>
      </div>
    )
  }

  const current = images[active] || images[0]
  const prev = () => setActive((i) => (i + count - 1) % count)
  const next = () => setActive((i) => (i + 1) % count)

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }

  return (
    <div className="gallery">
      <button
        type="button"
        className="gallery__main"
        onClick={() => dialog.current?.showModal()}
        aria-label="Rasmni kattalashtirish"
      >
        <img src={imageSrc(current.url)} alt={current.altText || title} />
        {count > 1 ? (
          <span className="gallery__counter">
            {active + 1} / {count}
          </span>
        ) : null}
      </button>

      {count > 1 ? (
        <ul className="gallery__thumbs">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                className={i === active ? 'is-active' : ''}
                onClick={() => setActive(i)}
                aria-label={`${i + 1}-rasm`}
                aria-current={i === active}
              >
                <img src={imageSrc(img.url)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialog}
        className="lightbox"
        onKeyDown={onKeyDown}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close()
        }}
        aria-label={`${title}: rasmlar`}
      >
        <div className="lightbox__inner">
          <img src={imageSrc(current.url)} alt={current.altText || title} />
          <button type="button" className="lightbox__close" onClick={() => dialog.current?.close()} aria-label="Yopish">
            <CloseIcon size={22} />
          </button>
          {count > 1 ? (
            <>
              <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={prev} aria-label="Oldingi rasm">
                <ChevronLeftIcon size={26} />
              </button>
              <button type="button" className="lightbox__nav lightbox__nav--next" onClick={next} aria-label="Keyingi rasm">
                <ChevronRightIcon size={26} />
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </div>
  )
}
