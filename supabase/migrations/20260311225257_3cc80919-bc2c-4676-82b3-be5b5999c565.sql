
-- Create sales_leads table for commercial lead capture
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  role text,
  company_size text,
  interest_type text,
  message text,
  source_page text,
  cta_origin text,
  status text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.sales_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.sales_leads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.sales_leads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON public.sales_leads(created_at DESC);
