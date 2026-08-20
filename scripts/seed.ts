import { config } from "dotenv";
import { ensureDemoSeed } from "../lib/db/queries";

config({ path: ".env.local" });
config();

async function main() {
  const result = await ensureDemoSeed();
  console.log("Seeded demo pack", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
