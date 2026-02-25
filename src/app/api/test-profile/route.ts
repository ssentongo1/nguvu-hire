import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId, role, employerType, country } = await req.json();
    
    console.log("📝 Test - Creating profile for:", { userId, role, country });

    // Try simple insert first
    const { data, error } = await supabase
      .from("profiles")
      .insert({ 
        id: userId, 
        role: role,
        country: country || "Unknown",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("❌ Test - Insert failed:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log("✅ Test - Profile created:", data);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("🔥 Test - Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}