-- Supabase Schema for Data Sources

CREATE TABLE IF NOT EXISTS public.data_sources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tahun text NOT NULL,
    url_csv text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (or you can restrict to authenticated users)
CREATE POLICY "Allow read access to all users" ON public.data_sources
    FOR SELECT USING (true);

-- Allow all operations for authenticated users (adjust as needed for your auth setup)
CREATE POLICY "Allow all operations for authenticated users" ON public.data_sources
    FOR ALL USING (auth.role() = 'authenticated');
    
-- Alternatively, if you are not using authentication for this dashboard yet, 
-- you can enable public access temporarily (NOT RECOMMENDED FOR PRODUCTION):
-- CREATE POLICY "Allow all operations for public" ON public.data_sources FOR ALL USING (true);

-- Insert initial data
INSERT INTO public.data_sources (tahun, url_csv, is_default)
VALUES ('2024', 'https://docs.google.com/spreadsheets/d/1VsR641RKwSwkjCPBoe-hamvy5or5DmuL73juJDNqOnQ/export?format=csv', true);
