'use client';

import { useState, useTransition } from 'react';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';
import { Turnstile } from '@/components/Turnstile';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Locale } from '@/lib/i18n';
import { submitMissingAction } from '../actions';

export function MissingSubmitForm({ locale }: { locale: Locale }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError(locale === 'es' ? 'La imagen excede 5 MB.' : 'Image exceeds 5 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(locale === 'es' ? 'Solo se permiten imágenes.' : 'Only image files are allowed.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('missing-photos')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from('missing-photos').getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError(locale === 'es' ? 'Completa la verificación.' : 'Complete the verification.');
      return;
    }
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await submitMissingAction({
        turnstile_token: turnstileToken ?? '',
        submitter_name: (form.get('submitter_name') as string) || null,
        submitter_contact: (form.get('submitter_contact') as string) || '',
        full_name: (form.get('full_name') as string) || '',
        age: (form.get('age') as string) || null,
        last_seen_location: (form.get('last_seen_location') as string) || null,
        last_seen_state: (form.get('last_seen_state') as string) || null,
        last_seen_date: (form.get('last_seen_date') as string) || null,
        description: (form.get('description') as string) || null,
        relationship: (form.get('relationship') as string) || null,
        source: (form.get('source') as string) || null,
        photo_url: photoUrl,
      });
      if ('error' in r) setError(r.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <p className="rounded border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        {locale === 'es'
          ? 'Gracias. El equipo revisará tu reporte y te contactará antes de publicar.'
          : 'Thank you. The team will review your report and contact you before publishing.'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Sobre ti (quien reporta)' : 'About you (the reporter)'}
        </legend>
        <Field label={locale === 'es' ? 'Tu nombre (opcional)' : 'Your name (optional)'}>
          <input name="submitter_name" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={`${locale === 'es' ? 'Tu contacto' : 'Your contact'} *`}>
          <input
            name="submitter_contact"
            required
            placeholder={locale === 'es' ? 'teléfono o email' : 'phone or email'}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label={locale === 'es' ? 'Relación con la persona' : 'Relationship to the person'}>
          <input name="relationship" placeholder={locale === 'es' ? 'p.ej. hijo' : 'e.g. son'} className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Sobre la persona desaparecida' : 'About the missing person'}
        </legend>

        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            {locale === 'es' ? 'Foto (opcional, ayuda a identificar)' : 'Photo (optional, helps with identification)'}
          </p>
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="mt-2 max-h-48 rounded border border-slate-200"
            />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1.5 text-sm">
              {uploading
                ? '...'
                : photoUrl
                  ? locale === 'es' ? 'Cambiar' : 'Replace'
                  : locale === 'es' ? 'Subir foto' : 'Upload photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </label>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
              >
                {locale === 'es' ? 'Quitar' : 'Remove'}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {locale === 'es'
              ? 'Máximo 5 MB. Sólo se muestra públicamente después de que el equipo verifique.'
              : 'Max 5 MB. Only shown publicly after the team verifies.'}
          </p>
        </div>

        <Field label={`${locale === 'es' ? 'Nombre completo' : 'Full name'} *`}>
          <input name="full_name" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={locale === 'es' ? 'Edad' : 'Age'}>
            <input name="age" type="number" min={0} max={120} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={locale === 'es' ? 'Visto el (fecha)' : 'Last seen (date)'}>
            <input name="last_seen_date" type="date" className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
        </div>
        <Field label={locale === 'es' ? 'Visto en (estado)' : 'Last seen (state)'}>
          <select name="last_seen_state" className="w-full rounded border border-slate-300 bg-white px-3 py-2">
            <option value="">—</option>
            {VENEZUELAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label={locale === 'es' ? 'Lugar específico' : 'Specific place'}>
          <input name="last_seen_location" className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={locale === 'es' ? 'Descripción (apariencia, ropa, señas)' : 'Description (appearance, clothing, markers)'}>
          <textarea name="description" rows={3} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </Field>
      </fieldset>

      <p className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        {locale === 'es'
          ? 'Al enviar, autorizas que el equipo te contacte para verificar la información. No publicaremos el reporte sin tu confirmación explícita.'
          : 'By submitting, you authorize the team to contact you to verify the information. We will not publish the report without your explicit confirmation.'}
      </p>

      <Turnstile onToken={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

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
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
