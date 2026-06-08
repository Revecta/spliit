-- Create table for personal budget
CREATE TABLE IF NOT EXISTS public.spese_personal_budget (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_limit INTEGER NOT NULL DEFAULT 60000, -- in cents, e.g. 600.00 (600€)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for budget
ALTER TABLE public.spese_personal_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budget" 
    ON public.spese_personal_budget 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create table for personal expenses
CREATE TABLE IF NOT EXISTS public.spese_personal_expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL, -- in cents
    category TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for expenses
ALTER TABLE public.spese_personal_expense ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personal expenses" 
    ON public.spese_personal_expense 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger for auto-updating updated_at on budget updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_spese_personal_budget_updated_at
    BEFORE UPDATE ON public.spese_personal_budget
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

