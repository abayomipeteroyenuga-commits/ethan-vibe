import { neon } from "@neondatabase/serverless";
export async function settleVibePayment(reference:string,transactionId:string){
 if(!process.env.DATABASE_URL)throw new Error("Payment database is not configured.");
 const sql=neon(process.env.DATABASE_URL);
 const rows=await sql`
 WITH paid AS (
  UPDATE public.payment_orders SET status='paid',paystack_transaction_id=${transactionId},paid_at=now()
  WHERE reference=${reference} AND status='pending' AND currency='NGN'
  RETURNING id,user_id,product_type,course_id,plan_slug
 ),
 course_access AS (
  INSERT INTO public.course_enrollments(user_id,course_id,order_id,starts_at,expires_at,status)
  SELECT p.user_id,p.course_id,p.id,now(),now()+make_interval(days=>c.access_days),'active'
  FROM paid p JOIN public.academy_courses c ON c.id=p.course_id WHERE p.product_type='course'
  ON CONFLICT(user_id,course_id) DO UPDATE SET
   order_id=EXCLUDED.order_id,
   starts_at=CASE WHEN public.course_enrollments.expires_at>now() THEN public.course_enrollments.starts_at ELSE now() END,
   expires_at=GREATEST(public.course_enrollments.expires_at,now())+make_interval(days=>(SELECT access_days FROM public.academy_courses WHERE id=EXCLUDED.course_id)),
   status='active',updated_at=now()
  RETURNING id
 ),
 membership_access AS (
  INSERT INTO public.vibe_memberships(user_id,plan_slug,order_id,starts_at,expires_at,status)
  SELECT p.user_id,p.plan_slug,p.id,now(),now()+make_interval(days=>v.access_days),'active'
  FROM paid p JOIN public.vibe_plans v ON v.slug=p.plan_slug WHERE p.product_type='membership'
  ON CONFLICT(user_id) DO UPDATE SET
   plan_slug=EXCLUDED.plan_slug,order_id=EXCLUDED.order_id,
   starts_at=CASE WHEN public.vibe_memberships.expires_at>now() THEN public.vibe_memberships.starts_at ELSE now() END,
   expires_at=GREATEST(public.vibe_memberships.expires_at,now())+make_interval(days=>(SELECT access_days FROM public.vibe_plans WHERE slug=EXCLUDED.plan_slug)),
   status='active',updated_at=now()
  RETURNING id
 )
 SELECT p.id::text AS order_id,p.product_type,
  (SELECT id::text FROM course_access LIMIT 1) AS enrollment_id,
  (SELECT id::text FROM membership_access LIMIT 1) AS membership_id
 FROM paid p`;
 return rows[0]||null;
}
