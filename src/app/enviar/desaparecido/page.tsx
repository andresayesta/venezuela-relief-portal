import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { MissingSubmitForm } from './submit-form';

export const dynamic = 'force-dynamic';

export default async function ReportMissingPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/enviar" className="text-sm text-slate-500 hover:text-slate-900">
        ← {locale === 'es' ? 'Volver' : 'Back'}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">
        {locale === 'es' ? 'Reportar una desaparición' : 'Report a missing person'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Llena lo que sepas. Un miembro del equipo se comunicará contigo para confirmar la información y pedir consentimiento antes de publicar.'
          : 'Fill in what you know. A team member will reach out to confirm and request consent before publishing.'}
      </p>
      <div className="mt-6">
        <MissingSubmitForm locale={locale} />
      </div>
    </div>
  );
}
