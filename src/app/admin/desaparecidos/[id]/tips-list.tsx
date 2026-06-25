'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { markTipReviewedAction, unmarkTipReviewedAction } from '../../admin-actions';

type Tip = {
  id: string;
  tip_giver_name: string | null;
  tip_giver_contact: string;
  info: string;
  created_at: string;
  reviewed: boolean;
};

export function TipsList({ tips, locale }: { tips: Tip[]; locale: Locale }) {
  return (
    <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-900">
        {locale === 'es' ? 'Información recibida' : 'Tips received'} ({tips.length})
      </h2>
      <ul className="mt-3 space-y-3">
        {tips.map((tip) => (
          <TipItem key={tip.id} tip={tip} locale={locale} />
        ))}
      </ul>
    </section>
  );
}

function TipItem({ tip, locale }: { tip: Tip; locale: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    start(async () => {
      const action = tip.reviewed ? unmarkTipReviewedAction : markTipReviewedAction;
      const r = await action(tip.id);
      if ('error' in r) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <li className={`rounded-md border p-3 ${tip.reviewed ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-amber-200 bg-white'}`}>
      <p className="text-xs text-slate-500">
        {new Date(tip.created_at).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US')}
        {tip.reviewed ? (
          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            {locale === 'es' ? 'Visto' : 'Reviewed'}
          </span>
        ) : (
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            {locale === 'es' ? 'Nuevo' : 'New'}
          </span>
        )}
      </p>
      <p className="mt-2 text-sm">{tip.info}</p>
      <p className="mt-2 text-xs text-slate-700">
        <span className="font-medium">{locale === 'es' ? 'Contacto' : 'Contact'}:</span>{' '}
        {tip.tip_giver_name ? `${tip.tip_giver_name} — ` : ''}
        {tip.tip_giver_contact}
      </p>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
        >
          {pending
            ? '...'
            : tip.reviewed
              ? locale === 'es' ? 'Marcar como nuevo' : 'Mark as new'
              : locale === 'es' ? '✓ Marcar como visto' : '✓ Mark as seen'}
        </button>
      </div>
    </li>
  );
}
