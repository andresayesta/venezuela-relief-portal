import { TrustBadge } from '@/components/TrustBadge';
import { DONATION_CATEGORIES } from '@/lib/supabase/types';
import type { t } from '@/lib/i18n';

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

export function ChannelCard({
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
