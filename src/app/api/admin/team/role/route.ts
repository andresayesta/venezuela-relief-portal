import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const Body = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['editor', 'admin']),
});

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

  // Block self-demotion so the team can never be left with zero admins by accident.
  if (parsed.data.user_id === session.userId && parsed.data.role !== 'admin') {
    return NextResponse.json(
      { error: 'No puedes bajar tu propio rol. Pide a otro admin que lo haga.' },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
