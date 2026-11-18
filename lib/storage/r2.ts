import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = { accountId:string; bucket:string; accessKeyId:string; secretAccessKey:string };
let client:S3Client|null=null;
function config():R2Config {
  const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket=process.env.R2_BUCKET_NAME;
  const accessKeyId=process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey=process.env.R2_SECRET_ACCESS_KEY;
  if(!accountId||!bucket||!accessKeyId||!secretAccessKey)throw new Error("Cloudflare R2 storage is not configured.");
  return {accountId,bucket,accessKeyId,secretAccessKey};
}
export function r2Configured(){return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID&&process.env.R2_BUCKET_NAME&&process.env.R2_ACCESS_KEY_ID&&process.env.R2_SECRET_ACCESS_KEY);}
export function r2Client(){
  if(!client){const c=config();client=new S3Client({region:"auto",endpoint:`https://${c.accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId:c.accessKeyId,secretAccessKey:c.secretAccessKey}});}
  return client;
}
export function r2Bucket(){return config().bucket;}
export async function createMediaUploadUrl(key:string,contentType:string){
  return getSignedUrl(r2Client(),new PutObjectCommand({Bucket:r2Bucket(),Key:key,ContentType:contentType}),{expiresIn:300});
}
export async function getMediaReadUrl(key:string){
  if(!key)return null;
  if(/^https:\/\//i.test(key))return key;
  return getSignedUrl(r2Client(),new GetObjectCommand({Bucket:r2Bucket(),Key:key}),{expiresIn:3600});
}
export async function verifyUploadedMedia(key:string){
  return r2Client().send(new HeadObjectCommand({Bucket:r2Bucket(),Key:key}));
}
