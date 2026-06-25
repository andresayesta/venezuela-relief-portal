import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { TeamManager } from './team-manager';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);

  // Combine profiles with their auth emails. We need the admin client to read
  // emails since profiles only stores names.
  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: true });

  const adminClient = createSupabaseAdminClient();
  const { data: usersList } = await adminClient.auth.admin.listUsers();
  const emailById = new Map(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const members = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? '',
    role: p.role,
    email: emailById.get(p.id) ?? '—',
    created_at: p.created_at,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl font-semibold">{tr.admin.team}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Invita miembros, cambia roles o elimina accesos. Los editores ven todo pero no publican; los admins publican y gestionan el equipo.'
          : 'Invite members, change roles, or remove access. Editors see everything but cannot publish; admins publish and manage the team.'}
      </p>

      <TeamManager members={members} locale={locale} />
    </div>
  );
}
