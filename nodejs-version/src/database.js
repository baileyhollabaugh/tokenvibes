const { createClient } = require('@supabase/supabase-js');

class DatabaseLogger {
  constructor() {
    console.log('🔍 DATABASE.JS CONSTRUCTOR CALLED');
    console.log('🔍 DEBUG: All environment variables:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    
    // Supabase configuration - Vercel uses NEXT_PUBLIC_ prefix
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('🔍 DEBUG: Supabase URL:', this.supabaseUrl ? 'SET' : 'NOT SET');
    console.log('🔍 DEBUG: Supabase Key:', this.supabaseKey ? 'SET' : 'NOT SET');
    console.log('🔍 DEBUG: NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 DEBUG: SUPABASE_URL from env:', process.env.SUPABASE_URL);
    console.log('🔍 DEBUG: NEXT_PUBLIC_SUPABASE_URL from env:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔍 DEBUG: SUPABASE_ANON_KEY from env:', process.env.SUPABASE_ANON_KEY);
    console.log('🔍 DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY from env:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('❌ CRITICAL: Supabase credentials not found!');
      console.error('❌ Missing URL:', !this.supabaseUrl);
      console.error('❌ Missing Key:', !this.supabaseKey);
      console.error('❌ Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
      this.enabled = false;
      return;
    }
    
    try {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      this.enabled = true;
      console.log('✅ Supabase database logging enabled');
      console.log('✅ Supabase URL:', this.supabaseUrl.substring(0, 30) + '...');
      console.log('✅ Supabase Key:', this.supabaseKey.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error);
      this.enabled = false;
    }
  }

  async logTokenCreation(tokenData) {
    console.log('🔍 DEBUG: logTokenCreation called with:', tokenData);
    console.log('🔍 DEBUG: Database enabled:', this.enabled);
    console.log('🔍 DEBUG: Supabase client exists:', !!this.supabase);
    
    if (!this.enabled) {
      console.log('📝 Token creation (not logged):', tokenData.name, tokenData.symbol);
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('token_creations')
        .insert([
          {
            token_name: tokenData.name,           // FIXED: was 'name'
            token_symbol: tokenData.symbol,       // FIXED: was 'symbol'
            token_quantity: tokenData.quantity,   // FIXED: was 'quantity'
            token_decimals: tokenData.decimals || 9,
            mint_address: tokenData.mintAddress,
            destination_address: tokenData.destinationAddress,
            creator_wallet: tokenData.creatorWallet,
            created_at: new Date().toISOString(),
            success: true
          }
        ]);

      if (error) {
        console.error('❌ Database logging error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Token creation logged to database:', tokenData.name);
        console.log('✅ Inserted data:', data);
      }
    } catch (error) {
      console.error('❌ Database logging failed:', error);
    }
  }

  async logTokenError(tokenData, errorMessage) {
    if (!this.enabled) return;

    try {
      const { data, error } = await this.supabase
        .from('token_creations')
        .insert([
          {
            token_name: tokenData.name || 'Unknown',           // FIXED: was 'name'
            token_symbol: tokenData.symbol || 'Unknown',       // FIXED: was 'symbol'
            token_quantity: tokenData.quantity || 0,           // FIXED: was 'quantity'
            token_decimals: tokenData.decimals || 9,
            mint_address: tokenData.mintAddress,
            destination_address: tokenData.destinationAddress,
            creator_wallet: tokenData.creatorWallet,
            created_at: new Date().toISOString(),
            success: false,
            error_message: errorMessage
          }
        ]);

      if (error) {
        console.error('❌ Error logging failed:', error);
      } else {
        console.log('✅ Token error logged to database');
      }
    } catch (error) {
      console.error('❌ Error logging failed:', error);
    }
  }

  async getTokenStats() {
    if (!this.enabled) return null;

    try {
      const { data, error } = await this.supabase
        .from('token_creations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch token stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to fetch token stats:', error);
      return null;
    }
  }
}

module.exports = DatabaseLogger;