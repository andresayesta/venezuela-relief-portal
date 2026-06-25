import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Server-side Supabase client bound to the request's cookies.
// Use in Server Components, Server Actions, and route handlers.
// In Next 16, cookies() is async — await it before passing to createServerClient.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll fails when called from a Server Component; ignored —
            // proxy.ts refreshes the session for each navigation.
          }
        },
      },
    },
  );
}
