import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { ChannelCard } from '../channel-card';
import { SearchOnly } from './search-only';

export const dynamic = 'force-dynamic';

type Params = { q?: string };

export default async function DirectoPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { q } = await searchParams;
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('donation_channels')
    .select('id, name, description, category, url, why_trusted, efficiency_note, payment_details, trust_tier, sort_order')
    .eq('is_published', true)
    .eq('category', 'family_campaign')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data } = await query;
  const campaigns = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/donar" className="text-sm text-slate-500 hover:text-slate-900">
        ← {tr.donate.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {tr.donate.remittanceTitle}{' '}
        <span className="text-base font-normal text-slate-500">({campaigns.length})</span>
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Campañas directas (GoFundMe, etc.) verificadas para familias y casos puntuales.'
          : 'Verified direct campaigns (GoFundMe, etc.) for families and specific cases.'}
      </p>

      <SearchOnly currentQ={q} locale={locale} />

      {campaigns.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {campaigns.map((c) => (
            <ChannelCard key={c.id} c={c} locale={locale} tr={tr} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {locale === 'es'
            ? 'Aún no hay campañas verificadas.'
            : 'No verified campaigns yet.'}
        </p>
      )}
    </div>
  );
}
