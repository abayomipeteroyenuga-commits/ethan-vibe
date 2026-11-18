import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
import { createMediaUploadUrl, r2Configured } from "@/lib/storage/r2";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const allowed:Record<string,{ext:string;type:"image"|"video";max:number}> = {
  "image/jpeg":{ext:"jpg",type:"image",max:10*1024*1024},
  "image/png":{ext:"png",type:"image",max:10*1024*1024},
  "image/webp":{ext:"webp",type:"image",max:10*1024*1024},
  "image/gif":{ext:"gif",type:"image",max:10*1024*1024},
  "video/mp4":{ext:"mp4",type:"video",max:100*1024*1024},
  "video/webm":{ext:"webm",type:"video",max:100*1024*1024}
};
export async function POST(request:Request){
  if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
  const {data:session}=await auth.getSession();
  if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in with a verified email to upload media."},{status:401});
  if(!process.env.DATABASE_URL)return NextResponse.json({error:"Media uploads are temporarily unavailable."},{status:503});
  const sql=neon(process.env.DATABASE_URL);
  const members=await sql`SELECT id,age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
  if(!members[0]||!members[0].age_band)return NextResponse.json({error:"Complete the 13+ age check before uploading."},{status:403});
  if(!r2Configured())return NextResponse.json({error:"Media storage has not been connected yet. Add the Cloudflare R2 environment variables."},{status:503});
  const body=await request.json().catch(()=>null);
  const contentType=typeof body?.contentType==="string"?body.contentType:"";
  const size=Number(body?.size);
  const spec=allowed[contentType];
  if(!spec||!Number.isFinite(size)||size<=0||size>spec.max)return NextResponse.json({error:"Choose a JPG, PNG, WEBP or GIF image up to 10 MB, or an MP4/WEBM video up to 100 MB."},{status:400});
  const key=`uploads/${members[0].id}/${crypto.randomUUID()}.${spec.ext}`;
  try{
    const uploadUrl=await createMediaUploadUrl(key,contentType);
    return NextResponse.json({uploadUrl,key,mediaType:spec.type,expiresIn:300},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Could not prepare a secure media upload."},{status:503});
  }
}
