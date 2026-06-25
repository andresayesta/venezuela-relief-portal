'use server';

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { requireTeam } from '@/lib/admin-auth';

const ExtractedCenterSchema = z.object({
  name: z.string().nullable().describe('Name of the collection center (centro de acopio).'),
  country: z
    .string()
    .nullable()
    .describe('ISO 2-letter country code. Use "VE" for Venezuela. Use "US" for United States, "CO" for Colombia, "ES" for Spain, "PA" for Panama, "AR" Argentina, "CL" Chile, "PE" Peru, "MX" Mexico, "EC" Ecuador, "BR" Brazil, "IT" Italy, "CA" Canada, "PT" Portugal, "DO" Dominican Republic. Default null (treated as Venezuela).'),
  state: z
    .string()
    .nullable()
    .describe('State, region, province, or department where the center is located. For Venezuela, use one of the canonical Venezuelan states. For other countries, use the local subdivision (e.g. "Florida" for US, "Cundinamarca" for Colombia).'),
  city: z.string().nullable().describe('City within the state.'),
  neighborhood: z.string().nullable().describe('Neighborhood, sector, parroquia.'),
  address: z.string().nullable().describe('Street address or landmark.'),
  accepted_items: z
    .array(z.string())
    .describe('Items the center accepts (e.g. agua, medicinas, ropa).'),
  urgent_needs: z
    .array(z.string())
    .describe('Items most urgently needed right now.'),
  hours: z.string().nullable().describe('Opening hours in human-readable form.'),
  contact_name: z.string().nullable().describe('Name of the contact person.'),
  contact_phone: z.string().nullable().describe('Phone number (digits + country code if present).'),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe(
      'Date in YYYY-MM-DD format ONLY if the image states an explicit one-time event date (e.g. "el sábado 28 de junio", "30/06/2026"). Use null for ongoing centers and for relative dates like "este sábado" or "mañana".',
    ),
});

export type ExtractedCenter = z.infer<typeof ExtractedCenterSchema>;

export type ExtractResult =
  | { data: ExtractedCenter }
  | { error: string };

export async function extractCenterFromImage(imageUrl: string): Promise<ExtractResult> {
  // Only signed-in team can spend on the API.
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
      output: Output.object({ schema: ExtractedCenterSchema }),
      instructions: [
        'You extract structured info about an earthquake-relief collection center (centro de acopio) from a photo or screenshot.',
        'The image is usually a WhatsApp or Instagram message in Spanish.',
        'Most centers are inside Venezuela, but many diaspora groups (in the US, Colombia, Spain, Panama, etc.) also organize centers to collect goods to send. Detect which country the center is located in.',
        'Return only fields you can read with high confidence. Use null for anything missing.',
        'For country, use the ISO 2-letter code: "VE" Venezuela, "US" United States, "CO" Colombia, "ES" Spain, "PA" Panama, "AR" Argentina, "CL" Chile, "PE" Peru, "MX" Mexico, "EC" Ecuador, "BR" Brazil, "IT" Italy, "CA" Canada, "PT" Portugal, "DO" Dominican Republic. Default to "VE" only if there is clear Venezuelan context; otherwise null.',
        'For state: if country is VE, use one of the canonical Venezuelan states. Otherwise use the local subdivision name (e.g. "Florida", "Cundinamarca", "Madrid").',
        'For accepted_items and urgent_needs, return short lowercase items in Spanish (e.g. "agua", "medicinas").',
        'For contact_phone, preserve the digits and country code if visible.',
        'For event_date, ONLY return a YYYY-MM-DD date if the image explicitly states a date for a one-time event (e.g. "30 de junio", "sábado 28/06/2026"). Use null for ongoing centers and relative phrases like "este sábado" or "mañana".',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract centro de acopio details from this image.',
            },
            {
              type: 'file',
              mediaType: 'image',
              data: { type: 'url', url },
            },
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
