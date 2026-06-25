import { requireTeam } from '@/lib/admin-auth';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { MissingForm } from '../missing-form';
import { createMissingAction } from '../../admin-actions';

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
          ? 'Sube la captura del post para que la IA llene los campos. Marca el consentimiento solo si el reportante lo autorizó.'
          : 'Upload the post screenshot so the AI fills the fields. Check consent only if the reporter authorized it.'}
      </p>
      <div className="mt-6">
        <MissingForm
          isAdmin={session.profile.role === 'admin'}
          locale={locale}
          onSubmit={createMissingAction}
        />
      </div>
    </div>
  );
}
