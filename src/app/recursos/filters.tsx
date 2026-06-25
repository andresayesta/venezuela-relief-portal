'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';

export function Filters({
  currentScope,
  currentState,
  currentCountry,
  currentCategory,
  currentQ,
  availableCountries,
  categoryOptions,
  locale,
}: {
  currentScope: 'inside' | 'diaspora';
  currentState?: string;
  currentCountry?: string;
  currentCategory?: string;
  currentQ?: string;
  availableCountries: string[];
  categoryOptions: { value: string; label: string }[];
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
      category: currentCategory,
      q: q || undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  const inDiaspora = currentScope === 'diaspora';
  const hasAnyFilter =
    !!currentState || !!currentCountry || !!currentCategory || !!currentQ;

  return (
    <div className="mt-3 space-y-2">
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
        <select
          value={currentCategory ?? ''}
          onChange={(e) => update({ category: e.target.value || undefined })}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{locale === 'es' ? 'Tipo: Todos' : 'Type: All'}</option>
          {categoryOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {inDiaspora ? (
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
        ) : (
          <select
            value={currentState ?? ''}
            onChange={(e) => update({ state: e.target.value || undefined })}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{locale === 'es' ? 'Estado: Todos' : 'State: All'}</option>
            {VENEZUELAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {hasAnyFilter && (
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
