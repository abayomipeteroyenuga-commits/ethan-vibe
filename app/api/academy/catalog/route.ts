import {NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 if(!process.env.DATABASE_URL)return NextResponse.json({courses:[],plans:[]},{status:503});
 const sql=neon(process.env.DATABASE_URL);
 const [courses,plans]=await Promise.all([
  sql`SELECT id::text AS id,slug,title,description,price_ngn::float8 AS price_ngn,access_days FROM public.academy_courses WHERE is_active=true ORDER BY created_at`,
  sql`SELECT slug,title,description,price_ngn::float8 AS price_ngn,access_days FROM public.vibe_plans WHERE is_active=true ORDER BY price_ngn`
 ]);
 return NextResponse.json({courses,plans},{headers:{"Cache-Control":"no-store"}});
}
