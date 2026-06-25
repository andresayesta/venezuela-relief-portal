import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TrustBadge } from '@/components/TrustBadge';

export const dynamic = 'force-dynamic';

export default async function CanalesAdmin() {
  await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from('donation_channels')
    .select('id, name, category, trust_tier, is_published, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tr.admin.manageChannels}</h1>
        <Link href="/admin/canales/new" className="rounded bg-[#254499] px-3 py-2 text-sm font-medium text-white">
          + {locale === 'es' ? 'Canal' : 'Channel'}
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {(rows ?? []).map((c) => (
          <li key={c.id}>
            <Link href={`/admin/canales/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">{c.category ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {!c.is_published && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    {locale === 'es' ? 'Pendiente' : 'Pending'}
                  </span>
                )}
                <TrustBadge tier={c.trust_tier} locale={locale} />
              </div>
            </Link>
          </li>
        ))}
        {(rows ?? []).length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            {locale === 'es' ? 'Nada todavía.' : 'Nothing yet.'}
          </li>
        )}
      </ul>
    </div>
  );
}
