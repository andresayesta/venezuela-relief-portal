'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireTeam, requireAdmin } from '@/lib/admin-auth';

const TrustTier = z.enum(['verified', 'reported', 'unverified']);
const Direction = z.enum(['dropoff', 'pickup']);

const CenterSchema = z.object({
  name: z.string().trim().min(1),
  state: z.string().trim().min(1),
  city: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  accepted_items: z.string().trim().min(1),
  urgent_needs: z.string().trim().optional().nullable(),
  hours: z.string().trim().optional().nullable(),
  contact_name: z.string().trim().optional().nullable(),
  contact_phone: z.string().trim().optional().nullable(),
  direction: Direction.default('dropoff'),
  trust_tier: TrustTier.default('reported'),
  source: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export type ActionResult = { ok: true; id?: string } | { error: string };

function parseFormToCenter(form: FormData) {
  const raw = Object.fromEntries(form.entries());
  return CenterSchema.safeParse({
    name: raw.name,
    state: raw.state,
    city: raw.city || null,
    neighborhood: raw.neighborhood || null,
    address: raw.address || null,
    accepted_items: raw.accepted_items,
    urgent_needs: raw.urgent_needs || null,
    hours: raw.hours || null,
    contact_name: raw.contact_name || null,
    contact_phone: raw.contact_phone || null,
    direction: raw.direction || 'dropoff',
    trust_tier: raw.trust_tier || 'reported',
    source: raw.source || null,
    notes: raw.notes || null,
    photo_url: raw.photo_url || null,
    event_date: raw.event_date || null,
  });
}

// ---------- Centers ----------

export async function createCenterAction(
  form: FormData,
): Promise<ActionResult> {
  const session = await requireTeam();
  const parsed = parseFormToCenter(form);
  if (!parsed.success) {
    return { error: 'Faltan campos requeridos.' };
  }
  const publish = form.get('publish') === '1';
  if (publish && session.profile.role !== 'admin') {
    return { error: 'Solo un admin puede publicar.' };
  }

  const supabase = await createSupabaseServerClient();

  // RLS requires is_published=false on insert. If the admin asked to publish,
  // do it as a second UPDATE — which the update policy allows for admins.
  const { data: inserted, error: insertError } = await supabase
    .from('collection_centers')
    .insert({
      ...parsed.data,
      created_by: session.userId,
      is_published: false,
    })
    .select('id')
    .single();

  if (insertError) return { error: insertError.message };

  if (publish) {
    const { error: publishError } = await supabase
      .from('collection_centers')
      .update({
        is_published: true,
        published_by: session.userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', inserted.id);
    if (publishError) return { error: publishError.message };
  }

  revalidatePath('/admin');
  revalidatePath('/centros');
  return { ok: true, id: inserted.id };
}

export async function updateCenterAction(
  id: string,
  form: FormData,
): Promise<ActionResult> {
  const session = await requireTeam();
  const parsed = parseFormToCenter(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('collection_centers')
    .update(parsed.data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin');
  revalidatePath('/centros');
  revalidatePath(`/admin/centros/${id}`);
  void session;
  return { ok: true };
}

export async function publishCenterAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('collection_centers')
    .update({
      is_published: true,
      published_by: session.userId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/centros');
  return { ok: true };
}

export async function unpublishCenterAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('collection_centers')
    .update({ is_published: false })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/centros');
  return { ok: true };
}

export async function deleteCenterAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('collection_centers').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/centros');
  return { ok: true };
}

// ---------- Missing persons ----------

const MissingStatus = z.enum(['missing', 'found_safe', 'closed']);

const MissingSchema = z.object({
  full_name: z.string().trim().min(1),
  age: z
    .preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(0).max(120).nullable()),
  last_seen_location: z.string().trim().optional().nullable(),
  last_seen_state: z.string().trim().optional().nullable(),
  last_seen_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  description: z.string().trim().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  reporter_name: z.string().trim().optional().nullable(),
  reporter_contact: z.string().trim().optional().nullable(),
  relationship: z.string().trim().optional().nullable(),
  status: MissingStatus.default('missing'),
  trust_tier: TrustTier.default('reported'),
  source: z.string().trim().optional().nullable(),
  consent_to_publish: z.preprocess((v) => v === 'on' || v === '1' || v === true, z.boolean()),
});

function parseFormToMissing(form: FormData) {
  const raw = Object.fromEntries(form.entries());
  return MissingSchema.safeParse({
    full_name: raw.full_name,
    age: raw.age,
    last_seen_location: raw.last_seen_location || null,
    last_seen_state: raw.last_seen_state || null,
    last_seen_date: raw.last_seen_date || null,
    description: raw.description || null,
    photo_url: raw.photo_url || null,
    reporter_name: raw.reporter_name || null,
    reporter_contact: raw.reporter_contact || null,
    relationship: raw.relationship || null,
    status: raw.status || 'missing',
    trust_tier: raw.trust_tier || 'reported',
    source: raw.source || null,
    consent_to_publish: raw.consent_to_publish,
  });
}

// Create N missing-person rows from one intake screenshot, linked by family_group_id.
export type GroupPersonInput = {
  full_name: string;
  age: number | null;
  last_seen_location: string | null;
  last_seen_state: string | null;
  last_seen_date: string | null;
  description: string | null;
  relationship: string | null;
};

export type CreateMissingGroupInput = {
  persons: GroupPersonInput[];
  photo_url: string | null;
  reporter_name: string | null;
  reporter_contact: string | null;
  source: string | null;
  trust_tier: 'verified' | 'reported' | 'unverified';
  consent_to_publish: boolean;
  publish: boolean;
};

export async function createMissingGroupAction(
  input: CreateMissingGroupInput,
): Promise<ActionResult & { count?: number }> {
  const session = await requireTeam();
  if (!input.persons.length) return { error: 'Falta al menos una persona.' };
  for (const p of input.persons) {
    if (!p.full_name?.trim()) return { error: 'Cada persona necesita un nombre.' };
  }
  if (input.publish && session.profile.role !== 'admin') {
    return { error: 'Solo un admin puede publicar.' };
  }
  if (input.publish && !input.consent_to_publish) {
    return { error: 'No se puede publicar sin consentimiento.' };
  }

  const familyGroupId =
    input.persons.length > 1
      ? crypto.randomUUID()
      : null;

  const supabase = await createSupabaseServerClient();
  const rows = input.persons.map((p) => ({
    full_name: p.full_name.trim(),
    age: p.age,
    last_seen_location: p.last_seen_location,
    last_seen_state: p.last_seen_state,
    last_seen_date: p.last_seen_date,
    description: p.description,
    relationship: p.relationship,
    photo_url: input.photo_url,
    reporter_name: input.reporter_name,
    reporter_contact: input.reporter_contact,
    source: input.source,
    trust_tier: input.trust_tier,
    consent_to_publish: input.consent_to_publish,
    family_group_id: familyGroupId,
    created_by: session.userId,
    is_published: false,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('missing_persons')
    .insert(rows)
    .select('id');

  if (insertError) return { error: insertError.message };

  if (input.publish && inserted) {
    const ids = inserted.map((r) => r.id);
    const { error: pubError } = await supabase
      .from('missing_persons')
      .update({ is_published: true, published_by: session.userId })
      .in('id', ids);
    if (pubError) return { error: pubError.message };
  }

  revalidatePath('/admin');
  revalidatePath('/desaparecidos');
  return { ok: true, count: inserted?.length ?? 0 };
}

export async function createMissingAction(form: FormData): Promise<ActionResult> {
  const session = await requireTeam();
  const parsed = parseFormToMissing(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };
  const publish = form.get('publish') === '1';
  if (publish && session.profile.role !== 'admin') {
    return { error: 'Solo un admin puede publicar.' };
  }
  if (publish && !parsed.data.consent_to_publish) {
    return { error: 'No se puede publicar sin consentimiento.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: inserted, error: insertError } = await supabase
    .from('missing_persons')
    .insert({
      ...parsed.data,
      created_by: session.userId,
      is_published: false,
    })
    .select('id')
    .single();

  if (insertError) return { error: insertError.message };

  if (publish) {
    const { error: publishError } = await supabase
      .from('missing_persons')
      .update({ is_published: true, published_by: session.userId })
      .eq('id', inserted.id);
    if (publishError) return { error: publishError.message };
  }

  revalidatePath('/admin');
  revalidatePath('/desaparecidos');
  return { ok: true, id: inserted.id };
}

export async function updateMissingAction(id: string, form: FormData): Promise<ActionResult> {
  await requireTeam();
  const parsed = parseFormToMissing(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('missing_persons').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/desaparecidos');
  revalidatePath(`/admin/desaparecidos/${id}`);
  return { ok: true };
}

export async function unpublishMissingAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('missing_persons').update({ is_published: false }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/desaparecidos');
  return { ok: true };
}

export async function deleteMissingAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('missing_persons').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/desaparecidos');
  return { ok: true };
}

// ---------- Missing-person tips ----------

export async function markTipReviewedAction(
  id: string,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('missing_person_tips')
    .update({
      reviewed: true,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

export async function unmarkTipReviewedAction(
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('missing_person_tips')
    .update({ reviewed: false, reviewed_by: null, reviewed_at: null })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

// ---------- Donation channels ----------

const ChannelSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  why_trusted: z.string().trim().optional().nullable(),
  efficiency_note: z.string().trim().optional().nullable(),
  region_focus: z.string().trim().optional().nullable(),
  trust_tier: TrustTier.default('verified'),
  sort_order: z
    .preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().int().default(0)),
});

function parseFormToChannel(form: FormData) {
  const raw = Object.fromEntries(form.entries());
  return ChannelSchema.safeParse({
    name: raw.name,
    description: raw.description || null,
    category: raw.category || null,
    url: raw.url || null,
    why_trusted: raw.why_trusted || null,
    efficiency_note: raw.efficiency_note || null,
    region_focus: raw.region_focus || null,
    trust_tier: raw.trust_tier || 'verified',
    sort_order: raw.sort_order ?? 0,
  });
}

export async function createChannelAction(form: FormData): Promise<ActionResult> {
  const session = await requireTeam();
  const parsed = parseFormToChannel(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };
  const publish = form.get('publish') === '1';
  if (publish && session.profile.role !== 'admin') {
    return { error: 'Solo un admin puede publicar.' };
  }
  const supabase = await createSupabaseServerClient();
  const { data: inserted, error: insertError } = await supabase
    .from('donation_channels')
    .insert({ ...parsed.data, is_published: false })
    .select('id')
    .single();
  if (insertError) return { error: insertError.message };
  if (publish) {
    const { error: pubError } = await supabase
      .from('donation_channels')
      .update({ is_published: true })
      .eq('id', inserted.id);
    if (pubError) return { error: pubError.message };
  }
  revalidatePath('/admin');
  revalidatePath('/donar');
  return { ok: true, id: inserted.id };
}

export async function updateChannelAction(id: string, form: FormData): Promise<ActionResult> {
  await requireTeam();
  const parsed = parseFormToChannel(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('donation_channels').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/donar');
  return { ok: true };
}

export async function publishChannelAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('donation_channels').update({ is_published: true }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/donar');
  return { ok: true };
}

export async function deleteChannelAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('donation_channels').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/donar');
  return { ok: true };
}

// ---------- Resource links ----------

const ResourceSchema = z.object({
  category: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  url_or_contact: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  sort_order: z
    .preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().int().default(0)),
});

function parseFormToResource(form: FormData) {
  const raw = Object.fromEntries(form.entries());
  return ResourceSchema.safeParse({
    category: raw.category,
    title: raw.title,
    description: raw.description || null,
    url_or_contact: raw.url_or_contact || null,
    country: raw.country || null,
    state: raw.state || null,
    sort_order: raw.sort_order ?? 0,
  });
}

export async function createResourceAction(form: FormData): Promise<ActionResult> {
  const session = await requireTeam();
  const parsed = parseFormToResource(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };
  const publish = form.get('publish') === '1';
  if (publish && session.profile.role !== 'admin') {
    return { error: 'Solo un admin puede publicar.' };
  }
  const supabase = await createSupabaseServerClient();
  const { data: inserted, error: insertError } = await supabase
    .from('resource_links')
    .insert({ ...parsed.data, is_published: false })
    .select('id')
    .single();
  if (insertError) return { error: insertError.message };
  if (publish) {
    const { error: pubError } = await supabase
      .from('resource_links')
      .update({ is_published: true })
      .eq('id', inserted.id);
    if (pubError) return { error: pubError.message };
  }
  revalidatePath('/admin');
  revalidatePath('/recursos');
  return { ok: true, id: inserted.id };
}

export async function updateResourceAction(id: string, form: FormData): Promise<ActionResult> {
  await requireTeam();
  const parsed = parseFormToResource(form);
  if (!parsed.success) return { error: 'Faltan campos requeridos.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('resource_links').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/recursos');
  return { ok: true };
}

export async function publishResourceAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('resource_links').update({ is_published: true }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/recursos');
  return { ok: true };
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('resource_links').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/recursos');
  return { ok: true };
}

export async function publishMissingAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: readErr } = await supabase
    .from('missing_persons')
    .select('consent_to_publish')
    .eq('id', id)
    .single();
  if (readErr) return { error: readErr.message };
  if (!existing?.consent_to_publish) {
    return { error: 'Falta consentimiento para publicar.' };
  }
  const { error } = await supabase
    .from('missing_persons')
    .update({
      is_published: true,
      published_by: session.userId,
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath('/desaparecidos');
  return { ok: true };
}
