"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function PaymentCallbackClient({reference}:{reference:string}){
 const [state,setState]=useState<"checking"|"success"|"pending">("checking"),[message,setMessage]=useState("Confirming your payment securely…");
 useEffect(()=>{
  if(!reference){setState("pending");setMessage("The payment reference is missing.");return;}
  let live=true;
  fetch("/api/payments/verify",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference})})
   .then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Payment confirmation is not available yet.");return d;})
   .then(d=>{if(live){setState("success");setMessage(d.message||"Payment confirmed. Your access is active.");}})
   .catch(e=>{if(live){setState("pending");setMessage(e instanceof Error?e.message:"We could not confirm your payment yet.");}});
  return()=>{live=false;};
 },[reference]);
 return <main className="academy-result"><div className="academy-result-card"><div className="academy-result-symbol">{state==="checking"?"…":state==="success"?"✓":"!"}</div><h1>{state==="checking"?"Verifying payment":state==="success"?"You're all set!":"Payment not confirmed yet"}</h1><p>{message}</p>{reference&&<small>Reference: {reference}</small>}<div className="academy-result-actions">{state==="pending"&&<button onClick={()=>window.location.reload()}>Check again</button>}<Link href="/academy">Back to Academy</Link><Link href="/account">My account</Link></div></div></main>;
}
