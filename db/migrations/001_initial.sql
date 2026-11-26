CREATE TABLE public.events (
  slug text PRIMARY KEY,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0)
);
