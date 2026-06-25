import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import type { ResourceLink } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

// Group resource_links by category, with friendly labels in both locales.
const CATEGORY_ORDER = [
  'emergency',
  'official_app',
  'hospital',
  'shelter',
  'official_source',
  'consular',
  'evacuation',
  'family_tracing',
  'anti_scam',
  'in_kind_guidance',
  'skills_volunteering',
] as const;

const CATEGORY_LABEL: Record<string, { es: string; en: string }> = {
  emergency: { es: 'Emergencias', en: 'Emergency' },
  official_app: { es: 'App oficial de reporte', en: 'Official damage-report app' },
  hospital: { es: 'Hospitales', en: 'Hospitals' },
  shelter: { es: 'Refugios oficiales', en: 'Official shelters' },
  official_source: { es: 'Fuentes oficiales', en: 'Official sources' },
  consular: { es: 'Ayuda consular', en: 'Consular help' },
  evacuation: { es: 'Evacuación', en: 'Evacuation' },
  family_tracing: { es: 'Búsqueda de familia', en: 'Family tracing' },
  anti_scam: { es: 'Evita estafas', en: 'Avoid scams' },
  in_kind_guidance: { es: 'Donaciones en especie', en: 'In-kind guidance' },
  skills_volunteering: { es: 'Voluntariado profesional', en: 'Skills volunteering' },
};

export default async function RecursosPage() {
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  const { data: links } = await supabase
    .from('resource_links')
    .select('id, category, title, description, url_or_contact, country, state, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  const byCategory = new Map<string, ResourceLink[]>();
  for (const l of links ?? []) {
    if (!byCategory.has(l.category)) byCategory.set(l.category, []);
    byCategory.get(l.category)!.push(l as ResourceLink);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c as never)),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.resources.title}</h1>

      {orderedCategories.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {locale === 'es'
            ? 'Aún no hay recursos publicados.'
            : 'No resources published yet.'}
        </p>
      )}

      {orderedCategories.map((cat) => {
        const items = byCategory.get(cat) ?? [];
        const label = CATEGORY_LABEL[cat]?.[locale] ?? cat;
        return (
          <section key={cat} className="mt-8">
            <h2 className="text-lg font-semibold">{label}</h2>
            <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {items.map((l) => (
                <li key={l.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{l.title}</p>
                  {l.description && <p className="mt-1 text-xs text-slate-600">{l.description}</p>}
                  {l.url_or_contact && (
                    <p className="mt-1 text-xs">
                      {l.url_or_contact.startsWith('http') ? (
                        <a
                          href={l.url_or_contact}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#254499] hover:underline"
                        >
                          {l.url_or_contact}
                        </a>
                      ) : (
                        <span className="text-slate-700">{l.url_or_contact}</span>
                      )}
                    </p>
                  )}
                  {(l.country || l.state) && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {[l.country, l.state].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
