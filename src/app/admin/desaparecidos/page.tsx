import Link from 'next/link';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';

export const dynamic = 'force-dynamic';

export default async function ManageMissingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireTeam();
  const { filter } = await searchParams;
  const onlyUnpublished = filter === 'unpublished';

  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('missing_persons')
    .select('id, full_name, last_seen_state, status, trust_tier, is_published, consent_to_publish, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (onlyUnpublished) query = query.eq('is_published', false);

  const { data } = await query;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tr.admin.manageMissing}</h1>
        <Link href="/admin/desaparecidos/new" className="rounded bg-[#254499] px-3 py-2 text-sm font-medium text-white">
          {tr.admin.addMissing}
        </Link>
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <Link
          href="/admin/desaparecidos"
          className={`rounded px-3 py-1.5 ${!onlyUnpublished ? 'bg-slate-900 text-white' : 'border border-slate-300'}`}
        >
          {locale === 'es' ? 'Todos' : 'All'}
        </Link>
        <Link
          href="/admin/desaparecidos?filter=unpublished"
          className={`rounded px-3 py-1.5 ${onlyUnpublished ? 'bg-slate-900 text-white' : 'border border-slate-300'}`}
        >
          {locale === 'es' ? 'No publicados' : 'Unpublished'}
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {(data ?? []).map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/desaparecidos/${m.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.full_name}</p>
                <p className="truncate text-xs text-slate-500">
                  {m.last_seen_state ?? '—'}
                  {' · '}
                  {m.status === 'missing'
                    ? locale === 'es' ? 'Desaparecido' : 'Missing'
                    : m.status === 'found_safe'
                      ? locale === 'es' ? 'Encontrado' : 'Found safe'
                      : locale === 'es' ? 'Cerrado' : 'Closed'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!m.consent_to_publish && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    {locale === 'es' ? 'Sin consentimiento' : 'No consent'}
                  </span>
                )}
                {!m.is_published && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    {locale === 'es' ? 'Pendiente' : 'Pending'}
                  </span>
                )}
                <TrustBadge tier={m.trust_tier} locale={locale} />
              </div>
            </Link>
          </li>
        ))}
        {(data ?? []).length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            {locale === 'es' ? 'Nada todavía.' : 'Nothing yet.'}
          </li>
        )}
      </ul>
    </div>
  );
}
