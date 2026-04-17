import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return Response.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Verify token
    const { data: session, error } = await supabase
      .from("auth_sessions")
      .select("*, users(*)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      return Response.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return Response.json(
      {
        authenticated: true,
        user: {
          id: session.users.id,
          username: session.users.username,
          name: session.users.name,
          role: session.users.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
