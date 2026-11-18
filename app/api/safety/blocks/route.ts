import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function context(request?:Request){
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return {error:NextResponse.json({error:"Sign in with a verified account."},{status:401})};
 if(!process.env.DATABASE_URL)return {error:NextResponse.json({error:"Safety settings are temporarily unavailable."},{status:503})};
 const sql=neon(process.env.DATABASE_URL);
 const rows=await sql`SELECT id,age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 if(!rows[0]?.age_band)return {error:NextResponse.json({error:"Complete age verification first."},{status:403})};
 return {sql,member:rows[0]};
}
export async function GET(){
 const c=await context();if("error" in c)return c.error;
 const rows=await c.sql`SELECT b.blocked_id::text AS user_id,u.username,u.display_name,u.avatar_url,b.created_at FROM public.user_blocks b JOIN public.users u ON u.id=b.blocked_id WHERE b.blocker_id=${c.member.id} ORDER BY b.created_at DESC`;
 return NextResponse.json({blocked:rows},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const c=await context();if("error" in c)return c.error;
 const body=await request.json().catch(()=>null),target=String(body?.user_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(target))return NextResponse.json({error:"Choose a valid member to block."},{status:400});
 const rows=await c.sql`SELECT id,age_band FROM public.users WHERE id=${target} LIMIT 1`;
 if(!rows[0])return NextResponse.json({error:"Member not found."},{status:404});
 if(rows[0].id===c.member.id)return NextResponse.json({error:"You cannot block your own account."},{status:400});
 await c.sql`INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES(${c.member.id},${target}) ON CONFLICT(blocker_id,blocked_id) DO NOTHING`;
 return NextResponse.json({success:true,message:"This member has been blocked. Their posts will no longer appear in your feed."});
}
export async function DELETE(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const c=await context();if("error" in c)return c.error;
 const body=await request.json().catch(()=>null),target=String(body?.user_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(target))return NextResponse.json({error:"Choose a valid member."},{status:400});
 await c.sql`DELETE FROM public.user_blocks WHERE blocker_id=${c.member.id} AND blocked_id=${target}`;
 return NextResponse.json({success:true,message:"Member unblocked."});
}
