# Uyma-uy: yaxshilash g'oyalari (backend + UI/UX)

Manba: `ergashev-dev/MarketPlace---system` repo kodini o'qish va frontend qurish tajribasi.
Belgilar: **[fakt]** kodda ko'rilgan, **[taxmin]** tekshirilmagan, **[fikr]** mening tavsiyam.
Tavsiyalar ustuvorlik tartibida: avval ishlamaydigan narsalar, keyin MVP uchun kerakli, oxirida "bo'lsa yaxshi".

---

## A. Backend: avval tuzatish kerak (xato va bo'shliqlar)

### A1. Inquiries controller'dagi xato (eng birinchi)
**[fakt]** `inquiries.controller.ts` da `@UseGuards()` bo'sh, `@Param()` esa kalitsiz ishlatilgan.
**[taxmin]** Deploy qilingan serverda `POST /properties/:id/inquiries` va `GET /inquiries/my` 500 qaytarishi mumkin (login qilingan holatda tekshirib ko'rish kerak, men akkaunt yarata olmadim).

Tuzatish:
```ts
@UseGuards(JwtAuthGuard)              // bo'sh emas
...
create(@Param('propertyId', ParseIntPipe) propertyId: number, ...)   // kalit va pipe
```
Shuningdek e'lon egasi o'ziga murojaat yubora olmasligi kerak (400).

### A2. Baza bo'sh: seed skripti yo'q
**[fakt]** Kategoriyalarni faqat admin yarata oladi, admin esa yo'q. Natijada sayt ochilganda e'lon joylab bo'lmaydi.
**[fikr]** `prisma/seed.ts`: 4 ta kategoriya (Kvartira, Hovli, Ofis, Yer uchastka), bitta admin (parol `.env` dan), ixtiyoriy 10 ta demo e'lon. `package.json` da `prisma.seed` ni ulang.

### A3. Moderatsiyani aylanib o'tish: rasm
**[fakt]** E'lon tahrirlansa PENDING ga qaytadi, lekin rasm qo'shish/o'chirish statusga tegmaydi.
Tasdiqlangan e'longa keyin boshqa rasm qo'yib, moderatsiyadan o'tib ketish mumkin. Rasm o'zgarsa ham status PENDING bo'lsin.

### A4. Rad etish sababi yo'q
**[fakt]** `REJECTED` bor, sabab maydoni yo'q. Sotuvchi nima tuzatishni bilmaydi.
`Property.rejectReason String?` qo'shing; admin rad etganda majburiy. Frontend `Dashboard` da allaqachon rad etilgan e'lonlar uchun joy tayyor, faqat maydonni ko'rsatish qoladi.

### A5. Token 1 soat, refresh yo'q
**[fakt]** JWT 1 soat. E'lon formasini 10 daqiqa to'ldirib, rasm yuklashda 401 olish mumkin, ma'lumot yo'qoladi.
Variant: refresh token (httpOnly cookie) yoki kamida muddatni 1 kunga uzaytirish. **[fikr]** MVP uchun 1 kun yetadi, refresh keyin.

### A6. Xavfsizlik
- `enableCors()` hamma originga ochiq **[fakt]**. Productionda faqat frontend domeniga cheklang.
- Rate limit yo'q: `@nestjs/throttler` bilan kamida `/auth/login`, `/auth/register`, inquiries'ga.
- Yuklangan fayl turi faqat MIME bo'yicha tekshirilsa, soxta fayl o'tadi **[taxmin]**. Magic bytes tekshiruvi (`file-type` paketi) qo'shing.
- Rasmlar server diskida `/uploads` da. Deploy qayta ishga tushsa yo'qolishi mumkin (hosting turiga bog'liq). Production uchun S3-mos saqlash (Cloudflare R2, Backblaze) tavsiya.

---

## B. Backend: MVP'ni to'ldiradigan imkoniyatlar

| # | G'oya | Nega kerak | Hajmi |
|---|-------|-----------|-------|
| B1 | `q` bo'yicha matnli qidiruv (title, description, address) | Foydalanuvchilar "Chilonzor" deb yozadi, hozir faqat `city` bor | kichik |
| B2 | Narx filtri `currency` bilan | **[fakt]** hozir 50 000 USD va 50 000 so'm bir xil solishtiriladi, filtr noto'g'ri natija beradi | kichik |
| B3 | Sotuvchi uchun kelgan murojaatlar: `GET /properties/:id/inquiries` va `GET /inquiries/received` | Hozir murojaat faqat yuboruvchiga ko'rinadi; sotuvchi (e'lon egasi) ularni ko'ra olmaydi **[fakt]**. Bu platformaning asosiy vazifasi | o'rta |
| B4 | Murojaatga `readAt` va status | Sotuvchi o'qilmaganlarni ko'radi | kichik |
| B5 | Status `SOLD` / `RENTED` (yoki `isActive`) | Sotilgan e'lon faol bo'lib qolmasin; o'chirmasdan arxivlash | kichik |
| B6 | `viewCount`, ro'yxatda `favoritesCount` | Sotuvchiga "e'loningiz 120 marta ko'rildi" statistikasi | kichik |
| B7 | `GET /properties/:id/similar` (bir shahar + kategoriya + narx ±30%) | Detail sahifada "O'xshash e'lonlar" | kichik |
| B8 | `lat`, `lng` maydonlari | **[fakt]** koordinata yo'q, shuning uchun xarita qilib bo'lmaydi. Xarita ko'chmas mulkda eng kutiladigan funksiya | o'rta |
| B9 | Rasm tartibi (`PATCH .../images/reorder`) va asosiy rasmni tanlash | Hozir birinchi yuklangan rasm kartochkada chiqadi; sotuvchi o'zgartira olmaydi | kichik |
| B10 | Ro'yxatda 1 emas, 3 tagacha rasm | Kartochkada slayder uchun | kichik |
| B11 | `PATCH /users/me` va parolni almashtirish | **[fakt]** repoda bor, frontendda hali yo'q (men qo'shaman) | kichik |
| B12 | E'lon muddati (masalan 60 kun) va "yangilash" tugmasi | Eskirgan e'lonlar saytni "o'lik" ko'rsatadi | o'rta |
| B13 | Swagger (`@nestjs/swagger`) | PDF qo'llanma qo'lda yoziladi va eskiradi; Swagger kodga yopishgan holda doim yangi | kichik |
| B14 | Admin uchun `GET /admin/properties?status=PENDING` sahifalash bilan | Moderatsiya navbati | kichik |

