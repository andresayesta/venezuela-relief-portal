'use client';

import { useState, useTransition } from 'react';
import { Turnstile } from '@/components/Turnstile';
import type { Locale } from '@/lib/i18n';
import { submitChannelAction } from '../actions';

export function ChannelSubmitForm({ locale }: { locale: Locale }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!token && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError(locale === 'es' ? 'Completa la verificación.' : 'Complete the verification.');
      return;
    }
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await submitChannelAction({
        turnstile_token: token ?? '',
        submitter_name: (form.get('submitter_name') as string) || null,
        submitter_contact: (form.get('submitter_contact') as string) || '',
        name: (form.get('name') as string) || '',
        description: (form.get('description') as string) || null,
        url: (form.get('url') as string) || null,
        why_trusted: (form.get('why_trusted') as string) || null,
      });
      if ('error' in r) setError(r.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <p className="rounded border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        {locale === 'es'
          ? 'Gracias. El equipo investigará la organización antes de listarla.'
          : 'Thank you. The team will research the org before listing it.'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={`${locale === 'es' ? 'Tu contacto' : 'Your contact'} *`}>
        <input name="submitter_contact" required className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Tu nombre (opcional)' : 'Your name (optional)'}>
        <input name="submitter_name" className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={`${locale === 'es' ? 'Nombre de la organización' : 'Organization name'} *`}>
        <input name="name" required className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Sitio web' : 'Website'}>
        <input name="url" type="url" className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Qué hacen' : 'What they do'}>
        <textarea name="description" rows={3} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label={locale === 'es' ? '¿Por qué confías en esta organización?' : 'Why do you trust this organization?'}>
        <textarea name="why_trusted" rows={3} placeholder={locale === 'es' ? 'p.ej. existía antes del desastre, tengo familia que trabaja ahí, prensa la cubre' : 'e.g. existed before the disaster, family works there, news covers them'} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </Field>

      <Turnstile onToken={setToken} onExpire={() => setToken(null)} />
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-[#254499] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '...' : locale === 'es' ? 'Enviar sugerencia' : 'Submit suggestion'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">{label}</span>
      {children}
    </label>
  );
}
