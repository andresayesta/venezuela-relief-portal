'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/lib/i18n';

export function SearchOnly({
  currentQ,
  locale,
}: {
  currentQ?: string;
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();
  const [q, setQ] = useState(currentQ ?? '');

  function update() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <input
      type="search"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') update();
      }}
      placeholder={locale === 'es' ? 'Buscar campaña...' : 'Search campaign...'}
      className="mt-4 w-full rounded border border-slate-300 px-3 py-2 text-base"
    />
  );
}
