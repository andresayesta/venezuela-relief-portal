'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { VENEZUELAN_STATES, type MissingPerson } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';
import type { ActionResult } from '../admin-actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { extractMissingFromImage, type ExtractedMissing } from './ai-extract-missing';

type Initial = Partial<MissingPerson>;

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

  // Intake screenshot for AI extraction — NOT persisted to the row.
  const [intakeScreenshotUrl, setIntakeScreenshotUrl] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [autofill, setAutofill] = useState<ExtractedMissing | null>(null);
  const [extracting, setExtracting] = useState(false);

  async function uploadToMissingPhotos(
    file: File,
  ): Promise<{ url: string } | { error: string }> {
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('missing-photos')
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) return { error: upErr.message };
    const { data: pub } = supabase.storage.from('missing-photos').getPublicUrl(path);
    return { url: pub.publicUrl };
  }

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const r = await uploadToMissingPhotos(file);
      if ('error' in r) setError(r.error);
      else setPhotoUrl(r.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleScreenshotUpload(file: File) {
    setError(null);
    setUploadingScreenshot(true);
    try {
      const r = await uploadToMissingPhotos(file);
      if ('error' in r) setError(r.error);
      else setIntakeScreenshotUrl(r.url);
    } finally {
      setUploadingScreenshot(false);
    }
  }

  async function handleExtract() {
    if (!intakeScreenshotUrl) return;
    setError(null);
    setExtracting(true);
    try {
      const result = await extractMissingFromImage(intakeScreenshotUrl);
      if ('error' in result) setError(result.error);
      else setAutofill(result.data);
    } finally {
      setExtracting(false);
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
      {/* Intake screenshot + AI extract — NOT saved as the person photo. */}
      <section className="rounded-lg border border-dashed border-slate-300 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Captura del post / mensaje (para IA)' : 'Post / message screenshot (for AI)'}
        </p>
        {intakeScreenshotUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={intakeScreenshotUrl} alt="" className="mt-2 max-h-60 rounded border border-slate-200" />
        )}
        <p className={`${intakeScreenshotUrl ? 'mt-2' : 'mt-1'} text-xs text-slate-500`}>
          {locale === 'es'
            ? 'Captura del post en redes sociales. Se usa solo para leer los datos; no se guarda como foto de la persona.'
            : 'Screenshot of the social post. Used only to read data; not saved as the person photo.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-sm">
            {uploadingScreenshot
              ? '...'
              : intakeScreenshotUrl
                ? locale === 'es' ? 'Cambiar' : 'Replace'
                : locale === 'es' ? 'Subir captura' : 'Upload screenshot'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScreenshotUpload(f);
              }}
            />
          </label>
          {intakeScreenshotUrl && (
            <>
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting}
                className="rounded bg-[#254499] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {extracting
                  ? locale === 'es' ? 'Leyendo...' : 'Reading...'
                  : locale === 'es' ? '✨ Llenar con IA' : '✨ Fill with AI'}
              </button>
              <button
                type="button"
                onClick={() => setIntakeScreenshotUrl(null)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm"
              >
                {locale === 'es' ? 'Quitar' : 'Remove'}
              </button>
            </>
          )}
        </div>
        {autofill && (
          <p className="mt-2 text-xs text-slate-600">
            {locale === 'es'
              ? 'Datos extraídos. Revisa y ajusta los campos antes de guardar.'
              : 'Data extracted. Review and adjust before saving.'}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Foto de la persona' : 'Person photo'}
        </p>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="mt-2 max-h-60 rounded border border-slate-200" />
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            {locale === 'es' ? 'Solo si el reportante consintió.' : 'Only if the reporter consented.'}
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
          defaultValue={autofill?.full_name ?? initial?.full_name ?? ''}
          key={`fn-${autofill?.full_name ?? ''}`}
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
            defaultValue={autofill?.age ?? initial?.age ?? ''}
            key={`age-${autofill?.age ?? ''}`}
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </Field>
        <Field label={locale === 'es' ? 'Relación con el reportante' : 'Relationship to reporter'}>
          <input
            name="relationship"
            placeholder={locale === 'es' ? 'p.ej. hermana' : 'e.g. sister'}
            defaultValue={autofill?.relationship ?? initial?.relationship ?? ''}
            key={`rel-${autofill?.relationship ?? ''}`}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={tr.missing.lastSeen + ' (' + (locale === 'es' ? 'estado' : 'state') + ')'}>
          <select
            name="last_seen_state"
            defaultValue={autofill?.last_seen_state ?? initial?.last_seen_state ?? ''}
            key={`lss-${autofill?.last_seen_state ?? ''}`}
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
            defaultValue={autofill?.last_seen_date ?? initial?.last_seen_date ?? ''}
            key={`lsd-${autofill?.last_seen_date ?? ''}`}
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </Field>
      </div>

      <Field label={locale === 'es' ? 'Lugar visto por última vez' : 'Last seen location'}>
        <input
          name="last_seen_location"
          defaultValue={autofill?.last_seen_location ?? initial?.last_seen_location ?? ''}
          key={`lsl-${autofill?.last_seen_location ?? ''}`}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </Field>

      <Field label={locale === 'es' ? 'Descripción (apariencia, ropa)' : 'Description (appearance, clothing)'}>
        <textarea
          name="description"
          rows={3}
          defaultValue={autofill?.description ?? initial?.description ?? ''}
          key={`desc-${autofill?.description ?? ''}`}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={locale === 'es' ? 'Reportante (nombre)' : 'Reporter (name)'}>
          <input
            name="reporter_name"
            defaultValue={autofill?.reporter_name ?? initial?.reporter_name ?? ''}
            key={`rn-${autofill?.reporter_name ?? ''}`}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label={locale === 'es' ? 'Reportante (contacto)' : 'Reporter (contact)'}>
          <input
            name="reporter_contact"
            placeholder={locale === 'es' ? 'teléfono o email' : 'phone or email'}
            defaultValue={autofill?.reporter_contact ?? initial?.reporter_contact ?? ''}
            key={`rc-${autofill?.reporter_contact ?? ''}`}
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
            ? 'El reportante autoriza publicar el caso aquí.'
            : 'The reporter has authorized public listing here.'}{' '}
          <span className="font-medium">
            {locale === 'es'
              ? 'No se puede publicar sin esto.'
              : 'Required for publishing.'}
          </span>
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
