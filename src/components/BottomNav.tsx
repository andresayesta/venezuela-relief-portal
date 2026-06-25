'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

// Sticky bottom tab bar shown only on mobile. Three primary CTAs with
// active-state highlighting based on pathname. Hidden on desktop (sm+).
export function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '/';

  // Don't show on admin routes — admins have their own top sub-nav.
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.04)] sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        <Tab
          href="/necesito-ayuda"
          label={locale === 'es' ? 'Ayuda' : 'Help'}
          icon="🆘"
          active={pathname.startsWith('/necesito-ayuda') || pathname.startsWith('/desaparecidos') || pathname.startsWith('/recursos')}
        />
        <Tab
          href="/donar"
          label={locale === 'es' ? 'Donar' : 'Donate'}
          icon="💙"
          active={pathname.startsWith('/donar') || pathname.startsWith('/centros')}
        />
        <Tab
          href="/enviar"
          label={locale === 'es' ? 'Reportar' : 'Report'}
          icon="✏️"
          active={pathname.startsWith('/enviar')}
        />
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
        active ? 'text-[#254499]' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
