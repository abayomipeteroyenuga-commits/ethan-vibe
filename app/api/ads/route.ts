import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 if(!process.env.DATABASE_URL)return NextResponse.json({ads:[]});
 const sql=neon(process.env.DATABASE_URL);
 const ads=await sql`SELECT id::text AS id,headline,body,image_url,destination_url,advertiser_name,placement FROM public.ad_campaigns WHERE status='active' AND (start_at IS NULL OR start_at<=now()) AND (end_at IS NULL OR end_at>now()) ORDER BY created_at DESC LIMIT 4`;
 return NextResponse.json({ads},{headers:{"Cache-Control":"no-store"}});
}