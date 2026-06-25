'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { quickAddFromUrlAction } from './actions';
import type { Locale } from '@/lib/i18n';

export function QuickAddForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setStatus(locale === 'es' ? 'Cargando la página…' : 'Loading page…');
    start(async () => {
      try {
        const result = await quickAddFromUrlAction(url.trim());
        if ('error' in result) {
          setError(result.error);
          setStatus(null);
          return;
        }
        setStatus(locale === 'es' ? '✓ Borrador creado. Redirigiendo…' : '✓ Draft created. Redirecting…');
        router.push(result.redirect);
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : locale === 'es' ? 'Error inesperado.' : 'Unexpected error.',
        );
        setStatus(null);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'URL' : 'URL'}
        </span>
        <input
          type="url"
          required
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-[#254499] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending
          ? (status ?? (locale === 'es' ? 'Procesando…' : 'Processing…'))
          : locale === 'es' ? 'Leer URL y crear borrador' : 'Read URL and create draft'}
      </button>

      {status && !pending && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {status}
        </p>
      )}
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-600">
        <li>
          {locale === 'es'
            ? 'La IA decide si es un centro, persona desaparecida, canal de donación o recurso.'
            : 'The AI decides whether it\'s a center, missing person, donation channel, or resource.'}
        </li>
        <li>
          {locale === 'es'
            ? 'Cada borrador se crea con trust_tier = unverified y is_published = false. Tú decides si publicarlo.'
            : 'Each draft is created with trust_tier = unverified and is_published = false. You decide if it goes live.'}
        </li>
        <li>
          {locale === 'es'
            ? 'Páginas detrás de login (Instagram privado, Facebook, etc.) no se pueden leer. Usa una captura en la admin de centros/desaparecidos para esos casos.'
            : 'Login-gated pages (private Instagram, Facebook, etc.) can\'t be read. Use a screenshot in the centro/missing admin for those.'}
        </li>
      </ul>
    </form>
  );
}
