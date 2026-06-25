import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';
import { CategoryFilters } from './filters';

type ResourceItemRow = {
  id: string;
  title: string;
  description: string | null;
  url_or_contact: string | null;
  country: string | null;
  state: string | null;
};

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, { es: string; en: string }> = {
  emergency: { es: 'Emergencias', en: 'Emergency' },
  hospital: { es: 'Hospitales y clínicas', en: 'Hospitals & clinics' },
  shelter: { es: 'Refugios oficiales', en: 'Official shelters' },
  related_tool: { es: 'Otros sitios y herramientas', en: 'Other sites & tools' },
  official_app: { es: 'App oficial de reporte', en: 'Official damage-report app' },
  official_source: { es: 'Fuentes oficiales', en: 'Official sources' },
  consular: { es: 'Ayuda consular', en: 'Consular help' },
  evacuation: { es: 'Evacuación', en: 'Evacuation' },
  family_tracing: { es: 'Búsqueda de familia', en: 'Family tracing' },
  anti_scam: { es: 'Evita estafas', en: 'Avoid scams' },
  in_kind_guidance: { es: 'Donaciones en especie', en: 'In-kind guidance' },
  skills_volunteering: { es: 'Voluntariado profesional', en: 'Skills volunteering' },
};

type Params = { state?: string; country?: string; q?: string };

export default async function CategoryResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Params>;
}) {
  const { category } = await params;
  const { state, country, q } = await searchParams;
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();

  // Build the base query.
  let query = supabase
    .from('resource_links')
    .select('id, category, title, description, url_or_contact, country, state, sort_order')
    .eq('is_published', true)
    .eq('category', category)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (state && (VENEZUELAN_STATES as readonly string[]).includes(state)) {
    query = query.eq('state', state);
  }
  if (country) {
    query = query.eq('country', country);
  }
  if (q && q.trim()) {
    const safe = q.trim().replace(/[%,]/g, '');
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data: items } = await query;
  const links = items ?? [];

  // Hard-redirect-to-404 if the category has no published items (and isn't a known one).
  if (!CATEGORY_LABEL[category] && links.length === 0) {
    notFound();
  }

  // Build the available state/country lists from the actual data so the filter dropdowns only show real options.
  const availableStates = [...new Set(links.map((l) => l.state).filter((s): s is string => !!s))].sort();
  const availableCountries = [...new Set(links.map((l) => l.country).filter((c): c is string => !!c))].sort();

  const meta = CATEGORY_LABEL[category];
  const label = meta ? (locale === 'es' ? meta.es : meta.en) : category;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/recursos" className="text-sm text-slate-500 hover:text-slate-900">
        ← {locale === 'es' ? 'Todos los recursos' : 'All resources'}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{label}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es' ? `${links.length} contactos` : `${links.length} contacts`}
      </p>

      <CategoryFilters
        category={category}
        currentState={state}
        currentCountry={country}
        currentQ={q}
        availableStates={availableStates}
        availableCountries={availableCountries}
        locale={locale}
      />

      <ul className="mt-5 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {links.map((l) => (
          <ResourceItem key={l.id} item={l} locale={locale} />
        ))}
        {links.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-slate-500">
            {locale === 'es' ? 'Sin resultados para esta selección.' : 'No results for this selection.'}
          </li>
        )}
      </ul>
    </div>
  );
}

function ResourceItem({
  item,
  locale,
}: {
  item: ResourceItemRow;
  locale: 'es' | 'en';
}) {
  return (
    <li className="px-4 py-3">
      <p className="text-sm font-medium">{item.title}</p>
      {item.description && (
        <p className="mt-1 text-xs text-slate-600">{item.description}</p>
      )}
      {item.url_or_contact && (
        <p className="mt-1 text-xs">
          {item.url_or_contact.startsWith('http') ? (
            <a
              href={item.url_or_contact}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#254499] hover:underline"
            >
              {item.url_or_contact}
            </a>
          ) : (
            <span className="text-slate-700">{item.url_or_contact}</span>
          )}
        </p>
      )}
      {(item.country || item.state) && (
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
          {[item.country, item.state].filter(Boolean).join(' · ')}
        </p>
      )}
    </li>
  );
}
