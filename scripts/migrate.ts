import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const sql = neon(url);
  const file = readFileSync(new URL("../drizzle/0000_init.sql", import.meta.url), "utf8");
  const statements = file
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`Applied ${statements.length} statements`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
