import { requireTeam } from '@/lib/admin-auth';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { MultiMissingForm } from '../multi-form';

export const dynamic = 'force-dynamic';

export default async function NewMissingPage() {
  const session = await requireTeam();
  const locale = await getLocale();
  const tr = t(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">{tr.admin.addMissing}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Sube la captura del post. Si la imagen tiene varias personas (p.ej. una familia), todas quedarán vinculadas al mismo grupo y se podrán mostrar juntas en el sitio público.'
          : 'Upload the post screenshot. If it lists multiple people (e.g. a family), all are linked as one group and shown together publicly.'}
      </p>
      <div className="mt-6">
        <MultiMissingForm
          isAdmin={session.profile.role === 'admin'}
          locale={locale}
        />
      </div>
    </div>
  );
}
