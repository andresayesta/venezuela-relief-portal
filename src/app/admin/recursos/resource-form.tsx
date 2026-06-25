'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RESOURCE_CATEGORIES, VENEZUELAN_STATES, type ResourceLink } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';
import type { ActionResult } from '../admin-actions';

export function ResourceForm({
  initial,
  isAdmin,
  locale,
  onSubmit,
  onDelete,
  submitLabelOverride,
}: {
  initial?: Partial<ResourceLink>;
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

  function submit(publish: boolean) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      if (publish) form.set('publish', '1');
      setError(null);
      start(async () => {
        const r = await onSubmit(form);
        if ('error' in r) setError(r.error);
        else {
          router.push('/admin/recursos');
          router.refresh();
        }
      });
    };
  }

  return (
    <form className="space-y-4" onSubmit={submit(false)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`${locale === 'es' ? 'Categoría' : 'Category'} *`}>
          <select name="category" required defaultValue={initial?.category ?? ''} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
            <option value="" disabled>—</option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{locale === 'es' ? c.es : c.en}</option>
            ))}
          </select>
        </Field>
        <Field label={locale === 'es' ? 'Orden (menor = arriba)' : 'Sort order (lower = top)'}>
          <input name="sort_order" type="number" defaultValue={initial?.sort_order ?? 0} className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
      </div>

      <Field label={`${locale === 'es' ? 'Título' : 'Title'} *`}>
        <input name="title" required defaultValue={initial?.title ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>

      <Field label={locale === 'es' ? 'Descripción' : 'Description'}>
        <textarea name="description" rows={2} defaultValue={initial?.description ?? ''} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </Field>

      <Field label={locale === 'es' ? 'URL o número de contacto' : 'URL or contact number'}>
        <input name="url_or_contact" defaultValue={initial?.url_or_contact ?? ''} placeholder={locale === 'es' ? 'https://... o 911' : 'https://... or 911'} className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={locale === 'es' ? 'País (p.ej. Colombia)' : 'Country (e.g. Colombia)'}>
          <input name="country" defaultValue={initial?.country ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={tr.centers.filterState}>
          <select name="state" defaultValue={initial?.state ?? ''} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
            <option value="">—</option>
            {VENEZUELAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      {error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="flex-1 rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50">
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
                  router.push('/admin/recursos');
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
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">{label}</span>
      {children}
    </label>
  );
}
