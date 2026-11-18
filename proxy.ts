import { auth } from "@/lib/auth/server";
export default auth.middleware({ loginUrl: "/auth?mode=signin" });
export const config = { matcher: ["/account/:path*"] };
