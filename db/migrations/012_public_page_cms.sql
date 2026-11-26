CREATE TABLE public.website_page_cms (
  id text PRIMARY KEY,
  draft jsonb NOT NULL DEFAULT '{}',
  published jsonb NOT NULL DEFAULT '{}',
  revision integer NOT NULL DEFAULT 0
);

INSERT INTO public.website_page_cms (id)
VALUES ('news'), ('events'), ('services'), ('career'), ('community'), ('alumni-card');
