/**
 * Supabase session-refresh middleware helper.
 *
 * Call this from within the main Virgil middleware (src/middleware.ts).
 * It refreshes the Supabase auth session cookie so Server Components
 * always get a valid session without an extra round-trip.
 *
 * Returns the mutated response with refreshed cookies set.
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function refreshSupabaseSession(
  request: NextRequest,
  baseResponse: NextResponse,
): Promise<NextResponse> {
  let response = baseResponse;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Forward cookies onto the mutating response.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: this call is what actually refreshes the session.
  // Do not remove it, and do not call supabase.auth anywhere else in middleware.
  await supabase.auth.getUser();

  return response;
}
