import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Missing-person submissions retired; direct people to the partner registry.
export default async function RetiredEnviarDesaparecidoPage() {
  redirect('/desaparecidos');
}
