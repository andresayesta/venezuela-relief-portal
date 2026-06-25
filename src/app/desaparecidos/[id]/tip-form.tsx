'use client';

import { useState, useTransition } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Locale } from '@/lib/i18n';

export function TipForm({
  missingPersonId,
  locale,
}: {
  missingPersonId: string;
  locale: Locale;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [info, setInfo] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim() || !info.trim()) return;
    setError(null);
    start(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from('missing_person_tips').insert({
        missing_person_id: missingPersonId,
        tip_giver_name: name.trim() || null,
        tip_giver_contact: contact.trim(),
        info: info.trim(),
      });
      if (insertError) {
        setError(
          locale === 'es'
            ? 'No se pudo enviar. Intenta de nuevo.'
            : "Couldn't send. Please try again.",
        );
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <p className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
        {locale === 'es'
          ? 'Gracias. Tu mensaje fue recibido. El equipo se comunicará si necesita más detalles.'
          : 'Thank you. Your message was received. The team will reach out if they need more details.'}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Tu nombre (opcional)' : 'Your name (optional)'}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Tu contacto (teléfono o email) *' : 'Your contact (phone or email) *'}
        </span>
        <input
          type="text"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Información *' : 'Information *'}
        </span>
        <textarea
          required
          rows={4}
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          placeholder={
            locale === 'es'
              ? '¿Dónde y cuándo le viste? ¿Llevaba algo distintivo?'
              : 'Where and when did you see them? Anything distinctive?'
          }
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-xs text-red-900">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending || !contact.trim() || !info.trim()}
        className="w-full rounded bg-[#254499] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending
          ? '...'
          : locale === 'es' ? 'Enviar información' : 'Send information'}
      </button>
      <p className="text-xs text-slate-500">
        {locale === 'es'
          ? 'Tu mensaje llega solo al equipo de verificación. No se publica.'
          : 'Your message goes only to the verification team. It is not published.'}
      </p>
    </form>
  );
}
