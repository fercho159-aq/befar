"use client";

import dynamic from "next/dynamic";
import type { ProductWithDetails } from "@/types/product";

const GalleryScene = dynamic(() => import("@/components/3d/GalleryScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <span className="text-3xl font-light tracking-[0.4em] text-white/80 uppercase">
          EMILIO EBEHAR
        </span>
        <div className="h-px bg-white/20 mt-6 mx-auto w-48 animate-pulse" />
        <p className="text-xs text-white/30 tracking-[0.2em] mt-4 uppercase">
          Cargando galería
        </p>
      </div>
    </div>
  ),
});

export default function GalleryCanvas({
  products,
}: {
  products: ProductWithDetails[];
}) {
  return <GalleryScene products={products} />;
}
