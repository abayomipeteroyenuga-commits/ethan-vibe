import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin !== new URL(request.url).origin || (fetchSite && fetchSite !== "same-origin")) {
    return reply({ error: "Invalid request origin." }, 403);
  }

  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return reply({ error: "Sign in to continue." }, 401);
    if (!session.user.emailVerified) return reply({ error: "Verify your email before setting up your VIBE profile." }, 403);
    if (!process.env.DATABASE_URL) return reply({ error: "Profile storage is temporarily unavailable." }, 503);

    const email = session.user.email?.trim().toLowerCase();
    if (!email) return reply({ error: "Your account needs a verified email address." }, 400);
    const displayName = (session.user.name || email.split("@")[0]).trim().slice(0, 80);
    const payload = await request.json().catch(() => ({}));
    const dateOfBirth = typeof payload?.dateOfBirth === "string" ? payload.dateOfBirth : "";
    const sql = neon(process.env.DATABASE_URL);

    const existing = await sql`SELECT id, username, display_name, age_band FROM public.users WHERE auth_user_id = ${session.user.id} LIMIT 1`;
    let ageBand: "13_15" | "16_17" | "18_plus" | null = existing[0]?.age_band || null;
    if (!ageBand) {
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateOfBirth)) return reply({ error: "Confirm your date of birth to continue.", code: "AGE_REQUIRED" }, 428);
      const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
      if (Number.isNaN(dob.getTime()) || dob.toISOString().slice(0, 10) !== dateOfBirth) return reply({ error: "Enter a valid date of birth." }, 400);
      const today = new Date();
      let age = today.getUTCFullYear() - dob.getUTCFullYear();
      const beforeBirthday = today.getUTCMonth() < dob.getUTCMonth() || (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
      if (beforeBirthday) age--;
      if (age < 13) return reply({ error: "ETHAN VIBE is for people aged 13 and above. You cannot create a VIBE profile yet." }, 403);
      ageBand = age <= 15 ? "13_15" : age <= 17 ? "16_17" : "18_plus";
    }

    if (existing[0]) {
      const rows = await sql`UPDATE public.users SET email = ${email}, display_name = ${displayName}, is_verified = true, age_band = COALESCE(age_band, ${ageBand}), age_verified_at = COALESCE(age_verified_at, now()), updated_at = now() WHERE auth_user_id = ${session.user.id} RETURNING id, username, display_name, age_band`;
      return reply({ profile: rows[0] });
    }

    const emailOwner = await sql`SELECT auth_user_id FROM public.users WHERE lower(email) = ${email} LIMIT 1`;
    if (emailOwner[0] && emailOwner[0].auth_user_id !== session.user.id) {
      return reply({ error: "A VIBE profile already uses this email. Please sign in or contact support to recover it." }, 409);
    }

    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "viber";
    const username = base + "_" + crypto.randomUUID().replace(/-/g, "").slice(0, 6);
    const rows = await sql`
      INSERT INTO public.users (auth_user_id, email, username, display_name, is_verified, age_band, age_verified_at)
      VALUES (${session.user.id}, ${email}, ${username}, ${displayName}, true, ${ageBand}, now())
      ON CONFLICT (auth_user_id) WHERE auth_user_id IS NOT NULL
      DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, is_verified = true, age_band = COALESCE(public.users.age_band, EXCLUDED.age_band), age_verified_at = COALESCE(public.users.age_verified_at, now()), updated_at = now()
      RETURNING id, username, display_name, age_band
    `;
    return reply({ profile: rows[0] });
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return reply({ error: "That email or username is already linked to a VIBE profile. Please sign in or contact support." }, 409);
    }
    console.error("VIBE profile sync failed:", error);
    return reply({ error: "We couldn't finish setting up your profile. Please try again." }, 500);
  }
}
