import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { ResourceForm } from '../resource-form';
import { updateResourceAction, deleteResourceAction } from '../../admin-actions';
import { DiligenceChecklist } from '@/components/DiligenceChecklist';

export const dynamic = 'force-dynamic';

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();
  const locale = await getLocale();
  const tr = t(locale);
  const supabase = await createSupabaseServerClient();
  const { data: resource } = await supabase.from('resource_links').select('*').eq('id', id).single();
  if (!resource) notFound();

  async function onSubmit(form: FormData) {
    'use server';
    return updateResourceAction(id, form);
  }
  async function onDelete() {
    'use server';
    return deleteResourceAction(id);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">{resource.title}</h1>
      <DiligenceChecklist kind="resource" locale={locale} />

      <div className="mt-6">
        <ResourceForm
          initial={resource}
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
