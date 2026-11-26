CREATE TABLE public.alumni_role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.alumni_cards(account_id),
  target_id uuid NOT NULL REFERENCES public.alumni_cards(account_id),
  role text NOT NULL CHECK (role IN ('engagement', 'ambassador')),
  reason text NOT NULL,
  evidence_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  decision_note text,
  ended_by text,
  ended_at timestamptz,
  end_note text,
  CHECK ((role = 'engagement') = (requester_id = target_id)),
  CHECK (ended_at IS NULL OR status = 'approved')
);
CREATE UNIQUE INDEX alumni_role_requests_active_idx
  ON public.alumni_role_requests(target_id, role)
  WHERE status IN ('pending', 'approved') AND ended_at IS NULL;

CREATE TABLE public.alumni_community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.alumni_cards(account_id),
  topic text NOT NULL CHECK (topic IN ('intro', 'career')),
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'visible', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  moderated_by text,
  moderated_at timestamptz
);

CREATE TABLE public.alumni_collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.alumni_cards(account_id),
  need text NOT NULL,
  contact_email text NOT NULL,
  requested_unit text NOT NULL DEFAULT '',
  assigned_unit text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'forwarded', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  handled_by text,
  updated_at timestamptz,
  handling_note text
);
