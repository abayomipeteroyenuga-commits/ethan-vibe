import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
import { getMediaReadUrl, r2Configured, verifyUploadedMedia } from "@/lib/storage/r2";
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
 const {data:session}=await auth.getSession();
 const members=session?.user?.emailVerified?await sql`SELECT id FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`:[];
 const viewerId=members[0]?.id||null;
 const rows=await sql`SELECT p.id::text AS id,p.author_id::text AS author_id,u.display_name AS name,u.username AS handle,upper(left(u.display_name,2)) AS avatar,p.created_at,p.body AS text,'Community' AS tag,p.media_url,p.media_type,u.is_verified AS verified,(SELECT count(*)::int FROM public.post_likes l WHERE l.post_id=p.id) AS likes,(SELECT count(*)::int FROM public.comments c WHERE c.post_id=p.id) AS comments FROM public.posts p JOIN public.users u ON u.id=p.author_id WHERE p.visibility='public' AND p.moderation_status='approved' AND NOT EXISTS (SELECT 1 FROM public.user_blocks b WHERE (b.blocker_id=${viewerId} AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=${viewerId})) ORDER BY p.created_at DESC LIMIT 60`;
 const posts=await Promise.all(rows.map(async(row:any)=>({...row,media_url:row.media_url?(r2Configured()?await getMediaReadUrl(row.media_url).catch(()=>null):(/^https:\/\//i.test(row.media_url)?row.media_url:null)):null})));
 return NextResponse.json({posts},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in with a verified email to post."},{status:401});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Publishing is temporarily unavailable."},{status:503});
 const body=await request.json().catch(()=>null);
 const text=typeof body?.body==="string"?body.body.trim():"";
 const mediaKey=typeof body?.media_key==="string"?body.media_key:"";
 const mediaType=body?.media_type==="image"||body?.media_type==="video"?body.media_type:null;
 if((!text&&!mediaKey)||text.length>5000)return NextResponse.json({error:"Write a post of up to 5,000 characters or attach media."},{status:400});
 if(mediaKey&&!mediaType)return NextResponse.json({error:"Choose a valid image or video attachment."},{status:400});
 const hit=blocked.find(([,pattern])=>pattern.test(text));
 if(hit)return NextResponse.json({error:"This post appears to contain prohibited content and cannot be published. Please follow the VIBE Community Guidelines.",category:hit[0]},{status:422});
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT id,age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 if(!members[0]||!members[0].age_band)return NextResponse.json({error:"Complete the 13+ age check before posting."},{status:403});
 if(mediaKey){
   if(!r2Configured())return NextResponse.json({error:"Media storage is not connected yet."},{status:503});
   if(!mediaKey.startsWith(`uploads/${members[0].id}/`)||mediaKey.includes(".."))return NextResponse.json({error:"This media upload does not belong to your account."},{status:403});
   try{
     const object=await verifyUploadedMedia(mediaKey);
     const max=mediaType==="image"?10*1024*1024:100*1024*1024;
     const expected=mediaType==="image"?["image/jpeg","image/png","image/webp","image/gif"]:["video/mp4","video/webm"];
     if(!object.ContentLength||object.ContentLength>max||!object.ContentType||!expected.includes(object.ContentType))return NextResponse.json({error:"The uploaded file failed media validation."},{status:400});
   }catch{return NextResponse.json({error:"The uploaded media could not be verified. Please upload it again."},{status:400});}
 }
 // Every new post, including media, remains private from the feed until a moderator approves it.
 const rows=await sql`INSERT INTO public.posts(author_id,body,media_url,media_type,visibility,moderation_status,moderation_reason) VALUES(${members[0].id},${text},${mediaKey||null},${mediaKey?mediaType:null},'public','pending_review','Awaiting moderator review') RETURNING id,created_at,moderation_status`;
 return NextResponse.json({post:rows[0],message:"Your post has been submitted for a quick community-safety review."},{status:201,headers:{"Cache-Control":"no-store"}});
}
