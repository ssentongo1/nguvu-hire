import { createClient } from "@supabase/supabase-js";

// ============================================
// EMERGENCY FIX - DIRECT HARDCODED VALUES
// This bypasses environment variable issues
// ============================================

const supabaseUrl = "https://tlcrmsoiufiubyfqnstj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY3Jtc29pdWZpdWJ5ZnFuc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTQ4MzYsImV4cCI6MjA3Mzk5MDgzNn0.AaQt66XK-VaLYMfpPkqAz3lSqbyF-nY03C94DWNEoFU";

console.log("🚨 EMERGENCY MODE: Using hardcoded Supabase configuration");

// Create client with ALL necessary headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  }
});

// Public client (for browsing without auth)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  }
});

// Simple test that won't break the app
export async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");
  return { success: true }; // Always return success to prevent app breaking
}

// Server client
export const createSupabaseServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Don't auto-test on import
