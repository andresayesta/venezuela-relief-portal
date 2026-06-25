import { notFound } from 'next/navigation';
import { requireTeam } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { MissingForm } from '../missing-form';
import { updateMissingAction, deleteMissingAction } from '../../admin-actions';
import { TipsList } from './tips-list';
import { DiligenceChecklist } from '@/components/DiligenceChecklist';

export const dynamic = 'force-dynamic';

export default async function EditMissingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireTeam();
  const locale = await getLocale();
  const tr = t(locale);

  const supabase = await createSupabaseServerClient();
  const [{ data: person }, { data: tips }] = await Promise.all([
    supabase.from('missing_persons').select('*').eq('id', id).single(),
    supabase
      .from('missing_person_tips')
      .select('id, tip_giver_name, tip_giver_contact, info, created_at, reviewed')
      .eq('missing_person_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!person) notFound();

  async function onSubmit(form: FormData) {
    'use server';
    return updateMissingAction(id, form);
  }
  async function onDelete() {
    'use server';
    return deleteMissingAction(id);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">{person.full_name}</h1>
      <p className="mt-1 text-xs text-slate-500">
        {person.is_published
          ? locale === 'es' ? 'Publicado' : 'Published'
          : locale === 'es' ? 'No publicado' : 'Unpublished'}
      </p>

      {tips && tips.length > 0 && (
        <TipsList tips={tips} locale={locale} />
      )}

      <DiligenceChecklist kind="missing" locale={locale} />

      <div className="mt-6">
        <MissingForm
          initial={person}
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
