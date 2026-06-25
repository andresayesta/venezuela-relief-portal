import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { ChannelSubmitForm } from './submit-form';

export const dynamic = 'force-dynamic';

export default async function SuggestChannelPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/enviar" className="text-sm text-slate-500 hover:text-slate-900">
        ← {locale === 'es' ? 'Volver' : 'Back'}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">
        {locale === 'es' ? 'Sugerir un canal de donación' : 'Suggest a donation channel'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Sólo publicamos organizaciones que existían antes del desastre y tienen presencia comprobada en el país.'
          : 'We only publish organizations that existed before the disaster and have verified in-country presence.'}
      </p>
      <div className="mt-6">
        <ChannelSubmitForm locale={locale} />
      </div>
    </div>
  );
}
