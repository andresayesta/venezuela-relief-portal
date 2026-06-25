import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { ResourceSubmitForm } from './submit-form';

export const dynamic = 'force-dynamic';

export default async function SuggestResourcePage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/enviar" className="text-sm text-slate-500 hover:text-slate-900">
        ← {locale === 'es' ? 'Volver' : 'Back'}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">
        {locale === 'es' ? 'Sugerir un recurso' : 'Suggest a resource'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Número de emergencia, app oficial, consulado, refugio, etc. El equipo verificará antes de publicar.'
          : 'Emergency number, official app, consulate, shelter, etc. The team will verify before publishing.'}
      </p>
      <div className="mt-6">
        <ResourceSubmitForm locale={locale} />
      </div>
    </div>
  );
}
