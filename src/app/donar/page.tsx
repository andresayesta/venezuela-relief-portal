import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function DonarPage() {
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  // Counts for each card so the user sees how many things are in each subsection.
  const [orgsCount, campaignsCount, sheltersCount, volunteerCount] = await Promise.all([
    supabase.from('donation_channels').select('id', { count: 'exact', head: true })
      .eq('is_published', true).neq('category', 'family_campaign'),
    supabase.from('donation_channels').select('id', { count: 'exact', head: true })
      .eq('is_published', true).eq('category', 'family_campaign'),
    supabase.from('collection_centers').select('id', { count: 'exact', head: true })
      .eq('is_published', true).eq('direction', 'dropoff'),
    supabase.from('resource_links').select('id', { count: 'exact', head: true })
      .eq('is_published', true).eq('category', 'skills_volunteering'),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.donate.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{tr.home.pathBDesc}</p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card
          href="/donar/canales"
          icon="💳"
          title={tr.donate.moneyTitle}
          count={orgsCount.count ?? 0}
          desc={
            locale === 'es'
              ? 'Organizaciones establecidas con presencia en Venezuela.'
              : 'Established organizations with presence in Venezuela.'
          }
          locale={locale}
        />
        <Card
          href="/donar/directo"
          icon="❤️"
          title={tr.donate.remittanceTitle}
          count={campaignsCount.count ?? 0}
          desc={
            locale === 'es'
              ? 'Campañas directas (GoFundMe, etc.) verificadas para familias y casos puntuales.'
              : 'Verified direct campaigns (GoFundMe, etc.) for families and specific cases.'
          }
          locale={locale}
        />
        <Card
          href="/centros?direction=dropoff"
          icon="📦"
          title={tr.donate.inKindTitle}
          count={sheltersCount.count ?? 0}
          desc={
            locale === 'es'
              ? 'Centros físicos donde puedes llevar agua, medicinas, ropa y otros suministros.'
              : 'Physical centers where you can drop off water, medicine, clothes and other supplies.'
          }
          locale={locale}
        />
        <Card
          href="/recursos/skills_volunteering"
          icon="🤝"
          title={tr.donate.skillsTitle}
          count={volunteerCount.count ?? 0}
          desc={
            locale === 'es'
              ? 'Apoyo psicológico, traducción, mapeo de crisis y más.'
              : 'Psychological support, translation, crisis mapping and more.'
          }
          locale={locale}
        />
      </ul>
    </div>
  );
}

function Card({
  href,
  icon,
  title,
  count,
  desc,
  locale,
}: {
  href: string;
  icon: string;
  title: string;
  count: number;
  desc: string;
  locale: 'es' | 'en';
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full flex-col rounded-xl border-2 border-[#254499] bg-white p-5 transition hover:bg-[#254499] hover:text-white"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">
            <span className="mr-2">{icon}</span>
            {title}
          </h2>
          {count > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 group-hover:bg-white group-hover:text-[#254499]">
              {count}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-600 group-hover:text-white/90">
          {desc}
        </p>
        <p className="mt-3 text-xs font-semibold text-[#254499] group-hover:text-white">
          {locale === 'es' ? 'Ver →' : 'View →'}
        </p>
      </Link>
    </li>
  );
}
