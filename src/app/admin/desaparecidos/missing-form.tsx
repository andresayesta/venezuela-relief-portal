'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { VENEZUELAN_STATES, type MissingPerson } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';
import type { ActionResult } from '../admin-actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Initial = Partial<MissingPerson>;

// Single-person edit form. The new-person flow lives in multi-form.tsx
// (handles AI extraction and family groups).
export function MissingForm({
  initial,
  isAdmin,
  locale,
  onSubmit,
  onDelete,
  submitLabelOverride,
}: {
  initial?: Initial;
  isAdmin: boolean;
  locale: Locale;
  onSubmit: (form: FormData) => Promise<ActionResult>;
  onDelete?: () => Promise<ActionResult>;
  submitLabelOverride?: string;
}) {
  const tr = t(locale);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [consent, setConsent] = useState<boolean>(initial?.consent_to_publish ?? false);

  async function handleUpload(file: File) {
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

  function submit(publish: boolean) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      form.set('photo_url', photoUrl ?? '');
      form.set('consent_to_publish', consent ? '1' : '');
      if (publish) form.set('publish', '1');
      setError(null);
      start(async () => {
        const result = await onSubmit(form);
        if ('error' in result) setError(result.error);
        else {
          router.push('/admin');
          router.refresh();
        }
      });
    };
  }

  return (
    <form className="space-y-5" onSubmit={submit(false)}>
      <section className="rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Foto pública' : 'Public photo'}
        </p>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="mt-2 max-h-60 rounded border border-slate-200" />
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            {locale === 'es' ? 'Imagen que se muestra en el sitio público.' : 'Image shown on the public site.'}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-sm">
            {uploading
              ? '...'
              : photoUrl
                ? locale === 'es' ? 'Cambiar' : 'Replace'
                : locale === 'es' ? 'Subir foto' : 'Upload photo'}
            <input
              type="file"
              accept="image/*"
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
              className="rounded border border-slate-300 px-3 py-1.5 text-sm"
            >
              {locale === 'es' ? 'Quitar' : 'Remove'}
            </button>
          )}
        </div>
      </section>

      <Field label={`${locale === 'es' ? 'Nombre completo' : 'Full name'} *`}>
        <input
          name="full_name"
          required
          defaultValue={initial?.full_name ?? ''}
          className="w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={locale === 'es' ? 'Edad' : 'Age'}>
          <input
            name="age"
            type="number"
            min={0}
            max={120}
            defaultValue={initial?.age ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </Field>
        <Field label={locale === 'es' ? 'Relación con el reportante' : 'Relationship to reporter'}>
          <input
            name="relationship"
            defaultValue={initial?.relationship ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={tr.missing.lastSeen + ' (' + (locale === 'es' ? 'estado' : 'state') + ')'}>
          <select
            name="last_seen_state"
            defaultValue={initial?.last_seen_state ?? ''}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base"
          >
            <option value="">—</option>
            {VENEZUELAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label={tr.missing.lastSeen + ' (' + (locale === 'es' ? 'fecha' : 'date') + ')'}>
          <input
            name="last_seen_date"
            type="date"
            defaultValue={initial?.last_seen_date ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </Field>
      </div>

      <Field label={locale === 'es' ? 'Lugar visto por última vez' : 'Last seen location'}>
        <input
          name="last_seen_location"
          defaultValue={initial?.last_seen_location ?? ''}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </Field>

      <Field label={locale === 'es' ? 'Descripción' : 'Description'}>
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ''}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={locale === 'es' ? 'Reportante (nombre)' : 'Reporter (name)'}>
          <input
            name="reporter_name"
            defaultValue={initial?.reporter_name ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label={locale === 'es' ? 'Reportante (contacto)' : 'Reporter (contact)'}>
          <input
            name="reporter_contact"
            defaultValue={initial?.reporter_contact ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label={locale === 'es' ? 'Estado' : 'Status'}>
          <select
            name="status"
            defaultValue={initial?.status ?? 'missing'}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base"
          >
            <option value="missing">{locale === 'es' ? 'Desaparecido' : 'Missing'}</option>
            <option value="found_safe">{locale === 'es' ? 'Encontrado' : 'Found safe'}</option>
            <option value="closed">{locale === 'es' ? 'Cerrado' : 'Closed'}</option>
          </select>
        </Field>
        <Field label={tr.admin.trustTier}>
          <select
            name="trust_tier"
            defaultValue={initial?.trust_tier ?? 'reported'}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base"
          >
            <option value="unverified">{locale === 'es' ? 'Sin verificar' : 'Unverified'}</option>
            <option value="reported">{tr.badges.reported}</option>
            <option value="verified">{tr.badges.verified}</option>
          </select>
        </Field>
        <Field label={locale === 'es' ? 'Fuente' : 'Source'}>
          <input
            name="source"
            defaultValue={initial?.source ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <label className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm text-amber-900">
          {locale === 'es'
            ? 'El reportante autoriza publicar el caso aquí. Necesario para publicar.'
            : 'The reporter has authorized public listing here. Required for publishing.'}
        </span>
      </label>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {submitLabelOverride ?? tr.admin.saveDraft}
        </button>
        {isAdmin && (
          <button
            type="button"
            disabled={pending || !consent}
            onClick={(e) => {
              const formEl = (e.currentTarget.closest('form') as HTMLFormElement) ?? null;
              if (formEl) submit(true)({ preventDefault: () => {}, currentTarget: formEl } as unknown as React.FormEvent<HTMLFormElement>);
            }}
            className="flex-1 rounded bg-[#254499] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            title={!consent ? (locale === 'es' ? 'Marca el consentimiento primero' : 'Check consent first') : undefined}
          >
            {tr.admin.savePublish}
          </button>
        )}
        {onDelete && isAdmin && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(locale === 'es' ? '¿Eliminar?' : 'Delete?')) return;
              start(async () => {
                const r = await onDelete();
                if ('error' in r) setError(r.error);
                else {
                  router.push('/admin');
                  router.refresh();
                }
              });
            }}
            className="rounded border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-50"
          >
            {tr.admin.delete}
          </button>
        )}
      </div>
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
