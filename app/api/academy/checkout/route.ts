import {NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";
import {auth} from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Invalid request origin."},403);
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return reply({error:"Sign in with a verified email before checkout."},401);
 if(!process.env.DATABASE_URL||!process.env.PAYSTACK_SECRET_KEY)return reply({error:"Online payments are not configured yet."},503);
 const body=await request.json().catch(()=>null);
 const productType=body?.product_type==="course"?"course":body?.product_type==="membership"?"membership":null;
 if(!productType)return reply({error:"Choose a valid course or membership."},400);
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT id,email,age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 const member=members[0];
 if(!member)return reply({error:"Complete your VIBE profile before checkout."},403);
 if(member.age_band!=="18_plus")return reply({error:"For safety, online checkout is currently available to adult account holders only. A parent or guardian can contact Ethan Digital Academy to arrange a student enrolment."},403);
 let item:any;
 if(productType==="course"){
  const courseId=typeof body.course_id==="string"?body.course_id:"";
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(courseId))return reply({error:"Choose a valid course."},400);
  const rows=await sql`SELECT id,slug,title,price_ngn::float8 AS price_ngn FROM public.academy_courses WHERE id=${courseId}::uuid AND is_active=true LIMIT 1`;
  item=rows[0];
 }else{
  const slug=typeof body.plan_slug==="string"?body.plan_slug:"";
  const rows=await sql`SELECT slug,title,price_ngn::float8 AS price_ngn FROM public.vibe_plans WHERE slug=${slug} AND is_active=true LIMIT 1`;
  item=rows[0];
 }
 if(!item)return reply({error:"That product is not available."},404);
 const amountKobo=Math.round(Number(item.price_ngn)*100);
 if(!Number.isSafeInteger(amountKobo)||amountKobo<100)return reply({error:"The product price is invalid."},500);
 const reference="EV-"+crypto.randomUUID().replace(/-/g,"").toUpperCase();
 const inserted=productType==="course"
  ?await sql`INSERT INTO public.payment_orders(user_id,product_type,course_id,reference,amount_kobo,currency) VALUES(${member.id},'course',${item.id},${reference},${amountKobo},'NGN') RETURNING id`
  :await sql`INSERT INTO public.payment_orders(user_id,product_type,plan_slug,reference,amount_kobo,currency) VALUES(${member.id},'membership',${item.slug},${reference},${amountKobo},'NGN') RETURNING id`;
 try{
  const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{"Authorization":`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({email:member.email,amount:amountKobo,currency:"NGN",reference,callback_url:new URL("/academy/payment/callback",request.url).toString(),metadata:{vibe_order_id:inserted[0].id,member_id:member.id,product_type:productType,product_slug:item.slug}}),cache:"no-store"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.status||!data.data?.authorization_url)throw new Error(data.message||"Paystack could not initialize payment.");
  return reply({authorization_url:data.data.authorization_url,reference});
 }catch(error){
  await sql`UPDATE public.payment_orders SET status='failed' WHERE reference=${reference} AND status='pending'`;
  console.error("VIBE payment initialization failed:",error);
  return reply({error:"We could not start the payment. Please try again."},502);
 }
}
