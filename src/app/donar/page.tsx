import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';
import { DONATION_CATEGORIES } from '@/lib/supabase/types';
import { Filters } from './filters';

export const dynamic = 'force-dynamic';

type Params = { category?: string; q?: string; sort?: string };

export default async function DonarPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { category, q, sort } = await searchParams;
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('donation_channels')
    .select('id, name, description, category, url, why_trusted, efficiency_note, payment_details, trust_tier, sort_order');

  query = query.eq('is_published', true);
  if (category) query = query.eq('category', category);
  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%,why_trusted.ilike.%${safe}%`);
  }

  // Sort options: 'verified' (trust tier first), 'name', or default (sort_order).
  if (sort === 'name') {
    query = query.order('name', { ascending: true });
  } else {
    // Default: sort_order then name. 'verified' puts trust_tier first; handled in JS below.
    query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });
  }

  const { data } = await query;
  let channels = data ?? [];
  if (sort === 'verified') {
    const tierRank: Record<string, number> = { verified: 0, reported: 1, unverified: 2 };
    channels = [...channels].sort(
      (a, b) => (tierRank[a.trust_tier] ?? 99) - (tierRank[b.trust_tier] ?? 99),
    );
  }

  // Split orgs from direct campaigns (GoFundMe-style).
  const orgs = channels.filter((c) => c.category !== 'family_campaign');
  const campaigns = channels.filter((c) => c.category === 'family_campaign');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.donate.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{tr.home.pathBDesc}</p>

      <Filters
        currentCategory={category}
        currentQ={q}
        currentSort={sort}
        categoryOptions={DONATION_CATEGORIES.map((c) => ({
          value: c.value,
          label: locale === 'es' ? c.es : c.en,
        }))}
        locale={locale}
      />

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {tr.donate.moneyTitle}{' '}
          <span className="text-sm font-normal text-slate-500">({orgs.length})</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {locale === 'es'
            ? 'Organizaciones establecidas con presencia en Venezuela.'
            : 'Established organizations with presence in Venezuela.'}
        </p>
        {orgs.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {orgs.map((c) => (
              <ChannelCard key={c.id} c={c} locale={locale} tr={tr} />
            ))}
          </ul>
        ) : (
          <Empty locale={locale} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          {tr.donate.remittanceTitle}{' '}
          <span className="text-sm font-normal text-slate-500">({campaigns.length})</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {locale === 'es'
            ? 'Campañas directas (GoFundMe, etc.) verificadas para familias y casos puntuales.'
            : 'Verified direct campaigns (GoFundMe, etc.) for families and specific cases.'}
        </p>
        {campaigns.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {campaigns.map((c) => (
              <ChannelCard key={c.id} c={c} locale={locale} tr={tr} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            {locale === 'es'
              ? 'Aún no hay campañas verificadas.'
              : 'No verified campaigns yet.'}
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{tr.donate.inKindTitle}</h2>
        <Link
          href="/centros?direction=dropoff"
          className="mt-3 block rounded-lg border border-slate-300 p-4 hover:bg-slate-50"
        >
          <p className="text-base font-semibold">
            {locale === 'es' ? 'Centros de acopio (llevar donaciones) →' : 'Drop-off centers →'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {locale === 'es'
              ? 'Centros donde puedes llevar agua, medicinas, ropa y otros suministros.'
              : 'Centers where you can drop off water, medicine, clothes, and other supplies.'}
          </p>
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{tr.donate.skillsTitle}</h2>
        <p className="mt-2 text-sm text-slate-700">
          {locale === 'es'
            ? 'Próximamente: voluntariado para personal médico, traductores y mapeo de crisis.'
            : 'Coming soon: volunteering for medical staff, translators, and crisis mapping.'}
        </p>
      </section>
    </div>
  );
}

function Empty({ locale }: { locale: 'es' | 'en' }) {
  return (
    <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {locale === 'es'
        ? 'Estamos verificando canales. Vuelve pronto.'
        : 'We are still verifying channels. Check back soon.'}
    </p>
  );
}

type Channel = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  url: string | null;
  why_trusted: string | null;
  efficiency_note: string | null;
  payment_details: string | null;
  trust_tier: 'verified' | 'reported' | 'unverified';
};

function ChannelCard({
  c,
  locale,
  tr,
}: {
  c: Channel;
  locale: 'es' | 'en';
  tr: ReturnType<typeof t>;
}) {
  const categoryLabel =
    DONATION_CATEGORIES.find((opt) => opt.value === c.category)?.[locale]
    ?? c.category;

  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{c.name}</h3>
          {categoryLabel && (
            <p className="text-xs uppercase tracking-wide text-slate-500">{categoryLabel}</p>
          )}
        </div>
        <TrustBadge tier={c.trust_tier} locale={locale} />
      </div>
      {c.description && <p className="mt-2 text-sm">{c.description}</p>}

      {(c.why_trusted || c.efficiency_note) && (
        <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">
            {locale === 'es' ? 'Por qué confiamos' : 'Why we trust this'}
          </summary>
          <div className="border-t border-slate-200 px-3 py-2">
            {c.why_trusted && (
              <p className="text-xs text-slate-700">{c.why_trusted}</p>
            )}
            {c.efficiency_note && (
              <p className="mt-1 text-xs text-slate-600">{c.efficiency_note}</p>
            )}
          </div>
        </details>
      )}

      {c.payment_details && (
        <details className="mt-2 rounded-md border border-[#254499]/30 bg-[#254499]/5">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[#254499]">
            💸 {locale === 'es' ? 'Cómo donar (cuentas y datos)' : 'How to donate (accounts & details)'}
          </summary>
          <pre className="whitespace-pre-wrap break-words border-t border-[#254499]/20 px-3 py-2 font-mono text-xs text-slate-800">
            {c.payment_details}
          </pre>
        </details>
      )}

      {c.url && (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-[#254499] hover:underline"
        >
          {locale === 'es' ? 'Ir al sitio →' : 'Visit site →'}
        </a>
      )}
    </li>
  );
}
