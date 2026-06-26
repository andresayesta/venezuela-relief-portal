'use server';

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { redirect } from 'next/navigation';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';

// Step 1: classify the URL content. Small schema, under Anthropic's
// schema-complexity limit (max 16 union/nullable parameters per schema).
const ClassifySchema = z.object({
  kind: z.enum(['center', 'missing', 'channel', 'resource', 'skip']),
  reasoning: z.string(),
});

// Step 2: per-kind extraction schemas, each focused with <= ~10 fields.
const CenterSchema = z.object({
  name: z.string().nullable(),
  country: z.string().nullable().describe('ISO 2-letter (VE, US, CO, ES, EC, AR, UY, PA, CL, etc.)'),
  state: z.string().nullable(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  accepted_items: z.array(z.string()),
  hours: z.string().nullable(),
  contact_phone: z.string().nullable(),
  direction: z.enum(['dropoff', 'pickup']).nullable(),
});

const MissingSchema = z.object({
  full_name: z.string().nullable(),
  age: z.number().int().min(0).max(120).nullable(),
  last_seen_location: z.string().nullable(),
  last_seen_state: z.enum(VENEZUELAN_STATES).nullable(),
  description: z.string().nullable(),
  reporter_contact: z.string().nullable(),
});

const ChannelSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  category: z.enum(['medical', 'shelter', 'food', 'family_tracing', 'family_campaign', 'general']).nullable(),
  why_trusted: z.string().nullable(),
  payment_details: z.string().nullable().describe('Bank wire, Zelle, Venmo, mailing address as multi-line text.'),
});

const ResourceSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  url_or_contact: z.string().nullable(),
  category: z.enum([
    'emergency', 'hospital', 'shelter', 'official_app', 'official_source',
    'consular', 'evacuation', 'family_tracing', 'anti_scam', 'in_kind_guidance',
    'skills_volunteering', 'related_tool',
  ]).nullable(),
  country: z.string().nullable(),
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
    return text.slice(0, 60_000);
  } finally {
    clearTimeout(timeout);
  }
}

const MODEL = 'claude-haiku-4-5';

async function classify(pageContent: string, url: string) {
  const { output } = await generateText({
    model: anthropic(MODEL),
    output: Output.object({ schema: ClassifySchema }),
    instructions: [
      'You read a page about Venezuela earthquake relief and classify it.',
      'kind=center: a collection / drop-off / pickup location.',
      'kind=missing: a missing-person report or flyer.',
      'kind=channel: a donation channel, organization, or fundraiser (GoFundMe etc.).',
      'kind=resource: a useful link / tool / phone number that doesn\'t fit the above (e.g. emergency line, hospital, partner site).',
      'kind=skip: irrelevant, login-walled, empty, or not useful.',
      'Reasoning is one short sentence.',
    ].join(' '),
    messages: [{ role: 'user', content: [{ type: 'text', text: `URL: ${url}\n\n${pageContent}` }] }],
  });
  return output;
}

async function extractCenter(pageContent: string, url: string) {
  const { output } = await generateText({
    model: anthropic(MODEL),
    output: Output.object({ schema: CenterSchema }),
    instructions: [
      'Extract a collection center (centro de acopio) from the page.',
      'country: ISO 2-letter (VE default). For diaspora, use US/CO/ES/EC/AR/UY/PA/CL/MX/PE/CA/PT/BR/DO/IT.',
      'state: for VE use a canonical Venezuelan state; otherwise local subdivision (Florida, Cundinamarca, etc.).',
      'accepted_items: array of short lowercase items in Spanish.',
      'Null for any field you cannot read with confidence.',
    ].join(' '),
    messages: [{ role: 'user', content: [{ type: 'text', text: `URL: ${url}\n\n${pageContent}` }] }],
  });
  return output;
}

async function extractMissing(pageContent: string, url: string) {
  const { output } = await generateText({
    model: anthropic(MODEL),
    output: Output.object({ schema: MissingSchema }),
    instructions: [
      'Extract a missing-person report. Spanish content from Venezuela.',
      'Null for any field you cannot read with confidence.',
    ].join(' '),
    messages: [{ role: 'user', content: [{ type: 'text', text: `URL: ${url}\n\n${pageContent}` }] }],
  });
  return output;
}

async function extractChannel(pageContent: string, url: string) {
  const { output } = await generateText({
    model: anthropic(MODEL),
    output: Output.object({ schema: ChannelSchema }),
    instructions: [
      'Extract a donation channel / organization / fundraising campaign.',
      'category: family_campaign for GoFundMe-style individual/family campaigns; medical/shelter/food/family_tracing for established orgs; general otherwise.',
      'payment_details: preserve bank wire, Zelle, Venmo, mailing address as multi-line text. Null if none.',
    ].join(' '),
    messages: [{ role: 'user', content: [{ type: 'text', text: `URL: ${url}\n\n${pageContent}` }] }],
  });
  return output;
}

