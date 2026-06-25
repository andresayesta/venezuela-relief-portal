'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { VENEZUELAN_STATES, COUNTRY_OPTIONS } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';

export function Filters({
  currentState,
  currentDirection,
  currentQ,
  currentScope,
  currentCountry,
  locale,
}: {
  currentState?: string;
  currentDirection?: string;
  currentQ?: string;
  currentScope: 'inside' | 'diaspora';
  currentCountry?: string;
  locale: Locale;
}) {
  const tr = t(locale);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(currentQ ?? '');

  function update(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      scope: currentScope === 'diaspora' ? 'diaspora' : undefined,
      state: currentState,
      country: currentCountry,
      direction: currentDirection,
      q: q || undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  const inDiaspora = currentScope === 'diaspora';

  return (
    <div className="mt-3 space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') update({ q: q || undefined });
        }}
        placeholder={tr.centers.search}
        className="w-full rounded border border-slate-300 px-3 py-2 text-base"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={currentDirection ?? ''}
          onChange={(e) => update({ direction: e.target.value || undefined })}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{tr.centers.filterDirection}: {tr.centers.filterAll}</option>
          <option value="dropoff">↓ {tr.centers.directionDropoff}</option>
          <option value="pickup">↑ {tr.centers.directionPickup}</option>
        </select>
        {inDiaspora ? (
          <select
            value={currentCountry ?? ''}
            onChange={(e) => update({ country: e.target.value || undefined })}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{locale === 'es' ? 'País: Todos' : 'Country: All'}</option>
            {COUNTRY_OPTIONS.filter((c) => c.code !== 'VE').map((c) => (
              <option key={c.code} value={c.code}>{locale === 'es' ? c.es : c.en}</option>
            ))}
          </select>
        ) : (
          <select
            value={currentState ?? ''}
            onChange={(e) => update({ state: e.target.value || undefined })}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{tr.centers.filterState}: {tr.centers.filterAll}</option>
            {VENEZUELAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {(currentState || currentDirection || currentQ || currentCountry) && (
          <button
            onClick={() => {
              setQ('');
              const base = inDiaspora ? `${pathname}?scope=diaspora` : pathname;
              start(() => router.push(base));
            }}
            disabled={pending}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {tr.common.cancel}
          </button>
        )}
      </div>
    </div>
  );
}
