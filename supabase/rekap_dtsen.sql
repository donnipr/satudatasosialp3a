CREATE TABLE public.rekap_dtsen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kecamatan TEXT NOT NULL,
    kelurahan TEXT NOT NULL,
    total_keluarga INTEGER DEFAULT 0,
    total_individu INTEGER DEFAULT 0,
    d1_keluarga INTEGER DEFAULT 0,
    d1_individu INTEGER DEFAULT 0,
    d2_keluarga INTEGER DEFAULT 0,
    d2_individu INTEGER DEFAULT 0,
    d3_keluarga INTEGER DEFAULT 0,
    d3_individu INTEGER DEFAULT 0,
    d4_keluarga INTEGER DEFAULT 0,
    d4_individu INTEGER DEFAULT 0,
    d5_keluarga INTEGER DEFAULT 0,
    d5_individu INTEGER DEFAULT 0,
    d6_10_keluarga INTEGER DEFAULT 0,
    d6_10_individu INTEGER DEFAULT 0,
    belum_peringkat_keluarga INTEGER DEFAULT 0,
    belum_peringkat_individu INTEGER DEFAULT 0,
    nonaktif_keluarga INTEGER DEFAULT 0,
    nonaktif_individu INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup RLS (Row Level Security)
ALTER TABLE public.rekap_dtsen ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users" 
ON public.rekap_dtsen 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow all operations to superusers (assumes role checking logic is applied in your app/db)
-- Here we're using a common pattern assuming auth.jwt() -> 'user_metadata' contains 'role'
CREATE POLICY "Allow full access to superusers" 
ON public.rekap_dtsen 
FOR ALL 
TO authenticated 
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'superuser')
WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'superuser');
