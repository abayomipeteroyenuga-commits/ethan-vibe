"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Eye, Heart, MessageCircle, Plus, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Video } from "lucide-react";

type Analytics = {
  creator: { name: string; username: string };
  summary: { total_posts: number; published_posts: number; pending_posts: number; posts_30d: number; total_likes: number; total_comments: number };
  topPosts: Array<{ id: string; excerpt: string; created_at: string; moderation_status: string; media_type: string | null; likes: number; comments: number }>;
  activity: Array<{ day: string; posts: number }>;
};

const number = (value?: number) => (value || 0).toLocaleString();
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function CreatorStudio() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/creator/analytics", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load creator analytics.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load creator analytics."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const s = data?.summary;
  const maxPosts = Math.max(1, ...(data?.activity || []).map(d => d.posts));
  return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% -20%,#1b2c55 0,transparent 48%),#080c18",color:"#f4f7ff",fontFamily:"Arial,sans-serif",padding:"24px 18px 60px"}}>
    <div style={{maxWidth:1120,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:28}}>
        <Link href="/" style={{color:"#fff",textDecoration:"none",fontWeight:900,letterSpacing:1}}>ETHAN <span style={{color:"#4de1dc"}}>VIBE</span></Link>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><Link href="/" style={secondary}>Back to feed</Link><button onClick={load} style={secondary}><RefreshCw size={14}/> Refresh</button></div>
      </header>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,flexWrap:"wrap",marginBottom:24}}>
        <div><div style={{color:"#4de1dc",fontSize:11,fontWeight:800,letterSpacing:2,display:"flex",alignItems:"center",gap:7}}><Sparkles size={15}/> CREATOR WORKSPACE</div><h1 style={{fontSize:34,margin:"9px 0 5px",letterSpacing:-1}}>Creator Studio</h1><p style={{color:"#9aabc5",margin:0,fontSize:14}}>{data?.creator?.name ? "Welcome back, "+data.creator.name+"." : "Your content, performance and growth at a glance."}</p></div>
        <Link href="/?create=1" style={primary}><Plus size={16}/> Create a post</Link>
      </div>
      {error && <div style={{padding:15,border:"1px solid #854b5b",background:"#351d2a",borderRadius:12,marginBottom:18,color:"#ffd8df"}}>{error}</div>}
      {loading && <div style={panel}>Loading your creator insights…</div>}
      {!loading && data && <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:13,marginBottom:16}}>
          <Metric icon={<BarChart3 size={18}/>} label="Total posts" value={number(s?.total_posts)} note={number(s?.posts_30d)+" created in 30 days"}/>
          <Metric icon={<CheckCircle2 size={18}/>} label="Published" value={number(s?.published_posts)} note="Approved and visible posts"/>
          <Metric icon={<Clock3 size={18}/>} label="In review" value={number(s?.pending_posts)} note="Awaiting moderator review"/>
          <Metric icon={<Heart size={18}/>} label="Likes received" value={number(s?.total_likes)} note="Across your posts"/>
          <Metric icon={<MessageCircle size={18}/>} label="Comments" value={number(s?.total_comments)} note="Community conversations"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(260px,.8fr)",gap:15,marginBottom:16}}>
          <section style={panel}><div style={sectionTitle}><span><Activity size={17}/> Posting activity</span><small>Last 7 days</small></div><div style={{display:"flex",alignItems:"end",gap:10,height:160,paddingTop:20}}>{data.activity.map((d,i)=><div key={d.day} style={{flex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"end",alignItems:"center",gap:8}}><b style={{fontSize:11,color:"#cbd8ed"}}>{d.posts}</b><div title={d.day+": "+d.posts+" posts"} style={{width:"100%",maxWidth:42,height:Math.max(5,(d.posts/maxPosts)*105),borderRadius:"7px 7px 2px 2px",background:"linear-gradient(180deg,#4de1dc,#7469ec)",opacity:d.posts?1:.3}}/><small style={{fontSize:10,color:"#8fa0bb"}}>{d.day}</small></div>)}</div></section>
          <section style={panel}><div style={sectionTitle}><span><TrendingUp size={17}/> Creator checklist</span></div><ChecklistItem done={Boolean(s?.total_posts)} title="Publish your first post" detail="Share an idea, skill or project."/><ChecklistItem done={Boolean(s?.published_posts)} title="Get your post approved" detail="Follow community guidelines."/><ChecklistItem done={Boolean((s?.total_likes||0)>0)} title="Start a conversation" detail="Invite the community to engage."/><ChecklistItem done={Boolean((s?.total_posts||0)>=3)} title="Build a posting habit" detail="Publish at least three posts."/></section>
        </div>
        <section style={panel}><div style={sectionTitle}><span><TrendingUp size={17}/> Top performing posts</span><small>Ranked by likes and comments</small></div>{data.topPosts.length===0?<div style={{padding:"25px 5px",color:"#9aabc5",fontSize:13}}>You haven't published any posts yet. Share your first idea and your performance will appear here.</div>:<div style={{display:"grid",gap:0}}>{data.topPosts.map((p,i)=><div key={p.id} style={{display:"grid",gridTemplateColumns:"32px minmax(0,1fr) auto",alignItems:"center",gap:12,padding:"14px 0",borderTop:"1px solid #24324a"}}><b style={{color:"#4de1dc"}}>0{i+1}</b><div style={{minWidth:0}}><div style={{fontSize:13,color:"#e4ebf8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.excerpt || (p.media_type==="video"?"Video post":"Media post")}</div><div style={{display:"flex",gap:8,alignItems:"center",marginTop:6,fontSize:10,color:"#8fa0bb"}}><span>{date(p.created_at)}</span><Status status={p.moderation_status}/></div></div><div style={{display:"flex",gap:13,fontSize:11,color:"#b5c5dc"}}><span style={{display:"flex",alignItems:"center",gap:4}}><Heart size={13}/>{number(p.likes)}</span><span style={{display:"flex",alignItems:"center",gap:4}}><MessageCircle size={13}/>{number(p.comments)}</span></div></div>)}</div>}</section>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:17}}><Link href="/account" style={secondary}>Account settings</Link><Link href="/academy" style={secondary}>Explore Ethan Academy</Link><span style={{marginLeft:"auto",fontSize:10,color:"#7588a6",display:"flex",alignItems:"center",gap:5}}><ShieldCheck size={13}/> Private analytics — only you can see these figures</span></div>
      </>}
      <footer style={{marginTop:32,color:"#71829e",fontSize:10}}>ETHAN VIBE · CREATOR STUDIO · CREATE · CONNECT · GROW</footer>
    </div>
  </main>;
}

