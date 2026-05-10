-- ==========================================
-- QuickFix Database Schema & Seed Data
-- ==========================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  location TEXT,
  "isBlocked" BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shops (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES public.users(id),
  name TEXT NOT NULL,
  rating NUMERIC DEFAULT 0,
  address TEXT,
  category TEXT[],
  is_approved BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT TRUE,
  price_range TEXT,
  city TEXT,
  total_reviews INTEGER DEFAULT 0,
  images TEXT[],
  phone TEXT,
  open_time TEXT,
  close_time TEXT
);

CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  shop_id TEXT REFERENCES public.shops(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id),
  shop_id TEXT REFERENCES public.shops(id),
  service_id TEXT REFERENCES public.services(id),
  status TEXT DEFAULT 'requested',
  date TEXT,
  time TEXT,
  address TEXT,
  description TEXT,
  service_price NUMERIC,
  payment_method TEXT DEFAULT 'cash'
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id),
  shop_id TEXT REFERENCES public.shops(id),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We are keeping RLS disabled for this MVP since we use mock OTP auth 
-- where the client manages the user identity.

-- ==========================================
-- 2. Seed Data
-- ==========================================

-- Users
INSERT INTO public.users (id, name, phone, role, "isBlocked", location) VALUES
('u1', 'Rahul Kumar', '+919876543210', 'customer', FALSE, 'HSR Layout, Bangalore'),
('u2', 'Priya Singh', '+919876543211', 'customer', FALSE, 'Indiranagar, Bangalore'),
('u3', 'Ravi Sharma', '+919000000001', 'provider', FALSE, 'Koramangala, Bangalore'),
('u4', 'Amit Patel', '+919000000002', 'provider', FALSE, 'BTM Layout, Bangalore'),
('u5', 'Suresh Reddy', '+919000000003', 'provider', FALSE, 'Jayanagar, Bangalore'),
('u6', 'Kiran Das', '+919000000004', 'provider', FALSE, 'Whitefield, Bangalore'),
('u7', 'Manoj Tiwari', '+919000000005', 'provider', FALSE, 'Electronic City, Bangalore')
ON CONFLICT (phone) DO NOTHING;

-- Shops
INSERT INTO public.shops (id, owner_id, name, rating, address, category, is_approved, is_open, price_range, city, total_reviews, images, phone, open_time, close_time) VALUES
('s1', 'u3', 'Ravi Mobile Fix', 4.8, '12th Main, Koramangala', '{"mobile-repair"}', TRUE, TRUE, '₹100 - ₹2000', 'Bangalore', 124, '{"https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800"}', '+919000000001', '09:00 AM', '08:00 PM'),
('s2', 'u4', 'TechHub Laptop Service', 4.6, '4th Cross, BTM Layout', '{"laptop-repair"}', TRUE, TRUE, '₹300 - ₹5000', 'Bangalore', 89, '{"https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800"}', '+919000000002', '10:00 AM', '07:00 PM'),
('s3', 'u5', 'Suresh Electric Works', 4.9, '11th Main, Jayanagar', '{"electrician"}', TRUE, TRUE, '₹150 - ₹1500', 'Bangalore', 215, '{"https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800"}', '+919000000003', '08:00 AM', '09:00 PM'),
('s4', 'u6', 'Kiran Plumber Services', 4.5, 'ITPL Road, Whitefield', '{"plumber"}', TRUE, TRUE, '₹200 - ₹1000', 'Bangalore', 156, '{"https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800"}', '+919000000004', '09:00 AM', '06:00 PM'),
('s5', 'u7', 'CoolBreeze AC Repair', 4.7, 'Phase 1, Electronic City', '{"ac-repair"}', TRUE, TRUE, '₹500 - ₹3500', 'Bangalore', 302, '{"https://images.unsplash.com/photo-1621677353915-d72b260dedb4?w=800"}', '+919000000005', '09:00 AM', '08:00 PM')
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO public.services (id, shop_id, name, description, price, duration, category) VALUES
('sv1', 's1', 'Screen Replacement', 'High quality OEM screen replacement', 800, '1-2 hours', 'mobile-repair'),
('sv2', 's1', 'Battery Replacement', 'Genuine battery with 6-month warranty', 350, '30 mins', 'mobile-repair'),
('sv3', 's2', 'OS Installation', 'Windows/macOS install with formatting', 500, '2 hours', 'laptop-repair'),
('sv4', 's2', 'Keyboard Fix', 'Replace damaged keys or full keyboard', 1200, '1 day', 'laptop-repair'),
('sv5', 's3', 'Fan Installation', 'Ceiling fan mounting and wiring', 250, '45 mins', 'electrician'),
('sv6', 's3', 'Switchboard Repair', 'Fix loose connections or replace switches', 150, '30 mins', 'electrician'),
('sv7', 's4', 'Tap Leakage', 'Fix dripping taps and pipes', 200, '1 hour', 'plumber'),
('sv8', 's4', 'Blockage Removal', 'Clear blocked drains and sinks', 350, '1.5 hours', 'plumber'),
('sv9', 's5', 'AC Servicing', 'Complete indoor/outdoor units vacuum & wash', 599, '1.5 hours', 'ac-repair'),
('sv10', 's5', 'Gas Refill', 'Check leaks and refill R32/R410 gas', 1500, '2 hours', 'ac-repair')
ON CONFLICT (id) DO NOTHING;

-- Bookings
INSERT INTO public.bookings (id, user_id, shop_id, service_id, status, date, time, address, description, service_price, payment_method) VALUES
('b1', 'u1', 's1', 'sv1', 'completed', 'Mon 23', '11:00 AM', 'HSR Layout Sector 2', 'Screen is cracked', 800, 'cash'),
('b2', 'u1', 's5', 'sv9', 'completed', 'Sun 22', '02:00 PM', 'HSR Layout Sector 2', 'Not cooling properly', 599, 'upi'),
('b3', 'u2', 's4', 'sv7', 'completed', 'Wed 25', '04:00 PM', 'Indiranagar 100ft road', 'Kitchen sink blocked', 350, 'cash')
ON CONFLICT (id) DO NOTHING;

-- Reviews
INSERT INTO public.reviews (id, user_id, shop_id, rating, comment) VALUES
('r1', 'u1', 's1', 5, 'Very quick and professional screen replacement! Highly recommended.'),
('r2', 'u2', 's1', 4, 'Good service but took a bit longer than expected.'),
('r3', 'u1', 's5', 5, 'Mechanic arrived on time and fixed the AC leakage quickly.'),
('r4', 'u2', 's4', 5, 'Plumber was very polite and cleared the blockage in 20 mins.')
ON CONFLICT (id) DO NOTHING;
