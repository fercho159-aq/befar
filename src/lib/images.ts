/**
 * Maps a product's database images to local file paths.
 * Images are stored in /public/products/{handle}.{ext} (primary)
 * and /public/products/{handle}-{position}.{ext} (secondary).
 */
export function getLocalImagePath(handle: string, position: number, originalSrc: string): string {
  const ext = originalSrc.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
  if (position === 1) {
    return `/products/${handle}.${ext}`;
  }
  return `/products/${handle}-${position}.${ext}`;
}

/**
 * Transform a product's images array to use local paths
 */
export function localizeImages(
  handle: string,
  images: { id: number; src: string; position: number; alt_text: string }[] | null
): { id: number; src: string; position: number; alt_text: string }[] {
  if (!images) return [];
  return images.map((img) => ({
    ...img,
    src: getLocalImagePath(handle, img.position, img.src),
  }));
}
