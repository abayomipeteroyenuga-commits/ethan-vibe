import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 if(!process.env.DATABASE_URL)return NextResponse.json({ads:[]});
 const {data:session}=await auth.getSession();
 if(!session?.user?.emailVerified)return NextResponse.json({ads:[]},{headers:{"Cache-Control":"no-store"}});
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 const ageBand=members[0]?.age_band;
 if(!ageBand)return NextResponse.json({ads:[]},{headers:{"Cache-Control":"no-store"}});
 const ads=ageBand==="18_plus"
  ? await sql`SELECT id::text AS id,headline,body,image_url,destination_url,advertiser_name,placement FROM public.ad_campaigns WHERE status='active' AND ad_category IN ('general','education','technology','events','employment','entertainment') AND (start_at IS NULL OR start_at<=now()) AND (end_at IS NULL OR end_at>now()) ORDER BY created_at DESC LIMIT 4`
  : await sql`SELECT id::text AS id,headline,body,image_url,destination_url,advertiser_name,placement FROM public.ad_campaigns WHERE status='active' AND teen_safe_approved=true AND ad_category IN ('education','technology','events','employment','entertainment') AND (start_at IS NULL OR start_at<=now()) AND (end_at IS NULL OR end_at>now()) ORDER BY created_at DESC LIMIT 4`;
 return NextResponse.json({ads},{headers:{"Cache-Control":"no-store"}});
}