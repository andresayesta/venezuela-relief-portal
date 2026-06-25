import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './i18n';

// Server helper — reads the locale cookie. Next 16 makes cookies() and
// headers() async. If no cookie has been set yet (first visit), falls back
// to the browser's Accept-Language preference so visitors land on a
// reasonable default. Once the user toggles, the cookie wins.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;

  const hdrs = await headers();
  const acceptLang = hdrs.get('accept-language') ?? '';
  // Accept-Language looks like "en-US,en;q=0.9,es;q=0.8". Take the highest-
  // ranked tag (first one) and reduce to its base language.
  const first = acceptLang.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
  if (first === 'en') return 'en';
  if (first === 'es') return 'es';
  return DEFAULT_LOCALE;
}