**[fikr]** Eng katta foyda/mehnat nisbati: A1, A2, B3, B2, B1. Shulardan keyin sayt haqiqiy foydalanishga yaroqli bo'ladi.

---

## C. UI/UX g'oyalari

### C1. Hozir qilsa bo'ladi (backendsiz)
1. **Bosh sahifada "E'lon joylash" bandi**: sotuvchilarni jalb qilish uchun alohida blok (qilinmagan).
2. **Formani qoralama sifatida saqlash**: `localStorage` da, sahifani yopib qaytsa ma'lumot yo'qolmasin (token muddati tugashiga qarshi himoya ham).
3. **Rasmlarni yuklashdan oldin siqish**: brauzerda `canvas` bilan 1600px gacha kichraytirish. 5 MB chegarasi telefon rasmlarida tez-tez buziladi; siqilgach yuklash tezlashadi.
4. **Rasmlarni sudrab tartiblash** (drag-and-drop): B9 bilan birga.
5. **Narxni yozayotganda bo'shliq bilan ajratish** (`85 000`), maydonni so'm/m² narxini avtomatik ko'rsatish.
6. **Saralash**: ro'yxatda "Eng arzon", "Eng yangi" bor; "Maydon bo'yicha" va "Narx m² bo'yicha" qo'shish.
7. **Qidiruv natijasidagi filtrlarni chip sifatida ko'rsatish** (ustida, bitta bosib o'chiriladigan). Hozir yon panelga qarab bilish kerak.
8. **Skeleton va bo'sh holatlar** allaqachon bor; xato xabarlari endi ham aniq (400 xabar massivi ko'rsatiladi).
9. **Klaviatura va ekran o'quvchi**: asosiy oqimlar tekshirilgan, lekin to'liq audit (kontrast, fokus tartibi) qilinmagan.

### C2. Backend o'zgarishi kerak
1. **Xarita ko'rinishi** (B8): ro'yxat bilan xarita yonma-yon, "shu hududda qidirish". Leaflet + OpenStreetMap bepul.
2. **Taqqoslash**: 2–3 e'lonni jadvalda yonma-yon (maydon, narx/m², xonalar). Frontendda localStorage bilan boshlasa bo'ladi.
3. **Saqlangan qidiruvlar** va yangi e'lon chiqsa xabar (Telegram bot juda mos: O'zbekistonda foydalanuvchilar Telegramda).
4. **Sotuvchi paneli statistikasi**: ko'rishlar, saqlashlar, murojaatlar (B3, B6).
5. **"Sotildi" belgisi** (B5): e'lon o'chirilmaydi, kulrang nishon bilan qoladi.
6. **Telefon raqamini bosib qo'ng'iroq / Telegram'da yozish tugmasi**: murojaat formasi bilan yonma-yon. O'zbek bozori uchun telefon odatda murojaatdan muhimroq.

### C3. Mahalliylashtirish
- **Uz/Ru til almashtirgich**. Toshkent bozorida ruscha so'rovlar katta ulush. Hozir matnlar to'g'ridan-to'g'ri JSX ichida; i18n qo'shishdan oldin matnlarni bitta lug'atga chiqarish kerak (1–2 soatlik ish).
- **Lotin/Kirill**: kerak bo'lmasligi mumkin, foydalanuvchilarni so'rab bilish kerak.
- Sana, narx formatlari allaqachon `uz` bo'yicha.

### C4. Ishonch va moderatsiya
- E'lon sahifasida "Tasdiqlangan sotuvchi" belgisi (telefon tasdiqlangan bo'lsa), spamga qarshi (SMS kod, Eskiz.uz).
- "Shikoyat qilish" tugmasi (B-ro'yxatga: `Report` jadvali).

---

## D. Tavsiya etilgan tartib

1. **Hafta 1 (backend)**: A1, A2, B13. Shundan keyin real API bilan to'liq sinab ko'raman (hozir faqat mock bilan sinalgan).
2. **Hafta 2**: B3 + B4 (sotuvchi murojaatlari), B2 (valyuta filtri), B1 (`q` qidiruv). Frontendda sotuvchi inbox sahifasi.
3. **Hafta 3**: A3–A6, B5, B11. Frontend: admin panel (moderatsiya, kategoriyalar), profil.
4. **Keyin**: B8 + xarita, C3 til, Telegram bot.

**Scope haqida ogohlantirish**: taqqoslash, saqlangan qidiruv, bot, statistika, ikki til birdaniga qilinsa MVP kechikadi. [fikr] Avval A + B3 bilan haqiqiy foydalanuvchilarga chiqing, qaysi biri kerakligini ular ko'rsatadi.

---

## Eslatma
Repoga o'zgarish kiritolmadim (faqat o'qish huquqi bor). Xohlasangiz, A1, A2 (seed) va B2 uchun aniq kod tuzatishlarini patch sifatida tayyorlab beraman.
