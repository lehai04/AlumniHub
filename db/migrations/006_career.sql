CREATE TABLE public.career_profiles (
  account_id uuid PRIMARY KEY REFERENCES public.alumni_accounts(id),
  profile jsonb NOT NULL,
  looking boolean NOT NULL DEFAULT false
);

CREATE TABLE public.career_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.alumni_cards(account_id),
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('onsite', 'hybrid', 'remote')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  closed_at timestamptz
);

CREATE TABLE public.career_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.alumni_accounts(id),
  name text NOT NULL,
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 5242880),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX career_cvs_account_idx ON public.career_cvs(account_id);

CREATE TABLE public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.career_jobs(id),
  account_id uuid NOT NULL REFERENCES public.alumni_accounts(id),
  candidate jsonb NOT NULL,
  cv_name text NOT NULL,
  cv_data bytea NOT NULL CHECK (octet_length(cv_data) BETWEEN 1 AND 5242880),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, account_id)
);
CREATE INDEX career_applications_account_idx ON public.career_applications(account_id);
