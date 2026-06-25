import { requireTeam } from '@/lib/admin-auth';
import { getLocale } from '@/lib/locale';
import { QuickAddForm } from './form';

export const dynamic = 'force-dynamic';

export default async function QuickAddPage() {
  await requireTeam();
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-xl font-semibold">
        ✨ {locale === 'es' ? 'Añadir desde URL' : 'Quick Add from URL'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Pega cualquier enlace (artículo, flyer, post). La IA lo lee, lo clasifica y crea un borrador listo para que lo revises.'
          : 'Paste any link (article, flyer, post). The AI reads it, classifies it, and creates a draft ready for review.'}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {locale === 'es'
          ? 'Funciona mejor con artículos de prensa, páginas de organizaciones y posts públicos. Posts privados o redes con login no funcionan.'
          : 'Works best with news articles, org pages, and public posts. Login-gated content won\'t work.'}
      </p>
      <div className="mt-6">
        <QuickAddForm locale={locale} />
      </div>
    </div>
  );
}
