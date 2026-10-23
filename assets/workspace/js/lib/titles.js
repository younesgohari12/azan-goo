/**
 * Local stand-in for conversation title generation.
 *
 * Real title generation belongs to the model and will be wired to the adapter
 * later. Until then these short keyword rules demonstrate the intended
 * behaviour: a conversation starts untitled, gets a meaningful short Persian
 * title once a request is understood, and keeps any title the user typed by
 * hand. The first message is never copied verbatim as the title.
 */
const RULES = [
  [/صفحه|فرود|لندینگ|طرح/, 'صفحهٔ فرود'],
  [/افزونه|پلاگین/, 'افزونه و مدیریت آن'],
  [/فرم|تماس/, 'فرم تماس با ما'],
  [/سرعت|کارایی|بهینه/, 'بهینه‌سازی سرعت سایت'],
  [/گالری|تصویر|عکس/, 'گالری تصاویر'],
  [/فروشگاه|محصول|ووکامرس/, 'فروشگاه و محصولات'],
  [/پشتیبان|بکاپ/, 'پشتیبان‌گیری محتوا'],
  [/منو|ناوبری/, 'منوی سایت'],
  [/رنگ|ظاهر|استایل|قالب/, 'ظاهر و رنگ‌بندی'],
  [/متن|نوشته|مقاله|بلاگ/, 'متن و نوشته‌ها'],
];

const MAX_TITLE_LENGTH = 40;

/** Short Persian title for a request, or the given fallback when nothing matches. */
export function suggestTitle(text, fallback = 'گفت‌وگوی جدید') {
  const value = String(text || '').trim();
  if (!value)
    return fallback;
  const match = RULES.find(([pattern]) => pattern.test(value));
  if (match)
    return match[1];
  const words = value.split(/\s+/).slice(0, 4).join(' ');
  return words.length > MAX_TITLE_LENGTH ? `${words.slice(0, MAX_TITLE_LENGTH).trimEnd()}…` : words;
}
