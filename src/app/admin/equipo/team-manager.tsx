'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { t, type Locale } from '@/lib/i18n';
import type { UserRole } from '@/lib/supabase/types';

type Member = {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  created_at: string;
};

export function TeamManager({
  members,
  locale,
}: {
  members: Member[];
  locale: Locale;
}) {
  const tr = t(locale);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');

  function clearMessages() {
    setError(null);
    setInfo(null);
  }

  function invite(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    start(async () => {
      const res = await fetch('/api/admin/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          full_name: inviteName.trim(),
          role: inviteRole,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reused?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error desconocido.');
        return;
      }
      setInfo(
        data.reused
          ? locale === 'es'
            ? 'Usuario existente añadido al equipo.'
            : 'Existing user added to the team.'
          : locale === 'es'
            ? 'Invitación enviada por correo.'
            : 'Invite sent by email.',
      );
      setInviteEmail('');
      setInviteName('');
      setInviteRole('editor');
      router.refresh();
    });
  }

  function changeRole(userId: string, role: UserRole) {
    clearMessages();
    start(async () => {
      const res = await fetch('/api/admin/team/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error desconocido.');
        return;
      }
      router.refresh();
    });
  }

  function remove(userId: string, name: string) {
    if (!confirm(locale === 'es' ? `¿Eliminar a ${name}?` : `Remove ${name}?`)) return;
    clearMessages();
    start(async () => {
      const res = await fetch('/api/admin/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error desconocido.');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Invite form */}
      <form onSubmit={invite} className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold">
          {locale === 'es' ? 'Invitar a alguien' : 'Invite someone'}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={tr.admin.email}
            className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            required
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder={locale === 'es' ? 'Nombre' : 'Name'}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="editor">{tr.admin.roleEditor}</option>
            <option value="admin">{tr.admin.roleAdmin}</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-3 rounded bg-[#254499] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending
            ? '...'
            : locale === 'es' ? 'Enviar invitación' : 'Send invite'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          {locale === 'es'
            ? 'Se enviará un correo con un enlace para fijar contraseña. Después podrán iniciar sesión en /admin/login.'
            : 'An email with a link to set their password will be sent. They sign in afterwards at /admin/login.'}
        </p>
      </form>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
      )}
      {info && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">{info}</p>
      )}

      {/* Members list */}
      <div className="rounded-lg border border-slate-200">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
          {locale === 'es' ? 'Miembros' : 'Members'} ({members.length})
        </h2>
        <ul className="divide-y divide-slate-200">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.full_name || m.email}</p>
                <p className="truncate text-xs text-slate-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value as UserRole)}
                  disabled={pending}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  <option value="editor">{tr.admin.roleEditor}</option>
                  <option value="admin">{tr.admin.roleAdmin}</option>
                </select>
                <button
                  type="button"
                  onClick={() => remove(m.id, m.full_name || m.email)}
                  disabled={pending}
                  className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
                >
                  {tr.admin.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
