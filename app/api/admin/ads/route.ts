import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const categories=["general","education","technology","events","employment","entertainment","finance","other"];
const teenSafeCategories=["education","technology","events","employment","entertainment"];
export async function GET(){
 const admin=await getAdminContext();
 if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
 const [campaigns,inquiries]=await Promise.all([
  admin.sql`SELECT id,advertiser_name,contact_email,headline,placement,status,budget_ngn,impressions,clicks,start_at,end_at,ad_category,teen_safe_approved,created_at FROM public.ad_campaigns ORDER BY created_at DESC LIMIT 100`,
  admin.sql`SELECT id,business_name,contact_name,email,phone,objective,budget_ngn,status,created_at FROM public.advertiser_inquiries ORDER BY created_at DESC LIMIT 50`
 ]);
 return NextResponse.json({campaigns,inquiries},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const admin=await getAdminContext();
 if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const b=await request.json().catch(()=>null);
 const advertiser=String(b?.advertiser_name||"").trim().slice(0,120),email=String(b?.contact_email||"").trim().slice(0,254),headline=String(b?.headline||"").trim().slice(0,120),body=String(b?.body||"").trim().slice(0,500),destination=String(b?.destination_url||"").trim(),image=String(b?.image_url||"").trim().slice(0,1000)||null,placement=["feed","all"].includes(b?.placement)?b.placement:"feed",budget=Number(b?.budget_ngn),category=categories.includes(b?.ad_category)?b.ad_category:"general",teenSafe=b?.teen_safe_approved===true;
 if(teenSafe&&!teenSafeCategories.includes(category))return NextResponse.json({error:"Only education, technology, events, employment and entertainment campaigns can be approved for teen accounts."},{status:400});
 if(!advertiser||!/^\S+@\S+\.\S+$/.test(email)||!headline||!body||!Number.isFinite(budget)||budget<0)return NextResponse.json({error:"Complete the advertiser, valid email, ad copy and a non-negative budget."},{status:400});
 let url:URL;try{url=new URL(destination);if(!["https:","http:"].includes(url.protocol))throw new Error();}catch{return NextResponse.json({error:"Enter a valid destination URL."},{status:400});}
 if(image){try{const u=new URL(image);if(!["https:","http:"].includes(u.protocol))throw new Error();}catch{return NextResponse.json({error:"Image URL must be a valid HTTP(S) URL."},{status:400});}}
 const rows=await admin.sql`INSERT INTO public.ad_campaigns(advertiser_name,contact_email,headline,body,image_url,destination_url,placement,status,budget_ngn,ad_category,teen_safe_approved,created_by) VALUES(${advertiser},${email},${headline},${body},${image},${url.toString()},${placement},'pending_payment',${budget},${category},${teenSafe},${admin.member.id}) RETURNING id`;
 return NextResponse.json({success:true,id:rows[0].id,message:"Campaign saved as pending payment. Activate it only after payment is confirmed."},{status:201});
}
export async function PATCH(request:Request){
 const admin=await getAdminContext();
 if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const b=await request.json().catch(()=>null),id=String(b?.id||""),action=String(b?.action||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["activate","pause","reject","complete"].includes(action))return NextResponse.json({error:"Invalid campaign action."},{status:400});
 const status=action==="activate"?"active":action==="pause"?"paused":action==="reject"?"rejected":"completed";
 const rows=await admin.sql`UPDATE public.ad_campaigns SET status=${status},updated_at=now() WHERE id=${id} RETURNING id`;
 if(!rows[0])return NextResponse.json({error:"Campaign not found."},{status:404});
 return NextResponse.json({success:true,status});
}