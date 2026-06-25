import type { Locale } from '@/lib/i18n';

type Tip = {
  id: string;
  tip_giver_name: string | null;
  tip_giver_contact: string;
  info: string;
  created_at: string;
  reviewed: boolean;
};

export function TipsList({ tips, locale }: { tips: Tip[]; locale: Locale }) {
  return (
    <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-900">
        {locale === 'es' ? 'Información recibida' : 'Tips received'} ({tips.length})
      </h2>
      <ul className="mt-3 space-y-3">
        {tips.map((tip) => (
          <li key={tip.id} className="rounded-md border border-amber-200 bg-white p-3">
            <p className="text-xs text-slate-500">
              {new Date(tip.created_at).toLocaleString(
                locale === 'es' ? 'es-VE' : 'en-US',
              )}
              {!tip.reviewed && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  {locale === 'es' ? 'Nuevo' : 'New'}
                </span>
              )}
            </p>
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
