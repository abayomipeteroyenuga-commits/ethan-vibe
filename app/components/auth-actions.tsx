"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

type UserSummary = { name?: string | null; email?: string | null };

export default function AuthActions() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;
    authClient.getSession().then(({ data }) => {
      if (!live) return;
      setUser(data?.user ?? null);
      setChecked(true);
    }).catch(() => { if (live) setChecked(true); });
    return () => { live = false; };
  }, []);

  if (!checked) return <div className="auth-actions" aria-label="Checking account"><span className="auth-loading" /></div>;
  if (user) {
    const label = (user.name || user.email || "V").slice(0, 2).toUpperCase();
    return <div className="auth-actions"><Link className="auth-user" href="/account" aria-label="Open your VIBE account"><span className="avatar avatar-you">{label}</span><span>My account</span></Link><Link className="auth-login" href="/creator-studio">Creator Studio</Link></div>;
  }
  return <div className="auth-actions"><Link className="auth-login" href="/auth?mode=signin">Log in</Link><Link className="auth-join" href="/auth?mode=signup">Create account</Link></div>;
}
