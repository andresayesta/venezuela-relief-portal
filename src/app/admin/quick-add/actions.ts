'use server';

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { redirect } from 'next/navigation';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';

const KIND = z.enum(['center', 'missing', 'channel', 'resource', 'skip']);

const ExtractionSchema = z.object({
  kind: KIND.describe(
    'What this content is about: center=collection center, missing=missing person, channel=donation channel/org, resource=resource link, skip=not useful relief info.',
  ),
  reasoning: z.string().describe('One sentence explaining why you classified it this way.'),

  // Center fields
  center_name: z.string().nullable(),
  center_country: z.string().nullable().describe('ISO 2-letter (VE, US, CO, ES, etc.)'),
  center_state: z.string().nullable(),
  center_city: z.string().nullable(),
  center_address: z.string().nullable(),
  center_accepted_items: z.array(z.string()),
  center_hours: z.string().nullable(),
  center_contact_phone: z.string().nullable(),
  center_direction: z.enum(['dropoff', 'pickup']).nullable(),

  // Missing person fields
  missing_full_name: z.string().nullable(),
  missing_age: z.number().int().min(0).max(120).nullable(),
  missing_last_seen_location: z.string().nullable(),
  missing_last_seen_state: z.enum(VENEZUELAN_STATES).nullable(),
  missing_description: z.string().nullable(),
  missing_reporter_contact: z.string().nullable(),

  // Channel (donation org / GoFundMe) fields
  channel_name: z.string().nullable(),
  channel_description: z.string().nullable(),
  channel_url: z.string().nullable(),
  channel_category: z.enum(['medical', 'shelter', 'food', 'family_tracing', 'family_campaign', 'general']).nullable(),
  channel_why_trusted: z.string().nullable(),
  channel_payment_details: z.string().nullable().describe('Bank wire info, Zelle, Venmo, etc., as multi-line text. Null if none.'),

  // Resource link fields
  resource_title: z.string().nullable(),
  resource_description: z.string().nullable(),
  resource_url_or_contact: z.string().nullable(),
  resource_category: z.enum([
    'emergency', 'hospital', 'shelter', 'official_app', 'official_source',
    'consular', 'evacuation', 'family_tracing', 'anti_scam', 'in_kind_guidance',
    'skills_volunteering', 'related_tool',
  ]).nullable(),
  resource_country: z.string().nullable(),
});

export type QuickAddResult =
  | { ok: true; redirect: string }
  | { error: string };

async function fetchTextFromUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WeHelpVenezuelaBot/1.0; +https://wehelpvenezuela.org)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Trim to a reasonable size (~ 60k chars) — Claude handles long inputs but it's wasteful.
    return text.slice(0, 60_000);
  } finally {
    clearTimeout(timeout);
  }
}

export async function quickAddFromUrlAction(url: string): Promise<QuickAddResult> {
  const session = await requireTeam();

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: 'URL inválida.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'Solo URLs http o https.' };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'Falta ANTHROPIC_API_KEY.' };
  }

  let pageContent: string;
  try {
    pageContent = await fetchTextFromUrl(parsed.toString());
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `No se pudo cargar la página: ${e.message}`
          : 'No se pudo cargar la página.',
    };
  }

  // Ask Claude to classify the URL and extract structured data.
  let extracted;
  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      output: Output.object({ schema: ExtractionSchema }),
      instructions: [
        'You read a page about Venezuela earthquake relief and extract structured info.',
        'First classify the content. Then fill ONLY the fields for that kind; leave the rest as null/empty arrays.',
        'For Venezuelan states use the canonical names. For diaspora locations use ISO country codes (US, CO, ES, EC, AR, UY, PA, CL, etc.).',
        'For accepted_items return short lowercase items in Spanish (e.g. "agua", "medicinas").',
        'For payment_details preserve bank wires, Zelle/Venmo handles, mailing addresses as multi-line text.',
        'If the page is irrelevant, login wall, or empty, return kind=skip.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `URL: ${parsed.toString()}\n\nContenido:\n${pageContent}` },
          ],
        },
      ],
    });
    extracted = result.output;
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `La IA no pudo procesar la página: ${e.message}`
          : 'Error de IA.',
    };
  }

  const supabase = await createSupabaseServerClient();

  if (extracted.kind === 'skip') {
    return { error: `IA: contenido no útil para el sitio. ${extracted.reasoning ?? ''}`.trim() };
  }

  if (extracted.kind === 'center') {
    if (!extracted.center_name) return { error: 'No se pudo extraer un nombre del centro.' };
    const items = extracted.center_accepted_items.join(', ').trim() || 'sin especificar';
    const { data, error } = await supabase
      .from('collection_centers')
      .insert({
        name: extracted.center_name,
        country: extracted.center_country ?? 'VE',
        state: extracted.center_state ?? 'Distrito Capital',
        city: extracted.center_city,
        address: extracted.center_address,
        accepted_items: items,
        hours: extracted.center_hours,
        contact_phone: extracted.center_contact_phone,
        direction: extracted.center_direction ?? 'dropoff',
        trust_tier: 'unverified',
        source: `Quick Add desde ${parsed.host}`,
        created_by: session.userId,
        is_published: false,
      })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { ok: true, redirect: `/admin/centros/${data.id}` };
  }

  if (extracted.kind === 'missing') {
    if (!extracted.missing_full_name) return { error: 'No se pudo extraer el nombre de la persona.' };
    const { data, error } = await supabase
      .from('missing_persons')
      .insert({
        full_name: extracted.missing_full_name,
        age: extracted.missing_age,
        last_seen_location: extracted.missing_last_seen_location,
        last_seen_state: extracted.missing_last_seen_state,
        description: extracted.missing_description,
        reporter_contact: extracted.missing_reporter_contact,
        trust_tier: 'unverified',
        source: `Quick Add desde ${parsed.host}`,
        consent_to_publish: false,
        created_by: session.userId,
        is_published: false,
      })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { ok: true, redirect: `/admin/desaparecidos/${data.id}` };
  }

  if (extracted.kind === 'channel') {
    if (!extracted.channel_name) return { error: 'No se pudo extraer el nombre de la organización.' };
    const { data, error } = await supabase
      .from('donation_channels')
      .insert({
        name: extracted.channel_name,
        description: extracted.channel_description,
        category: extracted.channel_category ?? 'general',
        url: extracted.channel_url,
        why_trusted: extracted.channel_why_trusted,
        payment_details: extracted.channel_payment_details,
        trust_tier: 'unverified',
        is_published: false,
      })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { ok: true, redirect: `/admin/canales/${data.id}` };
  }

  if (extracted.kind === 'resource') {
    if (!extracted.resource_title) return { error: 'No se pudo extraer el título del recurso.' };
    const { data, error } = await supabase
      .from('resource_links')
      .insert({
        category: extracted.resource_category ?? 'related_tool',
        title: extracted.resource_title,
        description: extracted.resource_description,
        url_or_contact: extracted.resource_url_or_contact ?? parsed.toString(),
        country: extracted.resource_country,
        is_published: false,
      })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { ok: true, redirect: `/admin/recursos/${data.id}` };
  }

  return { error: 'IA devolvió un tipo desconocido.' };
}

// Server action used directly from the form: extracts, inserts, then redirects.
export async function submitQuickAdd(formData: FormData): Promise<void> {
  const url = String(formData.get('url') ?? '').trim();
  if (!url) return;
  const result = await quickAddFromUrlAction(url);
  if ('error' in result) {
    // Re-throw so the client sees the error. Real UX comes from the client component.
    throw new Error(result.error);
  }
  redirect(result.redirect);
}
