import { sql } from "@/lib/db";
import { localizeImages } from "@/lib/images";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let products;

    if (tag) {
      products = await sql`
        SELECT p.*,
          (SELECT MIN(v.price) FROM variants v WHERE v.product_id = p.id AND v.price > 0) as min_price,
          (SELECT MAX(v.price) FROM variants v WHERE v.product_id = p.id) as max_price,
          (SELECT json_agg(json_build_object('id', pi.id, 'src', pi.src, 'position', pi.position, 'alt_text', pi.alt_text) ORDER BY pi.position)
           FROM product_images pi WHERE pi.product_id = p.id) as images
        FROM products p
        WHERE p.status = 'active' AND p.published = true AND ${tag} = ANY(p.tags)
        ORDER BY p.id
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      products = await sql`
        SELECT p.*,
          (SELECT MIN(v.price) FROM variants v WHERE v.product_id = p.id AND v.price > 0) as min_price,
          (SELECT MAX(v.price) FROM variants v WHERE v.product_id = p.id) as max_price,
          (SELECT json_agg(json_build_object('id', pi.id, 'src', pi.src, 'position', pi.position, 'alt_text', pi.alt_text) ORDER BY pi.position)
           FROM product_images pi WHERE pi.product_id = p.id) as images
        FROM products p
        WHERE p.status = 'active' AND p.published = true
        ORDER BY p.id
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const localized = products.map((p: any) => ({
      ...p,
      images: localizeImages(p.handle, p.images),
    }));

    return NextResponse.json(localized);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
