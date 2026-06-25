import Link from 'next/link';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { PendingQueue } from './pending-queue';
import { TipsFeed } from './tips-feed';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await requireTeam();
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();

  // Pending queue: unpublished centers + missing persons, with adder names.
  // Tips feed: unreviewed public submissions, with which person they apply to.
  const [
    { data: pendingCenters },
    { data: pendingMissing },
    { data: newTips },
  ] = await Promise.all([
    supabase
      .from('collection_centers')
      .select('id, name, state, direction, trust_tier, created_at, created_by, submitted_by, profiles:created_by(full_name)')
      .eq('is_published', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('missing_persons')
      .select('id, full_name, last_seen_state, trust_tier, created_at, created_by, submitted_by, profiles:created_by(full_name)')
      .eq('is_published', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('missing_person_tips')
      .select('id, missing_person_id, tip_giver_name, tip_giver_contact, info, created_at, missing_persons:missing_person_id(full_name)')
      .eq('reviewed', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{tr.admin.dashboard}</h1>
        <p className="text-sm text-slate-600">
          {session.profile.full_name ?? session.email}
          {' · '}
          <span className="uppercase tracking-wide text-slate-500">
            {session.profile.role}
          </span>
        </p>
      </div>

      {/* Primary daily workflow */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SectionCard
          href="/admin/centros"
          title={tr.admin.manageCenters}
          desc={locale === 'es'
            ? 'Ver, agregar y editar centros de acopio.'
            : 'View, add, and edit collection centers.'}
        />
        <SectionCard
          href="/admin/desaparecidos"
          title={tr.admin.manageMissing}
          desc={locale === 'es'
            ? 'Ver, agregar y editar reportes de desaparecidos.'
            : 'View, add, and edit missing-person reports.'}
        />
      </div>

      {/* Admin-only sections (Equipo moved to the top nav) */}
      {session.profile.role === 'admin' && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SectionCard
            href="/admin/canales"
            title={tr.admin.manageChannels}
            desc={locale === 'es' ? 'Canales verificados.' : 'Verified channels.'}
            compact
          />
          <SectionCard
            href="/admin/recursos"
            title={tr.admin.manageResources}
            desc={locale === 'es' ? 'Emergencias, refugios, etc.' : 'Emergency, shelters, etc.'}
            compact
          />
        </div>
      )}

      {(newTips ?? []).length > 0 && (
        <TipsFeed tips={newTips ?? []} locale={locale} />
      )}

      <PendingQueue
        centers={pendingCenters ?? []}
        missing={pendingMissing ?? []}
        role={session.profile.role}
        locale={locale}
      />
    </div>
  );
}

function SectionCard({
  href,
  title,
  desc,
  compact,
}: {
  href: string;
  title: string;
  desc: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-lg border-2 border-[#254499] bg-white text-left transition hover:bg-[#254499] hover:text-white ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <h2 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>{title}</h2>
      <p className={`mt-1 text-sm text-slate-600 group-hover:text-white/90 ${compact ? 'text-xs' : ''}`}>
        {desc}
      </p>
    </Link>
  );
}