function Metric({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}) { return <section style={panel}><div style={{color:"#4de1dc",marginBottom:12}}>{icon}</div><div style={{fontSize:11,color:"#94a5bf"}}>{label}</div><div style={{fontSize:29,fontWeight:800,margin:"5px 0"}}>{value}</div><div style={{fontSize:10,color:"#7f91ac"}}>{note}</div></section>; }
function ChecklistItem({done,title,detail}:{done:boolean;title:string;detail:string}) { return <div style={{display:"flex",gap:10,alignItems:"start",padding:"11px 0",borderTop:"1px solid #24324a"}}><CheckCircle2 size={17} color={done?"#4de1dc":"#687b98"}/><div><b style={{fontSize:12}}>{title}</b><div style={{fontSize:10,color:"#8fa0bb",marginTop:3}}>{detail}</div></div></div>; }
function Status({status}:{status:string}) { const color=status==="approved"?"#69e3bd":status==="pending_review"?"#ffcf83":"#aebbd0"; return <span style={{color,border:"1px solid "+color+"55",borderRadius:30,padding:"2px 7px",fontSize:9}}>{status.replaceAll("_"," ")}</span>; }
const panel:React.CSSProperties={background:"linear-gradient(145deg,#111b2e,#0d1627)",border:"1px solid #25334c",borderRadius:16,padding:18};
const sectionTitle:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:10};
const primary:React.CSSProperties={display:"inline-flex",alignItems:"center",gap:8,padding:"11px 15px",borderRadius:10,background:"linear-gradient(110deg,#4de1dc,#a79aff)",color:"#09111e",textDecoration:"none",fontWeight:800,fontSize:12};
const secondary:React.CSSProperties={display:"inline-flex",alignItems:"center",gap:7,padding:"9px 12px",borderRadius:9,border:"1px solid #34445f",background:"#121d31",color:"#dce7f8",textDecoration:"none",fontSize:11};
