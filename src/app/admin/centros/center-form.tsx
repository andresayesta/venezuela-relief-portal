'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  VENEZUELAN_STATES,
  ACCEPTED_ITEM_OPTIONS,
  SOURCE_CHANNEL_OPTIONS,
  type CollectionCenter,
} from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';
import type { ActionResult } from '../admin-actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { extractCenterFromImage, type ExtractedCenter } from './ai-extract';

type Initial = Partial<CollectionCenter>;

// Split a comma-joined items string into [predefined picks, freeform tail].
function splitItems(text: string | null | undefined) {
  const predefined = new Set(ACCEPTED_ITEM_OPTIONS.map((o) => o.value));
  const picked = new Set<string>();
  const others: string[] = [];
  for (const raw of (text ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const lower = raw.toLowerCase();
    if (predefined.has(lower as never)) picked.add(lower);
    else others.push(raw);
  }
  return { picked, other: others.join(', ') };
}

function joinItems(picked: Set<string>, other: string) {
  const parts = [...picked];
  if (other.trim()) parts.push(other.trim());
  return parts.join(', ');
}

function splitSource(text: string | null | undefined) {
  const known = SOURCE_CHANNEL_OPTIONS.map((o) => o.value);
  for (const ch of known) {
    if (text?.startsWith(ch)) {
      return { channel: ch, specifier: text.slice(ch.length).replace(/^[\s:—-]+/, '') };
    }
  }
  return { channel: '', specifier: text ?? '' };
}

export function CenterForm({
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

  const initialAccepted = splitItems(initial?.accepted_items);
  const initialUrgent = splitItems(initial?.urgent_needs);
  const initialSource = splitSource(initial?.source);

  const [acceptedPicked, setAcceptedPicked] = useState<Set<string>>(initialAccepted.picked);
  const [acceptedOther, setAcceptedOther] = useState(initialAccepted.other);
  const [urgentPicked, setUrgentPicked] = useState<Set<string>>(initialUrgent.picked);
  const [urgentOther, setUrgentOther] = useState(initialUrgent.other);
  const [channel, setChannel] = useState(initialSource.channel);
  const [sourceSpecifier, setSourceSpecifier] = useState(initialSource.specifier);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [eventDate, setEventDate] = useState<string>(initial?.event_date ?? '');

  // Track form-level state that we may need to override before submit.
  const [autofill, setAutofill] = useState<ExtractedCenter | null>(null);
  const [extracting, setExtracting] = useState(false);

  function toggle(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const copy = new Set(set);
    if (copy.has(value)) copy.delete(value);
    else copy.add(value);
    setter(copy);
  }

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('center-photos')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from('center-photos').getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleExtract() {
    if (!photoUrl) return;
    setError(null);
    setExtracting(true);
    try {
      const result = await extractCenterFromImage(photoUrl);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setAutofill(result.data);
      // Apply the structured fields immediately.
      const acc = splitItems((result.data.accepted_items ?? []).join(', '));
      const urg = splitItems((result.data.urgent_needs ?? []).join(', '));
      setAcceptedPicked(acc.picked);
      setAcceptedOther(acc.other);
      setUrgentPicked(urg.picked);
      setUrgentOther(urg.other);
      if (result.data.event_date) setEventDate(result.data.event_date);
    } finally {
      setExtracting(false);
    }
  }

  function submit(publish: boolean) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      // Overwrite multi-field values with the structured ones from state.
      form.set('accepted_items', joinItems(acceptedPicked, acceptedOther));
      form.set('urgent_needs', joinItems(urgentPicked, urgentOther));
      const sourceJoined = [channel, sourceSpecifier.trim()].filter(Boolean).join(' — ');
      form.set('source', sourceJoined);
      form.set('photo_url', photoUrl ?? '');
      form.set('event_date', eventDate || '');
      if (publish) form.set('publish', '1');
      setError(null);
      start(async () => {
        const result = await onSubmit(form);
        if ('error' in result) {
          setError(result.error);
        } else {
          router.push('/admin');
          router.refresh();
        }
      });
    };
  }

  return (
    <form className="space-y-5" onSubmit={submit(false)}>
      {/* Photo + AI extract */}
      <section className="rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Foto / captura' : 'Photo / screenshot'}
        </p>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="mt-2 max-h-60 rounded border border-slate-200" />
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            {locale === 'es'
              ? 'Sube una imagen o captura del mensaje original. Opcional.'
              : 'Upload an image or screenshot of the original message. Optional.'}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-sm">
            {uploading
              ? '...'
              : photoUrl
                ? locale === 'es' ? 'Cambiar' : 'Replace'
                : locale === 'es' ? 'Subir imagen' : 'Upload image'}
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
                onClick={() => setPhotoUrl(null)}
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

      {/* Name */}
      <Field label={`${locale === 'es' ? 'Nombre' : 'Name'} *`}>
        <input
          name="name"
          required
          defaultValue={autofill?.name ?? initial?.name ?? ''}
          key={`name-${autofill?.name ?? ''}`}
          className="w-full rounded border border-slate-300 px-3 py-2 text-base"
        />
      </Field>

      {/* State + direction */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr.centers.filterState + ' *'}>
          <select
            name="state"
            required
            defaultValue={autofill?.state ?? initial?.state ?? ''}
            key={`state-${autofill?.state ?? ''}`}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base"
          >
            <option value="" disabled>—</option>
            {VENEZUELAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label={tr.admin.direction}>
          <select
            name="direction"
            defaultValue={initial?.direction ?? 'dropoff'}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base"
          >
            <option value="dropoff">↓ {tr.centers.directionDropoff}</option>
            <option value="pickup">↑ {tr.centers.directionPickup}</option>
          </select>
        </Field>
      </div>

      {/* Accepted items */}
      <ItemChecklist
        label={tr.centers.acceptedItems + ' *'}
        picked={acceptedPicked}
        onToggle={(v) => toggle(acceptedPicked, v, setAcceptedPicked)}
        other={acceptedOther}
        onOther={setAcceptedOther}
        locale={locale}
        required
      />

      {/* Urgent needs */}
      <ItemChecklist
        label={tr.centers.urgentNeeds}
        picked={urgentPicked}
        onToggle={(v) => toggle(urgentPicked, v, setUrgentPicked)}
        other={urgentOther}
        onOther={setUrgentOther}
        locale={locale}
      />

      {/* Event date — optional, for one-time drives */}
      <div>
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Fecha (si es un evento único)' : 'Date (if a one-time event)'}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-base"
          />
          {eventDate && (
            <button
              type="button"
              onClick={() => setEventDate('')}
              className="rounded border border-slate-300 px-3 py-2 text-xs"
            >
              {locale === 'es' ? 'Quitar fecha' : 'Clear date'}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {locale === 'es'
            ? 'Déjalo vacío si el centro funciona de forma continua.'
            : 'Leave blank if the center runs continuously.'}
        </p>
      </div>

      {/* Location + contact (collapsed by default) */}
      <details className="rounded border border-slate-200 p-3" open={!!(autofill?.city || autofill?.address || autofill?.contact_phone)}>
        <summary className="cursor-pointer text-sm font-medium">
          {locale === 'es' ? 'Ubicación y contacto' : 'Location & contact'}
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={locale === 'es' ? 'Ciudad' : 'City'}>
            <input name="city" defaultValue={autofill?.city ?? initial?.city ?? ''} key={`city-${autofill?.city ?? ''}`} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={locale === 'es' ? 'Sector' : 'Neighborhood'}>
            <input name="neighborhood" defaultValue={autofill?.neighborhood ?? initial?.neighborhood ?? ''} key={`nb-${autofill?.neighborhood ?? ''}`} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={locale === 'es' ? 'Dirección' : 'Address'}>
            <input name="address" defaultValue={autofill?.address ?? initial?.address ?? ''} key={`addr-${autofill?.address ?? ''}`} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={tr.centers.hours}>
            <input name="hours" defaultValue={autofill?.hours ?? initial?.hours ?? ''} key={`h-${autofill?.hours ?? ''}`} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={locale === 'es' ? 'Contacto (nombre)' : 'Contact (name)'}>
            <input name="contact_name" defaultValue={autofill?.contact_name ?? initial?.contact_name ?? ''} key={`cn-${autofill?.contact_name ?? ''}`} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
          <Field label={locale === 'es' ? 'Contacto (teléfono)' : 'Contact (phone)'}>
            <input name="contact_phone" defaultValue={autofill?.contact_phone ?? initial?.contact_phone ?? ''} key={`cp-${autofill?.contact_phone ?? ''}`} className="w-full rounded border border-slate-300 px-3 py-2" />
          </Field>
        </div>
      </details>

      {/* Trust + Source */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
            {locale === 'es' ? 'Fuente' : 'Source'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {SOURCE_CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{locale === 'es' ? o.es : o.en}</option>
              ))}
            </select>
            <input
              value={sourceSpecifier}
              onChange={(e) => setSourceSpecifier(e.target.value)}
              placeholder={locale === 'es' ? 'p.ej. prima Maria' : 'e.g. cousin Maria'}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <Field label={locale === 'es' ? 'Notas (texto crudo del mensaje)' : 'Notes (raw message text)'}>
        <textarea
          name="notes"
          rows={4}
          defaultValue={initial?.notes ?? ''}
          className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
        />
      </Field>

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
            disabled={pending}
            onClick={(e) => {
              const formEl = (e.currentTarget.closest('form') as HTMLFormElement) ?? null;
              if (formEl) submit(true)({ preventDefault: () => {}, currentTarget: formEl } as unknown as React.FormEvent<HTMLFormElement>);
            }}
            className="flex-1 rounded bg-[#254499] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
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

function ItemChecklist({
  label,
  picked,
  onToggle,
  other,
  onOther,
  locale,
  required,
}: {
  label: string;
  picked: Set<string>;
  onToggle: (v: string) => void;
  other: string;
  onOther: (s: string) => void;
  locale: Locale;
  required?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-600">{label}</p>
      <div className="flex flex-wrap gap-2">
        {ACCEPTED_ITEM_OPTIONS.map((o) => {
          const on = picked.has(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onToggle(o.value)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                on
                  ? 'border-[#254499] bg-[#254499] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {on ? '✓ ' : ''}{locale === 'es' ? o.es : o.en}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={other}
        onChange={(e) => onOther(e.target.value)}
        placeholder={locale === 'es' ? 'Otro (separado por comas)' : 'Other (comma separated)'}
        className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />
      {required && picked.size === 0 && !other.trim() && (
        <p className="mt-1 text-xs text-slate-500">
          {locale === 'es' ? 'Selecciona al menos uno.' : 'Select at least one.'}
        </p>
      )}
    </div>
  );
}
