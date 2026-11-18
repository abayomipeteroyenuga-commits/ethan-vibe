import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const {data:session}=await auth.getSession();
 if(!session?.user?.emailVerified)return NextResponse.json({error:"Sign in to continue."},{status:401});
 if(!process.env.DATABASE_URL)return NextResponse.json({ok:false},{status:503});
 const b=await request.json().catch(()=>null),id=String(b?.campaign_id||""),type=String(b?.event_type||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["impression","click"].includes(type))return NextResponse.json({error:"Invalid ad event."},{status:400});
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 const ageBand=members[0]?.age_band;
 if(!ageBand)return NextResponse.json({error:"Complete age verification first."},{status:403});
 const eligible=ageBand==="18_plus"
  ? await sql`SELECT id FROM public.ad_campaigns WHERE id=${id} AND status='active' AND ad_category IN ('general','education','technology','events','employment','entertainment') LIMIT 1`
  : await sql`SELECT id FROM public.ad_campaigns WHERE id=${id} AND status='active' AND teen_safe_approved=true AND ad_category IN ('education','technology','events','employment','entertainment') LIMIT 1`;
 if(!eligible[0])return NextResponse.json({error:"Ad unavailable."},{status:404});
 await sql`INSERT INTO public.ad_events(campaign_id,event_type) VALUES(${id},${type})`;
 await sql`UPDATE public.ad_campaigns SET impressions=impressions+${type==="impression"?1:0},clicks=clicks+${type==="click"?1:0},updated_at=now() WHERE id=${id}`;
 return NextResponse.json({ok:true});
}