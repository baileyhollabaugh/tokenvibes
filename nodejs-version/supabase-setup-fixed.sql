-- Token Vibes Database Setup (FIXED VERSION)
-- Run this SQL in your Supabase SQL Editor

-- Create the token_creations table with quoted identifiers
CREATE TABLE IF NOT EXISTS "token_creations" (
    "id" BIGSERIAL PRIMARY KEY,
    "token_name" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "token_quantity" BIGINT NOT NULL,
    "token_decimals" INTEGER NOT NULL DEFAULT 9,
    "mint_address" TEXT,
    "destination_address" TEXT NOT NULL,
    "creator_wallet" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_token_creations_created_at" ON "token_creations"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_token_creations_creator_wallet" ON "token_creations"("creator_wallet");
CREATE INDEX IF NOT EXISTS "idx_token_creations_success" ON "token_creations"("success");

-- Create a view for easy statistics
CREATE OR REPLACE VIEW "token_stats" AS
SELECT 
    COUNT(*) as "total_tokens",
    COUNT(*) FILTER (WHERE "success" = true) as "successful_tokens",
    COUNT(*) FILTER (WHERE "success" = false) as "failed_tokens",
    ROUND(
        COUNT(*) FILTER (WHERE "success" = true) * 100.0 / COUNT(*), 
        2
    ) as "success_rate"
FROM "token_creations";

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE "token_creations" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert (for token creation logging)
CREATE POLICY "Allow token creation logging" ON "token_creations"
    FOR INSERT WITH CHECK (true);

-- Note: You may want to create more restrictive policies based on your needs
-- For now, this allows the app to log token creations but you can restrict
-- who can read the data if needed
