import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reasons=["nudity","sexual_content","violence","hate_speech","harassment","spam","self_harm","misinformation","other"];
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in with a verified account."},{status:401});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Reporting is temporarily unavailable."},{status:503});
 const body=await request.json().catch(()=>null),postId=String(body?.post_id||""),reason=String(body?.reason||""),details=typeof body?.details==="string"?body.details.trim().slice(0,1000):"";
 if(!/^[0-9a-f-]{36}$/i.test(postId)||!reasons.includes(reason))return NextResponse.json({error:"Choose a post and a valid report reason."},{status:400});
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT id,age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 if(!members[0]?.age_band)return NextResponse.json({error:"Complete age verification first."},{status:403});
 const post=await sql`SELECT id,author_id FROM public.posts WHERE id=${postId} LIMIT 1`;
 if(!post[0])return NextResponse.json({error:"Post not found."},{status:404});
 if(post[0].author_id===members[0].id)return NextResponse.json({error:"You cannot report your own post."},{status:400});
 try{
  await sql`INSERT INTO public.content_reports(post_id,reporter_id,reason,details) VALUES(${postId},${members[0].id},${reason},${details})`;
 }catch(error){
  if((error as {code?:string})?.code==="23505")return NextResponse.json({error:"You have already reported this post."},{status:409});
  throw error;
 }
 return NextResponse.json({success:true,message:"Thank you. Your report has been sent to the moderation team for review."},{status:201});
}
