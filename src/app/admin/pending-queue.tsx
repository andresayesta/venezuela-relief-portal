'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publishCenterAction, publishMissingAction } from './admin-actions';
import type { TrustTier, UserRole, CenterDirection } from '@/lib/supabase/types';
import { TrustBadge } from '@/components/TrustBadge';
import { t, type Locale } from '@/lib/i18n';

// Supabase's PostgREST embedded-relation queries return the related rows
// as an array, even for a unique FK. We accept either shape and take the
// first element below.
type RelProfile = { full_name: string | null } | { full_name: string | null }[] | null;

export type PendingCenter = {
  id: string;
  name: string;
  state: string;
  direction: CenterDirection;
  trust_tier: TrustTier;
  created_at: string;
  profiles: RelProfile;
};

export type PendingMissing = {
  id: string;
  full_name: string;
  last_seen_state: string | null;
  trust_tier: TrustTier;
  created_at: string;
  profiles: RelProfile;
};

function pickName(p: RelProfile): string | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0]?.full_name ?? null;
  return p.full_name;
}

export function PendingQueue({
  centers,
  missing,
  role,
  locale,
}: {
  centers: PendingCenter[];
  missing: PendingMissing[];
  role: UserRole;
  locale: Locale;
}) {
  const tr = t(locale);
  const total = centers.length + missing.length;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {tr.admin.pending}{' '}
        <span className="text-sm font-normal text-slate-500">({total})</span>
      </h2>
      <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {centers.map((c) => (
          <Row
            key={`c-${c.id}`}
            id={c.id}
            kind="center"
            title={c.name}
            subtitle={`${c.state} · ${c.direction === 'dropoff' ? '↓' : '↑'}`}
            addedBy={pickName(c.profiles) ?? '—'}
            trustTier={c.trust_tier}
            editHref={`/admin/centros/${c.id}`}
            role={role}
            locale={locale}
          />
        ))}
        {missing.map((m) => (
          <Row
            key={`m-${m.id}`}
            id={m.id}
            kind="missing"
            title={m.full_name}
            subtitle={m.last_seen_state ?? '—'}
            addedBy={pickName(m.profiles) ?? '—'}
            trustTier={m.trust_tier}
            editHref={`/admin/desaparecidos/${m.id}`}
            role={role}
            locale={locale}
          />
        ))}
        {total === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            {locale === 'es' ? 'Cola vacía.' : 'Queue is empty.'}
          </li>
        )}
      </ul>
    </section>
  );
}

function Row({
  id,
  kind,
  title,
  subtitle,
  addedBy,
  trustTier,
  editHref,
  role,
  locale,
}: {
  id: string;
  kind: 'center' | 'missing';
  title: string;
  subtitle: string;
  addedBy: string;
  trustTier: TrustTier;
  editHref: string;
  role: UserRole;
  locale: Locale;
}) {
  const tr = t(locale);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPublish() {
    setError(null);
    start(async () => {
      const action = kind === 'center' ? publishCenterAction : publishMissingAction;
      const result = await action(id);
      if (result && 'error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link href={editHref} className="block">
          <p className="truncate text-sm font-medium text-slate-900">{title}</p>
          <p className="truncate text-xs text-slate-500">
            {subtitle} · {tr.admin.addedBy} {addedBy}
          </p>
        </Link>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <TrustBadge tier={trustTier} locale={locale} />
        {role === 'admin' && (
          <button
            onClick={onPublish}
            disabled={pending}
            className="rounded bg-[#254499] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? '...' : tr.admin.publish}
          </button>
        )}
      </div>
    </li>
  );
}
