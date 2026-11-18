import {NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";
import {auth} from "@/lib/auth/server";
import {settleVibePayment} from "@/lib/payments/settle";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in to verify this payment."},{status:401});
 if(!process.env.DATABASE_URL||!process.env.PAYSTACK_SECRET_KEY)return NextResponse.json({error:"Payment verification is not configured."},{status:503});
 const body=await request.json().catch(()=>null);
 const reference=typeof body?.reference==="string"?body.reference:"";
 if(!/^EV-[A-F0-9]{32}$/.test(reference))return NextResponse.json({error:"Invalid payment reference."},{status:400});
 const sql=neon(process.env.DATABASE_URL);
 const orders=await sql`SELECT id::text,user_id::text,amount_kobo,currency,status FROM public.payment_orders WHERE reference=${reference} LIMIT 1`;
 const order=orders[0];
 if(!order)return NextResponse.json({error:"Payment order not found."},{status:404});
 const members=await sql`SELECT id::text FROM public.users WHERE auth_user_id=${session.user.id} LIMIT 1`;
 if(!members[0]||members[0].id!==order.user_id)return NextResponse.json({error:"This payment belongs to another account."},{status:403});
 if(order.status==="paid")return NextResponse.json({success:true,message:"Payment already confirmed. Your access is active."});
 const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{"Authorization":`Bearer ${process.env.PAYSTACK_SECRET_KEY}`},cache:"no-store"});
 const result=await response.json().catch(()=>({}));
 const payment=result.data;
 if(!response.ok||!result.status||payment?.status!=="success"||payment?.reference!==reference||payment?.currency!=="NGN"||Number(payment?.amount)!==Number(order.amount_kobo)){
  return NextResponse.json({error:"We have not received a verified payment for this order yet. If you were debited, retry shortly."},{status:409});
 }
 const settled=await settleVibePayment(reference,String(payment.id));
 if(!settled){
  const latest=await sql`SELECT status FROM public.payment_orders WHERE reference=${reference} LIMIT 1`;
  if(latest[0]?.status!=="paid")return NextResponse.json({error:"Payment was verified but access could not be activated. Contact support with your reference."},{status:500});
 }
 return NextResponse.json({success:true,message:"Payment confirmed. Your access is now active."},{headers:{"Cache-Control":"no-store"}});
}
