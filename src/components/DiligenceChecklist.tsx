import type { Locale } from '@/lib/i18n';

type Kind = 'missing' | 'center' | 'channel' | 'resource';

const CHECKLISTS: Record<Kind, { es: string[]; en: string[] }> = {
  missing: {
    es: [
      'Contacté al reportante por el medio que dejó y respondió.',
      'El reportante confirmó su relación con la persona.',
      'Tengo consentimiento explícito para publicar (marca la casilla del formulario).',
      'La foto, si la hay, es realmente de la persona desaparecida.',
      'Si aplica, crucé el caso con ICRC u otro registro oficial.',
    ],
    en: [
      'Contacted the reporter via the channel they left and got a response.',
      'Reporter confirmed their relationship to the person.',
      'Explicit consent to publish (toggle the consent checkbox on the form).',
      'The photo, if any, is genuinely of the missing person.',
      'If applicable, cross-referenced ICRC or another official registry.',
    ],
  },
  center: {
    es: [
      'Confirmé la dirección (Google/Street View si es necesario).',
      'Hablé con alguien en sitio por el teléfono dado, o un miembro del equipo visitó.',
      'Confirmé que está activo en este momento.',
      'Si es modo "pickup", confirmé que es un punto legítimo de distribución (no una casa privada).',
    ],
    en: [
      'Confirmed the address (Google/Street View if needed).',
      'Spoke with someone on-site via the contact number, OR a team member visited.',
      'Confirmed it is actively operating right now.',
      'If pickup mode, confirmed it is a legitimate distribution point (not a private home).',
    ],
  },
  channel: {
    es: [
      'La organización existía antes del desastre (registrada, presencia previa).',
      'Tiene operaciones reales en Venezuela.',
      'Verifiqué la presencia pública: prensa, finanzas auditadas, dirección real.',
      'Contacto directo con la organización confirma la campaña.',
    ],
    en: [
      'Org existed before the disaster (registered nonprofit, prior presence).',
      'Has real in-country operations in Venezuela.',
      'Verified public presence: press coverage, audited finances, real address.',
      'Direct contact with the org confirms the campaign.',
    ],
  },
  resource: {
    es: [
      'El número o URL funciona.',
      'Coincide con una fuente oficial (gobierno, organización conocida, embajada).',
    ],
    en: [
      'Number or URL works.',
      'Matches an official source (government, well-known org, embassy).',
    ],
  },
};

const TITLE: Record<Kind, { es: string; en: string }> = {
  missing: { es: 'Diligencia: Personas desaparecidas', en: 'Diligence: Missing persons' },
  center: { es: 'Diligencia: Centros de acopio', en: 'Diligence: Collection centers' },
  channel: { es: 'Diligencia: Canales de donación', en: 'Diligence: Donation channels' },
  resource: { es: 'Diligencia: Recursos', en: 'Diligence: Resources' },
};

// Visible diligence reminder shown on every admin edit page.
// Intentionally not stored — just a visual checklist to slow down the
// publish decision and give the team a shared standard.
export function DiligenceChecklist({
  kind,
  locale,
}: {
  kind: Kind;
  locale: Locale;
}) {
  const items = CHECKLISTS[kind][locale];
  const title = TITLE[kind][locale];

  return (
    <details className="my-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-blue-900">
        ✓ {title}
      </summary>
      <ul className="mt-2 space-y-1 text-xs text-blue-900">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-mono">[{i + 1}]</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs italic text-blue-800">
        {locale === 'es'
          ? 'Sólo publica si pudiste confirmar lo aplicable. La duda no se publica.'
          : 'Only publish if you confirmed what applies. If in doubt, leave unpublished.'}
      </p>
    </details>
  );
}
