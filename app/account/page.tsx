import {redirect} from "next/navigation";
import Link from "next/link";
import {neon} from "@neondatabase/serverless";
import {auth} from "@/lib/auth/server";
import SignOutButton from "./sign-out";
export const dynamic="force-dynamic";
export default async function AccountPage(){
 const {data:session}=await auth.getSession();if(!session?.user)redirect("/auth?mode=signin");
 const sql=neon(process.env.DATABASE_URL!);
 const rows=await sql`SELECT username,display_name,age_band FROM public.users WHERE auth_user_id=${session.user.id} LIMIT 1`;
 const profile=rows[0] as {username:string;display_name:string;age_band:string|null}|undefined;
 if(!profile?.age_band)redirect("/age-check");
 const displayName=profile?.display_name||session.user.name||"VIBE member";
 return <main className="account-page"><header className="account-top"><Link href="/" className="auth-brand"><span className="auth-brand-mark">V</span><span>ETHAN <b>VIBE</b></span></Link><SignOutButton/></header><section className="account-card"><div className="account-avatar">{displayName.slice(0,1).toUpperCase()}</div><span className="auth-kicker">✦ YOU'RE IN THE VIBE</span><h1>Welcome, {displayName}!</h1><p>Your account is active. Your VIBE profile is ready for the next step.</p><div className="account-details"><div><small>EMAIL</small><b>{session.user.email}</b></div><div><small>USERNAME</small><b>{profile?`@${profile.username}`:"Setting up..."}</b></div><div><small>EMAIL STATUS</small><b>{session.user.emailVerified?"Verified":"Pending verification"}</b></div></div><Link href="/academy" className="account-cta">Explore Academy classes & VIBE Premium →</Link><br/><br/><Link href="/academy/my-learning" className="account-cta">My Learning & paid access →</Link><br/><br/><Link href="/" className="account-cta">Explore the VIBE feed →</Link></section></main>;
}
