import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) redirect('/admin');

  const locale = await getLocale();
  const tr = t(locale);
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-semibold">{tr.admin.login}</h1>
      <p className="mt-1 text-sm text-slate-600">{tr.siteName}</p>
      {error === 'no-team' && (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {locale === 'es'
            ? 'No tienes acceso al equipo. Pide a un admin que te invite.'
            : 'No team access. Ask an admin to invite you.'}
        </p>
      )}
      <LoginForm tr={tr.admin} locale={locale} />
    </div>
  );
}
