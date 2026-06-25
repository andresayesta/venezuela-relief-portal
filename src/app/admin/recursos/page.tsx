import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { RESOURCE_CATEGORIES } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function RecursosAdmin() {
  await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from('resource_links')
    .select('id, category, title, country, state, is_published, sort_order')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  const labelFor = (cat: string) =>
    RESOURCE_CATEGORIES.find((c) => c.value === cat)?.[locale === 'es' ? 'es' : 'en'] ?? cat;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tr.admin.manageResources}</h1>
        <Link href="/admin/recursos/new" className="rounded bg-[#254499] px-3 py-2 text-sm font-medium text-white">
          + {locale === 'es' ? 'Recurso' : 'Resource'}
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <Link href={`/admin/recursos/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {labelFor(r.category)}
                  {(r.country || r.state) && ' · ' + [r.country, r.state].filter(Boolean).join(', ')}
                </p>
              </div>
              {!r.is_published && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                  {locale === 'es' ? 'Pendiente' : 'Pending'}
                </span>
              )}
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
