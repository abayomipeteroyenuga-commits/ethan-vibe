"use client";

import { useMemo, useState } from "react";
import {
  Activity, Bell, Bookmark, BriefcaseBusiness, Camera, Check, ChevronDown,
  Compass, Flame, Gamepad2, Hash, Heart, Home, ImagePlus, MessageCircle,
  MoreHorizontal, Plus, Search, Send, Settings2, Share2, ShieldCheck,
  Sparkles, TrendingUp, Users, Video, WandSparkles, X
} from "lucide-react";

type Post = { id:number; name:string; handle:string; avatar:string; time:string; text:string; tag:string; likes:number; comments:number; image:string; verified?:boolean; };
const initialPosts: Post[] = [
 {id:1,name:"Tomi Adebayo",handle:"tomi.creates",avatar:"TA",time:"12 min ago",text:"Your next opportunity might come from the community you build today. Keep creating, keep showing up. 🚀",tag:"Creators",likes:248,comments:32,image:"linear-gradient(135deg,#172b65,#7c3aed 58%,#f0abfc)",verified:true},
 {id:2,name:"Ethan Digital Academy",handle:"ethandigital",avatar:"ED",time:"38 min ago",text:"CREATOR SPOTLIGHT ✨ This week we're celebrating people learning new skills, sharing what they build and helping others grow. Tag a creator who inspires you.",tag:"Community",likes:186,comments:21,image:"linear-gradient(135deg,#0e7490,#0f172a 70%,#22c55e)",verified:true},
 {id:3,name:"Daniel Okafor",handle:"dan.codes",avatar:"DO",time:"1 hr ago",text:"Small progress is still progress. Built my first responsive landing page this week. What did you build?",tag:"Technology",likes:94,comments:14,image:"linear-gradient(135deg,#111827,#334155 55%,#38bdf8)"},
];
const trends = ["#EthanCreatorWeek","#BuildInPublic","#NaijaTech","#CampusVibes"];
const people = [{name:"Ada Creates",handle:"ada.creates",avatar:"AC",field:"Design & storytelling"},{name:"Femi Dev",handle:"femi.builds",avatar:"FB",field:"Software developer"},{name:"Zara Visuals",handle:"zara.visuals",avatar:"ZV",field:"Video creator"}];
const stories = [{name:"Your story",avatar:"＋",own:true},{name:"Tomi",avatar:"TA"},{name:"Ethan",avatar:"ED"},{name:"Zara",avatar:"ZV"},{name:"Daniel",avatar:"DO"},{name:"Ada",avatar:"AC"}];
const nav = [{label:"Home",icon:Home},{label:"Explore",icon:Compass},{label:"Messages",icon:MessageCircle},{label:"Communities",icon:Users},{label:"Challenges",icon:Gamepad2},{label:"Creator Studio",icon:WandSparkles}];

