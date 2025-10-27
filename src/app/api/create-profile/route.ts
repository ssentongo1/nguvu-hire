import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, role, employerType } = await request.json();

    // Debug logs for visibility
    console.log("➡️ Incoming create-profile request:", {
      userId,
      role,
      employerType,
    });

    // Step 1: Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Fetch profile error:", fetchError);
      return NextResponse.json({ error: "Database error checking profile" }, { status: 400 });
    }

    const profileData: any = {
      role: role || "job_seeker",
    };

    if (role === "employer") {
      profileData.employer_type = employerType || null;
    }

    let error;

    if (existingProfile) {
      console.log("🔄 Updating existing profile for:", userId);
      ({ error } = await supabaseServer
        .from("profiles")
        .update(profileData)
        .eq("id", userId));
    } else {
      console.log("🆕 Creating new profile for:", userId);
      ({ error } = await supabaseServer.from("profiles").insert({
        id: userId,
        ...profileData,
      }));
    }

    if (error) {
      console.error("❌ Profile Save Error:", error);
      return NextResponse.json({ error: "Database error saving user profile" }, { status: 400 });
    }

    console.log("✅ Profile saved successfully for:", userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 API Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}