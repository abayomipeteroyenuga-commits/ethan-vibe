"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
export default function AuthActions(){
 const [user,setUser]=useState<{name?:string|null;email?:string|null}|null>(null);
 useEffect(()=>{let live=true;authClient.getSession().then(({data})=>{if(live)setUser(data?.user??null);}).catch(()=>{});return()=>{live=false;};},[]);
 return user?<div className="auth-actions"><Link className="auth-user" href="/account"><span className="avatar avatar-you">{(user.name||user.email||"V").slice(0,2).toUpperCase()}</span><span>My account</span></Link></div>:<div className="auth-actions"><Link className="auth-login" href="/auth?mode=signin">Sign in</Link><Link className="auth-join" href="/auth?mode=signup">Join VIBE</Link></div>;
}
