import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hash password dengan bcrypt
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function setupDefaultAdmin() {
  try {
    console.log("Setting up default admin user...");

    const username = "admin";
    const password = "clustermagnoliaburaden2025";
    const passwordHash = await hashPassword(password);

    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    // Insert default admin user
    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          username: username,
          password_hash: passwordHash,
          name: "Administrator",
          role: "admin",
          is_active: true,
        },
      ])
      .select();

    if (insertError) throw insertError;

    console.log("✅ Default admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: clustermagnoliaburaden2025");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up admin user:", error.message);
    process.exit(1);
  }
}

setupDefaultAdmin();
