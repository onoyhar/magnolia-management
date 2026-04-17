import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const { records } = await request.json();

    if (!records || records.length === 0) {
      return Response.json({ error: "No records to insert" }, { status: 400 });
    }

    // Use Service Role Key for admin access (bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return Response.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("pembayaran_warga")
      .insert(records)
      .select();

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      count: data.length,
      message: `Successfully added ${data.length} records`,
    });
  } catch (error) {
    console.error("Bulk add year error:", error);
    return Response.json(
      { error: error.message || "Failed to add records" },
      { status: 500 }
    );
  }
}
