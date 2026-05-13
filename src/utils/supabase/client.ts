import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Browser-side Supabase client. Safe to call inside Client Components.
 * Reuse a single instance per component tree — don't call this in a loop.
 */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
