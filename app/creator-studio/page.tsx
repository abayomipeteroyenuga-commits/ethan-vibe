import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import CreatorStudio from "./studio";
export const dynamic = "force-dynamic";
export default async function CreatorStudioPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.emailVerified) redirect("/auth?mode=signin&next=/creator-studio");
  return <CreatorStudio />;
}