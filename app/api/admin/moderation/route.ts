import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const admin=await getAdminContext();
  if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  const [posts,reports]=await Promise.all([
    admin.sql`SELECT p.id,p.body,p.media_url,p.media_type,p.created_at,p.moderation_status,p.moderation_reason,u.username,u.display_name,u.email FROM public.posts p JOIN public.users u ON u.id=p.author_id WHERE p.moderation_status='pending_review' ORDER BY p.created_at ASC LIMIT 100`,
    admin.sql`SELECT r.id,r.post_id,r.reason,r.details,r.created_at,u.username,u.display_name,p.body FROM public.content_reports r JOIN public.users u ON u.id=r.reporter_id JOIN public.posts p ON p.id=r.post_id WHERE r.status='open' ORDER BY r.created_at ASC LIMIT 100`
  ]);
  return NextResponse.json({posts,reports},{headers:{"Cache-Control":"no-store"}});
}
export async function PATCH(request:Request) {
  const admin=await getAdminContext();
  if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  const origin=request.headers.get("origin");
  if(origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
  const body=await request.json().catch(()=>null);
  const id=typeof body?.id==="string"?body.id:"";
  const action=body?.action;
  const reason=typeof body?.reason==="string"?body.reason.slice(0,500):"Reviewed by moderator";
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["approve","reject","remove"].includes(action))return NextResponse.json({error:"Invalid moderation action."},{status:400});
  const status=action==="approve"?"approved":"rejected";
  const updated=await admin.sql`UPDATE public.posts SET moderation_status=${status},moderation_reason=${reason},moderated_at=now(),moderated_by=${admin.member.id},updated_at=now() WHERE id=${id} AND moderation_status IN ('pending_review','approved') RETURNING id`;
  if(!updated[0])return NextResponse.json({error:"Post not found or already processed."},{status:404});
  await admin.sql`INSERT INTO public.moderation_actions(post_id,moderator_id,action,reason) VALUES(${id},${admin.member.id},${action==="approve"?"approved":action==="remove"?"removed":"rejected"},${reason})`;
  return NextResponse.json({success:true,status});
}
