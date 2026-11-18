import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const runtime="nodejs";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Advertising enquiries are temporarily unavailable."},{status:503});
 const b=await request.json().catch(()=>null),business=String(b?.business_name||"").trim().slice(0,120),name=String(b?.contact_name||"").trim().slice(0,120),email=String(b?.email||"").trim().slice(0,254),phone=String(b?.phone||"").trim().slice(0,40),objective=String(b?.objective||"brand_awareness"),message=String(b?.message||"").trim().slice(0,2000),budget=b?.budget_ngn?Number(b.budget_ngn):null;
 if(!business||!name||!/^\S+@\S+\.\S+$/.test(email)||!phone)return NextResponse.json({error:"Business, contact name, valid email and phone are required."},{status:400});
 if(budget!==null&&(!Number.isFinite(budget)||budget<0))return NextResponse.json({error:"Enter a valid budget."},{status:400});
 if(!["brand_awareness","website_visits","product_sales","event_promotion","creator_campaign"].includes(objective))return NextResponse.json({error:"Choose a valid campaign objective."},{status:400});
 const sql=neon(process.env.DATABASE_URL);
 await sql`INSERT INTO public.advertiser_inquiries(business_name,contact_name,email,phone,objective,budget_ngn,message) VALUES(${business},${name},${email},${phone},${objective},${budget},${message})`;
 return NextResponse.json({success:true,message:"Thank you. The ETHAN DIGITALS advertising team will contact you."},{status:201});
}