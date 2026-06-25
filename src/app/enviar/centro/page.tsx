import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { CenterSubmitForm } from './submit-form';

export const dynamic = 'force-dynamic';

export default async function ReportCenterPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/enviar" className="text-sm text-slate-500 hover:text-slate-900">
        ← {locale === 'es' ? 'Volver' : 'Back'}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">
        {locale === 'es' ? 'Reportar un centro de acopio' : 'Report a collection center'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Sólo añadimos centros que el equipo pueda confirmar. Comparte lo que sepas y un miembro del equipo verificará antes de publicar.'
          : 'We only add centers the team can confirm. Share what you know and a team member will verify before publishing.'}
      </p>
      <div className="mt-6">
        <CenterSubmitForm locale={locale} />
      </div>
    </div>
  );
}
