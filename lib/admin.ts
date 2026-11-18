import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

export async function getAdminContext() {
  const { data: session } = await auth.getSession();
  if (!session?.user || !session.user.emailVerified) return null;
  if (!process.env.DATABASE_URL) return null;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT id, email, username, display_name, role
    FROM public.users
    WHERE auth_user_id = ${session.user.id}
    LIMIT 1
  `;
  const member = rows[0] as {id:string;email:string;username:string;display_name:string;role:string}|undefined;
  if (!member) return null;
  const allowlist = (process.env.VIBE_ADMIN_EMAILS || "").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  const isAdmin = member.role === "admin" || allowlist.includes(member.email.toLowerCase());
  return isAdmin ? { session, member, sql } : null;
}
