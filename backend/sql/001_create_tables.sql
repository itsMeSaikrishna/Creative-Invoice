-- ============================================================
-- Creative Invoice - Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_path VARCHAR(500),
    original_filename VARCHAR(255),

    -- Extracted Data
    seller_name VARCHAR(255),
    seller_gstin VARCHAR(15),
    buyer_gstin VARCHAR(15),
    bill_no VARCHAR(100),
    bill_date DATE,

    total_taxable_value DECIMAL(15, 2),
    total_cgst DECIMAL(15, 2),
    total_sgst DECIMAL(15, 2),
    total_igst DECIMAL(15, 2),
    total_quantity DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),

    tax_breakup JSONB,

    -- Processing Status
    status VARCHAR(50) DEFAULT 'pending',
    validation_passed BOOLEAN,
    validation_errors JSONB,

    -- Metadata
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_bill_date ON invoices(bill_date);
CREATE INDEX idx_invoices_status ON invoices(status);

-- 2. Buyer GSTINs table
CREATE TABLE buyer_gstins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gstin VARCHAR(15) NOT NULL,
    buyer_name VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, gstin)
);

CREATE INDEX idx_buyer_gstins_user_id ON buyer_gstins(user_id);

-- 3. Extraction Templates table (for future use)
CREATE TABLE extraction_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    template_name VARCHAR(255),
    seller_gstin VARCHAR(15),
    field_mappings JSONB,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) - users can only see their own data
-- ============================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_gstins ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_templates ENABLE ROW LEVEL SECURITY;

-- Invoices: users see only their own
CREATE POLICY "Users can view own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
    ON invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
    ON invoices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
    ON invoices FOR DELETE
    USING (auth.uid() = user_id);

-- Buyer GSTINs: users see only their own
CREATE POLICY "Users can view own buyers"
    ON buyer_gstins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own buyers"
    ON buyer_gstins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own buyers"
    ON buyer_gstins FOR DELETE
    USING (auth.uid() = user_id);

-- Templates: users see only their own
CREATE POLICY "Users can view own templates"
    ON extraction_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
    ON extraction_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket policy (run after creating 'invoices' bucket)
-- ============================================================
-- Go to Storage > Policies and add:
-- SELECT: auth.uid()::text = (storage.foldername(name))[1]
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- DELETE: auth.uid()::text = (storage.foldername(name))[1]
