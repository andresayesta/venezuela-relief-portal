import { requireAdmin } from '@/lib/admin-auth';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { ChannelForm } from '../channel-form';
import { createChannelAction } from '../../admin-actions';

export const dynamic = 'force-dynamic';

export default async function NewChannelPage() {
  const session = await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">+ {tr.admin.manageChannels}</h1>
      <div className="mt-6">
        <ChannelForm
          isAdmin={session.profile.role === 'admin'}
          locale={locale}
          onSubmit={createChannelAction}
        />
      </div>
    </div>
  );
}
