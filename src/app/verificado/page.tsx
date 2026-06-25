import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export default async function VerifiedPage() {
  const locale = await getLocale();
  const tr = t(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 leading-relaxed">
      <h1 className="text-2xl font-semibold">{tr.home.pathC}</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{tr.badges.legendTitle}</h2>
        <p className="mt-2 text-sm text-slate-700">{tr.badges.legendVerified}</p>
        <p className="mt-1 text-sm text-slate-700">{tr.badges.legendReported}</p>
        <p className="mt-2 text-sm text-slate-700">
          {locale === 'es'
            ? 'Nunca publicamos información sin confirmar.'
            : 'We never publish unconfirmed information.'}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {locale === 'es' ? 'Cómo detectar estafas' : 'How to spot scams'}
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            {locale === 'es'
              ? 'Desconfía de cuentas creadas recientemente y de campañas con urgencia extrema.'
              : 'Be wary of newly created accounts and campaigns with extreme urgency.'}
          </li>
          <li>
            {locale === 'es'
              ? 'Verifica que la organización exista antes del terremoto y tenga presencia en el país.'
              : 'Check that the org existed before the earthquake and has in-country presence.'}
          </li>
          <li>
            {locale === 'es'
              ? 'Prefiere transferencias directas a familia o canales que aparecen aquí.'
              : 'Prefer direct family transfers or the channels listed here.'}
          </li>
        </ul>
      </section>
    </div>
  );
}
