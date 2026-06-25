import { requireAdmin } from '@/lib/admin-auth';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { ResourceForm } from '../resource-form';
import { createResourceAction } from '../../admin-actions';

export const dynamic = 'force-dynamic';

export default async function NewResourcePage() {
  const session = await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">+ {tr.admin.manageResources}</h1>
      <div className="mt-6">
        <ResourceForm
          isAdmin={session.profile.role === 'admin'}
          locale={locale}
          onSubmit={createResourceAction}
        />
      </div>
    </div>
  );
}
