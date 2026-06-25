import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { VENEZUELAN_STATES, type ResourceLink } from '@/lib/supabase/types';
import { Filters } from './filters';

export const dynamic = 'force-dynamic';

const CATEGORY_ORDER = [
  'emergency',
  'hospital',
  'shelter',
  'related_tool',
  'official_app',
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
  related_tool: { es: 'Otros sitios y herramientas', en: 'Other sites and tools' },
};

type Params = {
  scope?: string;
  state?: string;
  country?: string;
  category?: string;
  q?: string;
};

export default async function RecursosPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { scope, state, country, category, q } = await searchParams;
  const isDiaspora = scope === 'diaspora';

  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('resource_links')
    .select('id, category, title, description, url_or_contact, country, state, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (isDiaspora) {
    // Diaspora resources: anything tagged with a country (e.g. ICRC Cruz Roja
    // by country, or consular help).
    query = query.not('country', 'is', null);
    if (country) query = query.eq('country', country);
  } else {
    // Inside Venezuela: country is null OR explicitly 'VE'.
    query = query.or('country.is.null,country.eq.VE');
    if (state && (VENEZUELAN_STATES as readonly string[]).includes(state)) {
      query = query.eq('state', state);
    }
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data: links } = await query;

  const byCategory = new Map<string, ResourceLink[]>();
  for (const l of links ?? []) {
    if (!byCategory.has(l.category)) byCategory.set(l.category, []);
    byCategory.get(l.category)!.push(l as ResourceLink);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c as never)),
  ];

  // Build country list for the diaspora filter from what's actually in the data,
  // so the dropdown only shows countries we have resources for.
  const availableCountries = isDiaspora
    ? [...new Set((links ?? []).map((l) => l.country).filter((c): c is string => !!c))].sort()
    : [];

  const total = links?.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.resources.title}</h1>

      {/* Scope toggle: inside Venezuela vs diaspora */}
      <div className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white p-1">
        <Link
          href={`/recursos${category ? `?category=${category}` : ''}`}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${!isDiaspora ? 'bg-[#254499] text-white' : 'text-slate-700'}`}
        >
          🇻🇪 {locale === 'es' ? 'En Venezuela' : 'Inside Venezuela'}
        </Link>
        <Link
          href={`/recursos?scope=diaspora${category ? `&category=${category}` : ''}`}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${isDiaspora ? 'bg-[#254499] text-white' : 'text-slate-700'}`}
        >
          🌎 {locale === 'es' ? 'Diáspora' : 'Diaspora'}
        </Link>
      </div>

      <Filters
        currentScope={isDiaspora ? 'diaspora' : 'inside'}
        currentState={state}
        currentCountry={country}
        currentCategory={category}
        currentQ={q}
        availableCountries={availableCountries}
        categoryOptions={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
          value,
          label: label[locale],
        }))}
        locale={locale}
      />

      {/* Quick jump anchors */}
      {orderedCategories.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
          {orderedCategories.map((cat) => {
            const count = byCategory.get(cat)?.length ?? 0;
            const label = CATEGORY_LABEL[cat]?.[locale] ?? cat;
            return (
              <a
                key={cat}
                href={`#cat-${cat}`}
                className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
              >
                {label} <span className="text-slate-400">({count})</span>
              </a>
            );
          })}
        </div>
      )}

      {total === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {locale === 'es'
            ? 'No hay recursos para esta selección.'
            : 'No resources match this selection.'}
        </p>
      )}

      {orderedCategories.map((cat) => {
        const items = byCategory.get(cat) ?? [];
        const label = CATEGORY_LABEL[cat]?.[locale] ?? cat;
        return (
          <section key={cat} id={`cat-${cat}`} className="mt-8 scroll-mt-4">
            <h2 className="text-lg font-semibold">
              {label}{' '}
              <span className="text-sm font-normal text-slate-500">({items.length})</span>
            </h2>
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
