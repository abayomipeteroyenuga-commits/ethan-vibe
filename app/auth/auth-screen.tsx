"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
const otp = authClient as any;
type View = "signup" | "signin" | "verify" | "forgot" | "reset";
export default function AuthScreen({ initialMode }: { initialMode: "signup" | "signin" }) {
 const router=useRouter(); const [view,setView]=useState<View>(initialMode);
 const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [code,setCode]=useState("");
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
 function change(next:View){setView(next);setError("");setMessage("");}
 async function finish(){
  const response=await fetch("/api/profile/sync",{method:"POST",credentials:"same-origin"});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Your sign-in worked, but profile setup could not finish. Try again.");}
  router.replace("/account");router.refresh();
 }
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   if(view==="signup"){
    if(password.length<8)throw new Error("Use a password with at least 8 characters.");
    const {error}=await authClient.signUp.email({name:name.trim(),email:email.trim().toLowerCase(),password});
    if(error)throw new Error(error.message||"We couldn't create your account.");
    change("verify");setMessage("Your 6-digit verification code is on its way. Check your inbox.");
   }else if(view==="signin"){
    const {error}=await authClient.signIn.email({email:email.trim().toLowerCase(),password});
    if(error){
     if(/email.*(not|isn.t).*verified/i.test(error.message||"")){
      const sent=await otp.emailOtp.sendVerificationOtp({email:email.trim().toLowerCase(),type:"email-verification"});
      if(sent.error)throw new Error(sent.error.message||"We couldn't send a verification code.");
      change("verify");setMessage("Your email needs verification. We sent a fresh code.");return;
     }
     throw new Error(error.message||"Sign-in failed. Check your details.");
    }
    await finish();
   }else if(view==="verify"){
    if(!/^\d{6}$/.test(code))throw new Error("Enter the 6-digit code sent to your email.");
    const {error}=await otp.emailOtp.verifyEmail({email:email.trim().toLowerCase(),otp:code});
    if(error)throw new Error(error.message||"That code is invalid or expired.");
    const current=await authClient.getSession();
    if(!current.data?.user&&password){const signed=await authClient.signIn.email({email:email.trim().toLowerCase(),password});if(signed.error)throw new Error(signed.error.message||"Email verified. Please sign in.");}
    await finish();
   }else if(view==="forgot"){
    const {error}=await otp.forgetPassword.emailOtp({email:email.trim().toLowerCase()});
    if(error)throw new Error(error.message||"We couldn't send a reset code.");
    change("reset");setMessage("A password reset code has been sent to your email.");
   }else if(view==="reset"){
    if(!/^\d{6}$/.test(code))throw new Error("Enter the 6-digit reset code.");
    if(password.length<8)throw new Error("Use a new password with at least 8 characters.");
    const {error}=await otp.emailOtp.resetPassword({email:email.trim().toLowerCase(),otp:code,password});
    if(error)throw new Error(error.message||"Password reset failed. Request a new code.");
    change("signin");setPassword("");setCode("");setMessage("Password updated. Sign in with your new password.");
   }
  }catch(err){setError(err instanceof Error?err.message:"Something went wrong. Please try again.");}
  finally{setBusy(false);}
 }
 async function resend(){setBusy(true);setError("");setMessage("");try{const {error}=await otp.emailOtp.sendVerificationOtp({email:email.trim().toLowerCase(),type:"email-verification"});if(error)throw new Error(error.message||"Unable to resend code.");setMessage("A new verification code has been sent.");}catch(err){setError(err instanceof Error?err.message:"Unable to resend code.");}finally{setBusy(false);}}
 const title=view==="signup"?"Create your account":view==="signin"?"Welcome back":view==="verify"?"Check your inbox":view==="forgot"?"Reset your password":"Choose a new password";
 const sub=view==="signup"?"Your people, your creativity, your next big moment.":view==="signin"?"Pick up where your VIBE left off.":view==="verify"?`We sent a 6-digit code to ${email}.`:view==="forgot"?"Enter your account email and we'll send a reset code.":"Enter the reset code and choose a new password.";
 return <main className="auth-page">
  <Link href="/" className="auth-brand"><span className="auth-brand-mark">V</span><span>ETHAN <b>VIBE</b></span></Link>
  <div className="auth-layout">
   <section className="auth-visual"><span className="auth-kicker">✦ YOUR WORLD. YOUR PEOPLE. YOUR VIBE.</span><h1>Find your people.<br/><span>Make your mark.</span></h1><p>Create, connect, discover fresh talent, join challenges and turn the things you love into your next opportunity.</p><div className="auth-perks"><span>⚡ Create boldly</span><span>✦ Find your crew</span><span>🚀 Grow together</span></div></section>
   <section className="auth-card"><h2>{title}</h2><p className="auth-subtitle">{sub}</p>
    {error&&<div className="auth-error" role="alert">{error}</div>}{message&&<div className="auth-success" role="status">{message}</div>}
    <form className="auth-form" onSubmit={submit}>
     {view==="signup"&&<div className="auth-field"><label htmlFor="vibe-name">Your name</label><input id="vibe-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="What should we call you?" required maxLength={80}/></div>}
     {["signup","signin","forgot"].includes(view)&&<div className="auth-field"><label htmlFor="vibe-email">Email address</label><input id="vibe-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required maxLength={254}/></div>}
     {["signup","signin","reset"].includes(view)&&<div className="auth-field"><label htmlFor="vibe-password">{view==="reset"?"New password":"Password"}</label><input id="vibe-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={view==="signin"?"current-password":"new-password"} placeholder="At least 8 characters" required minLength={8}/></div>}
     {["verify","reset"].includes(view)&&<div className="auth-field"><label htmlFor="vibe-code">{view==="verify"?"Email verification code":"Password reset code"}</label><input id="vibe-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" required maxLength={6}/></div>}
     <button className="auth-primary" type="submit" disabled={busy}>{busy?"Please wait...":view==="signup"?"Create my account →":view==="signin"?"Sign in →":view==="verify"?"Verify email →":view==="forgot"?"Send reset code →":"Update password →"}</button>
    </form>
    {view==="verify"&&<div className="auth-switch"><span>Didn't get the code?</span><button type="button" disabled={busy} onClick={resend}>Resend code</button></div>}
    {view==="signin"&&<div className="auth-switch"><button type="button" onClick={()=>change("forgot")}>Forgot password?</button></div>}
    {view==="signup"&&<p className="auth-terms">Create respectfully, keep your community positive and follow the VIBE guidelines.</p>}
    <div className="auth-switch">{view==="signup"?<><span>Already part of VIBE?</span><button type="button" onClick={()=>change("signin")}>Sign in</button></>:view==="signin"?<><span>New around here?</span><button type="button" onClick={()=>change("signup")}>Create an account</button></>:<button type="button" onClick={()=>change("signin")}>Back to sign in</button>}</div>
    <button className="auth-back" type="button" onClick={()=>router.push("/")}>← Back to VIBE</button>
   </section>
  </div>
 </main>;
}
