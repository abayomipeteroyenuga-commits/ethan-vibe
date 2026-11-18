import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Profile storage is not configured." }, { status: 503 });
  const email = session.user.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Your account needs an email address." }, { status: 400 });
  const displayName = (session.user.name || email.split("@")[0]).trim().slice(0, 80);
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "viber";
  const username = `${base}_${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    INSERT INTO public.users (auth_user_id, email, username, display_name, is_verified)
    VALUES (${session.user.id}, ${email}, ${username}, ${displayName}, ${Boolean(session.user.emailVerified)})
    ON CONFLICT (auth_user_id) DO UPDATE SET email=EXCLUDED.email, display_name=EXCLUDED.display_name, is_verified=EXCLUDED.is_verified, updated_at=now()
    RETURNING id, username, display_name
  `;
  return NextResponse.json({ profile: rows[0] });
}
