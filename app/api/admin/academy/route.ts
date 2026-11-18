import {NextResponse} from "next/server";
import {getAdminContext} from "@/lib/admin";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const admin=await getAdminContext();
 if(!admin)return NextResponse.json({error:"Administrator access required."},{status:403});
 const [summary,orders,enrolments]=await Promise.all([
  admin.sql`SELECT count(*) FILTER(WHERE status='paid')::int AS paid_orders,COALESCE(sum(amount_kobo) FILTER(WHERE status='paid'),0)::numeric/100 AS gross_revenue_ngn,count(*) FILTER(WHERE status='pending')::int AS pending_orders FROM public.payment_orders`,
  admin.sql`SELECT o.reference,o.product_type,o.amount_kobo::numeric/100 AS amount_ngn,o.status,o.created_at,u.display_name,u.email,COALESCE(c.title,v.title) AS product_title FROM public.payment_orders o JOIN public.users u ON u.id=o.user_id LEFT JOIN public.academy_courses c ON c.id=o.course_id LEFT JOIN public.vibe_plans v ON v.slug=o.plan_slug ORDER BY o.created_at DESC LIMIT 30`,
  admin.sql`SELECT count(*) FILTER(WHERE status='active' AND expires_at>now())::int AS active_enrollments FROM public.course_enrollments`
 ]);
 return NextResponse.json({summary:summary[0],orders,active_enrollments:enrolments[0]?.active_enrollments||0},{headers:{"Cache-Control":"no-store"}});
}
