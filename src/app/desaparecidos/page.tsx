import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';
import { MissingFilters } from './filters';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

type Params = { state?: string; q?: string };

export default async function DesaparecidosPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { state, q } = await searchParams;
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('missing_persons')
    .select('id, full_name, age, last_seen_location, last_seen_state, last_seen_date, description, photo_url, reporter_name, reporter_contact, status, trust_tier, updated_at')
    .eq('is_published', true)
    .neq('status', 'closed')
    .order('updated_at', { ascending: false });

  if (state && (VENEZUELAN_STATES as readonly string[]).includes(state)) {
    query = query.eq('last_seen_state', state);
  }
  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.ilike('full_name', `%${safe}%`);
  }

  const { data } = await query;
  const persons = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{tr.missing.title}</h1>

      <MissingFilters currentState={state} currentQ={q} locale={locale} />

      <ul className="mt-5 space-y-3">
        {persons.map((p) => (
          <li key={p.id}>
            <Link
              href={`/desaparecidos/${p.id}`}
              className="flex gap-4 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
            >
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photo_url}
                  alt={p.full_name}
                  className="h-24 w-24 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-24 w-24 flex-shrink-0 rounded bg-slate-100" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold">
                    {p.full_name}
                    {p.age != null && <span className="ml-1 text-slate-500">· {p.age}</span>}
                  </h2>
                  <div className="flex items-center gap-1">
                    {p.status === 'found_safe' && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-900">
                        {tr.missing.foundSafe}
                      </span>
                    )}
                    <TrustBadge tier={p.trust_tier} locale={locale} />
                  </div>
                </div>
                {(p.last_seen_state || p.last_seen_location || p.last_seen_date) && (
                  <p className="mt-1 text-xs text-slate-600">
                    {tr.missing.lastSeen}:{' '}
                    {[p.last_seen_location, p.last_seen_state, p.last_seen_date].filter(Boolean).join(' · ')}
                  </p>
                )}
                {p.description && <p className="mt-2 line-clamp-2 text-sm">{p.description}</p>}
                <p className="mt-2 text-xs font-medium text-[#254499]">
                  {locale === 'es' ? 'Ver más / Reportar info →' : 'View / Report info →'}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {persons.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            {tr.missing.empty}
          </li>
        )}
      </ul>

      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold">{tr.missing.report}</h2>
        <p className="mt-1 text-xs text-slate-600">{tr.missing.reportNote}</p>
      </div>
    </div>
  );
}
