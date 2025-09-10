# 🚀 Supabase Setup Guide for Token Vibes

This guide will help you set up Supabase to track all token creations on your Token Vibes app.

## Step 1: Connect Supabase to Vercel

1. **Go to your Vercel dashboard** (vercel.com)
2. **Find your Token Vibes project**
3. **Click on "Settings" tab**
4. **Click on "Integrations" in the left sidebar**
5. **Find "Supabase" and click "Add Integration"**
6. **Follow the setup wizard** - it will create a new Supabase project for you

## Step 2: Set Up the Database Table

1. **Go to your Supabase dashboard** (supabase.com)
2. **Select your project** (the one Vercel created)
3. **Click on "SQL Editor" in the left sidebar**
4. **Copy and paste the contents of `supabase-setup.sql`**
5. **Click "Run" to create the table**

## Step 3: Get Your Supabase Credentials

1. **In your Supabase project dashboard**
2. **Click on "Settings" (gear icon)**
3. **Click on "API"**
4. **Copy these two values:**
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 4: Add Environment Variables to Vercel

1. **Go back to your Vercel project**
2. **Click on "Settings" tab**
3. **Click on "Environment Variables"**
4. **Add these two variables:**
   - `SUPABASE_URL` = Your Project URL
   - `SUPABASE_ANON_KEY` = Your anon public key
5. **Make sure to select "Production" environment**
6. **Click "Save"**

## Step 5: Deploy Your Updated Code

1. **Push your changes to GitHub** (if using Git)
2. **Or redeploy from Vercel dashboard**
3. **Wait for deployment to complete**

## Step 6: Test the Setup

1. **Visit your Token Vibes app**
2. **Create a test token**
3. **Visit `your-app.vercel.app/admin`** to see the admin dashboard
4. **You should see your test token in the statistics!**

## 🎉 What You'll Be Able to See

Once set up, you can visit `/admin` on your site to see:

- **Total tokens created**
- **Success/failure rates**
- **Recent token creations**
- **Creator wallet addresses**
- **Token names and symbols**

## 🔧 Troubleshooting

**If the admin dashboard shows "Database not available":**
- Check that your environment variables are set correctly in Vercel
- Make sure you ran the SQL setup script in Supabase
- Check the Vercel deployment logs for any errors

**If no data appears:**
- Try creating a test token first
- Check the browser console for any errors
- Verify the Supabase connection is working

## 📊 Database Schema

The `token_creations` table stores:
- `token_name` - Name of the token (e.g., "BaileyCoin")
- `token_symbol` - Symbol (e.g., "BAILEY")
- `token_quantity` - How many tokens were created
- `mint_address` - The Solana address of the token
- `creator_wallet` - Who created it
- `created_at` - When it was created
- `success` - Whether it succeeded or failed

## 🔒 Privacy Note

This setup logs basic token creation data but doesn't store:
- Private keys
- Personal information
- Sensitive wallet data

The data is stored securely in Supabase and only you can access it through the admin dashboard.
