'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n';

export function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next: Locale = current === 'es' ? 'en' : 'es';

  function toggle() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    start(() => router.refresh());
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="text-xs font-medium uppercase tracking-wider text-slate-600 hover:text-slate-900 disabled:opacity-50"
      aria-label={`Switch to ${next}`}
    >
      {current === 'es' ? 'EN' : 'ES'}
    </button>
  );
}
