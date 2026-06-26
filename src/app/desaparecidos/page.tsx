import Link from 'next/link';
import { getLocale } from '@/lib/locale';

export const dynamic = 'force-dynamic';

const PARTNER_URL = 'https://desaparecidosterremotovenezuela.com';

export default async function DesaparecidosLandingPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">
        {locale === 'es' ? 'Personas desaparecidas' : 'Missing persons'}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-700">
        {locale === 'es'
          ? 'Para evitar duplicar esfuerzos y mantener un solo registro confiable, redirigimos a Desaparecidos Terremoto Venezuela, una plataforma dedicada exclusivamente al registro y búsqueda de personas desaparecidas tras los terremotos.'
          : 'To avoid duplicating efforts and keep one reliable registry, we redirect to Desaparecidos Terremoto Venezuela, a platform dedicated exclusively to registering and searching for people missing after the earthquakes.'}
      </p>
      <p className="mt-3 text-sm text-slate-600">
        {locale === 'es'
          ? 'Ahí puedes reportar a un familiar desaparecido, consultar la lista pública y aportar información sobre alguien que hayas visto.'
          : 'There you can report a missing family member, browse the public list, and submit information about someone you have seen.'}
      </p>

      <a
        href={PARTNER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#254499] px-5 py-3 text-base font-semibold text-white hover:bg-[#1d3777]"
      >
        {locale === 'es' ? 'Ir a Desaparecidos Terremoto Venezuela' : 'Go to Desaparecidos Terremoto Venezuela'}{' '}
        ↗
      </a>

      <p className="mt-3 text-xs text-slate-500">{PARTNER_URL}</p>

      <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold">
          {locale === 'es' ? '¿Buscas algo más?' : 'Looking for something else?'}
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          <li>
            <Link href="/necesito-ayuda" className="text-[#254499] hover:underline">
              {locale === 'es' ? 'Necesito ayuda' : 'I need help'}
            </Link>{' '}
            —{' '}
            {locale === 'es'
              ? 'refugios, emergencias, ayuda consular.'
              : 'shelters, emergencies, consular help.'}
          </li>
          <li>
            <Link href="/recursos/family_tracing" className="text-[#254499] hover:underline">
              {locale === 'es' ? 'Búsqueda de familia (ICRC, Cruz Roja)' : 'Family tracing (ICRC, Red Cross)'}
            </Link>
          </li>
          <li>
            <Link href="/donar" className="text-[#254499] hover:underline">
              {locale === 'es' ? 'Quiero ayudar' : 'I want to help'}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
