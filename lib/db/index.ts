import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { requireDatabaseUrl } from "@/lib/env";
import * as schema from "@/lib/db/schema";

export function getDb() {
  const sql = neon(requireDatabaseUrl());
  return drizzle({ client: sql, schema });
}

export type Database = ReturnType<typeof getDb>;
