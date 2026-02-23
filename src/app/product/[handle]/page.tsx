import { sql } from "@/lib/db";
import { localizeImages } from "@/lib/images";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ui/ProductDetail";
import type { Metadata } from "next";

export const revalidate = 3600;

async function getProduct(handle: string) {
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

  if (products.length === 0) return null;
  const p = products[0] as any;
  p.images = localizeImages(p.handle, p.images);
  return p;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.title} | EBEHAR`,
    description:
      product.seo_description ||
      `${product.title} - Fotografía original certificada EBEHAR`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) notFound();

  return <ProductDetail product={product as any} />;
}
