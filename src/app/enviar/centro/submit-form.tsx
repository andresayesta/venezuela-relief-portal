'use client';

import { useState, useTransition } from 'react';
import { VENEZUELAN_STATES, COUNTRY_OPTIONS } from '@/lib/supabase/types';
import { Turnstile } from '@/components/Turnstile';
import type { Locale } from '@/lib/i18n';
import { submitCenterAction } from '../actions';

export function CenterSubmitForm({ locale }: { locale: Locale }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('VE');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!token && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError(locale === 'es' ? 'Completa la verificación.' : 'Complete the verification.');
      return;
    }
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await submitCenterAction({
        turnstile_token: token ?? '',
        submitter_name: (form.get('submitter_name') as string) || null,
        submitter_contact: (form.get('submitter_contact') as string) || '',
        name: (form.get('name') as string) || '',
        country,
        state: (form.get('state') as string) || '',
        city: (form.get('city') as string) || null,
        address: (form.get('address') as string) || null,
        accepted_items: (form.get('accepted_items') as string) || '',
        urgent_needs: (form.get('urgent_needs') as string) || null,
        hours: (form.get('hours') as string) || null,
        direction: ((form.get('direction') as 'dropoff' | 'pickup') || 'dropoff'),
        contact_phone: (form.get('contact_phone') as string) || null,
        source: (form.get('source') as string) || null,
      });
      if ('error' in r) setError(r.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <p className="rounded border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        {locale === 'es'
          ? 'Gracias. El equipo verificará el centro y te contactará si necesita confirmar detalles.'
          : 'Thank you. The team will verify the center and reach out if they need details.'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Sobre ti' : 'About you'}
        </legend>
        <Field label={locale === 'es' ? 'Tu nombre (opcional)' : 'Your name (optional)'}>
          <input name="submitter_name" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={`${locale === 'es' ? 'Tu contacto' : 'Your contact'} *`}>
          <input name="submitter_contact" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Sobre el centro' : 'About the center'}
        </legend>
        <Field label={`${locale === 'es' ? 'Nombre' : 'Name'} *`}>
          <input name="name" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={`${locale === 'es' ? 'País' : 'Country'} *`}>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{locale === 'es' ? c.es : c.en}</option>
              ))}
            </select>
          </Field>
          <Field label={locale === 'es' ? 'Tipo' : 'Type'}>
            <select name="direction" defaultValue="dropoff" className="w-full rounded border border-slate-300 bg-white px-3 py-2">
              <option value="dropoff">{locale === 'es' ? 'Llevar donaciones' : 'Drop off'}</option>
              <option value="pickup">{locale === 'es' ? 'Recibir ayuda' : 'Pickup'}</option>
            </select>
          </Field>
        </div>
        <Field label={`${
          country === 'VE'
            ? (locale === 'es' ? 'Estado' : 'State')
            : (locale === 'es' ? 'Estado / Región' : 'State / Region')
        } *`}>
          {country === 'VE' ? (
            <select name="state" required defaultValue="" className="w-full rounded border border-slate-300 bg-white px-3 py-2">
              <option value="" disabled>—</option>
              {VENEZUELAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <input name="state" required placeholder={locale === 'es' ? 'p.ej. Florida' : 'e.g. Florida'} className="w-full rounded border border-slate-300 px-3 py-2" />
          )}
        </Field>
        <Field label={locale === 'es' ? 'Ciudad' : 'City'}>
          <input name="city" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={locale === 'es' ? 'Dirección o referencia' : 'Address or landmark'}>
          <input name="address" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={`${locale === 'es' ? 'Aceptan' : 'Accepts'} *`}>
          <input name="accepted_items" required placeholder={locale === 'es' ? 'agua, medicinas, ropa' : 'water, medicine, clothes'} className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={locale === 'es' ? 'Necesidad urgente' : 'Urgent needs'}>
          <input name="urgent_needs" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={locale === 'es' ? 'Horario' : 'Hours'}>
            <input name="hours" className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={locale === 'es' ? 'Teléfono del centro' : 'Center phone'}>
            <input name="contact_phone" className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
        </div>
        <Field label={locale === 'es' ? 'Fuente / cómo lo sabes' : 'Source / how you know'}>
          <input name="source" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
      </fieldset>

      <Turnstile onToken={setToken} onExpire={() => setToken(null)} />

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-[#254499] py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? '...' : locale === 'es' ? 'Enviar reporte' : 'Submit report'}
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
