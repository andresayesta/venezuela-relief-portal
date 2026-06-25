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

const SITE_URL = 'https://wehelpvenezuela.org';
const SITE_TITLE = 'We Help Venezuela · Venezuela Responde';
const SITE_DESCRIPTION =
  'Ayuda verificada para Venezuela tras los terremotos del 24 de junio. Centros de acopio, personas desaparecidas, donaciones confiables. Verified earthquake relief for Venezuela.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: 'es_VE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
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
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-3 py-2">
            <Link
              href="/"
              className="order-1 flex-shrink-0 whitespace-nowrap text-sm font-bold text-[#254499] sm:text-base"
            >
              {tr.siteName}
            </Link>
            <div className="order-2 ml-auto sm:order-3 sm:ml-0">
              <LocaleToggle current={locale} />
            </div>
            <nav className="order-3 grid w-full grid-cols-3 gap-1.5 text-sm sm:order-2 sm:flex sm:w-auto sm:flex-1 sm:justify-end sm:text-xs">
              <Link
                href="/necesito-ayuda"
                className="rounded-full bg-[#254499] px-3 py-2.5 text-center font-semibold text-white hover:bg-[#1d3777] sm:py-1.5"
              >
                {tr.home.pathA}
              </Link>
              <Link
                href="/donar"
                className="rounded-full bg-[#254499] px-3 py-2.5 text-center font-semibold text-white hover:bg-[#1d3777] sm:py-1.5"
              >
                {tr.home.pathB}
              </Link>
              <Link
                href="/enviar"
                className="rounded-full border border-slate-300 px-3 py-2.5 text-center font-medium text-slate-700 hover:bg-slate-50 sm:py-1.5"
              >
                {locale === 'es' ? 'Reportar' : 'Report'}
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6">
          <div className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-slate-500">
            <p>{tr.disclaimer}</p>
            <p className="mt-3">
              <Link href="/admin" className="text-slate-400 hover:text-slate-600">
                {tr.nav.admin}
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
