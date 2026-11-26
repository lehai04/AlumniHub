CREATE TABLE public.alumni_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  full_name text NOT NULL,
  identifier_type text NOT NULL CHECK (identifier_type IN ('mssv', 'cccd')),
  identifier text NOT NULL,
  faculty text NOT NULL,
  phone text NOT NULL,
  occupation text NOT NULL DEFAULT '',
  workplace text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identifier_type, identifier)
);

CREATE TABLE public.alumni_cards (
  account_id uuid PRIMARY KEY REFERENCES public.alumni_accounts(id),
  code text NOT NULL UNIQUE,
  reviewed_by text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE public.alumni_card_number AS integer MAXVALUE 999999;
