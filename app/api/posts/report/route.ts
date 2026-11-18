import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in to report content."},{status:401});
 const body=await request.json().catch(()=>null);
 const postId=typeof body?.postId==="string"?body.postId:"";
 const reason=body?.reason;
 const details=typeof body?.details==="string"?body.details.slice(0,1000):"";
 const allowed=["nudity","sexual_content","violence","hate_speech","harassment","spam","self_harm","misinformation","other"];
 if(!/^[0-9a-f-]{36}$/i.test(postId)||!allowed.includes(reason))return NextResponse.json({error:"Choose a valid report reason."},{status:400});
 const sql=neon(process.env.DATABASE_URL!);
 const users=await sql`SELECT id FROM public.users WHERE auth_user_id=${session.user.id} LIMIT 1`;
 if(!users[0])return NextResponse.json({error:"Complete your profile first."},{status:403});
 const result=await sql`INSERT INTO public.content_reports(post_id,reporter_id,reason,details) SELECT p.id,${users[0].id},${reason},${details} FROM public.posts p WHERE p.id=${postId} ON CONFLICT DO NOTHING RETURNING id`;
 if(!result[0])return NextResponse.json({error:"We couldn't submit that report. It may already have been reported by you."},{status:409});
 return NextResponse.json({success:true,message:"Thank you. The moderation team will review this report."},{status:201});
}
