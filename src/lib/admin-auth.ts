import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';
import type { Profile } from './supabase/types';

export type TeamSession = {
  userId: string;
  email: string | null;
  profile: Profile;
};

// Call at the top of every gated /admin page or server action.
// Redirects to /admin/login if no session or no profiles row.
// Uses getUser() (verified by the Auth server), NOT getSession()
// — getSession reads from cookies without verification.
export async function requireTeam(): Promise<TeamSession> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect('/admin/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', userData.user.id)
    .single<Profile>();

  if (profileError || !profile) {
    // Auth user exists but no profiles row — they were removed from the team
    // or never bootstrapped. Sign them out so they don't loop.
    await supabase.auth.signOut();
    redirect('/admin/login?error=no-team');
  }

  return {
    userId: userData.user.id,
    email: userData.user.email ?? null,
    profile,
  };
}

export async function requireAdmin(): Promise<TeamSession> {
  const session = await requireTeam();
  if (session.profile.role !== 'admin') {
    redirect('/admin');
  }
  return session;
}
