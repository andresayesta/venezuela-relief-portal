'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/lib/i18n';

export function CategoryFilters({
  category,
  currentState,
  currentCountry,
  currentQ,
  availableStates,
  availableCountries,
  locale,
}: {
  category: string;
  currentState?: string;
  currentCountry?: string;
  currentQ?: string;
  availableStates: string[];
  availableCountries: string[];
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(currentQ ?? '');

  function update(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      state: currentState,
      country: currentCountry,
      q: q || undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  const hasAnyFilter = !!currentState || !!currentCountry || !!currentQ;
  void category;

  return (
    <div className="mt-4 space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') update({ q: q || undefined });
        }}
        placeholder={locale === 'es' ? 'Buscar...' : 'Search...'}
        className="w-full rounded border border-slate-300 px-3 py-2 text-base"
      />
      <div className="flex flex-wrap gap-2">
        {availableStates.length > 0 && (
          <select
            value={currentState ?? ''}
            onChange={(e) => update({ state: e.target.value || undefined })}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{locale === 'es' ? 'Estado: Todos' : 'State: All'}</option>
            {availableStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {availableCountries.length > 0 && (
          <select
            value={currentCountry ?? ''}
            onChange={(e) => update({ country: e.target.value || undefined })}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{locale === 'es' ? 'País: Todos' : 'Country: All'}</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        {hasAnyFilter && (
          <button
            onClick={() => {
              setQ('');
              start(() => router.push(pathname));
            }}
            disabled={pending}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {locale === 'es' ? 'Limpiar' : 'Clear'}
          </button>
        )}
      </div>
    </div>
  );
}
