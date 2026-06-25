import { requireTeam } from '@/lib/admin-auth';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { CenterForm } from '../center-form';
import { createCenterAction } from '../../admin-actions';

export const dynamic = 'force-dynamic';

export default async function NewCenterPage() {
  const session = await requireTeam();
  const locale = await getLocale();
  const tr = t(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">{tr.admin.addCenter}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {locale === 'es'
          ? 'Solo Nombre, Estado y Aceptan son requeridos. El resto es opcional.'
          : 'Only Name, State, and Accepts are required.'}
      </p>
      <div className="mt-6">
        <CenterForm
          isAdmin={session.profile.role === 'admin'}
          locale={locale}
          onSubmit={createCenterAction}
        />
      </div>
    </div>
  );
}
