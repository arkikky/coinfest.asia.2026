DO $$ BEGIN
    CREATE TYPE public.invoice_status_enum AS ENUM ('send', 'unsend');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.invoice (
    id SERIAL PRIMARY KEY,
    id_invoice UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_orders UUID NOT NULL REFERENCES public.orders (id_orders) ON DELETE CASCADE,
    invoice_id VARCHAR(50) NOT NULL, -- format: "INV-{random char+number}"
    pdf_url TEXT,
    amount_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    invoice_status public.invoice_status_enum NOT NULL DEFAULT 'unsend',
    ayment_method TEXT,
    payment_provider TEXT,
    payment_intent_id TEXT,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;

-- @indexes
DO $$ BEGIN
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_invoice_invoice_id ON public.invoice (invoice_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_invoice_id_orders ON public.invoice (id_orders);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;