import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';
import { VENEZUELAN_STATES, type CenterDirection } from '@/lib/supabase/types';
import { Filters } from './filters';

export const dynamic = 'force-dynamic';

type Params = { state?: string; direction?: string; q?: string };

export default async function CentrosPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { state, direction, q } = await searchParams;
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('collection_centers')
    .select('id, name, state, city, neighborhood, accepted_items, urgent_needs, hours, contact_name, contact_phone, direction, trust_tier, updated_at, photo_url, event_date')
    .eq('is_published', true)
    .order('updated_at', { ascending: false });

  const knownStates = VENEZUELAN_STATES as readonly string[];
  if (state && knownStates.includes(state)) {
    query = query.eq('state', state);
  }
  if (direction === 'dropoff' || direction === 'pickup') {
    query = query.eq('direction', direction as CenterDirection);
  }
  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${safe}%,city.ilike.%${safe}%,neighborhood.ilike.%${safe}%`);
  }

  const { data } = await query;
  const centers = data ?? [];
  const latest = centers[0]?.updated_at;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{tr.centers.title}</h1>
      {latest && (
        <p className="mt-1 text-xs text-slate-500">
          {tr.home.lastUpdated}: {new Date(latest).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US')}
        </p>
      )}

      <Filters
        currentState={state}
        currentDirection={direction}
        currentQ={q}
        locale={locale}
      />

      <ul className="mt-5 space-y-3">
        {centers.map((c) => (
          <li key={c.id} className="overflow-hidden rounded-lg border border-slate-200">
            {c.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.photo_url}
                alt={c.name}
                className="block w-full max-h-[520px] object-contain bg-slate-50"
              />
            )}
            <div className="p-4">
            {c.event_date && (
              <p className="mb-2 inline-block rounded-md bg-red-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                {locale === 'es' ? 'Solo el' : 'Only on'}{' '}
                {new Date(c.event_date + 'T00:00:00').toLocaleDateString(
                  locale === 'es' ? 'es-VE' : 'en-US',
                  { weekday: 'long', day: 'numeric', month: 'long' },
                )}
              </p>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{c.name}</h2>
                <p className="text-xs text-slate-600">
                  {[c.state, c.city, c.neighborhood].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                  {c.direction === 'dropoff' ? '↓ ' + tr.centers.directionDropoff : '↑ ' + tr.centers.directionPickup}
                </span>
                <TrustBadge tier={c.trust_tier} locale={locale} />
              </div>
            </div>
            {c.accepted_items && (
              <p className="mt-2 text-sm">
                <span className="font-medium">{tr.centers.acceptedItems}:</span> {c.accepted_items}
              </p>
            )}
            {c.urgent_needs && (
              <p className="mt-1 text-sm text-red-700">
                <span className="font-medium">{tr.centers.urgentNeeds}:</span> {c.urgent_needs}
              </p>
            )}
            <dl className="mt-2 grid grid-cols-1 gap-x-4 text-xs text-slate-600 sm:grid-cols-2">
              {c.hours && (
                <div>
                  <dt className="inline font-medium">{tr.centers.hours}: </dt>
                  <dd className="inline">{c.hours}</dd>
                </div>
              )}
              {(c.contact_name || c.contact_phone) && (
                <div>
                  <dt className="inline font-medium">{tr.centers.contact}: </dt>
                  <dd className="inline">
                    {[c.contact_name, c.contact_phone].filter(Boolean).join(' — ')}
                  </dd>
                </div>
              )}
            </dl>
            </div>
          </li>
        ))}
        {centers.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            {tr.centers.empty}
          </li>
        )}
      </ul>

      <p className="mt-8 text-xs text-slate-500">
        <span className="font-semibold">{tr.badges.legendTitle}.</span>{' '}
        {tr.badges.legendVerified} {tr.badges.legendReported}
      </p>
    </div>
  );
}
