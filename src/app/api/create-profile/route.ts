import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId, role, employerType, country } = await req.json();

    if (!userId || !role || !country) {
      return NextResponse.json(
        { error: "Missing required fields: userId, role, or country" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Fetch profile error:", fetchError);
      return NextResponse.json({ error: "Database error checking profile" }, { status: 500 });
    }

    const profileData: any = {
      role,
      country,
      updated_at: new Date().toISOString()
    };

    if (role === "employer") {
      profileData.employer_type = employerType || null;
    }

    let error;

    if (existingProfile) {
      // Update existing profile
      ({ error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId));
    } else {
      // Create new profile
      ({ error } = await supabase
        .from("profiles")
        .insert({ 
          id: userId, 
          ...profileData,
          created_at: new Date().toISOString()
        }));
    }

    if (error) {
      console.error("❌ Profile save error:", error);
      return NextResponse.json({ error: "Database error saving profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 API Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}