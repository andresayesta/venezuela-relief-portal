'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';

export function MissingFilters({
  currentState,
  currentQ,
  locale,
}: {
  currentState?: string;
  currentQ?: string;
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
      state: currentState,
      q: q || undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mt-4 space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') update({ q: q || undefined });
        }}
        placeholder={tr.missing.search}
        className="w-full rounded border border-slate-300 px-3 py-2 text-base"
      />
      <div className="flex flex-wrap gap-2">
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
        {(currentState || currentQ) && (
          <button
            onClick={() => {
              setQ('');
              start(() => router.push(pathname));
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
