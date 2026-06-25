'use server';

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { requireTeam } from '@/lib/admin-auth';
import { VENEZUELAN_STATES } from '@/lib/supabase/types';

const ExtractedPersonSchema = z.object({
  full_name: z.string().nullable().describe("Person's full name."),
  age: z.number().int().min(0).max(120).nullable().describe('Age in years.'),
  last_seen_location: z.string().nullable().describe('Specific place last seen.'),
  last_seen_state: z.enum(VENEZUELAN_STATES).nullable().describe('Venezuelan state.'),
  last_seen_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe('YYYY-MM-DD if an explicit date is given. Null for relative phrases.'),
  description: z.string().nullable().describe('Distinguishing features, clothing, height.'),
  relationship: z
    .string()
    .nullable()
    .describe("This person's relationship to the reporter."),
});

const ExtractedGroupSchema = z.object({
  persons: z
    .array(ExtractedPersonSchema)
    .min(1)
    .describe('One entry per person mentioned in the post. If a single post lists multiple missing people (a family, for example), return all of them as separate entries.'),
  reporter_name: z.string().nullable().describe('Name of the person publishing the post.'),
  reporter_contact: z
    .string()
    .nullable()
    .describe('Phone, email, or @handle to contact with information.'),
});

export type ExtractedPerson = z.infer<typeof ExtractedPersonSchema>;
export type ExtractedGroup = z.infer<typeof ExtractedGroupSchema>;

export type ExtractMissingResult =
  | { data: ExtractedGroup }
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
      output: Output.object({ schema: ExtractedGroupSchema }),
      instructions: [
        'You extract structured info about missing persons from a screenshot of a social-media post or a missing-person flyer.',
        'The post is usually in Spanish, about people missing after the June 2026 Venezuela earthquakes.',
        'A single post may list one person OR multiple people (e.g. an entire family). Return every distinct missing person as a separate entry in the persons array.',
        'Return only fields you can read with high confidence. Use null for anything missing.',
        'Normalize last_seen_state to one of the canonical Venezuelan states.',
        'For reporter_contact preserve phone digits, email, or @handle exactly as shown.',
        'For last_seen_date, only return YYYY-MM-DD if an explicit date appears. Skip relative phrases ("ayer", "el sábado").',
        'If a person has individual details (own age, own clothing, own last-seen location), put those on their own entry. Shared context (a family was last seen together at one address) should be repeated on each entry.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract every missing person from this image.' },
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
