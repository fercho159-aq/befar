import { sql } from "@/lib/db";
import { localizeImages } from "@/lib/images";
import GalleryGrid from "@/components/ui/GalleryGrid";

export const revalidate = 3600;

async function getAllProducts() {
  const products = await sql`
    SELECT p.*,
      (SELECT MIN(v.price) FROM variants v WHERE v.product_id = p.id AND v.price > 0) as min_price,
      (SELECT MAX(v.price) FROM variants v WHERE v.product_id = p.id) as max_price,
      (SELECT json_agg(
        json_build_object('id', pi.id, 'src', pi.src, 'position', pi.position, 'alt_text', pi.alt_text)
        ORDER BY pi.position
      ) FROM product_images pi WHERE pi.product_id = p.id) as images
    FROM products p
    WHERE p.status = 'active' AND p.published = true
    ORDER BY p.title
  `;
  return products.map((p: any) => ({
    ...p,
    images: localizeImages(p.handle, p.images),
  }));
}

async function getAllTags() {
  const result = await sql`
    SELECT DISTINCT unnest(tags) as tag
    FROM products
    WHERE status = 'active' AND published = true
    ORDER BY tag
  `;
  return result.map((r: any) => r.tag);
}

export default async function GalleryPage() {
  const [products, tags] = await Promise.all([getAllProducts(), getAllTags()]);

  return <GalleryGrid products={products as any} tags={tags} />;
}
