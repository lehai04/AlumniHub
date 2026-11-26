CREATE TABLE public.event_registration_cancellations (
  event_slug text NOT NULL REFERENCES public.events(slug),
  account_id text NOT NULL,
  PRIMARY KEY (event_slug, account_id)
);
