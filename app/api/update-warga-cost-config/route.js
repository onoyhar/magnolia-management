import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const { wargaId, tahun, costConfigs } = await request.json();

  if (!wargaId || !tahun || !costConfigs || !Array.isArray(costConfigs)) {
    return Response.json(
      { error: "Missing or invalid parameters" },
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

    // First, delete existing configs for this warga+tahun
    const { error: deleteError } = await supabase
      .from("warga_cost_config")
      .delete()
      .eq("warga_id", wargaId)
      .eq("tahun", tahun);

    if (deleteError) {
      throw new Error(deleteError.message || "Failed to delete existing configs");
    }

    // Insert new configs
    const configsToInsert = costConfigs.map(config => ({
      warga_id: wargaId,
      tahun: tahun,
      start_month: config.start_month,
      has_ipl: config.has_ipl,
      has_sampah: config.has_sampah,
      property_type: config.property_type || 'rumah',
    }));

    const { data, error } = await supabase
      .from("warga_cost_config")
      .insert(configsToInsert)
      .select();

    if (error) {
      throw new Error(error.message || "Failed to save cost configs");
    }

    return Response.json({
      success: true,
      count: data?.length || configsToInsert.length,
      message: "Cost configuration saved successfully",
    });
  } catch (error) {
    console.error("Error updating warga cost config:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
