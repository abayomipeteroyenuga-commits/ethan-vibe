"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,BookOpen,Check,Crown,GraduationCap,Sparkles} from "lucide-react";
type Product={id?:string;slug:string;title:string;description:string;price_ngn:number;access_days:number};
export default function AcademyPage(){
 const [courses,setCourses]=useState<Product[]>([]),[plans,setPlans]=useState<Product[]>([]),[busy,setBusy]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{fetch("/api/academy/catalog",{cache:"no-store"}).then(r=>r.json()).then(d=>{setCourses(d.courses||[]);setPlans(d.plans||[]);if(d.error)setNotice(d.error);}).catch(()=>setNotice("Could not load the Academy catalogue."));},[]);
 async function checkout(type:"course"|"membership",item:Product){
  if(busy)return;setBusy(item.slug);setNotice("");
  try{
   const response=await fetch("/api/academy/checkout",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(type==="course"?{product_type:type,course_id:item.id}:{product_type:type,plan_slug:item.slug})});
   const data=await response.json().catch(()=>({}));
   if(response.status===401){window.location.href="/auth?mode=signin&next=/academy";return;}
   if(!response.ok)throw new Error(data.error||"Checkout could not start.");
   window.location.href=data.authorization_url;
  }catch(error){setNotice(error instanceof Error?error.message:"Checkout failed.");setBusy("");}
 }
 const money=(n:number)=>"₦"+Number(n).toLocaleString("en-NG");
 return <main className="academy-page">
  <header className="academy-header"><Link href="/" className="academy-back"><ArrowLeft size={16}/> Back to VIBE</Link><span>ETHAN <b>ACADEMY</b></span><Link href="/account" className="academy-account">My account</Link></header>
  <section className="academy-hero"><span className="academy-kicker"><Sparkles size={14}/> LEARN · PRACTISE · GROW</span><h1>Turn your VIBE<br/><em>into real skills.</em></h1><p>Learn practical digital skills with Ethan Digital Academy. Choose a programme, enrol securely and build skills you can use.</p><div className="academy-points"><span><Check size={15}/> Practical learning</span><span><Check size={15}/> Guided projects</span><span><Check size={15}/> Certificate pathways</span></div></section>
  <section className="academy-section"><div className="academy-section-heading"><div><small>ETHAN DIGITAL ACADEMY</small><h2>Enrol in a class</h2><p>Monthly course access. Renew when your current access period ends.</p></div><GraduationCap size={30}/></div>
   {courses.length===0?<p className="academy-empty">Academy courses are being prepared. Please check back shortly.</p>:<div className="academy-grid">{courses.map(c=><article className="academy-card featured" key={c.slug}><div className="academy-icon"><BookOpen size={23}/></div><span className="academy-tag">ACADEMY PROGRAMME</span><h3>{c.title}</h3><p>{c.description}</p><div className="academy-price">{money(c.price_ngn)}<small> / {c.access_days} days</small></div><button disabled={!!busy} onClick={()=>checkout("course",c)}>{busy===c.slug?"Opening secure checkout…":"Enrol & pay securely →"}</button></article>)}</div>}
  </section>
  <section className="academy-section"><div className="academy-section-heading"><div><small>OPTIONAL MEMBERSHIP</small><h2>Upgrade your VIBE</h2><p>Join free and upgrade only when you want extra creator benefits.</p></div><Crown size={30}/></div><div className="academy-grid">{plans.map(p=><article className="academy-card" key={p.slug}><div className="academy-icon"><Sparkles size={22}/></div><span className="academy-tag">30-DAY MEMBERSHIP</span><h3>{p.title}</h3><p>{p.description}</p><div className="academy-price">{money(p.price_ngn)}<small> / {p.access_days} days</small></div><button className="secondary" disabled={!!busy} onClick={()=>checkout("membership",p)}>{busy===p.slug?"Opening secure checkout…":"Choose membership →"}</button></article>)}</div></section>
  {notice&&<p className="academy-notice" role="status">{notice}</p>}
  <footer className="academy-footer">Secure payments powered by Paystack · Access activates after payment verification. Memberships are prepaid access passes and renew manually.</footer>
 </main>;
}
