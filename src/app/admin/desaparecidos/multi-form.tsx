'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { extractMissingFromImage, type ExtractedPerson } from './ai-extract-missing';
import { createMissingGroupAction } from '../admin-actions';

type PersonDraft = {
  uid: string;
  full_name: string;
  age: string; // string to handle empty
  last_seen_location: string;
  last_seen_state: string;
  last_seen_date: string;
  description: string;
  relationship: string;
};

function emptyPerson(): PersonDraft {
  return {
    uid: crypto.randomUUID(),
    full_name: '',
    age: '',
    last_seen_location: '',
    last_seen_state: '',
    last_seen_date: '',
    description: '',
    relationship: '',
  };
}

function fromExtracted(e: ExtractedPerson): PersonDraft {
  return {
    uid: crypto.randomUUID(),
    full_name: e.full_name ?? '',
    age: e.age != null ? String(e.age) : '',
    last_seen_location: e.last_seen_location ?? '',
    last_seen_state: e.last_seen_state ?? '',
    last_seen_date: e.last_seen_date ?? '',
    description: e.description ?? '',
    relationship: e.relationship ?? '',
  };
}

export function MultiMissingForm({
  isAdmin,
  locale,
}: {
  isAdmin: boolean;
  locale: Locale;
}) {
  const tr = t(locale);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [useScreenshotAsPhoto, setUseScreenshotAsPhoto] = useState(true);

  const [persons, setPersons] = useState<PersonDraft[]>([emptyPerson()]);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [trustTier, setTrustTier] = useState<'unverified' | 'reported' | 'verified'>('reported');
  const [consent, setConsent] = useState(false);

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

  async function handleExtract() {
    if (!photoUrl) return;
    setError(null);
    setExtracting(true);
    try {
      const result = await extractMissingFromImage(photoUrl);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      const newPersons = result.data.persons.map(fromExtracted);
      setPersons(newPersons.length ? newPersons : [emptyPerson()]);
      if (result.data.reporter_name) setReporterName(result.data.reporter_name);
      if (result.data.reporter_contact) setReporterContact(result.data.reporter_contact);
    } finally {
      setExtracting(false);
    }
  }

  function updatePerson(uid: string, patch: Partial<PersonDraft>) {
    setPersons((curr) => curr.map((p) => (p.uid === uid ? { ...p, ...patch } : p)));
  }
  function addPerson() {
    setPersons((curr) => [...curr, emptyPerson()]);
  }
  function removePerson(uid: string) {
    setPersons((curr) => (curr.length > 1 ? curr.filter((p) => p.uid !== uid) : curr));
  }

  function submit(publish: boolean) {
    setError(null);
    start(async () => {
      const result = await createMissingGroupAction({
        persons: persons.map((p) => ({
          full_name: p.full_name,
          age: p.age ? Number(p.age) : null,
          last_seen_location: p.last_seen_location || null,
          last_seen_state: p.last_seen_state || null,
          last_seen_date: p.last_seen_date || null,
          description: p.description || null,
          relationship: p.relationship || null,
        })),
        photo_url: useScreenshotAsPhoto ? photoUrl : null,
        reporter_name: reporterName || null,
        reporter_contact: reporterContact || null,
        source: sourceText || null,
        trust_tier: trustTier,
        consent_to_publish: consent,
        publish,
      });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push('/admin');
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Screenshot upload */}
      <section className="rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {locale === 'es' ? 'Captura del post' : 'Post screenshot'}
        </p>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="mt-2 max-h-80 rounded border border-slate-200" />
        )}
        <p className={`${photoUrl ? 'mt-2' : 'mt-1'} text-xs text-slate-500`}>
          {locale === 'es'
            ? 'Sube la imagen original. Si contiene la foto de la persona, también se usará públicamente.'
            : 'Upload the original. If it includes the person’s photo, it doubles as the public image.'}
        </p>
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
        {photoUrl && (
          <label className="mt-3 flex items-start gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={useScreenshotAsPhoto}
              onChange={(e) => setUseScreenshotAsPhoto(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              {locale === 'es'
                ? 'Usar esta imagen como foto pública para todas las personas del grupo.'
                : 'Use this image as the public photo for everyone in the group.'}
            </span>
          </label>
        )}
      </section>

      {/* Persons */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {locale === 'es' ? 'Personas' : 'Persons'} ({persons.length})
          </h2>
          <button
            type="button"
            onClick={addPerson}
            className="rounded border border-slate-300 px-3 py-1 text-xs"
          >
            + {locale === 'es' ? 'Agregar persona' : 'Add person'}
          </button>
        </div>
        <ul className="mt-3 space-y-3">
          {persons.map((p, i) => (
            <li key={p.uid} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  #{i + 1}
                </p>
                {persons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePerson(p.uid)}
                    className="text-xs text-red-700"
                  >
                    {locale === 'es' ? 'Quitar' : 'Remove'}
                  </button>
                )}
              </div>
              <Field label={`${locale === 'es' ? 'Nombre' : 'Name'} *`}>
                <input
                  value={p.full_name}
                  onChange={(e) => updatePerson(p.uid, { full_name: e.target.value })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-base"
                />
              </Field>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label={locale === 'es' ? 'Edad' : 'Age'}>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={p.age}
                    onChange={(e) => updatePerson(p.uid, { age: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </Field>
                <Field label={locale === 'es' ? 'Relación' : 'Relationship'}>
                  <input
                    value={p.relationship}
                    onChange={(e) => updatePerson(p.uid, { relationship: e.target.value })}
                    placeholder={locale === 'es' ? 'p.ej. hija' : 'e.g. daughter'}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </Field>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label={locale === 'es' ? 'Visto en (estado)' : 'Last seen (state)'}>
                  <select
                    value={p.last_seen_state}
                    onChange={(e) => updatePerson(p.uid, { last_seen_state: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="">—</option>
                    {VENEZUELAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label={locale === 'es' ? 'Visto el (fecha)' : 'Last seen (date)'}>
                  <input
                    type="date"
                    value={p.last_seen_date}
                    onChange={(e) => updatePerson(p.uid, { last_seen_date: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </Field>
              </div>
              <Field label={locale === 'es' ? 'Lugar específico' : 'Specific place'}>
                <input
                  value={p.last_seen_location}
                  onChange={(e) => updatePerson(p.uid, { last_seen_location: e.target.value })}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </Field>
              <Field label={locale === 'es' ? 'Descripción' : 'Description'}>
                <textarea
                  value={p.description}
                  rows={2}
                  onChange={(e) => updatePerson(p.uid, { description: e.target.value })}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            </li>
          ))}
        </ul>
      </section>

      {/* Shared reporter info */}
      <section className="rounded-lg border border-slate-200 p-3">
        <h2 className="text-sm font-semibold">
          {locale === 'es' ? 'Quien reportó (compartido)' : 'Reporter (shared)'}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label={locale === 'es' ? 'Nombre' : 'Name'}>
            <input
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </Field>
          <Field label={locale === 'es' ? 'Contacto' : 'Contact'}>
            <input
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              placeholder={locale === 'es' ? 'teléfono o email' : 'phone or email'}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label={tr.admin.trustTier}>
            <select
              value={trustTier}
              onChange={(e) => setTrustTier(e.target.value as typeof trustTier)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2"
            >
              <option value="unverified">{locale === 'es' ? 'Sin verificar' : 'Unverified'}</option>
              <option value="reported">{tr.badges.reported}</option>
              <option value="verified">{tr.badges.verified}</option>
            </select>
          </Field>
          <Field label={locale === 'es' ? 'Fuente' : 'Source'}>
            <input
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="WhatsApp, Instagram, etc."
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </Field>
        </div>
      </section>

      <label className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm text-amber-900">
          {locale === 'es'
            ? 'El reportante autoriza publicar a todas las personas listadas. Necesario para publicar.'
            : 'The reporter has authorized public listing for everyone listed here. Required to publish.'}
        </span>
      </label>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="flex-1 rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {tr.admin.saveDraft}
        </button>
        {isAdmin && (
          <button
            type="button"
            disabled={pending || !consent}
            onClick={() => submit(true)}
            className="flex-1 rounded bg-[#254499] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            title={!consent ? (locale === 'es' ? 'Marca el consentimiento primero' : 'Check consent first') : undefined}
          >
            {tr.admin.savePublish}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-2 block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
