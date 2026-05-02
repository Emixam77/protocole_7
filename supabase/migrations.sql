-- SQL Migration for Protocole 7 Jours

-- 1. Table: leads_prospects
-- Stockage des leads identifiés par les agents de sourcing
CREATE TABLE IF NOT EXISTS public.leads_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    niche TEXT CHECK (niche IN ('Restos', 'Immobilier', 'Artisans', 'FFF')),
    gap_type TEXT, -- e.g., 'photos_obsoletes', 'site_non_responsive', 'reseaux_inactifs'
    heat_score INTEGER CHECK (heat_score >= 0 AND heat_score <= 100),
    contact_info JSONB,
    city TEXT,
    status TEXT DEFAULT 'nouveau' -- nouveau, contacté, clos
);

-- 2. Table: user_activity
-- Suivi de l'avancement de l'élève du Jour 1 au Jour 7
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_day INTEGER DEFAULT 1 CHECK (current_day >= 1 AND current_day <= 7),
    tasks_completed JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table: upsell_matrix
-- Intelligence pour proposer des services additionnels
CREATE TABLE IF NOT EXISTS public.upsell_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_point TEXT, -- e.g., 'first_lead_found', 'day_3_reached'
    upsell_type TEXT,
    is_presented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.leads_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_matrix ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only see their own leads" ON public.leads_prospects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own activity" ON public.user_activity
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own upsells" ON public.upsell_matrix
    FOR ALL USING (auth.uid() = user_id);
