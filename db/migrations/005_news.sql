CREATE TABLE public.news_articles (
  slug text PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL,
  cover text CHECK (cover IN ('community', 'event')),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  withdrawn_at timestamptz,
  CHECK (withdrawn_at IS NULL OR published_at IS NOT NULL)
);

CREATE INDEX news_articles_public_order_idx
  ON public.news_articles (published_at DESC, slug)
  WHERE published_at IS NOT NULL AND withdrawn_at IS NULL;
