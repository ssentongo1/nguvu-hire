import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client with the service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    const { userId, role, employerType, country } = await req.json();

    console.log("📝 Creating profile for user:", userId);

    if (!userId || !role || !country) {
      return NextResponse.json(
        { error: "Missing required fields", details: { userId, role, country } },
        { status: 400 }
      );
    }

    // Prepare profile data
    const profileData = {
      id: userId,
      role,
      country,
      employer_type: role === "employer" ? employerType : null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log("📦 Profile data:", profileData);

    // Insert directly - service role bypasses RLS
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.error("❌ Profile save error:", error);
      return NextResponse.json({ 
        error: "Database error saving profile",
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log("✅ Profile created/updated successfully");
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("🔥 API Error:", err);
    return NextResponse.json({ 
      error: "Internal server error",
      details: err.message 
    }, { status: 500 });
  }
}