import { sql } from "@/lib/db";
import { localizeImages } from "@/lib/images";
import GalleryCanvas from "@/components/3d/GalleryCanvas";

export const revalidate = 3600;

async function getFeaturedProducts() {
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
    ORDER BY p.id
    LIMIT 20
  `;
  return products.map((p: any) => ({
    ...p,
    images: localizeImages(p.handle, p.images),
  }));
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div className="relative">
      <GalleryCanvas products={products as any} />
    </div>
  );
}
