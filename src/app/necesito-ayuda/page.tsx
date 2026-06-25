import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export default async function NeedHelpPage() {
  const locale = await getLocale();
  const tr = t(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.home.pathA}</h1>
      <p className="mt-1 text-sm text-slate-600">{tr.home.pathADesc}</p>

      <ul className="mt-6 space-y-3">
        <Card
          href="/desaparecidos"
          title={locale === 'es' ? 'Buscar a una persona desaparecida' : 'Find a missing person'}
          desc={locale === 'es' ? 'Listado de personas reportadas. Busca por nombre o estado.' : 'List of reported persons. Search by name or state.'}
        />
        <Card
          href="/centros?direction=pickup"
          title={locale === 'es' ? 'Refugios y puntos de ayuda' : 'Shelters and pickup points'}
          desc={locale === 'es' ? 'Centros donde se entregan suministros a quienes los necesitan.' : 'Centers giving out supplies to those who need them.'}
        />
        <Card
          href="/recursos"
          title={locale === 'es' ? 'Emergencias y canales oficiales' : 'Emergency and official channels'}
          desc={locale === 'es' ? 'Números de emergencia, app oficial de reporte, ayuda consular.' : 'Emergency numbers, official damage-report app, consular help.'}
        />
      </ul>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg border border-slate-300 p-4 hover:bg-slate-50"
      >
        <h2 className="text-base font-semibold">{title} →</h2>
        <p className="mt-1 text-sm text-slate-600">{desc}</p>
      </Link>
    </li>
  );
}
