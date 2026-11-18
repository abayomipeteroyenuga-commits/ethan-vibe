import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const admin = await getAdminContext();
  if (!admin) return NextResponse.json({error:"Admin access required."},{status:403,headers:{"Cache-Control":"no-store"}});
  const {sql}=admin;
  const [totals, daily, pending, reports, verified] = await Promise.all([
    sql`SELECT count(*)::int AS total_members, count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos')::int AS today_signups, count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS last_7_days, count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS last_30_days FROM public.users`,
    sql`SELECT to_char(day, 'YYYY-MM-DD') AS day, count(*)::int AS registrations FROM (SELECT (created_at AT TIME ZONE 'Africa/Lagos')::date AS day FROM public.users WHERE created_at >= now() - interval '29 days') d GROUP BY day ORDER BY day ASC`,
    sql`SELECT count(*)::int AS count FROM public.posts WHERE moderation_status = 'pending_review'`,
    sql`SELECT count(*)::int AS count FROM public.content_reports WHERE status = 'open'`,
    sql`SELECT count(*)::int AS count FROM public.users WHERE is_verified = true`
  ]);
  return NextResponse.json({totals:totals[0],daily,pending:pending[0].count,openReports:reports[0].count,verified:verified[0].count,timezone:"Africa/Lagos"},{headers:{"Cache-Control":"no-store"}});
}
