import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const Body = z.object({ user_id: z.string().uuid() });

export async function POST(request: Request) {
  const session = await requireAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 });
  }

  if (parsed.data.user_id === session.userId) {
    return NextResponse.json(
      { error: 'No puedes eliminarte. Pide a otro admin que lo haga.' },
      { status: 400 },
    );
  }

  // Deleting the auth user cascades to profiles (via ON DELETE CASCADE).
  // We use the service-role admin client because deleting auth users is
  // a privileged operation regardless of RLS.
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(parsed.data.user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
