import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_u5jsyOXUK9tA@ep-shiny-unit-air24p4d-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function setup() {
  console.log("Dropping existing tables...");
  await sql`DROP TABLE IF EXISTS product_images CASCADE`;
  await sql`DROP TABLE IF EXISTS variants CASCADE`;
  await sql`DROP TABLE IF EXISTS products CASCADE`;

  console.log("Creating products table...");
  await sql`
    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      handle VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      body_html TEXT,
      vendor VARCHAR(255),
      product_category VARCHAR(255),
      product_type VARCHAR(255),
      tags TEXT[],
      published BOOLEAN DEFAULT true,
      seo_title VARCHAR(500),
      seo_description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      aspect_ratio VARCHAR(10),
      location VARCHAR(255),
      certification VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log("Creating variants table...");
  await sql`
    CREATE TABLE variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      sku VARCHAR(255) UNIQUE,
      option1_name VARCHAR(255),
      option1_value VARCHAR(255),
      option2_name VARCHAR(255),
      option2_value VARCHAR(255),
      option3_name VARCHAR(255),
      option3_value VARCHAR(255),
      price DECIMAL(10,2),
      compare_at_price DECIMAL(10,2),
      grams INTEGER DEFAULT 0,
      inventory_qty INTEGER DEFAULT 0,
      requires_shipping BOOLEAN DEFAULT true,
      variant_image VARCHAR(1000),
      weight_unit VARCHAR(10) DEFAULT 'g',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log("Creating product_images table...");
  await sql`
    CREATE TABLE product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      src VARCHAR(1000) NOT NULL,
      position INTEGER DEFAULT 1,
      alt_text VARCHAR(500)
    )
  `;

  console.log("Creating indexes...");
  await sql`CREATE INDEX idx_variants_product_id ON variants(product_id)`;
  await sql`CREATE INDEX idx_product_images_product_id ON product_images(product_id)`;
  await sql`CREATE INDEX idx_products_handle ON products(handle)`;
  await sql`CREATE INDEX idx_products_status ON products(status)`;
  await sql`CREATE INDEX idx_products_tags ON products USING GIN(tags)`;

  console.log("Database setup complete!");
}

setup().catch(console.error);
