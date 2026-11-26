ALTER TABLE public.events
  ADD COLUMN description text NOT NULL DEFAULT '',
  ADD COLUMN location text NOT NULL DEFAULT '',
  ADD COLUMN published_at timestamptz;

CREATE TABLE public.event_registrations (
  event_slug text NOT NULL REFERENCES public.events(slug),
  account_id text NOT NULL,
  guests integer NOT NULL CHECK (guests BETWEEN 0 AND 20),
  registered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_slug, account_id)
);
