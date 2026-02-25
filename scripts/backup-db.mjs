import { neon } from "@neondatabase/serverless";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  "postgresql://neondb_owner:npg_u5jsyOXUK9tA@ep-shiny-unit-air24p4d-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function backup() {
  console.log("Backing up database...");

  const products = await sql`SELECT * FROM products ORDER BY id`;
  console.log(`  Products: ${products.length}`);

  const variants = await sql`SELECT * FROM variants ORDER BY id`;
  console.log(`  Variants: ${variants.length}`);

  const images = await sql`SELECT * FROM product_images ORDER BY id`;
  console.log(`  Images: ${images.length}`);

  const data = { products, variants, images, backed_up_at: new Date().toISOString() };

  const outPath = resolve(__dirname, "backup-2025-02-25.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`\nBackup saved to: ${outPath}`);
}

backup().catch(console.error);
