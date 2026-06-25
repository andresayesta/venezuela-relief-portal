import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';

export const dynamic = 'force-dynamic';

export default async function DonarPage() {
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  const { data: channels } = await supabase
    .from('donation_channels')
    .select('id, name, description, category, url, why_trusted, efficiency_note, trust_tier, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const grouped = new Map<string, typeof channels>();
  for (const c of channels ?? []) {
    const key = c.category ?? 'general';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.donate.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{tr.home.pathBDesc}</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{tr.donate.moneyTitle}</h2>
        {channels && channels.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {channels.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{c.name}</h3>
                    {c.category && (
                      <p className="text-xs uppercase tracking-wide text-slate-500">{c.category}</p>
                    )}
                  </div>
                  <TrustBadge tier={c.trust_tier} locale={locale} />
                </div>
                {c.description && <p className="mt-2 text-sm">{c.description}</p>}
                {c.why_trusted && (
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">{tr.donate.whyTrusted}:</span> {c.why_trusted}
                  </p>
                )}
                {c.efficiency_note && (
                  <p className="mt-1 text-xs text-slate-600">{c.efficiency_note}</p>
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
            ))}
          </ul>
        ) : (
          <Empty locale={locale} />
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
        <h2 className="text-lg font-semibold">{tr.donate.remittanceTitle}</h2>
        <p className="mt-2 text-sm text-slate-700">
          {locale === 'es'
            ? 'Próximamente: guía actualizada de los canales de remesas que están funcionando ahora mismo y sus comisiones.'
            : 'Coming soon: an up-to-date guide to remittance rails that are working right now and their fees.'}
        </p>
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
