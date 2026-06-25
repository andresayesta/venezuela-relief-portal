import Link from 'next/link';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { signOutAction } from './actions';
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
      .select('id, name, state, direction, trust_tier, created_at, created_by, profiles:created_by(full_name)')
      .eq('is_published', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('missing_persons')
      .select('id, full_name, last_seen_state, trust_tier, created_at, created_by, profiles:created_by(full_name)')
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
      <div className="flex items-center justify-between">
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
        <form action={signOutAction}>
          <button className="text-sm text-slate-600 hover:text-slate-900">
            {tr.admin.signOut}
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/admin/centros/new"
          className="rounded-lg bg-[#254499] px-4 py-6 text-center text-base font-semibold text-white"
        >
          {tr.admin.addCenter}
        </Link>
        <Link
          href="/admin/desaparecidos/new"
          className="rounded-lg bg-[#254499] px-4 py-6 text-center text-base font-semibold text-white"
        >
          {tr.admin.addMissing}
        </Link>
        <Link
          href="/admin/centros"
          className="rounded-lg border border-slate-300 px-4 py-6 text-center text-sm font-medium"
        >
          {tr.admin.manageCenters}
        </Link>
        <Link
          href="/admin/desaparecidos"
          className="rounded-lg border border-slate-300 px-4 py-6 text-center text-sm font-medium"
        >
          {tr.admin.manageMissing}
        </Link>
      </div>

      {session.profile.role === 'admin' && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/admin/canales"
            className="rounded-lg border border-slate-300 px-4 py-4 text-center text-sm font-medium"
          >
            {tr.admin.manageChannels}
          </Link>
          <Link
            href="/admin/recursos"
            className="rounded-lg border border-slate-300 px-4 py-4 text-center text-sm font-medium"
          >
            {tr.admin.manageResources}
          </Link>
          <Link
            href="/admin/equipo"
            className="rounded-lg border border-slate-300 px-4 py-4 text-center text-sm font-medium"
          >
            {tr.admin.team}
          </Link>
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
