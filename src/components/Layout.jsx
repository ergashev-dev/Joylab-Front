import { motion, useReducedMotion } from 'framer-motion'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCompareIds } from '../lib/compare'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { initials } from '../lib/format'
import Cursor from '../motion/Cursor'
import { EASE_OUT } from '../motion/ease'
import Magnetic from '../motion/Magnetic'
import { ScrollToTop, SmoothScroll } from '../motion/SmoothScroll'
import { HeartIcon } from './Icons'
import { Spinner } from './States'
import Logo from './Logo'

function UserMenu() {
  const { user, logout } = useAuth()
  const ref = useRef(null)
  const location = useLocation()

  // Sahifa almashganda menyu yopiladi
  useEffect(() => {
    ref.current?.removeAttribute('open')
  }, [location])

  // Menyudan tashqariga bosilganda yopiladi
  useEffect(() => {
    function onDown(e) {
      if (ref.current?.hasAttribute('open') && !ref.current.contains(e.target)) ref.current.removeAttribute('open')
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  return (
    <details className="usermenu" ref={ref}>
      <summary className="usermenu__trigger" aria-label="Profil menyusi">
        <span className="avatar">{initials(user.fullName)}</span>
        <span className="usermenu__name">{user.fullName}</span>
      </summary>
      <div className="usermenu__panel">
        <p className="usermenu__email">{user.email}</p>
        {user.role === 'ADMIN' ? <Link to="/admin">Admin panel</Link> : null}
        <Link to="/dashboard">Mening e'lonlarim</Link>
        <Link to="/dashboard/new">E'lon joylash</Link>
        <Link to="/favorites">Saqlanganlar</Link>
        <Link to="/inquiries">Murojaatlar</Link>
        <button type="button" onClick={logout}>
          Chiqish
        </button>
      </div>
    </details>
  )
}

/** Pastga scroll qilganda header yashirinadi, tepaga qilganda qaytadi. */
function useHeaderState() {
  const [state, setState] = useState({ scrolled: false, hidden: false })
  useEffect(() => {
    let last = window.scrollY
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        const goingDown = y > last + 4
        const goingUp = y < last - 4
        setState((s) => {
          const hidden = y < 120 ? false : goingDown ? true : goingUp ? false : s.hidden
          const scrolled = y > 8
          return hidden === s.hidden && scrolled === s.scrolled ? s : { hidden, scrolled }
        })
        last = y
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  return state
}

function Header() {
  const { user, ready } = useAuth()
  const { ids } = useFavorites()
  const compareIds = useCompareIds()
  const { scrolled, hidden } = useHeaderState()

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''}`}>
      <div className="container header__row">
        <Logo />
        <nav className="header__nav" aria-label="Asosiy menyu">
          <NavLink to="/properties" end={false}>
            E'lonlar
          </NavLink>
          {compareIds.length > 0 ? (
            <NavLink to="/compare" className="header__fav">
              <span>Taqqoslash</span>
              <span className="count">{compareIds.length}</span>
            </NavLink>
          ) : null}
          <NavLink to="/favorites" className="header__fav">
            <HeartIcon size={18} />
            <span>Saqlanganlar</span>
            {ids.size > 0 ? <span className="count">{ids.size}</span> : null}
          </NavLink>
        </nav>
        <div className="header__auth">
          <Magnetic className="header__post-wrap">
            <Link to="/dashboard/new" className="btn btn--accent btn--sm header__post">
              E'lon joylash
            </Link>
          </Magnetic>
          {!ready ? null : user ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Kirish
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Ro'yxatdan o'tish
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />
      <div className="container footer__row">
        <Logo />
        <p>Kvartira, hovli, ofis va yer uchastkalari. Sotuv va ijara.</p>
        <p className="footer__copy">© {new Date().getFullYear()} Uyma-uy</p>
      </div>
    </footer>
  )
}

/** Tile'larda sichqoncha holatini CSS o'zgaruvchilariga yozadi (yorug'lik va parallax uchun). */
function usePointerVars() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return undefined
    let raf = 0
    const onMove = (e) => {
      const tile = e.target.closest?.('[data-spotlight]')
      if (!tile) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = tile.getBoundingClientRect()
        tile.style.setProperty('--mx', `${e.clientX - r.left}px`)
        tile.style.setProperty('--my', `${e.clientY - r.top}px`)
        tile.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5) * 2)
        tile.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5) * 2)
      })
    }
    const onOut = (e) => {
      const tile = e.target.closest?.('[data-spotlight]')
      if (tile && !tile.contains(e.relatedTarget)) {
        tile.style.setProperty('--px', 0)
        tile.style.setProperty('--py', 0)
      }
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [])
}

export default function Layout() {
  const location = useLocation()
  const reduce = useReducedMotion()
  usePointerVars()

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Asosiy mazmunga o'tish
      </a>
      <SmoothScroll />
      <ScrollToTop />
      <Cursor />
      <div className="backdrop" aria-hidden="true">
        <span className="backdrop__blob backdrop__blob--a" />
        <span className="backdrop__blob backdrop__blob--b" />
      </div>
      <Header />
      {/* Faqat kirish animatsiyasi: eski sahifa kutilmaydi, shuning uchun navigatsiya tez qoladi */}
      <motion.main
        id="main"
        key={location.pathname}
        className="shell__main"
        initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none', transform: 'none' } }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </motion.main>
      <Footer />
    </div>
  )
}
