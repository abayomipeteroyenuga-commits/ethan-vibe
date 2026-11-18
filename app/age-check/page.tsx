"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgeCheckPage() {
  const router = useRouter();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/profile/sync", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We couldn't verify your age.");
      router.replace("/account"); router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Age verification failed.");
    } finally { setBusy(false); }
  }
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#080d1b",color:"#f6f7ff",fontFamily:"Arial,sans-serif"}}>
    <section style={{width:"100%",maxWidth:480,padding:32,border:"1px solid #293750",borderRadius:20,background:"#111b2e"}}>
      <Link href="/" style={{color:"#70e5dc",textDecoration:"none",fontWeight:700}}>ETHAN VIBE</Link>
      <div style={{marginTop:30,color:"#70e5dc",fontSize:12,fontWeight:800,letterSpacing:2}}>AGE-SAFE COMMUNITY</div>
      <h1 style={{fontSize:32,margin:"12px 0"}}>One quick age check.</h1>
      <p style={{color:"#aab8cc",lineHeight:1.7}}>ETHAN VIBE is for people aged 13 and above. Enter your date of birth to finish setting up your account. We store an age range, not your full date of birth.</p>
      <form onSubmit={submit} style={{marginTop:24}}>
        <label htmlFor="age-dob" style={{display:"block",fontSize:13,color:"#c6d2e3",marginBottom:8}}>Date of birth</label>
        <input id="age-dob" type="date" required value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} max={new Date().toISOString().slice(0,10)} style={{width:"100%",padding:13,borderRadius:9,border:"1px solid #3a4b67",background:"#091324",color:"#fff"}}/>
        {error&&<p role="alert" style={{color:"#ff9a9a",fontSize:13,lineHeight:1.5}}>{error}</p>}
        <button disabled={busy||!dateOfBirth} style={{width:"100%",marginTop:18,padding:14,border:0,borderRadius:10,background:"#6ce4db",color:"#07111e",fontWeight:800,cursor:"pointer"}}>{busy?"Checking…":"Confirm age and continue →"}</button>
      </form>
      <p style={{fontSize:12,color:"#8797b0",lineHeight:1.6,marginTop:20}}>If you are under 13, you cannot create or use an ETHAN VIBE account. Do not enter a false date of birth.</p>
      <Link href="/auth?mode=signin" style={{display:"inline-block",marginTop:10,color:"#70e5dc",fontSize:13}}>Back to sign in</Link>
    </section>
  </main>;
}
