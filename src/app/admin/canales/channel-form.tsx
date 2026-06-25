'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DONATION_CATEGORIES, type DonationChannel } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';
import type { ActionResult } from '../admin-actions';

export function ChannelForm({
  initial,
  isAdmin,
  locale,
  onSubmit,
  onDelete,
  submitLabelOverride,
}: {
  initial?: Partial<DonationChannel>;
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
          router.push('/admin/canales');
          router.refresh();
        }
      });
    };
  }

  return (
    <form className="space-y-4" onSubmit={submit(false)}>
      <Field label={`${locale === 'es' ? 'Nombre' : 'Name'} *`}>
        <input name="name" required defaultValue={initial?.name ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Descripción' : 'Description'}>
        <textarea name="description" rows={3} defaultValue={initial?.description ?? ''} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={locale === 'es' ? 'Categoría' : 'Category'}>
          <select name="category" defaultValue={initial?.category ?? 'general'} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
            {DONATION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{locale === 'es' ? c.es : c.en}</option>
            ))}
          </select>
        </Field>
        <Field label={tr.admin.trustTier}>
          <select name="trust_tier" defaultValue={initial?.trust_tier ?? 'verified'} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
            <option value="verified">{tr.badges.verified}</option>
            <option value="reported">{tr.badges.reported}</option>
          </select>
        </Field>
      </div>
      <Field label="URL">
        <input name="url" type="url" defaultValue={initial?.url ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={tr.donate.whyTrusted}>
        <input name="why_trusted" defaultValue={initial?.why_trusted ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Nota de eficiencia (ej. matching 5x)' : 'Efficiency note (e.g. 5x match)'}>
        <input name="efficiency_note" defaultValue={initial?.efficiency_note ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
      </Field>
      <Field label={locale === 'es' ? 'Detalles de pago (wire, Zelle, Venmo, dirección)' : 'Payment details (wire, Zelle, Venmo, address)'}>
        <textarea
          name="payment_details"
          rows={6}
          placeholder={locale === 'es' ? 'Banco: ...\nABA: ...\nSWIFT: ...\nCuenta: ...' : 'Bank: ...\nABA: ...\nSWIFT: ...\nAccount: ...'}
          defaultValue={initial?.payment_details ?? ''}
          className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <span className="mt-1 block text-xs text-slate-500">
          {locale === 'es'
            ? 'Aparece en un panel desplegable separado en la tarjeta pública.'
            : 'Shown in a separate collapsible panel on the public card.'}
        </span>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={locale === 'es' ? 'Región de enfoque' : 'Region focus'}>
          <input name="region_focus" defaultValue={initial?.region_focus ?? ''} className="w-full rounded border border-slate-300 px-3 py-2" />
        </Field>
        <Field label={locale === 'es' ? 'Orden (menor = arriba)' : 'Sort order (lower = top)'}>
          <input name="sort_order" type="number" defaultValue={initial?.sort_order ?? 0} className="w-full rounded border border-slate-300 px-3 py-2" />
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
                  router.push('/admin/canales');
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
