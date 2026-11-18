import AuthScreen from "./auth-screen";
export const dynamic = "force-dynamic";
export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  return <AuthScreen initialMode={params.mode === "signin" ? "signin" : "signup"} />;
}
