const { createClient } = require('@supabase/supabase-js');

class DatabaseLogger {
  constructor() {
    // Supabase configuration
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️  Supabase credentials not found. Token logging will be disabled.');
      this.enabled = false;
      return;
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.enabled = true;
    console.log('✅ Supabase database logging enabled');
  }

  async logTokenCreation(tokenData) {
    if (!this.enabled) {
      console.log('📝 Token creation (not logged):', tokenData.name, tokenData.symbol);
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('token_logs')
        .insert([
          {
            name: tokenData.name,
            symbol: tokenData.symbol,
            quantity: tokenData.quantity,
            creator_wallet: tokenData.creatorWallet,
            created_at: new Date().toISOString(),
            success: true
          }
        ]);

      if (error) {
        console.error('❌ Database logging error:', error);
      } else {
        console.log('✅ Token creation logged to database:', tokenData.name);
      }
    } catch (error) {
      console.error('❌ Database logging failed:', error);
    }
  }

  async logTokenError(tokenData, errorMessage) {
    if (!this.enabled) return;

    try {
      const { data, error } = await this.supabase
        .from('token_logs')
        .insert([
          {
            name: tokenData.name || 'Unknown',
            symbol: tokenData.symbol || 'Unknown',
            quantity: tokenData.quantity || 0,
            creator_wallet: tokenData.creatorWallet || 'Unknown',
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
        .from('token_logs')
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
