'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Locale } from '@/lib/i18n';

export function ResetForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Supabase puts a temporary session in the URL hash when the user clicks the
  // reset link. The browser client reads it into the session automatically; we
  // just need to wait for that handshake before letting the user submit.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    // Also handle the case where the session is already present on mount.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(
        locale === 'es'
          ? 'Mínimo 8 caracteres.'
          : 'At least 8 characters.',
      );
      return;
    }
    if (password !== confirm) {
      setError(
        locale === 'es'
          ? 'Las contraseñas no coinciden.'
          : 'Passwords don’t match.',
      );
      return;
    }
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {!ready && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {locale === 'es'
            ? 'Verificando enlace... si no carga, abre el enlace del correo desde un navegador moderno.'
            : 'Verifying link... if it doesn’t load, open the email link in a modern browser.'}
        </p>
      )}
      <label className="block">
        <span className="text-sm font-medium">
          {locale === 'es' ? 'Nueva contraseña' : 'New password'}
        </span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          {locale === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
        </span>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </label>
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !ready}
        className="w-full rounded bg-[#254499] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? '...' : locale === 'es' ? 'Cambiar contraseña' : 'Update password'}
      </button>
    </form>
  );
}
