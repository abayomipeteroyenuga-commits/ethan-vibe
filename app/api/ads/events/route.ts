import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const runtime="nodejs";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 if(!process.env.DATABASE_URL)return NextResponse.json({ok:false},{status:503});
 const b=await request.json().catch(()=>null),id=String(b?.campaign_id||""),type=String(b?.event_type||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["impression","click"].includes(type))return NextResponse.json({error:"Invalid ad event."},{status:400});
 const sql=neon(process.env.DATABASE_URL),exists=await sql`SELECT id FROM public.ad_campaigns WHERE id=${id} AND status='active' LIMIT 1`;
 if(!exists[0])return NextResponse.json({error:"Ad unavailable."},{status:404});
 await sql`INSERT INTO public.ad_events(campaign_id,event_type) VALUES(${id},${type})`;
 await sql`UPDATE public.ad_campaigns SET impressions=impressions+${type==="impression"?1:0},clicks=clicks+${type==="click"?1:0},updated_at=now() WHERE id=${id}`;
 return NextResponse.json({ok:true});
}