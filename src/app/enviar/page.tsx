import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export default async function EnviarIndex() {
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        {locale === 'es' ? 'Reportar información' : 'Report information'}
      </h1>
      <p className="mt-2 text-base text-slate-700">{t(locale).submitPrompt.headline}</p>
      <p className="mt-1 text-sm text-slate-600">{t(locale).submitPrompt.reassurance}</p>

      <ul className="mt-6 space-y-3">
        <Card
          href="/desaparecidos"
          title={locale === 'es' ? 'Reportar una desaparición' : 'Report a missing person'}
          desc={locale === 'es'
            ? 'Reportamos personas desaparecidas vía Desaparecidos Terremoto Venezuela, te llevamos directo allí.'
            : 'Missing-person reports are handled by Desaparecidos Terremoto Venezuela — we send you there.'}
        />
        <Card
          href="/enviar/centro"
          title={locale === 'es' ? 'Reportar un centro de acopio' : 'Report a collection center'}
          desc={locale === 'es'
            ? '¿Sabes de un punto activo de acopio o entrega? Cuéntanos.'
            : 'Know of an active collection or distribution point? Tell us.'}
        />
        <Card
          href="/enviar/canal"
          title={locale === 'es' ? 'Sugerir un canal de donación' : 'Suggest a donation channel'}
          desc={locale === 'es'
            ? 'Organización confiable que esté ayudando en el país.'
            : 'Trusted organization helping inside Venezuela.'}
        />
        <Card
          href="/enviar/recurso"
          title={locale === 'es' ? 'Sugerir un recurso' : 'Suggest a resource'}
          desc={locale === 'es'
            ? 'Número de emergencia, app oficial, consulado, etc.'
            : 'Emergency number, official app, consulate, etc.'}
        />
      </ul>

      <p className="mt-10 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        {locale === 'es'
          ? 'Importante: nunca pidas dinero por mensaje privado a alguien que dice estar reportado aquí. Si recibes ese mensaje, es estafa.'
          : 'Important: never send money to anyone claiming to be a person reported here via private message. That is a scam.'}
      </p>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg border-2 border-[#254499] p-4 transition hover:bg-[#254499] hover:text-white"
      >
        <h2 className="text-base font-semibold">{title} →</h2>
        <p className="mt-1 text-sm text-slate-600 hover:text-white/90">{desc}</p>
      </Link>
    </li>
  );
}
