ALTER TABLE public.news_articles
  ADD COLUMN draft jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN published jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN revision integer NOT NULL DEFAULT 0;

ALTER TABLE public.events
  ADD COLUMN draft jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN published jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN revision integer NOT NULL DEFAULT 0;
