import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "./db";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Upsert user in our DB
  const dbUser = await db.user.upsert({
    where: { supabaseId: user.id },
    update: {
      email: user.email!,
      avatarUrl: user.user_metadata?.avatar_url,
      displayName: user.user_metadata?.full_name || user.user_metadata?.name,
    },
    create: {
      supabaseId: user.id,
      email: user.email!,
      avatarUrl: user.user_metadata?.avatar_url,
      displayName: user.user_metadata?.full_name || user.user_metadata?.name,
    },
  });

  return dbUser;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}
