import {NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "node:crypto";
import {neon} from "@neondatabase/serverless";
import {settleVibePayment} from "@/lib/payments/settle";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;
 if(!secret||!process.env.DATABASE_URL)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();
 const supplied=request.headers.get("x-paystack-signature")||"";
 const expected=createHmac("sha512",secret).update(raw).digest("hex");
 const a=Buffer.from(supplied,"utf8"),b=Buffer.from(expected,"utf8");
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid signature."},{status:401});
 let event:any;try{event=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid payload."},{status:400});}
 if(event?.event!=="charge.success")return NextResponse.json({received:true});
 const payment=event.data,reference=typeof payment?.reference==="string"?payment.reference:"";
 if(!/^EV-[A-F0-9]{32}$/.test(reference)||payment?.status!=="success"||payment?.currency!=="NGN")return NextResponse.json({received:true});
 const sql=neon(process.env.DATABASE_URL);
 const orders=await sql`SELECT amount_kobo,status FROM public.payment_orders WHERE reference=${reference} LIMIT 1`;
 if(!orders[0]||Number(orders[0].amount_kobo)!==Number(payment.amount))return NextResponse.json({error:"Payment does not match an order."},{status:400});
 if(orders[0].status!=="paid")await settleVibePayment(reference,String(payment.id));
 return NextResponse.json({received:true});
}
