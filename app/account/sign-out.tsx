"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message || "Sign out failed.");
      router.replace("/");
      router.refresh();
    } catch { setBusy(false); }
  }
  return <button className="account-signout" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>;
}
