-- Add UNIQUE constraint to prevent duplicate quarterly uploads
ALTER TABLE public.rekap_dtsen 
ADD CONSTRAINT unique_kapanewon_kalurahan_periode_tahun 
UNIQUE (kecamatan, kelurahan, periode, tahun);
