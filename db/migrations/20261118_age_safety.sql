-- ETHAN VIBE 13+ age assurance and age-aware advertising
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS age_band text NULL,
  ADD COLUMN IF NOT EXISTS age_verified_at timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_age_band_check') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_age_band_check
      CHECK (age_band IS NULL OR age_band IN ('13_15', '16_17', '18_plus'));
  END IF;
END $$;

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS ad_category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS teen_safe_approved boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_campaigns_ad_category_check') THEN
    ALTER TABLE public.ad_campaigns
      ADD CONSTRAINT ad_campaigns_ad_category_check
      CHECK (ad_category IN ('general','education','technology','events','employment','entertainment','finance','other'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ad_campaigns_teen_safe_delivery_idx
  ON public.ad_campaigns (status, teen_safe_approved, ad_category, start_at, end_at);
