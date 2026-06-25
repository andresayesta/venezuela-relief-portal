import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';
import { TipForm } from './tip-form';

export const dynamic = 'force-dynamic';

export default async function MissingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  const { data: person } = await supabase
    .from('missing_persons')
    .select('id, full_name, age, last_seen_location, last_seen_state, last_seen_date, description, photo_url, reporter_name, reporter_contact, status, trust_tier')
    .eq('id', id)
    .eq('is_published', true)
    .neq('status', 'closed')
    .single();

  if (!person) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/desaparecidos" className="text-sm text-slate-500 hover:text-slate-900">
        ← {tr.missing.title}
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        {person.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photo_url}
            alt={person.full_name}
            className="h-48 w-48 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-48 w-48 flex-shrink-0 rounded-lg bg-slate-100" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-semibold">
              {person.full_name}
              {person.age != null && (
                <span className="ml-2 text-slate-500">· {person.age}</span>
              )}
            </h1>
            <div className="flex items-center gap-1">
              {person.status === 'found_safe' && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-900">
                  {tr.missing.foundSafe}
                </span>
              )}
              <TrustBadge tier={person.trust_tier} locale={locale} />
            </div>
          </div>
          {(person.last_seen_state || person.last_seen_location || person.last_seen_date) && (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">{tr.missing.lastSeen}:</span>{' '}
              {[person.last_seen_location, person.last_seen_state, person.last_seen_date]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {person.description && (
            <p className="mt-3 text-sm text-slate-800">{person.description}</p>
          )}
          {person.reporter_contact && (
            <p className="mt-3 text-xs text-slate-700">
              <span className="font-medium">{tr.missing.contactReporter}:</span>{' '}
              {person.reporter_name ? `${person.reporter_name} — ` : ''}
              {person.reporter_contact}
            </p>
          )}
        </div>
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-base font-semibold">
          {locale === 'es' ? '¿Tienes información?' : 'Have information?'}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {locale === 'es'
            ? 'Si has visto a esta persona o tienes información que pueda ayudar, déjanos un mensaje. El equipo revisa cada uno antes de compartirlo con la familia.'
            : 'If you have seen this person or have helpful information, leave a message. The team reviews each one before sharing with the family.'}
        </p>
        <TipForm missingPersonId={person.id} locale={locale} />
      </section>
    </div>
  );
}
