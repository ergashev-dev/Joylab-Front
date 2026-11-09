/** "Yer uchastka" -> "yer-uchastka". Backend faqat a-z, 0-9 va tireni qabul qiladi. */
export function slugify(text) {
  return text
    .toLocaleLowerCase('uz')
    .replace(/[ʻʼ'`’‘]/g, '')
    .replace(/o‘|oʻ/g, 'o')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
