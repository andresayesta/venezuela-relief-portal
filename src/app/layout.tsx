import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { LocaleToggle } from '@/components/LocaleToggle';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Venezuela Responde — Información de ayuda verificada',
  description:
    'Información verificada de ayuda tras los terremotos del 24 de junio en Venezuela. Centros de acopio, personas desaparecidas, donaciones confiables.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const tr = t(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-white text-slate-900"
        suppressHydrationWarning
      >
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
            <Link
              href="/"
              className="flex-shrink-0 whitespace-nowrap text-sm font-bold text-[#254499] sm:text-base"
            >
              {tr.siteName}
            </Link>
            <nav className="-mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 text-xs">
              <Link
                href="/necesito-ayuda"
                className="flex-shrink-0 whitespace-nowrap rounded-full bg-[#254499] px-3 py-1.5 font-semibold text-white hover:bg-[#1d3777]"
              >
                {tr.home.pathA}
              </Link>
              <Link
                href="/donar"
                className="flex-shrink-0 whitespace-nowrap rounded-full bg-[#254499] px-3 py-1.5 font-semibold text-white hover:bg-[#1d3777]"
              >
                {tr.home.pathB}
              </Link>
              <Link
                href="/enviar"
                className="flex-shrink-0 whitespace-nowrap rounded-full border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                {locale === 'es' ? 'Reportar' : 'Report'}
              </Link>
            </nav>
            <div className="flex-shrink-0">
              <LocaleToggle current={locale} />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>{tr.tagline}</p>
          <p className="mt-2">
            <Link href="/admin" className="text-slate-400 hover:text-slate-600">
              {tr.nav.admin}
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
