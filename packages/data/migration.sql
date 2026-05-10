-- Migration: Add password column to users (required for admin-created provider accounts)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

-- Migration: Add Coordinates to Shops for Distance Sorting
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Update seed shops with precise mock coordinates in Bangalore
UPDATE public.shops SET latitude = 12.9279, longitude = 77.6271 WHERE id = 's1'; -- Ravi Mobile Fix (Koramangala)
UPDATE public.shops SET latitude = 12.9165, longitude = 77.6101 WHERE id = 's2'; -- TechHub Laptop (BTM Layout)
UPDATE public.shops SET latitude = 12.9299, longitude = 77.5826 WHERE id = 's3'; -- Suresh Electric (Jayanagar)
UPDATE public.shops SET latitude = 12.9698, longitude = 77.7499 WHERE id = 's4'; -- Kiran Plumber (Whitefield)
UPDATE public.shops SET latitude = 12.8399, longitude = 77.6770 WHERE id = 's5'; -- CoolBreeze AC (Electronic City)

-- Enable Realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Migration: Add Coordinates to Bookings for precise user location
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS longitude FLOAT8;
