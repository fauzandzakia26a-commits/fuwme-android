"use strict";

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseApiKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseApiKey) {
  throw new Error("SUPABASE_URL and SUPABASE_API_KEY must be configured in the server environment.");
}

const supabase = createClient(supabaseUrl, supabaseApiKey);

async function testConnection(tableName = process.env.SUPABASE_TABLE) {
  if (!tableName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error("Set SUPABASE_TABLE to the name of an existing Supabase table.");
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase connection error:", error.message);
    throw error;
  }

  console.log("Connected to Supabase. Sample rows:", data);
  return data;
}

if (require.main === module) {
  testConnection().catch((error) => {
    console.error("Supabase connection check failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = supabase;
module.exports.testConnection = testConnection;
