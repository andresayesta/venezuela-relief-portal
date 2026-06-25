import { getLocale } from '@/lib/locale';
import { ResetForm } from './reset-form';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-semibold">
        {locale === 'es' ? 'Nueva contraseña' : 'New password'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Ingresa tu nueva contraseña.'
          : 'Enter your new password.'}
      </p>
      <ResetForm locale={locale} />
    </div>
  );
}
