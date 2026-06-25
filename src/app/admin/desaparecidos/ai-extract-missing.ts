'use server';

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { requireTeam } from '@/lib/admin-auth';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';

const ExtractedMissingSchema = z.object({
  full_name: z.string().nullable().describe("Person's full name."),
  age: z.number().int().min(0).max(120).nullable().describe('Age in years.'),
  last_seen_location: z.string().nullable().describe('Specific place last seen.'),
  last_seen_state: z.enum(VENEZUELAN_STATES).nullable().describe('Venezuelan state.'),
  last_seen_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe('YYYY-MM-DD if an explicit date is given. Null for relative phrases.'),
  description: z
    .string()
    .nullable()
    .describe('Distinguishing features, clothing last worn, height, complexion.'),
  reporter_name: z.string().nullable().describe('Name of the person publishing the post.'),
  reporter_contact: z
    .string()
    .nullable()
    .describe('Phone, email, or @handle to contact with information.'),
  relationship: z
    .string()
    .nullable()
    .describe("Reporter's relationship to the missing person."),
});

export type ExtractedMissing = z.infer<typeof ExtractedMissingSchema>;

export type ExtractMissingResult =
  | { data: ExtractedMissing }
  | { error: string };

export async function extractMissingFromImage(
  imageUrl: string,
): Promise<ExtractMissingResult> {
  await requireTeam();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'Falta ANTHROPIC_API_KEY en .env.local' };
  }

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return { error: 'URL de imagen inválida.' };
  }

  try {
    const { output: extracted } = await generateText({
      model: anthropic('claude-haiku-4-5'),
      output: Output.object({ schema: ExtractedMissingSchema }),
      instructions: [
        'You extract structured info about a missing person from a screenshot of a social media post (WhatsApp, Instagram, X/Twitter, Facebook) or a missing-person flyer.',
        'The post is usually in Spanish, about someone missing after the June 2026 Venezuela earthquakes.',
        'Return only fields you can read with high confidence. Use null for anything missing.',
        'Normalize last_seen_state to one of the canonical Venezuelan states.',
        'For reporter_contact preserve the phone digits, email, or @handle exactly as shown.',
        'For last_seen_date, only return YYYY-MM-DD if an explicit date appears. Skip relative phrases ("ayer", "el sábado").',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract missing-person details from this image.' },
            { type: 'file', mediaType: 'image', data: { type: 'url', url } },
          ],
        },
      ],
    });

    return { data: extracted };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido.';
    return { error: message };
  }
}
