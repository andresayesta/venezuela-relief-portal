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
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-base font-semibold text-[#254499]">
              {tr.siteName}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/necesito-ayuda" className="hover:text-slate-700">
                {tr.nav.help}
              </Link>
              <Link href="/donar" className="hover:text-slate-700">
                {tr.nav.donate}
              </Link>
              <Link href="/verificado" className="hover:text-slate-700">
                {tr.nav.verified}
              </Link>
              <Link href="/enviar" className="hover:text-slate-700">
                {locale === 'es' ? 'Enviar info' : 'Submit info'}
              </Link>
              <LocaleToggle current={locale} />
            </nav>
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
