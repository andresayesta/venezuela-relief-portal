import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';
import { DONATION_CATEGORIES } from '@/lib/supabase/types';
import { Filters } from '../filters';
import { ChannelCard } from '../channel-card';

export const dynamic = 'force-dynamic';

type Params = { category?: string; q?: string; sort?: string };

export default async function CanalesPage({
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
    .select('id, name, description, category, url, why_trusted, efficiency_note, payment_details, trust_tier, sort_order')
    .eq('is_published', true)
    .neq('category', 'family_campaign');

  if (category) query = query.eq('category', category);
  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%,why_trusted.ilike.%${safe}%`);
  }

  if (sort === 'name') {
    query = query.order('name', { ascending: true });
  } else {
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

  // Only show categories present in the data so filter dropdown stays useful.
  const presentCategories = new Set(channels.map((c) => c.category).filter(Boolean));
  const categoryOptions = DONATION_CATEGORIES
    .filter((c) => c.value !== 'family_campaign' && presentCategories.has(c.value))
    .map((c) => ({ value: c.value, label: locale === 'es' ? c.es : c.en }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/donar" className="text-sm text-slate-500 hover:text-slate-900">
        ← {tr.donate.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {tr.donate.moneyTitle}{' '}
        <span className="text-base font-normal text-slate-500">({channels.length})</span>
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Organizaciones establecidas con presencia en Venezuela.'
          : 'Established organizations with presence in Venezuela.'}
      </p>

      <Filters
        currentCategory={category}
        currentQ={q}
        currentSort={sort}
        categoryOptions={categoryOptions}
        locale={locale}
      />

      {channels.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {channels.map((c) => (
            <ChannelCard key={c.id} c={c} locale={locale} tr={tr} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {locale === 'es'
            ? 'Sin resultados para esta selección.'
            : 'No results for this selection.'}
        </p>
      )}

      {channels.length === 0 && !q && !category && (
        <p className="mt-3 text-center text-xs text-slate-500">
          <TrustBadge tier="reported" locale={locale} />{' '}
          {locale === 'es' ? 'El equipo sigue verificando canales.' : 'The team is still verifying channels.'}
        </p>
      )}
    </div>
  );
}
