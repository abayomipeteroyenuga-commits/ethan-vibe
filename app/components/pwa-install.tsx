"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

export default function PwaInstall() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [iosHelp, setIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); setIosHelp(false); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      const register = () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); };
      if (document.readyState === "complete") register(); else window.addEventListener("load", register, { once: true });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallEvent(null);
    } else if (isIos) {
      setIosHelp(true);
    }
  }

  if (installed || (!installEvent && !isIos)) return null;

  return <>
    <button type="button" onClick={install} aria-label="Install Ethan Vibe" style={{position:"fixed",zIndex:80,right:18,bottom:82,border:0,borderRadius:999,padding:"12px 17px",background:"linear-gradient(100deg,#06bde8,#7845f5)",color:"#fff",fontWeight:800,fontSize:13,boxShadow:"0 8px 28px #0008",cursor:"pointer"}}>＋ Install VIBE</button>
    {iosHelp && <div role="dialog" aria-modal="true" aria-label="Install Ethan Vibe" onClick={()=>setIosHelp(false)} style={{position:"fixed",inset:0,zIndex:100,display:"grid",placeItems:"center",padding:22,background:"#020617c9"}}><section onClick={e=>e.stopPropagation()} style={{maxWidth:360,width:"100%",padding:24,borderRadius:20,background:"#111d34",color:"#fff",border:"1px solid #34527d"}}><button onClick={()=>setIosHelp(false)} aria-label="Close" style={{float:"right",background:"transparent",border:0,color:"#fff",fontSize:22}}>×</button><h2 style={{marginTop:4}}>Add VIBE to your Home Screen</h2><p style={{color:"#c4d2e8",lineHeight:1.6}}>In Safari, tap the <b>Share</b> button, scroll down and choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</p><p style={{color:"#8fa8ca",fontSize:12}}>For the install option to work, open this website directly in Safari.</p></section></div>}
  </>;
}