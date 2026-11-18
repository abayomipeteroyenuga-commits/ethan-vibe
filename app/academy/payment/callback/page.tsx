import PaymentCallbackClient from "../callback-client";
export const dynamic="force-dynamic";
export default async function PaymentCallbackPage({searchParams}:{searchParams:Promise<{reference?:string}>}){
 const params=await searchParams;
 return <PaymentCallbackClient reference={params.reference||""}/>;
}
