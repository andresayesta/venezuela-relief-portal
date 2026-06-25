import { notFound } from 'next/navigation';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { CenterForm } from '../center-form';
import { updateCenterAction, deleteCenterAction } from '../../admin-actions';

export const dynamic = 'force-dynamic';

export default async function EditCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTeam();
  const locale = await getLocale();
  const tr = t(locale);

  const supabase = await createSupabaseServerClient();
  const { data: center } = await supabase
    .from('collection_centers')
    .select('*')
    .eq('id', id)
    .single();

  if (!center) notFound();

  // Bind id into server actions for the form.
  async function onSubmit(form: FormData) {
    'use server';
    return updateCenterAction(id, form);
  }
  async function onDelete() {
    'use server';
    return deleteCenterAction(id);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">{center.name}</h1>
      <p className="mt-1 text-xs text-slate-500">
        {center.is_published
          ? locale === 'es' ? 'Publicado' : 'Published'
          : locale === 'es' ? 'No publicado' : 'Unpublished'}
      </p>
      <div className="mt-6">
        <CenterForm
          initial={center}
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
