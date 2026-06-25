import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { signOutAction } from './actions';
import type { UserRole } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

// Admin sub-layout: renders a sticky sub-nav on every authenticated /admin/*
// page so editors and admins can hop between sections without going back to
// the dashboard. /admin/login and password-reset pages render no sub-nav
// because there's no session at that point.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  let role: UserRole | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single<{ role: UserRole }>();
    role = profile?.role ?? null;
  }

  const locale = await getLocale();
  const tr = t(locale);

  return (
    <>
      {role && (
        <nav className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/admin" className="font-semibold text-slate-900 hover:text-[#254499]">
                {tr.admin.dashboard}
              </Link>
              <Link href="/admin/quick-add" className="rounded-full bg-[#254499] px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-[#1d3777]">
                ✨ {locale === 'es' ? 'Añadir URL' : 'Add URL'}
              </Link>
              <Link href="/admin/centros" className="text-slate-700 hover:text-[#254499]">
                {tr.admin.manageCenters}
              </Link>
              <Link href="/admin/desaparecidos" className="text-slate-700 hover:text-[#254499]">
                {tr.admin.manageMissing}
              </Link>
              {role === 'admin' && (
                <>
                  <Link href="/admin/canales" className="text-slate-700 hover:text-[#254499]">
                    {tr.admin.manageChannels}
                  </Link>
                  <Link href="/admin/recursos" className="text-slate-700 hover:text-[#254499]">
                    {tr.admin.manageResources}
                  </Link>
                  <Link href="/admin/equipo" className="text-slate-700 hover:text-[#254499]">
                    {tr.admin.team}
                  </Link>
                </>
              )}
            </div>
            <form action={signOutAction}>
              <button className="text-xs text-slate-600 hover:text-slate-900">
                {tr.admin.signOut}
              </button>
            </form>
          </div>
        </nav>
      )}
      {children}
    </>
  );
}
