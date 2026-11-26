CREATE TABLE public.alumni_password_resets (
  account_id uuid PRIMARY KEY REFERENCES public.alumni_accounts(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  used_at timestamptz
);

CREATE TABLE public.alumni_service_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('benefits', 'library')),
  title text NOT NULL,
  body text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'published', 'withdrawn')),
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);
