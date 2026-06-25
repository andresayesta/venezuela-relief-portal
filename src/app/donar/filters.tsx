'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/lib/i18n';

export function Filters({
  currentCategory,
  currentQ,
  currentSort,
  categoryOptions,
  locale,
}: {
  currentCategory?: string;
  currentQ?: string;
  currentSort?: string;
  categoryOptions: { value: string; label: string }[];
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(currentQ ?? '');

  function update(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: currentCategory,
      sort: currentSort,
      q: q || undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  const hasAnyFilter = !!currentCategory || !!currentQ || (!!currentSort && currentSort !== 'default');

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
        <select
          value={currentSort ?? 'default'}
          onChange={(e) => update({ sort: e.target.value === 'default' ? undefined : e.target.value })}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="default">{locale === 'es' ? 'Orden: Recomendado' : 'Sort: Recommended'}</option>
          <option value="verified">{locale === 'es' ? 'Verificados primero' : 'Verified first'}</option>
          <option value="name">{locale === 'es' ? 'Alfabético' : 'Alphabetical'}</option>
        </select>
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
