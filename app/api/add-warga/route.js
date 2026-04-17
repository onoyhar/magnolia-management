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
    let { no, nama, blok, no_hp, property_type, years } = body;

    if (!nama || !blok || !years || years.length === 0) {
      return Response.json(
        { error: "nama, blok, and years are required" },
        { status: 400 }
      );
    }

    // Always auto-generate no for new warga (ignore provided value)
    const { data: maxNoData, error: maxError } = await supabase
      .from("data_warga")
      .select("no", { count: 'exact' })
      .order("no", { ascending: false })
      .limit(1);

    if (maxError && maxError.code !== 'PGRST116') {
      return Response.json(
        { error: `Failed to get max no: ${maxError.message}` },
        { status: 500 }
      );
    }

    no = (maxNoData && maxNoData.length > 0 && maxNoData[0]?.no) 
      ? parseInt(maxNoData[0].no) + 1 
      : 1;

    // 1. Insert into data_warga
    const { data: wargaData, error: wargaError } = await supabase
      .from("data_warga")
      .insert({
        no,
        nama,
        blok,
        no_hp: no_hp || null,
        property_type: property_type || null,
      })
      .select("id")
      .single();

    if (wargaError) {
      return Response.json(
        { error: `Failed to insert warga: ${wargaError.message}` },
        { status: 500 }
      );
    }

    const wargaId = wargaData.id;

    // 2. Insert into pembayaran_ipl for each year
    const pembayaranRecords = years.map((year) => ({
      warga_id: wargaId,
      tahun: year,
      jan: "N/A",
      feb: "N/A",
      mar: "N/A",
      apr: "N/A",
      mei: "N/A",
      jun: "N/A",
      jul: "N/A",
      agt: "N/A",
      sep: "N/A",
      okt: "N/A",
      nov: "N/A",
      des: "N/A",
    }));

    const { error: pembayaranError } = await supabase
      .from("pembayaran_ipl")
      .insert(pembayaranRecords);

    if (pembayaranError) {
      return Response.json(
        { error: `Failed to insert pembayaran: ${pembayaranError.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      warga_id: wargaId,
      count: years.length,
    });
  } catch (error) {
    return Response.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
