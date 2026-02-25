import { neon } from "@neondatabase/serverless";
import { createReadStream, existsSync, copyFileSync, mkdirSync, readdirSync } from "fs";
import { parse } from "csv-parse";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  "postgresql://neondb_owner:npg_u5jsyOXUK9tA@ep-shiny-unit-air24p4d-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

// --- Pricing ---
const DI_BOND_PRICE_PER_CM2 = 1.80;
const CHROMALUXE_PRICE_PER_CM2 = 2.16;

// --- Size tables per format ---
const FORMAT_SIZES = {
  "1:1": [[30, 30], [60, 60], [90, 90]],
  "2:3": [[30, 45], [60, 90], [90, 135]],
  "3:2": [[45, 30], [90, 60], [135, 90]],
  "2:1": [[60, 30], [120, 60], [180, 90]],
  "1:2": [[30, 60], [60, 120], [90, 180]],
  "3:1": [[90, 30], [180, 60], null],
  "1:3": [[30, 90], [60, 180], null],
  "4:1": [[120, 30], null, null],
};

// --- Slugify ---
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// --- Levenshtein distance for fuzzy matching ---
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

// --- Image resolution (gallery-new ONLY) ---
const projectRoot = resolve(__dirname, "..");
const galleryNewDir = resolve(projectRoot, "public/gallery-new");
const productsDir = resolve(projectRoot, "public/products");

// Pre-load gallery-new file list for fuzzy matching
const galleryNewFiles = readdirSync(galleryNewDir).filter(f => f.endsWith(".jpg")).map(f => f.replace(".jpg", ""));

function fileSlug(filename) {
  return filename
    .replace(/\.(dng|tif|tiff|jpg|jpeg|png|cr2|psd|raw)$/i, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function findImageInGalleryNew(filename) {
  if (!filename) return null;
  const slug = fileSlug(filename);

  // 1. Exact match
  if (galleryNewFiles.includes(slug)) {
    return slug;
  }

  // 2. Contains match (one starts with the other)
  const contains = galleryNewFiles.find(f => slug.startsWith(f) || f.startsWith(slug));
  if (contains) {
    return contains;
  }

  // 3. Levenshtein fuzzy match
  let best = null, bestDist = Infinity;
  for (const gf of galleryNewFiles) {
    const d = levenshtein(slug, gf);
    if (d < bestDist) { bestDist = d; best = gf; }
  }
  const threshold = Math.max(Math.floor(slug.length * 0.3), 2);
  if (bestDist <= threshold) {
    return best;
  }

  return null;
}

async function seed() {
  const csvPath = "/Users/fernandotrejo/Downloads/emilio - Hoja 1.csv";
  console.log("Reading CSV from:", csvPath);

  const records = [];
  const parser = createReadStream(csvPath).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true })
  );

  for await (const record of parser) {
    records.push(record);
  }

  console.log(`Parsed ${records.length} rows from CSV`);

  mkdirSync(productsDir, { recursive: true });

  const handleCounts = new Map();

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let imagesCopied = 0;
  let deactivated = 0;

  for (const row of records) {
    const nombre = (row["Nombre de la obra *"] || "").trim();
    if (!nombre) continue;

    // Generate unique handle
    let baseHandle = slugify(nombre);
    if (!baseHandle) baseHandle = `producto-${records.indexOf(row) + 1}`;

    const count = handleCounts.get(baseHandle) || 0;
    handleCounts.set(baseHandle, count + 1);
    const handle = count > 0 ? `${baseHandle}-${count + 1}` : baseHandle;

    // Extract fields
    const description = (row["Descripción *"] || "").trim();
    const category = (row["Categoría *"] || "").trim();
    const formato = (row["Formato (relación) *"] || "").trim();
    const anchoX = parseInt(row["Ancho X (cm) *"]) || 0;
    const altoY = parseInt(row["Alto Y (cm) *"]) || 0;
    const archivo = (row["Nombre del archivo *"] || "").trim();
    const stock = parseInt(row["Stock *"]) || 5;

    // Parse tags + add category
    const rawTags = (row["Tags / Palabras clave"] || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tags = [...new Set([...rawTags, category])].filter(Boolean);

    const aspect_ratio = formato || null;

    // Check if image exists in gallery-new
    const matchedFile = findImageInGalleryNew(archivo);
    const hasImage = !!matchedFile;

    try {
      const result = await sql`
        INSERT INTO products (
          handle, title, body_html, vendor, product_category, product_type,
          tags, published, seo_title, seo_description, status,
          aspect_ratio, width_cm, height_cm, location, certification
        )
        VALUES (
          ${handle}, ${nombre}, ${description}, ${"EBEHAR"}, ${category}, ${"Fotografía"},
          ${tags}, ${hasImage}, ${nombre}, ${description}, ${hasImage ? "active" : "draft"},
          ${aspect_ratio}, ${anchoX}, ${altoY}, ${null}, ${"Original Certified EBEHAR"}
        )
        RETURNING id
      `;

      const productId = result[0].id;
      productCount++;
      if (!hasImage) deactivated++;

      // --- Generate variants ---
      const sizes = FORMAT_SIZES[formato];
      if (sizes) {
        for (const size of sizes) {
          if (!size) continue;
          const [w, h] = size;

          const materials = [
            { name: "Di bond Aluminio", code: "DB", pricePerCm2: DI_BOND_PRICE_PER_CM2 },
            { name: "Chromaluxe Brilloso", code: "CH", pricePerCm2: CHROMALUXE_PRICE_PER_CM2 },
          ];

          for (const mat of materials) {
            const price = w * h * mat.pricePerCm2;
            const sku = `${handle}-${mat.code}-${w}x${h}`;
            const sizeLabel = `${w}\u00d7${h} cm`;

            await sql`
              INSERT INTO variants (
                product_id, sku,
                option1_name, option1_value,
                option2_name, option2_value,
                option3_name, option3_value,
                price, inventory_qty, requires_shipping
              )
              VALUES (
                ${productId}, ${sku},
                ${"Tipo de Producto"}, ${"Arte Impreso"},
                ${"Material"}, ${mat.name},
                ${"Tamaño"}, ${sizeLabel},
                ${price}, ${stock}, ${true}
              )
            `;
            variantCount++;
          }
        }
      }

      // --- Copy image from gallery-new ---
      if (matchedFile) {
        const srcPath = resolve(galleryNewDir, `${matchedFile}.jpg`);
        const destFilename = `${handle}.jpg`;
        const destPath = resolve(productsDir, destFilename);
        const imageSrc = `/products/${destFilename}`;

        if (!existsSync(destPath)) {
          copyFileSync(srcPath, destPath);
          imagesCopied++;
        }

        await sql`
          INSERT INTO product_images (product_id, src, position, alt_text)
          VALUES (${productId}, ${imageSrc}, ${1}, ${nombre})
        `;
        imageCount++;
      }

      if (productCount % 50 === 0) {
        console.log(`  Inserted ${productCount} products, ${variantCount} variants...`);
      }
    } catch (err) {
      console.error(`Error inserting "${nombre}" (${handle}):`, err.message);
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`  Products: ${productCount} (${productCount - deactivated} active, ${deactivated} draft)`);
  console.log(`  Variants: ${variantCount}`);
  console.log(`  Images: ${imageCount} (${imagesCopied} copied from gallery-new)`);
}

seed().catch(console.error);
