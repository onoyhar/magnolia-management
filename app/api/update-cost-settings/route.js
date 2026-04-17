import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const { settings } = await request.json();

  if (!settings || typeof settings !== 'object') {
    return Response.json(
      { error: "Invalid settings object" },
      { status: 400 }
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Update each setting
    const updates = Object.entries(settings).map(([key, amount]) => ({
      setting_key: key,
      amount: parseInt(amount),
    }));

    // Use upsert to insert or update
    const { error, data } = await supabase
      .from("ipl_settings")
      .upsert(updates, { onConflict: "setting_key" })
      .select();

    if (error) {
      throw new Error(error.message || "Failed to update settings");
    }

    return Response.json({
      success: true,
      count: data?.length || updates.length,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating cost settings:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
