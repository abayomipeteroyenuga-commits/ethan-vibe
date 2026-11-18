# ETHAN VIBE

**Create. Connect. Compete. Earn.**

ETHAN VIBE is the social and creator community platform in the Ethan Digital ecosystem.

## Product scope
- Social feed with text, image, and short-video posts
- Creator profiles, follows, likes, and comments
- Direct messaging and notifications
- Communities, challenges, creator competitions, points, and leaderboards
- Responsive installable Progressive Web App

## Infrastructure
- PostgreSQL on Neon
- Next.js application hosted on Vercel
- Private media storage on Cloudflare R2 (S3-compatible)

## Cloudflare R2 setup
Create a **Standard** R2 bucket (for example, `ethan-vibe-media`) and an R2 API token scoped to that bucket with **Object Read & Write** permissions. Keep the bucket private; the application uses short-lived signed upload and read URLs.

Configure the bucket CORS policy:
- Allowed origin: `https://vibe.ethandigitalacademy.org`
- Allowed methods: `PUT`, `GET`, `HEAD`
- Allowed headers: `Content-Type`
- Expose headers: `ETag`
- Max age: `3600` seconds

Add these environment variables to the Vercel project for the Production environment (and Preview/Development if required):
- `CLOUDFLARE_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Never commit R2 credentials or expose them to browser-side code. The app allows JPEG, PNG, WEBP and GIF images up to 10 MB, and MP4/WEBM videos up to 100 MB. New media posts are held for moderator review; the private object is only served to moderators and in the feed after approval.

## Repository status
The R2 upload integration is implemented in the application code. It is not operational until the bucket, CORS policy, and Vercel environment variables above are configured and a successful production deployment is verified.


## Academy, subscriptions and payments
- The member storefront is available at `/academy`.
- The initial Academy product is Professional Digital Skills Training at ₦50,000 per 30-day access period.
- Optional VIBE Premium and Creator Plus passes are ₦2,000 and ₦5,000 per 30 days respectively.
- Course and membership access is activated only after server-side Paystack verification or a valid signed Paystack webhook.
- Configure the server-only `PAYSTACK_SECRET_KEY` in Vercel. Never expose it to browser code or commit it.
- Configure the Paystack webhook URL as `https://vibe.ethandigitalacademy.org/api/payments/paystack/webhook`.
- This first release uses prepaid 30-day access passes with manual renewal; it does not silently auto-charge members.
- Apply `db/migrations/20261118_revenue_academy.sql` to the Neon `ethan_vibe` database before enabling checkout.
- Admins can review verified revenue and recent transactions from `/admin`.
