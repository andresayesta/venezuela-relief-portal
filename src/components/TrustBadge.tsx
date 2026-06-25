import type { TrustTier } from '@/lib/supabase/types';
import { t, type Locale } from '@/lib/i18n';

export function TrustBadge({
  tier,
  locale,
}: {
  tier: TrustTier;
  locale: Locale;
}) {
  const tr = t(locale);
  if (tier === 'verified') {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-slate-900"
        style={{ backgroundColor: '#F8CB78' }}
      >
        {tr.badges.verified}
      </span>
    );
  }
  if (tier === 'reported') {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-400 px-2 py-0.5 text-xs font-medium text-slate-600">
        {tr.badges.reported}
      </span>
    );
  }
  return null;
}
