'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';

export type SubmitResult = { ok: true } | { error: string };

// Shared shape: every public submission requires a Turnstile token
// and a non-empty submitted_by (so the team can follow up).
const Base = z.object({
  turnstile_token: z.string().min(1),
  submitter_name: z.string().trim().max(120).optional().nullable(),
  submitter_contact: z.string().trim().min(2).max(200),
});

async function checkAbuse(token: string): Promise<string | null> {
  const ok = await verifyTurnstileToken(token);
  if (!ok) return 'Verificación de seguridad falló. Recarga la página e intenta de nuevo.';
  return null;
}

function joinSubmittedBy(
  name: string | null | undefined,
  contact: string,
): string {
  return name?.trim() ? `${name.trim()} <${contact}>` : contact;
}

// ---------- Missing person ----------

const KNOWN_STATES = new Set<string>(VENEZUELAN_STATES);

// Photo URLs must come from our own Supabase Storage so anon submissions can't
// inject arbitrary external URLs (which we'd then proxy / hotlink).
const SUPABASE_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : null;
  } catch {
    return null;
  }
})();

function sanitizePhotoUrl(v: unknown): string | null {
  if (typeof v !== 'string' || !v) return null;
  try {
    const url = new URL(v);
    if (SUPABASE_HOST && url.host !== SUPABASE_HOST) return null;
    if (!url.pathname.includes('/missing-photos/')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const MissingSubmit = Base.extend({
  full_name: z.string().trim().min(1).max(200),
  age: z
    .preprocess(
      (v) => (v === '' || v == null ? null : Number(v)),
      z.number().int().min(0).max(120).nullable(),
    ),
  last_seen_location: z.string().trim().max(500).optional().nullable(),
  last_seen_state: z
    .preprocess(
      (v) => (typeof v === 'string' && KNOWN_STATES.has(v) ? v : null),
      z.string().nullable(),
    ),
  last_seen_date: z
    .preprocess(
      (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null),
      z.string().nullable(),
    ),
  description: z.string().trim().max(2000).optional().nullable(),
  relationship: z.string().trim().max(120).optional().nullable(),
  source: z.string().trim().max(200).optional().nullable(),
  photo_url: z.preprocess(sanitizePhotoUrl, z.string().nullable()),
});

export async function submitMissingAction(
  raw: z.input<typeof MissingSubmit>,
): Promise<SubmitResult> {
  const parsed = MissingSubmit.safeParse(raw);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };

  const abuse = await checkAbuse(parsed.data.turnstile_token);
  if (abuse) return { error: abuse };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('missing_persons').insert({
    full_name: parsed.data.full_name,
    age: parsed.data.age,
    last_seen_location: parsed.data.last_seen_location ?? null,
    last_seen_state: parsed.data.last_seen_state ?? null,
    last_seen_date: parsed.data.last_seen_date ?? null,
    description: parsed.data.description ?? null,
    relationship: parsed.data.relationship ?? null,
    source: parsed.data.source ?? null,
    photo_url: parsed.data.photo_url ?? null,
    reporter_name: parsed.data.submitter_name?.trim() || null,
    reporter_contact: parsed.data.submitter_contact,
    submitted_by: joinSubmittedBy(parsed.data.submitter_name, parsed.data.submitter_contact),
    trust_tier: 'unverified',
    is_published: false,
    consent_to_publish: false,
  });

  if (error) return { error: 'No se pudo enviar. Intenta de nuevo.' };
  return { ok: true };
}

// ---------- Collection center ----------

const CenterSubmit = Base.extend({
  name: z.string().trim().min(1).max(200),
  state: z.preprocess(
    (v) => (typeof v === 'string' && KNOWN_STATES.has(v) ? v : ''),
    z.string().min(1),
  ),
  city: z.string().trim().max(200).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  accepted_items: z.string().trim().min(1).max(500),
  urgent_needs: z.string().trim().max(500).optional().nullable(),
  hours: z.string().trim().max(120).optional().nullable(),
  direction: z.enum(['dropoff', 'pickup']).default('dropoff'),
  contact_phone: z.string().trim().max(60).optional().nullable(),
  source: z.string().trim().max(200).optional().nullable(),
});

export async function submitCenterAction(
  raw: z.input<typeof CenterSubmit>,
): Promise<SubmitResult> {
  const parsed = CenterSubmit.safeParse(raw);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };

  const abuse = await checkAbuse(parsed.data.turnstile_token);
  if (abuse) return { error: abuse };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('collection_centers').insert({
    name: parsed.data.name,
    state: parsed.data.state,
    city: parsed.data.city ?? null,
    address: parsed.data.address ?? null,
    accepted_items: parsed.data.accepted_items,
    urgent_needs: parsed.data.urgent_needs ?? null,
    hours: parsed.data.hours ?? null,
    direction: parsed.data.direction,
    contact_phone: parsed.data.contact_phone ?? null,
    source: parsed.data.source ?? null,
    submitted_by: joinSubmittedBy(parsed.data.submitter_name, parsed.data.submitter_contact),
    trust_tier: 'unverified',
    is_published: false,
  });

  if (error) return { error: 'No se pudo enviar. Intenta de nuevo.' };
  return { ok: true };
}

// ---------- Donation channel suggestion ----------

const ChannelSubmit = Base.extend({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  url: z.string().url().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  why_trusted: z.string().trim().max(500).optional().nullable(),
});

export async function submitChannelAction(
  raw: z.input<typeof ChannelSubmit>,
): Promise<SubmitResult> {
  const parsed = ChannelSubmit.safeParse(raw);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };

  const abuse = await checkAbuse(parsed.data.turnstile_token);
  if (abuse) return { error: abuse };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('donation_channels').insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    url: parsed.data.url ?? null,
    why_trusted: parsed.data.why_trusted ?? null,
    trust_tier: 'unverified',
    is_published: false,
  });

  if (error) return { error: 'No se pudo enviar. Intenta de nuevo.' };
  return { ok: true };
}

// ---------- Resource link suggestion ----------

const ResourceSubmit = Base.extend({
  category: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  url_or_contact: z.string().trim().max(500).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
});

export async function submitResourceAction(
  raw: z.input<typeof ResourceSubmit>,
): Promise<SubmitResult> {
  const parsed = ResourceSubmit.safeParse(raw);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };

  const abuse = await checkAbuse(parsed.data.turnstile_token);
  if (abuse) return { error: abuse };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('resource_links').insert({
    category: parsed.data.category,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    url_or_contact: parsed.data.url_or_contact ?? null,
    country: parsed.data.country ?? null,
    is_published: false,
  });

  if (error) return { error: 'No se pudo enviar. Intenta de nuevo.' };
  return { ok: true };
}
