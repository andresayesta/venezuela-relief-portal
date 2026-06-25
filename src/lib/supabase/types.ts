export type TrustTier = 'verified' | 'reported' | 'unverified';
export type UserRole = 'editor' | 'admin';
export type MissingStatus = 'missing' | 'found_safe' | 'closed';
export type CenterDirection = 'dropoff' | 'pickup';

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type CollectionCenter = {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  accepted_items: string | null;
  urgent_needs: string | null;
  hours: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  direction: CenterDirection;
  trust_tier: TrustTier;
  source: string | null;
  notes: string | null;
  photo_url: string | null;
  event_date: string | null;
  is_published: boolean;
  submitted_by: string | null;
  created_by: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
};

// Predefined options for the centro intake form.
export const ACCEPTED_ITEM_OPTIONS = [
  { value: 'agua', es: 'Agua', en: 'Water' },
  { value: 'medicinas', es: 'Medicinas', en: 'Medicine' },
  { value: 'comida no perecedera', es: 'Comida no perecedera', en: 'Non-perishable food' },
  { value: 'ropa', es: 'Ropa', en: 'Clothing' },
  { value: 'mantas', es: 'Mantas / cobijas', en: 'Blankets' },
  { value: 'higiene personal', es: 'Productos de higiene', en: 'Personal hygiene' },
  { value: 'pañales', es: 'Pañales', en: 'Diapers' },
  { value: 'productos para bebés', es: 'Productos para bebés', en: 'Baby supplies' },
  { value: 'linternas', es: 'Linternas', en: 'Flashlights' },
  { value: 'baterías', es: 'Baterías', en: 'Batteries' },
  { value: 'herramientas', es: 'Herramientas', en: 'Tools' },
  { value: 'kits primeros auxilios', es: 'Kits de primeros auxilios', en: 'First aid kits' },
] as const;

export const DONATION_CATEGORIES = [
  { value: 'medical', es: 'Médico', en: 'Medical' },
  { value: 'shelter', es: 'Refugio', en: 'Shelter' },
  { value: 'food', es: 'Comida', en: 'Food' },
  { value: 'family_tracing', es: 'Búsqueda de familia', en: 'Family tracing' },
  { value: 'family_campaign', es: 'Campaña directa (GoFundMe, etc.)', en: 'Direct campaign (GoFundMe, etc.)' },
  { value: 'general', es: 'General', en: 'General' },
] as const;

export const RESOURCE_CATEGORIES = [
  { value: 'emergency', es: 'Emergencias', en: 'Emergency' },
  { value: 'official_app', es: 'App oficial', en: 'Official app' },
  { value: 'hospital', es: 'Hospital', en: 'Hospital' },
  { value: 'shelter', es: 'Refugio oficial', en: 'Official shelter' },
  { value: 'official_source', es: 'Fuente oficial', en: 'Official source' },
  { value: 'consular', es: 'Ayuda consular', en: 'Consular help' },
  { value: 'evacuation', es: 'Evacuación', en: 'Evacuation' },
  { value: 'family_tracing', es: 'Búsqueda de familia', en: 'Family tracing' },
  { value: 'anti_scam', es: 'Evita estafas', en: 'Avoid scams' },
  { value: 'in_kind_guidance', es: 'Donaciones en especie', en: 'In-kind guidance' },
  { value: 'skills_volunteering', es: 'Voluntariado profesional', en: 'Skills volunteering' },
  { value: 'related_tool', es: 'Otros sitios y herramientas', en: 'Other sites and tools' },
] as const;

export const SOURCE_CHANNEL_OPTIONS = [
  { value: 'WhatsApp', es: 'WhatsApp', en: 'WhatsApp' },
  { value: 'Instagram', es: 'Instagram', en: 'Instagram' },
  { value: 'X / Twitter', es: 'X / Twitter', en: 'X / Twitter' },
  { value: 'Facebook', es: 'Facebook', en: 'Facebook' },
  { value: 'TikTok', es: 'TikTok', en: 'TikTok' },
  { value: 'Telegram', es: 'Telegram', en: 'Telegram' },
  { value: 'Llamada', es: 'Llamada / teléfono', en: 'Phone call' },
  { value: 'Persona en sitio', es: 'Persona en sitio', en: 'In person' },
  { value: 'Medio de prensa', es: 'Medio de prensa', en: 'News outlet' },
  { value: 'Otro', es: 'Otro', en: 'Other' },
] as const;

export type MissingPerson = {
  id: string;
  full_name: string;
  age: number | null;
  last_seen_location: string | null;
  last_seen_state: string | null;
  last_seen_date: string | null;
  description: string | null;
  photo_url: string | null;
  reporter_name: string | null;
  reporter_contact: string | null;
  relationship: string | null;
  status: MissingStatus;
  trust_tier: TrustTier;
  source: string | null;
  consent_to_publish: boolean;
  is_published: boolean;
  family_group_id: string | null;
  submitted_by: string | null;
  created_by: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DonationChannel = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  url: string | null;
  why_trusted: string | null;
  efficiency_note: string | null;
  region_focus: string | null;
  payment_details: string | null;
  trust_tier: TrustTier;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ResourceLink = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  url_or_contact: string | null;
  country: string | null;
  state: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

// ISO-ish country codes used by collection_centers.country and similar
// fields. 'VE' is the default; the rest are the highest-density Venezuelan
// diaspora destinations. 'Otro' / 'OTHER' is the catch-all.
export const COUNTRY_OPTIONS = [
  { code: 'VE', es: 'Venezuela', en: 'Venezuela' },
  { code: 'US', es: 'Estados Unidos', en: 'United States' },
  { code: 'CO', es: 'Colombia', en: 'Colombia' },
  { code: 'ES', es: 'España', en: 'Spain' },
  { code: 'PA', es: 'Panamá', en: 'Panama' },
  { code: 'AR', es: 'Argentina', en: 'Argentina' },
  { code: 'CL', es: 'Chile', en: 'Chile' },
  { code: 'PE', es: 'Perú', en: 'Peru' },
  { code: 'MX', es: 'México', en: 'Mexico' },
  { code: 'EC', es: 'Ecuador', en: 'Ecuador' },
  { code: 'BR', es: 'Brasil', en: 'Brazil' },
  { code: 'IT', es: 'Italia', en: 'Italy' },
  { code: 'CA', es: 'Canadá', en: 'Canada' },
  { code: 'PT', es: 'Portugal', en: 'Portugal' },
  { code: 'DO', es: 'República Dominicana', en: 'Dominican Republic' },
  { code: 'UY', es: 'Uruguay', en: 'Uruguay' },
  { code: 'OTHER', es: 'Otro', en: 'Other' },
] as const;

export function countryLabel(code: string, locale: 'es' | 'en'): string {
  const found = COUNTRY_OPTIONS.find((c) => c.code === code);
  return found ? (locale === 'es' ? found.es : found.en) : code;
}

export const VENEZUELAN_STATES = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
] as const;