export default function HomePage() {
 const [active,setActive] = useState("For you");
 const [liked,setLiked] = useState<number[]>([]);
 const [following,setFollowing] = useState<string[]>([]);
 const [saved,setSaved] = useState<number[]>([]);
 const [query,setQuery] = useState("");
 const [composer,setComposer] = useState("");
 const [posts,setPosts] = useState(initialPosts);
 const [notice,setNotice] = useState("");
 const [activeNav,setActiveNav] = useState("Home");
 const [showComposer,setShowComposer] = useState(false);
 const [mobileMenu,setMobileMenu] = useState(false);
 const filtered = useMemo(()=>posts.filter(p => (active==="For you" || active==="Following" || p.tag.toLowerCase()===active.toLowerCase()) && (p.text+" "+p.name+" "+p.tag).toLowerCase().includes(query.toLowerCase())),[posts,active,query]);
 const toggle = (arr:number[],id:number,setter:(v:number[])=>void) => setter(arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]);
 function publish(){ if(!composer.trim()) return; setPosts([{id:Date.now(),name:"You",handle:"you",avatar:"YO",time:"Just now",text:composer.trim(),tag:"Creators",likes:0,comments:0,image:"linear-gradient(135deg,#1e293b,#4338ca,#0e7490)"},...posts]);setComposer("");setShowComposer(false);setNotice("Your post has been added to this preview feed."); }
 return <main className="app-shell">
  <header className="topbar">
   <a className="brand" href="#" aria-label="Ethan Vibe home"><span className="brand-mark">V</span><span>ETHAN <b>VIBE</b><small>CREATE · CONNECT · COMPETE · EARN</small></span></a>
   <label className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search creators, communities, topics..." /></label>
   <div className="top-actions"><button className="icon-btn" aria-label="Notifications" onClick={()=>setNotice("Notifications will appear here when your account is connected.")}><Bell/><i/></button><button className="avatar avatar-you" onClick={()=>setNotice("Your profile is part of the next account setup phase.")}>YO</button><button className="mobile-toggle icon-btn" onClick={()=>setMobileMenu(!mobileMenu)}><MoreHorizontal/></button></div>
  </header>
  <div className="layout">
   <aside className={mobileMenu?"left-sidebar mobile-open":"left-sidebar"}>
    <div className="profile-mini"><div className="avatar avatar-you large">YO</div><div><b>Your profile</b><span>@yourvibe</span></div><button className="dots" onClick={()=>setNotice("Profile settings are coming with account setup.")}><MoreHorizontal size={18}/></button></div>
    <button className="primary-btn create-btn" onClick={()=>setShowComposer(true)}><Plus size={18}/> Create a post</button>
    <div className="side-label">YOUR SPACE</div>
    <nav>{nav.map(({label,icon:Icon})=><button key={label} className={activeNav===label?"nav-item selected":"nav-item"} onClick={()=>{setActiveNav(label);setMobileMenu(false);if(label!=="Home")setNotice(label+" is included in the VIBE roadmap and will be connected in the next build.");}}><Icon size={19}/><span>{label}</span>{label==="Messages"&&<em>3</em>}</button>)}</nav>
    <div className="side-label communities-label">YOUR COMMUNITIES <button onClick={()=>setNotice("Community creation is coming soon.")}><Plus size={15}/></button></div>
    <button className="community-link" onClick={()=>setNotice("Naija Creators community preview.")}><span className="community-icon cyan">N</span> Naija Creators</button>
    <button className="community-link" onClick={()=>setNotice("Ethan Learners community preview.")}><span className="community-icon purple">E</span> Ethan Learners</button>
    <button className="community-link" onClick={()=>setNotice("Campus Connect community preview.")}><span className="community-icon orange">C</span> Campus Connect</button>
    <div className="sidebar-bottom"><ShieldCheck size={16}/> Built for positive communities</div>
   </aside>
   <section className="feed-column">
    <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR PEOPLE. YOUR MOMENT.</div><h1>Find your <span>vibe.</span></h1><p>Discover creators, share ideas and grow together.</p></div><button className="outline-btn" onClick={()=>setActiveNav("Explore")}><Compass size={16}/> Explore</button></div>
    <div className="stories-panel"><div className="panel-heading"><b>Stories</b><span>See what’s happening <ChevronDown size={14}/></span></div><div className="stories">{stories.map(s=><button key={s.name} className="story" onClick={()=>setNotice(s.own?"Story creation will be enabled with media uploads.":s.name+"'s story preview is not published yet.")}><span className={s.own?"story-ring own":"story-ring"}><span className={"story-avatar "+(s.own?"story-add":"")}>{s.avatar}</span>{!s.own&&<i/>}</span><small>{s.name}</small></button>)}</div></div>
    <div className="composer-card"><div className="avatar avatar-you">YO</div><button className="composer-prompt" onClick={()=>setShowComposer(true)}>What’s happening in your world?</button><button className="composer-media" onClick={()=>setNotice("Photo and video uploads will be enabled after media storage is connected.")}><ImagePlus size={19}/><span>Media</span></button><button className="composer-media video-action" onClick={()=>setNotice("VIBE short-video studio is planned for the next media release.")}><Video size={19}/><span>Video</span></button></div>
    <div className="feed-tabs"><div className="tabs">{["For you","Following","Creators","Technology","Community"].map(t=><button key={t} className={active===t?"tab active":"tab"} onClick={()=>setActive(t)}>{t}</button>)}</div><button className="filter-btn" onClick={()=>setNotice("Feed preferences will be available in settings.")}><Settings2 size={17}/></button></div>
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    <div className="feed-list">{filtered.length===0?<div className="empty-state"><Search size={24}/><b>No posts found</b><span>Try another search or feed category.</span></div>:filtered.map(p=><article className="post-card" key={p.id}>
      <div className="post-head"><div className="avatar">{p.avatar}</div><div className="post-author"><div><b>{p.name}</b>{p.verified&&<ShieldCheck className="verified" size={15}/>}<span>@{p.handle}</span></div><small>{p.time} · <span>{p.tag}</span></small></div><button className="dots" onClick={()=>setNotice("Post options: report, hide and share will be available in the full release.")}><MoreHorizontal/></button></div>
      <p className="post-copy">{p.text}</p><div className="post-art" style={{background:p.image}}><div className="art-overlay"><span>ETHAN VIBE COMMUNITY</span><b>{p.tag==="Creators"?"MAKE YOUR MOMENT COUNT":p.tag==="Technology"?"BUILD SOMETHING GREAT":"GROW TOGETHER"}</b><small>CREATE · CONNECT · GROW</small></div><span className="art-stamp">VIBE / 01</span></div>
      <div className="post-stats"><span>{p.likes+(liked.includes(p.id)?1:0)} likes</span><span>{p.comments} comments · Share</span></div>
      <div className="post-actions"><button className={liked.includes(p.id)?"action liked":"action"} onClick={()=>toggle(liked,p.id,setLiked)}><Heart size={19} fill={liked.includes(p.id)?"currentColor":"none"}/> Like</button><button className="action" onClick={()=>setNotice("Comments will be enabled when the live API is connected.")}><MessageCircle size={19}/> Comment</button><button className="action" onClick={()=>setNotice("Share link will be generated for published posts.")}><Share2 size={18}/> Share</button><button className={saved.includes(p.id)?"action saved":"action save-action"} onClick={()=>toggle(saved,p.id,setSaved)}><Bookmark size={18} fill={saved.includes(p.id)?"currentColor":"none"}/></button></div>
     </article>)}</div>
   </section>
   <aside className="right-sidebar">
    <div className="right-card challenge-card"><div className="card-kicker"><Flame size={15}/> THIS WEEK ON VIBE</div><div className="challenge-title">Show us what<br/>you <span>can create.</span></div><p>#EthanCreatorWeek is live. Share a skill, a project or a story that inspires someone.</p><div className="challenge-meta"><span><Users size={15}/> Community challenge</span><span>Weekly</span></div><button className="primary-btn full-btn" onClick={()=>setNotice("Creator challenge entry will open when publishing and media uploads are live.")}>Join the challenge <span>→</span></button></div>
    <div className="right-card"><div className="right-heading"><b><TrendingUp size={17}/> Trending now</b><button onClick={()=>setActive("For you")}>See all</button></div>{trends.map((t,i)=><button className="trend-row" key={t} onClick={()=>{setQuery(t.replace("#",""));setActive("For you");}}><span>0{i+1} · TRENDING</span><b>{t}</b><small>{[1240,892,674,438][i].toLocaleString()} posts</small></button>)}</div>
    <div className="right-card"><div className="right-heading"><b><Users size={17}/> People to follow</b><button onClick={()=>setNotice("More creator recommendations are coming soon.")}>More</button></div>{people.map(p=><div className="person-row" key={p.handle}><div className="avatar">{p.avatar}</div><div className="person-info"><b>{p.name}</b><small>{p.field}</small></div><button className={following.includes(p.handle)?"follow-btn following":"follow-btn"} onClick={()=>setFollowing(following.includes(p.handle)?following.filter(x=>x!==p.handle):[...following,p.handle])}>{following.includes(p.handle)?<Check size={15}/>:<Plus size={15}/>} {following.includes(p.handle)?"Following":"Follow"}</button></div>)}</div>
    <div className="vibe-footer"><span>ETHAN VIBE</span><p>About · Community Guidelines · Privacy · Help</p><small>© 2026 Ethan Digital. Create. Connect. Compete. Earn.</small></div>
   </aside>
  </div>
  {showComposer&&<div className="modal-backdrop" onClick={()=>setShowComposer(false)}><div className="composer-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><b>Create a post</b><button onClick={()=>setShowComposer(false)}><X/></button></div><textarea value={composer} onChange={e=>setComposer(e.target.value)} placeholder="Share something with your community..." autoFocus/><div className="modal-tools"><span><ImagePlus size={17}/> Media upload coming soon</span><button className="primary-btn" onClick={publish} disabled={!composer.trim()}>Publish post <Send size={15}/></button></div></div></div>}
  <nav className="mobile-nav">{nav.slice(0,5).map(({label,icon:Icon})=><button key={label} className={activeNav===label?"mobile-active":""} onClick={()=>setActiveNav(label)}><Icon size={20}/><small>{label==="Communities"?"Groups":label}</small></button>)}</nav>
 </main>;
}
