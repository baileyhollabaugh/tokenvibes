# 🔧 SUPABASE-VERCEL CONNECTION FIX GUIDE

## 🚨 CRITICAL ISSUES IDENTIFIED & FIXED

Your Token Vibes app has several connection issues that I've identified and fixed:

### ✅ **FIXED ISSUES:**
1. **Database Table Name Mismatch** - Fixed `token_logs` → `token_creations`
2. **Vercel Configuration** - Added missing environment variables
3. **Code Structure** - Everything else is properly set up

### ❌ **REMAINING ISSUES TO FIX:**
1. **Missing Supabase Environment Variables** (You need to add these)
2. **Supabase Project Setup** (You need to create this)
3. **Vercel Environment Variables** (You need to add these to Vercel)

---

## 🚀 STEP-BY-STEP FIX INSTRUCTIONS

### **STEP 1: Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign in with your GitHub account**
3. **Click "New Project"**
4. **Fill out the form:**
   - Organization: Select your account
   - Project Name: `token-vibes-database`
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users
5. **Click "Create new project"**
6. **Wait 2-3 minutes for setup to complete**

### **STEP 2: Set Up Database Table**

1. **In your Supabase dashboard, click "SQL Editor" (left sidebar)**
2. **Click "New Query"**
3. **Copy and paste this SQL code:**

```sql
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
```

4. **Click "Run" to execute the SQL**
5. **You should see "Success. No rows returned" message**

### **STEP 3: Get Your Supabase Credentials**

1. **In your Supabase dashboard, click "Settings" (gear icon)**
2. **Click "API" in the left sidebar**
3. **Copy these two values:**
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### **STEP 4: Add Environment Variables to Vercel**

1. **Go to [vercel.com](https://vercel.com) and sign in**
2. **Find your Token Vibes project and click on it**
3. **Click "Settings" tab**
4. **Click "Environment Variables" in the left sidebar**
5. **Add these variables one by one:**

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://your-project-id.supabase.co` (paste your Project URL)
   - Environment: Production, Preview, Development (check all three)

   **Variable 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJ...` (paste your anon key)
   - Environment: Production, Preview, Development (check all three)

6. **Click "Save" after adding each variable**

### **STEP 5: Fix IPv6 Connection Issue (CRITICAL)**

This is the most important step! Vercel doesn't support IPv6, but Supabase uses it by default.

1. **In your Supabase dashboard, go to Settings > Database**
2. **Scroll down to "Connection Pooling"**
3. **Copy the "Connection string" (it should start with `postgres://`)**
4. **Go back to Vercel > Environment Variables**
5. **Add this variable:**
   - Name: `POSTGRES_URL`
   - Value: `postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true`
   - Environment: Production, Preview, Development (check all three)

### **STEP 6: Update Your Local Environment**

1. **Open your `.env` file in the `nodejs-version` folder**
2. **Add these lines at the bottom:**

```env
# Supabase Configuration (REQUIRED FOR DATABASE LOGGING)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

3. **Replace the placeholder values with your actual Supabase credentials**
4. **Save the file**

### **STEP 7: Test the Connection**

1. **In your terminal, navigate to the `nodejs-version` folder**
2. **Run: `npm start`**
3. **Open your browser to `http://localhost:3000`**
4. **Try creating a test token**
5. **Check the terminal - you should see:**
   - `✅ Supabase database logging enabled`
   - `✅ Token creation logged to database: [token-name]`

### **STEP 8: Deploy to Vercel**

1. **Commit and push your changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Supabase connection"
   git push
   ```

2. **Vercel will automatically deploy your changes**
3. **Wait for deployment to complete**
4. **Test your live app - token creation should now be logged!**

---

## 🎯 WHAT THIS FIXES

After completing these steps, your app will:

✅ **Connect to Supabase** - Your app can now save data to the database
✅ **Log Token Creations** - Every token created gets saved with details
✅ **Track Statistics** - You can see how many tokens were created
✅ **Handle Errors** - Failed token creations are also logged
✅ **Work on Vercel** - Everything works in production

---

## 🔍 TROUBLESHOOTING

**If you see "Database not available" in your app:**
- Check that all environment variables are set in Vercel
- Make sure you ran the SQL setup script in Supabase
- Verify the Supabase URL and key are correct

**If token creation works but nothing gets logged:**
- Check the Vercel deployment logs for errors
- Make sure the database table was created successfully
- Verify the environment variables are set correctly

**If you get connection errors:**
- Make sure you're using the Supavisor connection string (not direct connection)
- Check that your Supabase project is fully set up
- Verify all environment variables are set in Vercel

---

## 🎉 SUCCESS!

Once everything is working, you'll be able to:
- Create Solana tokens through your app
- See them logged in your Supabase database
- View statistics and analytics
- Track success/failure rates

Your Token Vibes app will be fully functional with database logging! 🚀
