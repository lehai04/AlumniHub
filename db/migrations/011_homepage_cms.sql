CREATE TABLE public.homepage_cms (
  id boolean PRIMARY KEY CHECK (id),
  draft jsonb NOT NULL DEFAULT '{}',
  published jsonb NOT NULL DEFAULT '{}',
  revision integer NOT NULL DEFAULT 0
);

INSERT INTO public.homepage_cms (id) VALUES (true);
