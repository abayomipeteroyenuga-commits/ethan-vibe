import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const {data:session}=await auth.getSession();
 if(!session?.user)return NextResponse.json({verified:false},{status:401,headers:{"Cache-Control":"no-store"}});
 if(!session.user.emailVerified)return NextResponse.json({verified:false,error:"Verify your email first."},{status:403,headers:{"Cache-Control":"no-store"}});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:"Age verification is temporarily unavailable."},{status:503});
 const sql=neon(process.env.DATABASE_URL);
 const rows=await sql`SELECT age_band FROM public.users WHERE auth_user_id=${session.user.id} AND is_verified=true LIMIT 1`;
 if(!rows[0]?.age_band)return NextResponse.json({verified:false,required:true},{status:428,headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({verified:true,ageBand:rows[0].age_band},{headers:{"Cache-Control":"no-store"}});
}
