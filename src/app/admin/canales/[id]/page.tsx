import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { ChannelForm } from '../channel-form';
import { updateChannelAction, deleteChannelAction } from '../../admin-actions';

export const dynamic = 'force-dynamic';

export default async function EditChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();
  const { data: channel } = await supabase.from('donation_channels').select('*').eq('id', id).single();
  if (!channel) notFound();

  async function onSubmit(form: FormData) {
    'use server';
    return updateChannelAction(id, form);
  }
  async function onDelete() {
    'use server';
    return deleteChannelAction(id);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">{channel.name}</h1>
      <div className="mt-6">
        <ChannelForm
          initial={channel}
          isAdmin={session.profile.role === 'admin'}
          locale={locale}
          onSubmit={onSubmit}
          onDelete={onDelete}
          submitLabelOverride={tr.common.save}
        />
      </div>
    </div>
  );
}
