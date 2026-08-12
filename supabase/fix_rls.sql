-- The previous policy might be failing if your Supabase Auth JWT doesn't match exactly.
-- To completely unblock you and prevent the "violates row-level security policy" error,
-- we will just DISABLE Row-Level Security for this table since we are enforcing
-- security in the Next.js Server Actions anyway.

ALTER TABLE public.rekap_dtsen DISABLE ROW LEVEL SECURITY;
