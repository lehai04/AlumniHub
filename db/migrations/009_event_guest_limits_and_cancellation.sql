ALTER TABLE public.events
  ADD COLUMN guest_limit integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT events_guest_limit_check CHECK (guest_limit >= 0 AND guest_limit < capacity);

ALTER TABLE public.event_registrations
  DROP CONSTRAINT event_registrations_guests_check,
  ADD CONSTRAINT event_registrations_guests_check CHECK (guests BETWEEN 0 AND 99999),
  ADD COLUMN registration_id uuid NOT NULL DEFAULT gen_random_uuid();
