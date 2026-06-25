import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// Order categories so the most-used ones are on top.
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

const CATEGORY_LABEL: Record<string, { es: string; en: string; descEs: string; descEn: string; icon: string }> = {
  emergency: { es: 'Emergencias', en: 'Emergency', descEs: 'Bomberos, policía, civil, ambulancias y números de emergencia.', descEn: 'Fire, police, civil protection, ambulances and emergency numbers.', icon: '🚨' },
  hospital: { es: 'Hospitales y clínicas', en: 'Hospitals & clinics', descEs: 'Atención médica pública y privada.', descEn: 'Public and private medical care.', icon: '🏥' },
  shelter: { es: 'Refugios oficiales', en: 'Official shelters', descEs: 'Albergues y puntos de refugio temporales.', descEn: 'Temporary shelter locations.', icon: '🏠' },
  related_tool: { es: 'Otros sitios y herramientas', en: 'Other sites & tools', descEs: 'Plataformas y registros aliados (búsqueda, mapas, registros hospitalarios).', descEn: 'Partner platforms and registries (search, maps, hospital lookups).', icon: '🔗' },
  official_app: { es: 'App oficial de reporte', en: 'Official damage-report app', descEs: 'Aplicación oficial para reportar daños.', descEn: 'Official damage-report application.', icon: '📱' },
  official_source: { es: 'Fuentes oficiales', en: 'Official sources', descEs: 'Comunicación oficial e información autorizada.', descEn: 'Official channels and authoritative information.', icon: '📢' },
  consular: { es: 'Ayuda consular', en: 'Consular help', descEs: 'Apoyo consular por país, embajadas y emergencias.', descEn: 'Consular support by country, embassies and emergencies.', icon: '🛂' },
  evacuation: { es: 'Evacuación', en: 'Evacuation', descEs: 'Rutas y apoyo de evacuación.', descEn: 'Evacuation routes and support.', icon: '🚐' },
  family_tracing: { es: 'Búsqueda de familia', en: 'Family tracing', descEs: 'Cruz Roja Internacional y servicios de búsqueda.', descEn: 'ICRC and family-tracing services.', icon: '🔍' },
  anti_scam: { es: 'Evita estafas', en: 'Avoid scams', descEs: 'Cómo reconocer recaudaciones falsas.', descEn: 'How to spot fake fundraisers.', icon: '⚠️' },
  in_kind_guidance: { es: 'Donaciones en especie', en: 'In-kind guidance', descEs: 'Qué donar y cómo enviarlo.', descEn: 'What to donate and how to send it.', icon: '📦' },
  skills_volunteering: { es: 'Voluntariado profesional', en: 'Skills volunteering', descEs: 'Apoyo psicológico, traducción, mapeo de crisis.', descEn: 'Psychological support, translation, crisis mapping.', icon: '🤝' },
};

export default async function RecursosPage() {
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  // Count items per category so each card can show how many are in there.
  const { data: rows } = await supabase
    .from('resource_links')
    .select('category')
    .eq('is_published', true);

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }

  // Categories present in the data, sorted by our preferred order, then anything custom.
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => counts.has(c)),
    ...[...counts.keys()].filter((c) => !CATEGORY_ORDER.includes(c as never)),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{tr.resources.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Toca cualquier categoría para ver los contactos y enlaces. Cada lista es buscable.'
          : 'Tap any category to see contacts and links. Each list is searchable.'}
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {orderedCategories.map((cat) => {
          const meta = CATEGORY_LABEL[cat] ?? null;
          const count = counts.get(cat) ?? 0;
          const label = meta ? (locale === 'es' ? meta.es : meta.en) : cat;
          const desc = meta ? (locale === 'es' ? meta.descEs : meta.descEn) : '';
          return (
            <li key={cat}>
              <Link
                href={`/recursos/${cat}`}
                className="group flex h-full flex-col rounded-xl border-2 border-[#254499] bg-white p-5 transition hover:bg-[#254499] hover:text-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    {meta?.icon && <span className="mr-2">{meta.icon}</span>}
                    {label}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 group-hover:bg-white group-hover:text-[#254499]">
                    {count}
                  </span>
                </div>
                {desc && (
                  <p className="mt-2 text-sm text-slate-600 group-hover:text-white/90">
                    {desc}
                  </p>
                )}
                <p className="mt-3 text-xs font-semibold text-[#254499] group-hover:text-white">
                  {locale === 'es' ? 'Ver →' : 'View →'}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      {orderedCategories.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {locale === 'es'
            ? 'Aún no hay recursos publicados.'
            : 'No resources published yet.'}
        </p>
      )}
    </div>
  );
}
