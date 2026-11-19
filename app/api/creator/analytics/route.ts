import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.emailVerified) return NextResponse.json({ error: "Sign in with a verified email to view Creator Studio." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Creator analytics are temporarily unavailable." }, { status: 503 });

  const sql = neon(process.env.DATABASE_URL);
  const members = await sql`SELECT id, display_name, username FROM public.users WHERE auth_user_id = ${session.user.id} AND is_verified = true LIMIT 1`;
  if (!members[0]) return NextResponse.json({ error: "Complete your VIBE profile before opening Creator Studio." }, { status: 403 });
  const memberId = members[0].id;

  const [summary, topPosts, daily] = await Promise.all([
    sql`SELECT
      count(*)::int AS total_posts,
      count(*) FILTER (WHERE moderation_status = 'approved')::int AS published_posts,
      count(*) FILTER (WHERE moderation_status = 'pending_review')::int AS pending_posts,
      count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS posts_30d,
      coalesce(sum((SELECT count(*) FROM public.post_likes l WHERE l.post_id = p.id)),0)::int AS total_likes,
      coalesce(sum((SELECT count(*) FROM public.comments c WHERE c.post_id = p.id)),0)::int AS total_comments
      FROM public.posts p WHERE p.author_id = ${memberId}`,
    sql`SELECT p.id::text AS id, left(coalesce(p.body,''),180) AS excerpt, p.created_at,
      p.moderation_status, p.media_type,
      (SELECT count(*)::int FROM public.post_likes l WHERE l.post_id=p.id) AS likes,
      (SELECT count(*)::int FROM public.comments c WHERE c.post_id=p.id) AS comments
      FROM public.posts p WHERE p.author_id=${memberId}
      ORDER BY ((SELECT count(*) FROM public.post_likes l WHERE l.post_id=p.id) + (SELECT count(*) FROM public.comments c WHERE c.post_id=p.id)) DESC, p.created_at DESC LIMIT 6`,
    sql`SELECT to_char(day::date,'Mon DD') AS day, count(p.id)::int AS posts
      FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS day
      LEFT JOIN public.posts p ON p.author_id=${memberId} AND p.created_at >= day AND p.created_at < day + interval '1 day'
      GROUP BY day ORDER BY day`
  ]);
  return NextResponse.json({
    creator: { name: members[0].display_name, username: members[0].username },
    summary: summary[0] || {},
    topPosts,
    activity: daily
  }, { headers: { "Cache-Control": "no-store" } });
}