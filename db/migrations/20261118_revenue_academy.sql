-- ETHAN VIBE Revenue & Academy Subscription System
CREATE TABLE IF NOT EXISTS public.academy_courses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
 title text NOT NULL, description text NOT NULL DEFAULT '',
 price_ngn numeric(12,2) NOT NULL CHECK(price_ngn>0),
 access_days integer NOT NULL DEFAULT 30 CHECK(access_days BETWEEN 1 AND 366),
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.vibe_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
 title text NOT NULL, description text NOT NULL DEFAULT '',
 price_ngn numeric(12,2) NOT NULL CHECK(price_ngn>0),
 access_days integer NOT NULL DEFAULT 30 CHECK(access_days BETWEEN 1 AND 366),
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.payment_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 product_type text NOT NULL CHECK(product_type IN ('course','membership')),
 course_id uuid NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
 plan_slug text NULL REFERENCES public.vibe_plans(slug) ON DELETE RESTRICT,
 reference text NOT NULL UNIQUE, amount_kobo bigint NOT NULL CHECK(amount_kobo>0),
 currency text NOT NULL DEFAULT 'NGN' CHECK(currency='NGN'),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','abandoned')),
 paystack_transaction_id text NULL, paid_at timestamptz NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((product_type='course' AND course_id IS NOT NULL AND plan_slug IS NULL) OR (product_type='membership' AND course_id IS NULL AND plan_slug IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS payment_orders_user_created_idx ON public.payment_orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS payment_orders_status_created_idx ON public.payment_orders(status,created_at DESC);
CREATE TABLE IF NOT EXISTS public.course_enrollments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
 order_id uuid NOT NULL UNIQUE REFERENCES public.payment_orders(id) ON DELETE RESTRICT,
 starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,course_id)
);
CREATE INDEX IF NOT EXISTS course_enrollments_user_status_idx ON public.course_enrollments(user_id,status,expires_at);
CREATE TABLE IF NOT EXISTS public.vibe_memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
 plan_slug text NOT NULL REFERENCES public.vibe_plans(slug) ON DELETE RESTRICT,
 order_id uuid NOT NULL UNIQUE REFERENCES public.payment_orders(id) ON DELETE RESTRICT,
 starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vibe_memberships_status_expiry_idx ON public.vibe_memberships(status,expires_at);
INSERT INTO public.academy_courses(slug,title,description,price_ngn,access_days)
VALUES('professional-digital-skills','Professional Digital Skills Training','Monthly access to Ethan Digital Academy professional digital skills training with guided lessons, practical exercises and projects. Contact the Academy for the current timetable and class format.',50000,30)
ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.vibe_plans(slug,title,description,price_ngn,access_days) VALUES
('vibe-premium','VIBE Premium','A 30-day membership with enhanced creator and community features.',2000,30),
('creator-plus','Creator Plus','A 30-day membership for creators who want additional profile and creator tools.',5000,30)
ON CONFLICT(slug) DO NOTHING;
