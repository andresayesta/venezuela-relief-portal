'use client';

import { useState, useTransition } from 'react';
import { RESOURCE_CATEGORIES } from '@/lib/supabase/types';
import { Turnstile } from '@/components/Turnstile';
import type { Locale } from '@/lib/i18n';
import { submitResourceAction } from '../actions';

export function ResourceSubmitForm({ locale }: { locale: Locale }) {
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
      const r = await submitResourceAction({
        turnstile_token: token ?? '',
        submitter_name: (form.get('submitter_name') as string) || null,
        submitter_contact: (form.get('submitter_contact') as string) || '',
        category: (form.get('category') as string) || '',
        title: (form.get('title') as string) || '',
        description: (form.get('description') as string) || null,
        url_or_contact: (form.get('url_or_contact') as string) || null,
        country: (form.get('country') as string) || null,
      });
      if ('error' in r) setError(r.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <p className="rounded border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        {locale === 'es'
          ? 'Gracias. Revisaremos el recurso antes de publicarlo.'
          : 'Thank you. We will review the resource before publishing.'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={`${locale === 'es' ? 'Tu contacto' : 'Your contact'} *`}>
        <input name="submitter_contact" required className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={`${locale === 'es' ? 'Categoría' : 'Category'} *`}>
        <select name="category" required defaultValue="" className="w-full rounded border border-slate-300 bg-white px-3 py-2">
          <option value="" disabled>—</option>
          {RESOURCE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{locale === 'es' ? c.es : c.en}</option>
          ))}
        </select>
      </Field>
      <Field label={`${locale === 'es' ? 'Título' : 'Title'} *`}>
        <input name="title" required className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'URL o número' : 'URL or number'}>
        <input name="url_or_contact" className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Descripción' : 'Description'}>
        <textarea name="description" rows={3} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label={locale === 'es' ? 'País (si aplica)' : 'Country (if applicable)'}>
        <input name="country" className="w-full rounded border border-slate-300 px-3 py-2" />
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
