#!/bin/bash

echo "🚀 Token Vibes - Supabase Setup Script"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

echo "🔍 Checking current environment variables..."
echo ""

# Check for Supabase variables
if grep -q "SUPABASE_URL" .env; then
    echo "✅ SUPABASE_URL found in .env"
else
    echo "❌ SUPABASE_URL missing from .env"
    echo "📝 Adding Supabase configuration to .env..."
    echo "" >> .env
    echo "# Supabase Configuration (REQUIRED FOR DATABASE LOGGING)" >> .env
    echo "SUPABASE_URL=your_supabase_project_url_here" >> .env
    echo "SUPABASE_ANON_KEY=your_supabase_anon_key_here" >> .env
    echo "✅ Supabase configuration added to .env"
fi

echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 🌐 Go to https://supabase.com and create a new project"
echo "2. 📊 Run the SQL setup script in Supabase SQL Editor"
echo "3. 🔑 Copy your Supabase URL and API key"
echo "4. ✏️  Edit .env file and replace the placeholder values"
echo "5. 🚀 Deploy to Vercel with environment variables"
echo ""
echo "📖 For detailed instructions, see: SUPABASE-VERCEL-FIX.md"
echo ""
echo "🎉 Happy coding!"
