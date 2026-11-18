-- Additive profile-to-auth identity link. Existing profile and post rows are preserved.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id text;
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key ON public.users (auth_user_id);
