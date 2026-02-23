import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  try {
    const products = await sql`
      SELECT p.*,
        (SELECT MIN(v.price) FROM variants v WHERE v.product_id = p.id AND v.price > 0) as min_price,
        (SELECT MAX(v.price) FROM variants v WHERE v.product_id = p.id) as max_price,
        (SELECT json_agg(
          json_build_object(
            'id', v.id, 'sku', v.sku,
            'option1_name', v.option1_name, 'option1_value', v.option1_value,
            'option2_name', v.option2_name, 'option2_value', v.option2_value,
            'option3_name', v.option3_name, 'option3_value', v.option3_value,
            'price', v.price, 'compare_at_price', v.compare_at_price,
            'inventory_qty', v.inventory_qty, 'variant_image', v.variant_image
          )
        ) FROM variants v WHERE v.product_id = p.id) as variants,
        (SELECT json_agg(
          json_build_object('id', pi.id, 'src', pi.src, 'position', pi.position, 'alt_text', pi.alt_text)
          ORDER BY pi.position
        ) FROM product_images pi WHERE pi.product_id = p.id) as images
      FROM products p
      WHERE p.handle = ${handle}
    `;

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(products[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
