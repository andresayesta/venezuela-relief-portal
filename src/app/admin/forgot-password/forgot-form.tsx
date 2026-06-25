'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Locale } from '@/lib/i18n';

export function ForgotForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/admin/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (error) {
      setError(
        locale === 'es'
          ? 'No se pudo enviar el correo. Verifica el email.'
          : "Couldn't send the email. Check the address.",
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-6 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">
        {locale === 'es'
          ? 'Si la cuenta existe, recibirás un correo con un enlace para restablecer la contraseña.'
          : 'If the account exists, you’ll receive an email with a reset link.'}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">{locale === 'es' ? 'Correo' : 'Email'}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </label>
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-[#254499] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? '...' : locale === 'es' ? 'Enviar enlace' : 'Send link'}
      </button>
      <p className="text-center text-xs">
        <Link href="/admin/login" className="text-slate-500 hover:text-slate-900">
          ← {locale === 'es' ? 'Volver a iniciar sesión' : 'Back to sign in'}
        </Link>
      </p>
    </form>
  );
}
