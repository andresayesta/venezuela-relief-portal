import { getLocale } from '@/lib/locale';
import { ForgotForm } from './forgot-form';

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-semibold">
        {locale === 'es' ? 'Recuperar contraseña' : 'Reset password'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Te enviaremos un enlace para restablecer tu contraseña.'
          : 'We will send you a link to reset your password.'}
      </p>
      <ForgotForm locale={locale} />
    </div>
  );
}
