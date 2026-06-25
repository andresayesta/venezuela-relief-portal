import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  // Live counts and last-updated, all from published rows only (RLS-safe).
  const [centersAgg, missingAgg, channelsAgg, latestUpdate] = await Promise.all([
    supabase.from('collection_centers').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('missing_persons').select('id', { count: 'exact', head: true }).eq('is_published', true).neq('status', 'closed'),
    supabase.from('donation_channels').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('collection_centers').select('updated_at').eq('is_published', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const stats = {
    centers: centersAgg.count ?? 0,
    missing: missingAgg.count ?? 0,
    channels: channelsAgg.count ?? 0,
  };
  const lastUpdated = latestUpdate.data?.updated_at;

  return (
    <div>
      <div className="relative w-full">
        <Image
          src="/we-help-venezuela.png"
          alt="We Help Venezuela — Earthquake Disaster 24 June 2026"
          width={1920}
          height={1080}
          priority
          sizes="100vw"
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">
          {tr.siteName}
        </h1>
        <p className="mt-2 text-base text-slate-600">{tr.tagline}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/necesito-ayuda"
          className="group rounded-xl border-2 border-[#254499] bg-white p-6 transition hover:bg-[#254499] hover:text-white"
        >
          <h2 className="flex items-baseline gap-2 text-xl font-semibold">
            <span className="rounded-md bg-[#254499] px-1.5 py-0.5 text-sm font-bold text-white group-hover:bg-white group-hover:text-[#254499]">
              A
            </span>
            <span>{tr.home.pathA}</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 group-hover:text-white/90">
            {tr.home.pathADesc}
          </p>
        </Link>
        <Link
          href="/donar"
          className="group rounded-xl border-2 border-[#254499] bg-white p-6 transition hover:bg-[#254499] hover:text-white"
        >
          <h2 className="flex items-baseline gap-2 text-xl font-semibold">
            <span className="rounded-md bg-[#254499] px-1.5 py-0.5 text-sm font-bold text-white group-hover:bg-white group-hover:text-[#254499]">
              B
            </span>
            <span>{tr.home.pathB}</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 group-hover:text-white/90">
            {tr.home.pathBDesc}
          </p>
        </Link>
      </div>

      <Link
        href="/verificado"
        className="mt-3 block rounded-xl border border-slate-300 bg-slate-50 p-4 text-center text-sm font-medium text-slate-800 hover:bg-slate-100"
      >
        {tr.home.pathC} →
      </Link>

      <dl className="mt-10 grid grid-cols-3 gap-3 text-center">
        <Stat n={stats.centers} label={tr.home.stats.centers} />
        <Stat n={stats.missing} label={tr.home.stats.missing} />
        <Stat n={stats.channels} label={tr.home.stats.channels} />
      </dl>

      {lastUpdated && (
        <p className="mt-6 text-center text-xs text-slate-500">
          {tr.home.lastUpdated}:{' '}
          {new Date(lastUpdated).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US')}
        </p>
      )}
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-[#254499]">{n}</dd>
    </div>
  );
}