async function extractResource(pageContent: string, url: string) {
  const { output } = await generateText({
    model: anthropic(MODEL),
    output: Output.object({ schema: ResourceSchema }),
    instructions: [
      'Extract a useful resource (emergency number, hospital, official source, partner site, etc.).',
      'category: pick the closest match.',
      'country: ISO 2-letter only if the resource is for a specific country.',
    ].join(' '),
    messages: [{ role: 'user', content: [{ type: 'text', text: `URL: ${url}\n\n${pageContent}` }] }],
  });
  return output;
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
      error: e instanceof Error ? `No se pudo cargar la página: ${e.message}` : 'No se pudo cargar la página.',
    };
  }

  // Step 1: classify
  let classification: z.infer<typeof ClassifySchema>;
  try {
    classification = await classify(pageContent, parsed.toString());
  } catch (e) {
    return {
      error: e instanceof Error ? `La IA no pudo clasificar la página: ${e.message}` : 'Error de IA.',
    };
  }

  if (classification.kind === 'skip') {
    return { error: `IA: contenido no útil. ${classification.reasoning ?? ''}`.trim() };
  }

  const supabase = await createSupabaseServerClient();

  // Step 2: extract specific to kind
  try {
    if (classification.kind === 'center') {
      const data = await extractCenter(pageContent, parsed.toString());
      if (!data.name) return { error: 'No se pudo extraer un nombre del centro.' };
      const items = data.accepted_items.join(', ').trim() || 'sin especificar';
      const { data: inserted, error } = await supabase
        .from('collection_centers')
        .insert({
          name: data.name,
          country: data.country ?? 'VE',
          state: data.state ?? 'Distrito Capital',
          city: data.city,
          address: data.address,
          accepted_items: items,
          hours: data.hours,
          contact_phone: data.contact_phone,
          direction: data.direction ?? 'dropoff',
          trust_tier: 'unverified',
          source: `Quick Add desde ${parsed.host}`,
          created_by: session.userId,
          is_published: false,
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      return { ok: true, redirect: `/admin/centros/${inserted.id}` };
    }

    if (classification.kind === 'missing') {
      const data = await extractMissing(pageContent, parsed.toString());
      if (!data.full_name) return { error: 'No se pudo extraer el nombre de la persona.' };
      const { data: inserted, error } = await supabase
        .from('missing_persons')
        .insert({
          full_name: data.full_name,
          age: data.age,
          last_seen_location: data.last_seen_location,
          last_seen_state: data.last_seen_state,
          description: data.description,
          reporter_contact: data.reporter_contact,
          trust_tier: 'unverified',
          source: `Quick Add desde ${parsed.host}`,
          consent_to_publish: false,
          created_by: session.userId,
          is_published: false,
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      return { ok: true, redirect: `/admin/desaparecidos/${inserted.id}` };
    }

    if (classification.kind === 'channel') {
      const data = await extractChannel(pageContent, parsed.toString());
      if (!data.name) return { error: 'No se pudo extraer el nombre de la organización.' };
      const { data: inserted, error } = await supabase
        .from('donation_channels')
        .insert({
          name: data.name,
          description: data.description,
          category: data.category ?? 'general',
          url: data.url ?? parsed.toString(),
          why_trusted: data.why_trusted,
          payment_details: data.payment_details,
          trust_tier: 'unverified',
          is_published: false,
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      return { ok: true, redirect: `/admin/canales/${inserted.id}` };
    }

    if (classification.kind === 'resource') {
      const data = await extractResource(pageContent, parsed.toString());
      if (!data.title) return { error: 'No se pudo extraer el título del recurso.' };
      const { data: inserted, error } = await supabase
        .from('resource_links')
        .insert({
          category: data.category ?? 'related_tool',
          title: data.title,
          description: data.description,
          url_or_contact: data.url_or_contact ?? parsed.toString(),
          country: data.country,
          is_published: false,
        })
        .select('id')
        .single();
      if (error) return { error: error.message };
      return { ok: true, redirect: `/admin/recursos/${inserted.id}` };
    }
  } catch (e) {
    return {
      error: e instanceof Error ? `La IA no pudo extraer datos: ${e.message}` : 'Error de IA.',
    };
  }

  return { error: 'IA devolvió un tipo desconocido.' };
}

export async function submitQuickAdd(formData: FormData): Promise<void> {
  const url = String(formData.get('url') ?? '').trim();
  if (!url) return;
  const result = await quickAddFromUrlAction(url);
  if ('error' in result) {
    throw new Error(result.error);
  }
  redirect(result.redirect);
}
