# Supabase Integration Setup Guide

## Overview
This guide will help you connect your Token Vibes app to Supabase for database logging.

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy these values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 2: Set Environment Variables in Vercel

### Option A: Through Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add these variables:
   - `SUPABASE_URL` = Your project URL from Step 1
   - `SUPABASE_ANON_KEY` = Your anon key from Step 1
4. Make sure to set them for "Production" environment
5. Click "Save"

### Option B: Through Vercel CLI
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

## Step 3: Verify Your Database Table

Make sure your `token_creations` table has these columns:
- `id` (bigint, primary key)
- `token_name` (text)
- `token_symbol` (text) 
- `token_quantity` (bigint)
- `token_decima` (bigint) - Note: keeping the typo from your existing schema
- `mint_address` (text)
- `metadata_address` (text)
- `destination_address` (text)
- `destination_token_account` (text)
- `wallet_address` (text)
- `metadata_uri` (text)
- `transaction_signature` (text)
- `created_at` (timestamp)

## Step 4: Test the Integration

1. Deploy your updated code to Vercel
2. Visit your app's `/health/db` endpoint to test database connection
3. Create a test token to verify data is being saved

## Step 5: Check Your Data

1. Go to your Supabase dashboard
2. Navigate to "Table Editor"
3. Select the `token_creations` table
4. You should see your token creation data!

## Troubleshooting

### Database Connection Fails
- Double-check your environment variables in Vercel
- Make sure your Supabase project is active
- Verify the table exists and has the correct schema

### Data Not Appearing
- Check the Vercel function logs for errors
- Verify RLS (Row Level Security) policies allow inserts
- Test the `/health/db` endpoint first

### Environment Variables Not Working
- Make sure you set them for the correct environment (Production)
- Redeploy your Vercel project after adding variables
- Check that variable names match exactly (case-sensitive)

## What This Integration Does

1. **Logs Token Creation**: Every time someone creates a token, it gets saved to your database
2. **Tracks Transaction Signatures**: After the transaction is confirmed, the signature is updated
3. **Provides Admin Endpoints**: You can view all created tokens via `/api/tokens/all`
4. **Health Monitoring**: Check database status via `/health/db`

Your token creation flow now works like this:
1. User fills out form → Token created on Solana → Data logged to Supabase
2. Transaction gets signed → Signature updated in database
3. You can view all token data in your Supabase dashboard!

## Next Steps

Once this is working, you can:
- Build an admin dashboard to view all tokens
- Add analytics and reporting
- Set up automated notifications
- Create token verification tools

Happy token creating! 🚀
