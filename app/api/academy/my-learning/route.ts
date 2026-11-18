import {NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";
import {auth} from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const {data:session}=await auth.getSession();
 if(!session?.user||!session.user.emailVerified)return NextResponse.json({error:"Sign in to view your learning."},{status:401});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Learning records are unavailable."},{status:503});
 const sql=neon(process.env.DATABASE_URL);
 const members=await sql`SELECT id FROM public.users WHERE auth_user_id=${session.user.id} LIMIT 1`;
 if(!members[0])return NextResponse.json({courses:[],membership:null});
 const [courses,memberships]=await Promise.all([
  sql`SELECT c.title,c.description,c.slug,e.starts_at,e.expires_at,e.status,(e.expires_at>now() AND e.status='active') AS access_active FROM public.course_enrollments e JOIN public.academy_courses c ON c.id=e.course_id WHERE e.user_id=${members[0].id} ORDER BY e.updated_at DESC`,
  sql`SELECT v.title,v.slug,m.starts_at,m.expires_at,m.status,(m.expires_at>now() AND m.status='active') AS access_active FROM public.vibe_memberships m JOIN public.vibe_plans v ON v.slug=m.plan_slug WHERE m.user_id=${members[0].id} LIMIT 1`
 ]);
 return NextResponse.json({courses,membership:memberships[0]||null},{headers:{"Cache-Control":"no-store"}});
}
