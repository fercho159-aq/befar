export interface Product {
  id: number;
  handle: string;
  title: string;
  body_html: string;
  vendor: string;
  product_category: string;
  product_type: string;
  tags: string[];
  published: boolean;
  seo_title: string;
  seo_description: string;
  status: string;
  aspect_ratio: string | null;
  location: string | null;
  certification: string;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: number;
  product_id: number;
  sku: string;
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  option3_name: string | null;
  option3_value: string | null;
  price: number;
  compare_at_price: number | null;
  grams: number;
  inventory_qty: number;
  requires_shipping: boolean;
  variant_image: string | null;
  weight_unit: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  src: string;
  position: number;
  alt_text: string;
}

export interface ProductWithDetails extends Product {
  variants: Variant[];
  images: ProductImage[];
  min_price: number;
  max_price: number;
}

export interface CartItem {
  product: Product;
  variant: Variant;
  image: string;
  quantity: number;
}

export type WallTexture = "white-plaster" | "brick" | "concrete" | "wood";
export type FrameType = "none" | "black-matte" | "natural-wood";

export interface VisualizerState {
  wallTexture: WallTexture;
  frameType: FrameType;
  artworkSize: { width: number; height: number };
}
