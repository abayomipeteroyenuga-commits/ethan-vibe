import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

// ETHAN VIBE has one explicitly designated platform owner.
// Never grant admin access merely because a profile says "admin" or an
// environment allowlist happens to contain an address.
const PLATFORM_OWNER_EMAIL = "abayomipeteroyenuga@gmail.com";

export async function getAdminContext() {
  const { data: session } = await auth.getSession();
  if (!session?.user || !session.user.emailVerified) return null;
  if (!process.env.DATABASE_URL) return null;

  const sessionEmail = String(session.user.email || "").trim().toLowerCase();
  if (sessionEmail !== PLATFORM_OWNER_EMAIL) return null;

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT
      p.id,
      p.email,
      p.username,
      p.display_name,
      p.role
    FROM public.users p
    INNER JOIN neon_auth."user" a
      ON a.id::text = p.auth_user_id
    WHERE a.id::text = ${session.user.id}
      AND lower(a.email) = ${PLATFORM_OWNER_EMAIL}
      AND lower(p.email) = ${PLATFORM_OWNER_EMAIL}
      AND a."emailVerified" = true
      AND a.banned = false
      AND a.role = 'admin'
      AND p.role = 'admin'
    LIMIT 1
  `;

  const member = rows[0] as
    | { id: string; email: string; username: string; display_name: string; role: string }
    | undefined;

  if (!member) return null;
  return { session, member, sql };
}
