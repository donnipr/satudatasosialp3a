-- Add jumlah column with default 0
ALTER TABLE public.bantuan_sosial ADD COLUMN IF NOT EXISTS jumlah INTEGER DEFAULT 0;

-- Optional: Drop old columns that are no longer needed
ALTER TABLE public.bantuan_sosial DROP COLUMN IF EXISTS padukuhan;
ALTER TABLE public.bantuan_sosial DROP COLUMN IF EXISTS alamat;
