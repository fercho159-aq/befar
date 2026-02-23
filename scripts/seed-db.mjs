import { neon } from "@neondatabase/serverless";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  "postgresql://neondb_owner:npg_u5jsyOXUK9tA@ep-shiny-unit-air24p4d-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

function extractLocationFromHtml(html) {
  if (!html) return null;
  const match = html.match(/<strong[^>]*>Lugar:<\/strong>\s*(.*?)(?:<br|<\/p)/i);
  if (match) {
    return match[1].replace(/<[^>]+>/g, "").trim();
  }
  return null;
}

function extractAspectRatioFromTags(tags) {
  if (!tags) return null;
  const ratios = ["3:2", "2:3", "16:9", "1:1", "4:3", "3:4"];
  for (const r of ratios) {
    if (tags.includes(r)) return r;
  }
  return null;
}

async function seed() {
  const csvPath = resolve(__dirname, "../../products_export_1.csv");
  console.log("Reading CSV from:", csvPath);

  const records = [];
  const parser = createReadStream(csvPath).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true })
  );

  for await (const record of parser) {
    records.push(record);
  }

  console.log(`Parsed ${records.length} rows from CSV`);

  // Group by handle
  const productMap = new Map();

  for (const row of records) {
    const handle = row["Handle"];
    if (!handle) continue;

    if (!productMap.has(handle)) {
      productMap.set(handle, { main: null, variants: [], images: [] });
    }

    const entry = productMap.get(handle);

    // First row for this handle has the product-level data
    if (row["Title"] && !entry.main) {
      const tags = row["Tags"]
        ? row["Tags"]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      entry.main = {
        handle,
        title: row["Title"],
        body_html: row["Body (HTML)"] || "",
        vendor: row["Vendor"] || "EBEHAR",
        product_category: row["Product Category"] || "",
        product_type: row["Type"] || "",
        tags,
        published: row["Published"] === "true",
        seo_title: row["SEO Title"] || "",
        seo_description: row["SEO Description"] || "",
        status: row["Status"] || "active",
        aspect_ratio: extractAspectRatioFromTags(row["Tags"]),
        location: extractLocationFromHtml(row["Body (HTML)"]),
        certification: "Original Certified EBEHAR",
      };
    }

    // Every row is a variant
    if (row["Variant SKU"]) {
      entry.variants.push({
        sku: row["Variant SKU"],
        option1_name: row["Option1 Name"] || null,
        option1_value: row["Option1 Value"] || null,
        option2_name: row["Option2 Name"] || null,
        option2_value: row["Option2 Value"] || null,
        option3_name: row["Option3 Name"] || null,
        option3_value: row["Option3 Value"] || null,
        price: parseFloat(row["Variant Price"]) || 0,
        compare_at_price: row["Variant Compare At Price"]
          ? parseFloat(row["Variant Compare At Price"])
          : null,
        grams: parseInt(row["Variant Grams"]) || 0,
        inventory_qty: parseInt(row["Variant Inventory Qty"]) || 0,
        requires_shipping: row["Variant Requires Shipping"] === "true",
        variant_image: row["Variant Image"] || null,
        weight_unit: row["Variant Weight Unit"] || "g",
      });
    }

    // Collect images (deduplicate by src)
    if (row["Image Src"]) {
      const existing = entry.images.find((i) => i.src === row["Image Src"]);
      if (!existing) {
        entry.images.push({
          src: row["Image Src"],
          position: parseInt(row["Image Position"]) || 1,
          alt_text: row["Image Alt Text"] || "",
        });
      }
    }
  }

  console.log(`Found ${productMap.size} unique products`);

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;

  for (const [handle, data] of productMap) {
    if (!data.main) {
      console.warn(`Skipping ${handle} - no main product data`);
      continue;
    }

    const p = data.main;

    try {
      // Insert product
      const result = await sql`
        INSERT INTO products (handle, title, body_html, vendor, product_category, product_type, tags, published, seo_title, seo_description, status, aspect_ratio, location, certification)
        VALUES (${p.handle}, ${p.title}, ${p.body_html}, ${p.vendor}, ${p.product_category}, ${p.product_type}, ${p.tags}, ${p.published}, ${p.seo_title}, ${p.seo_description}, ${p.status}, ${p.aspect_ratio}, ${p.location}, ${p.certification})
        ON CONFLICT (handle) DO UPDATE SET title = EXCLUDED.title
        RETURNING id
      `;

      const productId = result[0].id;
      productCount++;

      // Insert variants
      for (const v of data.variants) {
        await sql`
          INSERT INTO variants (product_id, sku, option1_name, option1_value, option2_name, option2_value, option3_name, option3_value, price, compare_at_price, grams, inventory_qty, requires_shipping, variant_image, weight_unit)
          VALUES (${productId}, ${v.sku}, ${v.option1_name}, ${v.option1_value}, ${v.option2_name}, ${v.option2_value}, ${v.option3_name}, ${v.option3_value}, ${v.price}, ${v.compare_at_price}, ${v.grams}, ${v.inventory_qty}, ${v.requires_shipping}, ${v.variant_image}, ${v.weight_unit})
          ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
        `;
        variantCount++;
      }

      // Insert images
      for (const img of data.images) {
        await sql`
          INSERT INTO product_images (product_id, src, position, alt_text)
          VALUES (${productId}, ${img.src}, ${img.position}, ${img.alt_text})
        `;
        imageCount++;
      }

      if (productCount % 10 === 0) {
        console.log(`  Inserted ${productCount} products...`);
      }
    } catch (err) {
      console.error(`Error inserting ${handle}:`, err.message);
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`  Products: ${productCount}`);
  console.log(`  Variants: ${variantCount}`);
  console.log(`  Images: ${imageCount}`);
}

seed().catch(console.error);
