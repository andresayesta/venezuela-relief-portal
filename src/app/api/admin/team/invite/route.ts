import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const InviteSchema = z.object({
  email: z.email().trim().toLowerCase(),
  full_name: z.string().trim().min(1),
  role: z.enum(['editor', 'admin']),
});

export async function POST(request: Request) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const origin = request.headers.get('origin') ?? '';

  // Send an invite-by-email so the new member sets their own password via the
  // magic-link landing page. They land on /admin and then sign in.
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/admin`,
    },
  );

  if (error || !data.user) {
    // Common case: user already exists. Fall back to creating the profiles row
    // for the existing auth user if we can look them up.
    if (error?.message?.toLowerCase().includes('already')) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find(
        (u) => u.email?.toLowerCase() === parsed.data.email,
      );
      if (existing) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: existing.id,
            full_name: parsed.data.full_name,
            role: parsed.data.role,
          });
        if (profileError) {
          return NextResponse.json({ error: profileError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, reused: true });
      }
    }
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo crear el usuario.' },
      { status: 500 },
    );
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
  });

  if (profileError) {
    // If profile insert fails, roll back the auth user so we don't have orphans.
    await supabase.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
