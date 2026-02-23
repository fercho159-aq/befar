import { neon } from "@neondatabase/serverless";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL =
  "postgresql://neondb_owner:npg_u5jsyOXUK9tA@ep-shiny-unit-air24p4d-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);
const outDir = resolve(__dirname, "../public/products");

async function downloadImage(url, filepath) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    return true;
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  // Get first image per product
  const rows = await sql`
    SELECT DISTINCT ON (p.handle)
      p.handle,
      pi.src
    FROM products p
    JOIN product_images pi ON pi.product_id = p.id
    WHERE p.status = 'active' AND p.published = true
    ORDER BY p.handle, pi.position ASC
  `;

  console.log(`Downloading ${rows.length} product images...`);

  let ok = 0, fail = 0;

  // Download in batches of 5 for speed
  for (let i = 0; i < rows.length; i += 5) {
    const batch = rows.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (row) => {
        const ext = row.src.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
        const filename = `${row.handle}.${ext}`;
        const filepath = resolve(outDir, filename);

        if (existsSync(filepath)) {
          console.log(`  SKIP (exists): ${row.handle}`);
          return true;
        }

        console.log(`  Downloading: ${row.handle}...`);
        return downloadImage(row.src, filepath);
      })
    );
    results.forEach((r) => (r ? ok++ : fail++));
  }

  console.log(`\nDone! ${ok} downloaded, ${fail} failed.`);

  // Also download secondary images (positions 2-4) for product detail pages
  console.log("\nDownloading secondary images...");
  const secondaryRows = await sql`
    SELECT p.handle, pi.src, pi.position
    FROM products p
    JOIN product_images pi ON pi.product_id = p.id
    WHERE p.status = 'active' AND p.published = true AND pi.position > 1
    ORDER BY p.handle, pi.position ASC
  `;

  let ok2 = 0, fail2 = 0;
  for (let i = 0; i < secondaryRows.length; i += 5) {
    const batch = secondaryRows.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (row) => {
        const ext = row.src.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
        const filename = `${row.handle}-${row.position}.${ext}`;
        const filepath = resolve(outDir, filename);

        if (existsSync(filepath)) return true;

        console.log(`  Downloading: ${filename}...`);
        return downloadImage(row.src, filepath);
      })
    );
    results.forEach((r) => (r ? ok2++ : fail2++));
  }

  console.log(`\nSecondary: ${ok2} downloaded, ${fail2} failed.`);
}

main().catch(console.error);
