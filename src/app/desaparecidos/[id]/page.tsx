import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Public missing-person detail pages are retired. Anyone hitting an old
// shared link gets bounced to the new landing, which points them to
// desaparecidosterremotovenezuela.com.
export default async function RetiredMissingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/desaparecidos');
}
