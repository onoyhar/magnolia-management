import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const { id, data } = await request.json();

  if (!id || !data || typeof data !== 'object') {
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

    // Extract year from data (id is warga_id)
    const year = data.tahun || new Date().getFullYear();
    
    // Build update object - only include month fields
    const updateData = {};
    const validFields = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
    
    validFields.forEach(field => {
      if (field in data) {
        updateData[field] = data[field];
      }
    });

    // Update pembayaran_ipl using service role key (bypasses RLS)
    const { data: result, error } = await supabase
      .from("pembayaran_ipl")
      .update(updateData)
      .eq("warga_id", id)
      .eq("tahun", parseInt(year))
      .select();

    if (error) {
      throw new Error(error.message || "Failed to update pembayaran");
    }

    return Response.json({
      success: true,
      message: "Data berhasil diupdate",
      data: result,
    });
  } catch (error) {
    console.error("Error updating pembayaran:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
