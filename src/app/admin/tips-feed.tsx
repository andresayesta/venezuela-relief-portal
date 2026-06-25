import Link from 'next/link';
import type { Locale } from '@/lib/i18n';

type RelPerson = { full_name: string } | { full_name: string }[] | null;

type Tip = {
  id: string;
  missing_person_id: string;
  tip_giver_name: string | null;
  tip_giver_contact: string;
  info: string;
  created_at: string;
  missing_persons: RelPerson;
};

function pickPersonName(p: RelPerson): string {
  if (!p) return '—';
  if (Array.isArray(p)) return p[0]?.full_name ?? '—';
  return p.full_name;
}

export function TipsFeed({ tips, locale }: { tips: Tip[]; locale: Locale }) {
  return (
    <section className="mt-8 rounded-lg border-2 border-red-300 bg-red-50 p-4">
      <h2 className="text-base font-semibold text-red-900">
        {locale === 'es' ? 'Mensajes nuevos del público' : 'New tips from the public'}{' '}
        <span className="text-sm font-normal">({tips.length})</span>
      </h2>
      <p className="mt-1 text-xs text-red-800">
        {locale === 'es'
          ? 'Personas que dicen tener información. Revísalos y contacta a quien reporta.'
          : 'People who say they have information. Review and reach out to the reporter.'}
      </p>
      <ul className="mt-3 space-y-2">
        {tips.map((tip) => (
          <li key={tip.id} className="rounded-md border border-red-200 bg-white p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">
                {locale === 'es' ? 'Sobre:' : 'About:'}{' '}
                <Link
                  href={`/admin/desaparecidos/${tip.missing_person_id}`}
                  className="text-[#254499] hover:underline"
                >
                  {pickPersonName(tip.missing_persons)}
                </Link>
              </p>
              <span className="text-xs text-slate-500">
                {new Date(tip.created_at).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US')}
              </span>
            </div>
            <p className="mt-2 text-sm">{tip.info}</p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-medium">
                {locale === 'es' ? 'Contacto' : 'Contact'}:
              </span>{' '}
              {tip.tip_giver_name ? `${tip.tip_giver_name} — ` : ''}
              {tip.tip_giver_contact}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
