import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { errorText } from '../api/client'
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckIcon,
  CloseIcon,
  HomeIcon,
  LandIcon,
  MinusIcon,
  PinIcon,
  PlusIcon,
} from '../components/Icons'
import Placeholder from '../components/Placeholder'
import Select from '../components/Select'
import { BackLink, EmptyState, ErrorState, Spinner } from '../components/States'
import { CITY_SUGGESTIONS, CURRENCIES, LISTING_TYPES, MAX_IMAGES } from '../config'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { useCategories } from '../hooks/useCategories'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatNumber, formatPrice, imageSrc } from '../lib/format'
import {
  EMPTY_FORM,
  buildBody,
  changedFields,
  checkImageFiles,
  clearDraft,
  firstInvalidStep,
  formFromProperty,
  loadDraft,
  saveDraft,
  suggestTitle,
  toNumber,
  validateStep,
} from '../lib/propertyForm'
import { EASE_OUT } from '../motion/ease'

let pendingId = 1

const STEPS = [
  { key: 'type', label: 'Turi', title: "Nima e'lon qilmoqchisiz?", lead: "E'lon turi va kategoriyani tanlang." },
  { key: 'place', label: 'Joylashuv', title: 'Qayerda joylashgan?', lead: "Xaridor qidiruvda shahar bo'yicha topadi. Manzilni aniq yozing." },
  { key: 'specs', label: 'Xususiyatlar', title: 'Necha xona, qancha maydon?', lead: "Bu raqamlar kartochkada ko'rinadi va filtrda ishlatiladi." },
  { key: 'price', label: 'Narx va tavsif', title: 'Narx va tavsif', lead: "Aniq narx va batafsil tavsif ko'proq murojaat olib keladi." },
  { key: 'photos', label: 'Rasmlar', title: "Rasmlar qo'shing", lead: "Rasmli e'lonlar ko'proq ko'riladi. Birinchi rasm kartochkada chiqadi." },
  { key: 'review', label: "Ko'rib chiqish", title: "Hammasi to'g'rimi?", lead: "E'lon saytda shunday ko'rinadi. Kerak bo'lsa bo'limni o'zgartiring." },
]

