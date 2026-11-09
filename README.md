# Uyma-uy frontend

React 19 + Vite 8 + React Router 7. UI kutubxonasiz, sof CSS (`src/styles/global.css`).
Backend: `Uyma-uy API: Frontendchilar uchun qo'llanma` (25 endpoint).

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
```

Backend manzili `.env` faylida:

```
VITE_API_URL=https://151-245-137-141.sslip.io
```

Local backend uchun `VITE_API_URL=http://localhost:3000` (oxirida `/` va `/api` bo'lmasin).

## Hozirgi holat (MVP)

| Sahifa | Yo'l | Endpointlar |
| --- | --- | --- |
| Bosh sahifa (gap shaklidagi qidiruv, yangi e'lonlar) | `/` | `GET /properties`, `GET /categories` |
| E'lonlar (filtr, saralash, pagination, URL'da saqlanadi) | `/properties` | `GET /properties`, `GET /categories` |
| E'lon sahifasi (galereya, kontakt, murojaat) | `/properties/:id` | `GET /properties/:id`, `POST /properties/:id/inquiries` |
| Kirish / Ro'yxatdan o'tish | `/login`, `/register` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Saqlanganlar | `/favorites` | `GET/POST/DELETE /favorites` |
| Murojaatlarim | `/inquiries` | `GET /inquiries/my` |
| Admin: boshqaruv, moderatsiya, kategoriyalar, foydalanuvchilar va rollar | `/admin/*` (faqat ADMIN) | `GET /admin/properties`, `PATCH /admin/properties/:id/status`, `GET /admin/users`, `PATCH /admin/users/:id/role`, `POST/PATCH/DELETE /categories` |
| Mening e'lonlarim (holat, tahrirlash, o'chirish) | `/dashboard` | `GET /properties/my`, `DELETE /properties/:id` |
| E'lon joylash / tahrirlash (rasm yuklash bilan) | `/dashboard/new`, `/dashboard/:id/edit` | `POST/PATCH /properties`, `POST/DELETE /properties/:id/images` |

## Keyingi bosqich (hali yo'q)


- Profil tahrirlash: `PATCH /users/me`.

## Birinchi admin

Admin paneli faqat `role = ADMIN` foydalanuvchiga ochiladi, birinchi adminni bazada belgilash kerak:
`UPDATE "User" SET role = 'ADMIN' WHERE email = 'sizning@email.uz';` (yoki Prisma Studio). Keyin `/admin/categories` dan kategoriyalarni qo'shing.

## Muhim eslatmalar

- Token `localStorage`da (`uyma_token`). 401 kelsa sessiya tozalanadi.
- Rasm manzili: `VITE_API_URL + image.url`.
- Narx filtri valyutani ajratmaydi (API'da `currency` parametri yo'q).
- Xaritasiz: API'da koordinata yo'q, faqat `address` va `city`.
