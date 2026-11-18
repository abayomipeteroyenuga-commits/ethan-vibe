import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import AdminDashboard from "./dashboard";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 const admin=await getAdminContext();
 if(!admin)redirect("/auth?mode=signin&next=/admin");
 return <AdminDashboard adminName={admin.member.display_name}/>;
}
