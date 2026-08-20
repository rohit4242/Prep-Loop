import { config } from "dotenv";
import { ensureRetorioSeed } from "../lib/db/queries";

config({ path: ".env.local" });
config();

async function main() {
  const result = await ensureRetorioSeed();
  console.log("Seeded Retorio pack", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
