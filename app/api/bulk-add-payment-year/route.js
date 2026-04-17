import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return Response.json(
        { error: "records array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Insert all payment records
    const { error } = await supabase
      .from("pembayaran_ipl")
      .insert(records);

    if (error) {
      return Response.json(
        { error: `Failed to insert records: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      count: records.length,
    });
  } catch (error) {
    return Response.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