function categoryIcon(slug = '') {
  if (/kvartira|apart/.test(slug)) return BuildingIcon
  if (/ofis|office|tijorat/.test(slug)) return BriefcaseIcon
  if (/yer|uchast|land/.test(slug)) return LandIcon
  return HomeIcon
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-err`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

/** Butun son uchun −/+ tugmali maydon. */
function Counter({ id, label, value, onChange, min = 0, max = 50, error, icon: Icon }) {
  const n = Number(value)
  const valid = /^\d+$/.test(String(value))
  // Bo'sh maydonda birinchi bosish minimal qiymatni qo'yadi
  const step = (d) => onChange(String(valid ? Math.min(max, Math.max(min, n + d)) : min))
  return (
    <div className={`field counter ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {Icon ? <Icon size={18} /> : null}
        {label}
      </label>
      <div className="counter__box">
        <button type="button" className="counter__btn" onClick={() => step(-1)} disabled={valid && n <= min} aria-label={`${label}: kamaytirish`}>
          <MinusIcon size={18} />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button type="button" className="counter__btn" onClick={() => step(1)} disabled={valid && n >= max} aria-label={`${label}: oshirish`}>
          <PlusIcon size={18} />
        </button>
      </div>
      {error ? (
        <p className="field__error" id={`${id}-err`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Stepper({ step, reached, onJump }) {
  const pct = (step / (STEPS.length - 1)) * 100
  return (
    <nav className="wizard__steps" aria-label="E'lon joylash qadamlari">
      <div className="wizard__track" aria-hidden="true">
        <motion.span className="wizard__fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE_OUT }} />
      </div>
      <ol>
        {STEPS.map((s, i) => {
          const state = i === step ? 'current' : i < step || i <= reached ? 'done' : 'todo'
          const can = i <= reached && i !== step
          return (
            <li key={s.key} className={`wizard__step is-${state}`}>
              <button type="button" onClick={() => onJump(i)} disabled={!can} aria-current={i === step ? 'step' : undefined}>
                <span className="wizard__dot">{i < step || (i <= reached && i !== step) ? <CheckIcon size={14} /> : i + 1}</span>
                <span className="wizard__label">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="wizard__count">
        {step + 1}-qadam, jami {STEPS.length}
      </p>
    </nav>
  )
}

function ReviewRow({ label, children, onEdit }) {
  return (
    <div className="revrow">
      <dt>{label}</dt>
      <dd>{children}</dd>
      <button type="button" className="revrow__edit" onClick={onEdit}>
        O'zgartirish
      </button>
    </div>
  )
}

function EditorForm({ property }) {
  const isEdit = Boolean(property)
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  const { push } = useToast()
  const { categories, loading: catsLoading } = useCategories()

  const uploadFailed = location.state?.uploadFailed
  const [draftRestored] = useState(() => (!isEdit ? loadDraft() : null))
  const [form, setForm] = useState(() => (property ? formFromProperty(property) : draftRestored || EMPTY_FORM))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [images, setImages] = useState(property?.images || [])
  const [pending, setPending] = useState([])
  const [fileProblems, setFileProblems] = useState([])
  const [confirmImage, setConfirmImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  // Tahrirlashda barcha qadamlar ochiq; rasm yuklanmagan bo'lsa to'g'ridan-to'g'ri rasmlar qadamiga
  const [step, setStep] = useState(uploadFailed ? 4 : 0)
  const [reached, setReached] = useState(isEdit ? STEPS.length - 1 : 0)
  const [dir, setDir] = useState(1)
  const [showDraftNote, setShowDraftNote] = useState(Boolean(draftRestored))
  const pendingRef = useRef(pending)
  const headRef = useRef(null)
  pendingRef.current = pending

  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  // Yangi e'lon qoralamasi avtomatik saqlanadi (rasmlarsiz)
  useEffect(() => {
    if (!isEdit) saveDraft(form)
  }, [form, isEdit])

  const slotsLeft = MAX_IMAGES - images.length - pending.length
  const category = categories.find((c) => String(c.id) === String(form.categoryId))
  const titleSuggestion = suggestTitle(form, category?.name)
  const pricePerM2 = toNumber(form.price) > 0 && toNumber(form.area) > 0 ? Math.round(toNumber(form.price) / toNumber(form.area)) : null

  const setValue = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }
  const set = (key) => (e) => setValue(key, e.target.value)

  function goTo(next) {
    setDir(next > step ? 1 : -1)
    setStep(next)
    setErrors({})
    setFormError('')
    setReached((r) => Math.max(r, next))
    // Sarlavha ko'rinsin va fokus yangi qadamga o'tsin
    requestAnimationFrame(() => {
      headRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
      setTimeout(() => headRef.current?.querySelector('h2')?.focus({ preventScroll: true }), reduce ? 0 : 380)
    })
  }

  function next() {
    const found = validateStep(form, step)
    if (Object.keys(found).length) {
      setErrors(found)
      setTimeout(() => document.querySelector('.wizard [aria-invalid="true"]')?.focus(), 0)
      return
    }
    goTo(step + 1)
  }

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (picked.length === 0) return
    const { ok, problems } = checkImageFiles(picked)
    const accepted = ok.slice(0, Math.max(slotsLeft, 0))
    if (ok.length > accepted.length) problems.push(`Ko'pi bilan ${MAX_IMAGES} ta rasm yuklash mumkin.`)
    setFileProblems(problems)
    setPending((list) => [...list, ...accepted.map((file) => ({ id: pendingId++, file, url: URL.createObjectURL(file) }))])
  }

  function onDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove('is-drag')
    onPickFiles({ target: { files: e.dataTransfer.files, value: '' } })
  }

  function removePending(id) {
    setPending((list) => {
      const item = list.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return list.filter((p) => p.id !== id)
    })
  }

  async function removeExisting(image) {
    try {
      await api.deleteImage(property.id, image.id)
      setImages((list) => list.filter((i) => i.id !== image.id))
      setConfirmImage(null)
      push("Rasm o'chirildi", 'success')
    } catch (err) {
      push(errorText(err), 'error')
    }
  }

  async function submit() {
    setFormError('')
    const bad = firstInvalidStep(form)
    if (bad >= 0) {
      goTo(bad)
      setTimeout(() => setErrors(validateStep(form, bad)), 0)
      return
    }

    setSubmitting(true)
    let id = property?.id
    let contentChanged = !isEdit
    try {
      const body = buildBody(form)
      if (!isEdit) {
        const created = await api.createProperty(body)
        id = created.id
      } else {
        const diff = changedFields(body, property)
        if (Object.keys(diff).length > 0) {
          await api.updateProperty(id, diff)
          contentChanged = true
        }
      }
    } catch (err) {
      setFormError(errorText(err))
      setSubmitting(false)
      return
    }
    if (!isEdit) clearDraft()

    // Rasmlar ketma-ket yuboriladi: birinchi yuklangani kartochkada ko'rinadi
    let failed = 0
    let lastError = null
    for (let i = 0; i < pending.length; i++) {
      setProgress(`Rasm yuklanmoqda: ${i + 1} / ${pending.length}`)
      try {
        await api.uploadImage(id, pending[i].file)
      } catch (err) {
        failed++
        lastError = err
      }
    }

    setSubmitting(false)
    setProgress('')

    if (failed > 0) {
      push(`${failed} ta rasm yuklanmadi: ${errorText(lastError)}`, 'error')
      navigate(`/dashboard/${id}/edit`, { replace: true, state: { uploadFailed: failed } })
      return
    }

    if (!isEdit) push("E'lon yuborildi. Moderator tasdiqlagach saytda ko'rinadi.", 'success')
    else if (contentChanged) push("E'lon saqlandi. Qayta tekshiruvdan o'tgach yana ko'rinadi.", 'success')
    else push('Rasmlar yangilandi', 'success')
    navigate('/dashboard')
  }

  function resetDraft() {
    clearDraft()
    setForm(EMPTY_FORM)
    setShowDraftNote(false)
    goTo(0)
    setReached(0)
  }

  const onFormKeyDown = (e) => {
    // Enter matn maydonida keyingi qadamga o'tkazadi (textarea'da emas)
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file' && step < STEPS.length - 1) {
      e.preventDefault()
      next()
    }
  }

  const noCategories = !catsLoading && categories.length === 0
  const firstPhoto = images[0] ? imageSrc(images[0].url) : pending[0]?.url
  const S = STEPS[step]

  return (
    <div className="container formpage wizard">
      <BackLink to="/dashboard">Mening e'lonlarim</BackLink>
      <h1 className="page__title">{isEdit ? "E'lonni tahrirlash" : "E'lon joylash"}</h1>

      {isEdit ? (
        <p className="notice notice--warn">
          Matn, narx yoki boshqa ma'lumot o'zgarsa, e'lon qayta moderatsiyaga yuboriladi va tasdiqlanguncha saytda ko'rinmaydi.
        </p>
      ) : null}
      {uploadFailed ? (
        <p className="notice notice--error" role="alert">
          E'lon saqlandi, lekin {uploadFailed} ta rasm yuklanmadi. Rasmlarni qayta tanlang.
        </p>
      ) : null}
      {showDraftNote ? (
        <p className="notice draftnote">
          Oldingi qoralamangiz tiklandi.
          <button type="button" className="link" onClick={resetDraft}>
            Boshidan boshlash
          </button>
        </p>
      ) : null}

      <Stepper step={step} reached={reached} onJump={goTo} />

      <form className="wizard__card" onSubmit={(e) => e.preventDefault()} onKeyDown={onFormKeyDown} noValidate>
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section
            key={S.key}
            className="wizard__pane"
            custom={dir}
            initial={reduce ? false : { opacity: 0, x: dir * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -48 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
          >
            <header className="wizard__head" ref={headRef}>
              <h2 tabIndex={-1}>{S.title}</h2>
              <p className="muted">{S.lead}</p>
            </header>

            {step === 0 ? (
              <>
                <fieldset className="field fieldset">
                  <legend>E'lon turi</legend>
                  <div className="typecards" role="radiogroup">
                    {[
                      ['SALE', 'Sotuv', 'Mulkni sotmoqchiman'],
                      ['RENT', 'Ijara', 'Ijaraga bermoqchiman'],
                    ].map(([value, label, sub]) => (
                      <label key={value} className={`typecard ${form.listingType === value ? 'is-checked' : ''}`}>
                        <input type="radio" name="listingType" value={value} checked={form.listingType === value} onChange={set('listingType')} />
                        <span className="typecard__title">{label}</span>
                        <span className="typecard__sub">{sub}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className={`field fieldset ${errors.categoryId ? 'has-error' : ''}`}>
                  <legend>Kategoriya</legend>
                  {noCategories ? (
                    <p className="notice">Kategoriyalar hali yaratilmagan. Administrator kategoriya qo'shishi kerak.</p>
                  ) : (
                    <div className="catcards" role="radiogroup" aria-describedby={errors.categoryId ? 'p-category-err' : undefined}>
                      {categories.map((c, i) => {
                        const Icon = categoryIcon(c.slug)
                        const checked = String(form.categoryId) === String(c.id)
                        return (
                          <label key={c.id} className={`catcard ${checked ? 'is-checked' : ''}`}>
                            <input
                              type="radio"
                              name="categoryId"
                              value={c.id}
                              id={i === 0 ? 'p-category' : undefined}
                              checked={checked}
                              onChange={() => setValue('categoryId', String(c.id))}
                              aria-invalid={i === 0 && errors.categoryId ? true : undefined}
                            />
                            <span className="catcard__icon">
                              <Icon size={28} />
                            </span>
                            <span className="catcard__name">{c.name}</span>
                            <span className="catcard__check" aria-hidden="true">
                              <CheckIcon size={14} />
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {errors.categoryId ? (
                    <p className="field__error" id="p-category-err">
                      {errors.categoryId}
                    </p>
                  ) : null}
                </fieldset>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Field id="p-city" label="Shahar" error={errors.city}>
                  <input
                    id="p-city"
                    type="text"
                    list="p-cities"
                    autoComplete="off"
                    value={form.city}
                    onChange={set('city')}
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? 'p-city-err' : undefined}
                  />
                  <datalist id="p-cities">
                    {CITY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <div className="quickcities" aria-label="Tez tanlash">
                  {CITY_SUGGESTIONS.slice(0, 6).map((c) => (
                    <button key={c} type="button" className={`qchip ${form.city === c ? 'is-on' : ''}`} onClick={() => setValue('city', c)}>
                      {c}
                    </button>
                  ))}
                </div>
                <Field id="p-address" label="Manzil" error={errors.address} hint="Tuman, ko'cha yoki mavze va uy raqami.">
                  <input
                    id="p-address"
                    type="text"
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Chilonzor 9-kvartal, 12-uy"
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={errors.address ? 'p-address-err' : undefined}
                  />
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Field id="p-area" label="Umumiy maydon, m²" error={errors.area}>
                  <div className="suffix">
                    <input
                      id="p-area"
                      type="text"
                      inputMode="decimal"
                      value={form.area}
                      onChange={set('area')}
                      placeholder="72,5"
                      aria-invalid={Boolean(errors.area)}
                      aria-describedby={errors.area ? 'p-area-err' : undefined}
                    />
                    <span aria-hidden="true">m²</span>
                  </div>
                </Field>
                <div className="editor__row">
                  <Counter id="p-rooms" label="Xonalar" icon={BedIcon} value={form.rooms} min={1} onChange={(v) => setValue('rooms', v)} error={errors.rooms} />
                  <Counter id="p-bathrooms" label="Hammomlar" icon={BathIcon} value={form.bathrooms} min={0} onChange={(v) => setValue('bathrooms', v)} error={errors.bathrooms} />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="editor__row editor__row--price">
                  <Field id="p-price" label="Narx" error={errors.price} hint={pricePerM2 ? `1 m² uchun taxminan ${formatPrice(pricePerM2, form.currency)}` : undefined}>
                    <input
                      id="p-price"
                      type="text"
                      inputMode="decimal"
                      value={form.price}
                      onChange={set('price')}
                      placeholder="85000"
                      aria-invalid={Boolean(errors.price)}
                      aria-describedby={errors.price ? 'p-price-err' : undefined}
                    />
                  </Field>
                  <Field id="p-currency" label="Valyuta">
                    <Select id="p-currency" value={form.currency} onChange={(v) => setValue('currency', v)} options={CURRENCIES} minWidth={150} />
                  </Field>
                </div>

                <Field id="p-title" label="Sarlavha" error={errors.title} hint="5–150 belgi. Qisqa va aniq bo'lsin.">
                  <input
                    id="p-title"
                    type="text"
                    value={form.title}
                    onChange={set('title')}
                    maxLength={150}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? 'p-title-err' : undefined}
                  />
                </Field>
                {titleSuggestion && titleSuggestion !== form.title ? (
                  <button type="button" className="suggest" onClick={() => setValue('title', titleSuggestion)}>
                    <span className="suggest__label">Taklif:</span> {titleSuggestion}
                  </button>
                ) : null}

                <Field id="p-description" label="Tavsif" error={errors.description}>
                  <textarea
                    id="p-description"
                    rows={6}
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Ta'mir holati, jihozlar, qavat, atrofdagi maktab, bozor, metro..."
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? 'p-description-err' : 'p-description-count'}
                  />
                  <span className={`field__count ${form.description.trim().length >= 20 ? 'is-ok' : ''}`} id="p-description-count">
                    {form.description.trim().length < 20 ? `Yana kamida ${20 - form.description.trim().length} belgi` : `${form.description.trim().length} belgi`}
                  </span>
                </Field>
              </>
            ) : null}

            {step === 4 ? (
              <>
                {images.length > 0 || pending.length > 0 ? (
                  <ul className="photos">
                    {images.map((img, i) => (
                      <li key={`i${img.id}`} className="photo">
                        <img src={imageSrc(img.url)} alt={`${i + 1}-rasm`} />
                        {i === 0 ? <span className="photo__main">Asosiy</span> : null}
                        {confirmImage === img.id ? (
                          <span className="photo__confirm">
                            <button type="button" onClick={() => removeExisting(img)}>
                              O'chirish
                            </button>
                            <button type="button" onClick={() => setConfirmImage(null)}>
                              Yo'q
                            </button>
                          </span>
                        ) : (
                          <button type="button" className="photo__remove" onClick={() => setConfirmImage(img.id)} aria-label={`${i + 1}-rasmni o'chirish`}>
                            <CloseIcon size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                    {pending.map((p, i) => (
                      <li key={`p${p.id}`} className="photo photo--new">
                        <img src={p.url} alt={`Yangi rasm ${i + 1}`} />
                        {images.length === 0 && i === 0 ? <span className="photo__main">Asosiy</span> : null}
                        <span className="photo__new">Yangi</span>
                        <button type="button" className="photo__remove" onClick={() => removePending(p.id)} aria-label="Rasmni olib tashlash">
                          <CloseIcon size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {slotsLeft > 0 ? (
                  <label
                    className="upload"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('is-drag')
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('is-drag')}
                    onDrop={onDrop}
                  >
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPickFiles} disabled={submitting} />
                    <span className="upload__icon" aria-hidden="true">
                      <PlusIcon size={26} />
                    </span>
                    <span className="upload__title">Rasm tanlang yoki shu yerga tashlang</span>
                    <span className="upload__hint">
                      jpg, png yoki webp, har biri 5 MB gacha. Yana {slotsLeft} ta qo'shish mumkin.
                    </span>
                  </label>
                ) : null}

                {fileProblems.length > 0 ? (
                  <ul className="problems" role="alert">
                    {fileProblems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : null}
                {images.length + pending.length === 0 ? <p className="field__hint">Rasm majburiy emas, lekin rasmsiz e'lonlar kam ko'riladi.</p> : null}
              </>
            ) : null}

            {step === 5 ? (
              <div className="review5">
                <article className="preview">
                  <div className="preview__media">{firstPhoto ? <img src={firstPhoto} alt="" /> : <Placeholder label="Rasm yo'q" />}</div>
                  <span className={`badge badge--${form.listingType === 'RENT' ? 'rent' : 'sale'}`}>{LISTING_TYPES[form.listingType]}</span>
                  <div className="preview__body">
                    <span className="card__price">{formatPrice(toNumber(form.price), form.currency)}</span>
                    <h3 className="card__title">{form.title}</h3>
                    <span className="card__facts">
                      <span>
                        <BedIcon size={16} /> {form.rooms}
                      </span>
                      <span>
                        <BathIcon size={16} /> {form.bathrooms}
                      </span>
                      <span>
                        <AreaIcon size={16} /> {formatNumber(toNumber(form.area))} m²
                      </span>
                    </span>
                    <span className="card__place">
                      <PinIcon size={15} /> {form.city}
                      {category ? <span className="card__cat">{category.name}</span> : null}
                    </span>
                  </div>
                </article>

                <dl className="revlist">
                  <ReviewRow label="Turi" onEdit={() => goTo(0)}>
                    {LISTING_TYPES[form.listingType]}, {category?.name || '—'}
                  </ReviewRow>
                  <ReviewRow label="Manzil" onEdit={() => goTo(1)}>
                    {form.city}, {form.address}
                  </ReviewRow>
                  <ReviewRow label="Xususiyat" onEdit={() => goTo(2)}>
                    {formatNumber(toNumber(form.area))} m², {form.rooms} xona, {form.bathrooms} hammom
                  </ReviewRow>
                  <ReviewRow label="Narx" onEdit={() => goTo(3)}>
                    {formatPrice(toNumber(form.price), form.currency)}
                  </ReviewRow>
                  <ReviewRow label="Tavsif" onEdit={() => goTo(3)}>
                    <span className="revrow__desc">{form.description}</span>
                  </ReviewRow>
                  <ReviewRow label="Rasmlar" onEdit={() => goTo(4)}>
                    {images.length + pending.length} ta
                  </ReviewRow>
                </dl>
                {!isEdit ? <p className="muted">Yuborilgach moderator tekshiradi. Tasdiqlangach saytda ko'rinadi.</p> : null}
              </div>
            ) : null}
          </motion.section>
        </AnimatePresence>

        {formError ? (
          <p className="form-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="wizard__nav">
          {step > 0 ? (
            <button type="button" className="btn btn--ghost btn--lg" onClick={() => goTo(step - 1)} disabled={submitting}>
              Orqaga
            </button>
          ) : (
            <Link to="/dashboard" className="btn btn--ghost btn--lg">
              Bekor qilish
            </Link>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn--primary btn--lg wizard__next" onClick={next}>
              Davom etish
            </button>
          ) : (
            <button type="button" className="btn btn--accent btn--lg wizard__next" onClick={submit} disabled={submitting}>
              {submitting ? progress || 'Saqlanmoqda…' : isEdit ? 'Saqlash' : "E'lonni yuborish"}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default function PropertyEditor() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  usePageTitle(isEdit ? "E'lonni tahrirlash" : "E'lon joylash")

  // GET /properties/:id faqat APPROVED e'lonni beradi, shuning uchun tahrirlash ma'lumotini /properties/my dan olamiz
  const { data, error, loading, reload } = useAsync((signal) => (isEdit ? api.myProperties(signal) : Promise.resolve(null)), [id])
  const property = useMemo(() => (isEdit && Array.isArray(data) ? data.find((p) => String(p.id) === String(id)) : null), [data, id, isEdit])

  if (!isEdit) return <EditorForm key="new" />
  if (loading) return <Spinner />
  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }
  if (!property) {
    return (
      <div className="container">
        <EmptyState
          title="E'lon topilmadi"
          text="U o'chirilgan yoki sizga tegishli emas."
          action={
            <Link className="btn btn--primary" to="/dashboard">
              Mening e'lonlarim
            </Link>
          }
        />
      </div>
    )
  }
  return <EditorForm key={`${property.id}-${property.images?.length || 0}`} property={property} />
}
