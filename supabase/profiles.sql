CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'superuser'))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

INSERT INTO public.profiles (id, email, role)
VALUES ('340b43d6-e170-4eea-8503-88e62f532ee6', 'admin@dinsos.go.id', 'superuser')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;
