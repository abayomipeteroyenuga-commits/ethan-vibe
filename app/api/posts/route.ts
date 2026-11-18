import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const blocked: Array<[string,RegExp]> = [
 ["nudity_or_explicit_sexual_content",/\b(nudes?|naked pics?|porn(?:ography)?|xxx|sex tape|explicit sex|send nudes|onlyfans leak)\b/i],
 ["sexual_exploitation",/\b(child porn|child sexual|underage sex|sexual exploitation|rape fantasy)\b/i],
 ["graphic_violence",/\b(gore|beheading|dismemberment|graphic killing|murder video)\b/i],
 ["hate_or_targeted_abuse",/\b(kill all|gas the|racial slur|ethnic cleansing)\b/i],
 ["self_harm_encouragement",/\b(go kill yourself|encourage suicide|how to commit suicide)\b/i]
];
export async function GET(){
 if(!process.env.DATABASE_URL)return NextResponse.json({posts:[]});
 const sql=neon(process.env.DATABASE_URL);
 const rows=await sql`SELECT p.id::text AS id,u.display_name AS name,u.username AS handle,upper(left(u.display_name,2)) AS avatar,p.created_at,p.body AS text,'Community' AS tag,p.media_url,p.media_type,u.is_verified AS verified,(SELECT count(*)::int FROM public.post_likes l WHERE l.post_id=p.id) AS likes,(SELECT count(*)::int FROM public.comments c WHERE c.post_id=p.id) AS comments FROM public.posts p JOIN public.users u ON u.id=p.author_id WHERE p.visibility='public' AND p.moderation_status='approved' ORDER BY p.created_at DESC LIMIT 60\`;
 return NextResponse.json({posts:rows},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in with a verified email to post."},{status:401});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Publishing is temporarily unavailable."},{status:503});
 const body=await request.json().catch(()=>null);
 const text=typeof body?.body==="string"?body.body.trim():"";
 if(!text||text.length>5000)return NextResponse.json({error:"Write a post of 1–5,000 characters."},{status:400});
 const hit=blocked.find(([,pattern])=>pattern.test(text));
 if(hit)return NextResponse.json({error:"This post appears to contain prohibited content and cannot be published. Please follow the VIBE Community Guidelines.",category:hit[0]},{status:422});
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT id FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1\`;
 if(!members[0])return NextResponse.json({error:"Finish setting up your VIBE profile before posting."},{status:403});
 // Hold every new post for human review until a dedicated AI moderation provider is configured.
 const rows=await sql`INSERT INTO public.posts(author_id,body,visibility,moderation_status,moderation_reason) VALUES(${members[0].id},${text},'public','pending_review','Awaiting moderator review') RETURNING id,created_at,moderation_status\`;
 return NextResponse.json({post:rows[0],message:"Your post has been submitted for a quick community-safety review."},{status:201,headers:{"Cache-Control":"no-store"}});
}
