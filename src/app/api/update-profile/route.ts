import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId, role, employerType } = await request.json();

    const profileData = {
      id: userId,
      first_name: "",
      last_name: "",
      phone_number: "",
      country: "",
      role: role || "job_seeker",
      employer_type: role === "employer" ? employerType || "" : null,
      age: null,
      bio: "",
      skills: "",
      company_name: "",
      company_description: "",
      profile_picture: "",
    };

    const { error } = await supabase.from("profiles").insert(profileData);

    if (error) {
      console.error("Profile Insert Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}