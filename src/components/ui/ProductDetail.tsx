"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";
import type { ProductWithDetails, Variant } from "@/types/product";

const WallVisualizer = dynamic(() => import("@/components/3d/WallVisualizer"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "60vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="w-8 h-8 border border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
        <p className="font-body" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 12, letterSpacing: "0.1em" }}>Cargando visualizador 3D</p>
      </div>
    </div>
  ),
});

export default function ProductDetail({ product }: { product: ProductWithDetails }) {
  const { addToCart } = useStore();
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const printVariants = useMemo(() => (product.variants || []).filter((v: Variant) => v.option1_value === "Arte Impreso"), [product.variants]);
  const tshirtVariants = useMemo(() => (product.variants || []).filter((v: Variant) => v.option1_value === "T-shirt"), [product.variants]);

  const materials = useMemo(() => {
    const mats = new Set(printVariants.map((v: Variant) => v.option2_value).filter(Boolean));
    return Array.from(mats);
  }, [printVariants]);

  const sizes = useMemo(() => {
    const s = new Set(printVariants.map((v: Variant) => v.option3_value).filter(Boolean));
    return Array.from(s);
  }, [printVariants]);

  const [selectedMaterial, setSelectedMaterial] = useState<string>(materials[0] || "");
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");
  const [selectedTab, setSelectedTab] = useState<"print" | "tshirt">("print");

  const currentVariant = useMemo(() => {
    if (selectedTab === "tshirt") return tshirtVariants[0];
    return printVariants.find((v: Variant) => v.option2_value === selectedMaterial && v.option3_value === selectedSize);
  }, [selectedTab, selectedMaterial, selectedSize, printVariants, tshirtVariants]);

  const images = product.images || [];
  const activeImage = images[activeImageIndex]?.src;

  const handleAddToCart = () => {
    if (!currentVariant) return;
    addToCart({ product, variant: currentVariant, image: activeImage || "", quantity: 1 });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const cleanDescription = useMemo(() => {
    if (!product.body_html) return "";
    return product.body_html
      .replace(/<h3>.*?<\/h3>/gi, "")
      .replace(/<strong>Opciones de[\s\S]*$/gi, "")
      .replace(/<meta[^>]*>/gi, "")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br[^>]*>/gi, "\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/data-\w+="[^"]*"/g, "")
      .trim();
  }, [product.body_html]);

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingTop: 56 }}>
      {/* Main section */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 0 }}>
        {/* Image */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "sticky", top: 56 }}>
            <div style={{ position: "relative", background: "#0a0a0a", overflow: "hidden", width: "100%", height: "calc(100dvh - 56px)" }}>
                {activeImage ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ position: "absolute", inset: "clamp(16px, 3vw, 48px)" }}
                    >
                      <Image src={activeImage} alt={product.title} fill style={{ objectFit: "contain" }} sizes="(max-width: 1024px) 100vw, 50vw" priority />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.15)" }}>Sin imagen</span>
                  </div>
                )}

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
                    {images.map((img: any, i: number) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageIndex(i)}
                        style={{
                          width: 44,
                          height: 44,
                          position: "relative",
                          overflow: "hidden",
                          border: i === activeImageIndex ? "2px solid rgba(255,255,255,0.5)" : "2px solid rgba(255,255,255,0.08)",
                          background: "none",
                          cursor: "pointer",
                          padding: 0,
                          transition: "border-color 0.3s",
                        }}
                      >
                        <Image src={img.src} alt="" fill style={{ objectFit: "cover" }} sizes="44px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Product info */}
        <div style={{ padding: "clamp(20px, 4vw, 48px) clamp(20px, 4vw, 64px)" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Location */}
            {product.location && (
              <p className="font-body" style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>
                {product.location}
              </p>
            )}

            {/* Title */}
            <h1 className="font-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 300, letterSpacing: "0.02em", color: "rgba(255,255,255,0.92)", margin: 0, lineHeight: 1.2 }}>
              {product.title}
            </h1>

            {/* Certification */}
            <p className="font-body" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginTop: 8 }}>
              {product.certification}
            </p>

            {/* Price */}
            {currentVariant && (
              <motion.p key={currentVariant.sku} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display" style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 300, color: "rgba(255,255,255,0.9)", marginTop: 20 }}>
                ${Number(currentVariant.price).toLocaleString("es-MX")}{" "}
                <span className="font-body" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>MXN</span>
              </motion.p>
            )}

            {/* Description */}
            {cleanDescription && (
              <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 }}>
                <p className="font-body" style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {cleanDescription}
                </p>
              </div>
            )}

            {/* Tabs */}
            <div style={{ marginTop: 24, display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setSelectedTab("print")}
                className="font-body"
                style={{
                  padding: "12px 20px",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  background: "none",
                  border: "none",
                  borderBottom: selectedTab === "print" ? "2px solid rgba(255,255,255,0.8)" : "2px solid transparent",
                  color: selectedTab === "print" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              >
                Arte Impreso
              </button>
              {tshirtVariants.length > 0 && (
                <button
                  onClick={() => setSelectedTab("tshirt")}
                  className="font-body"
                  style={{
                    padding: "12px 20px",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: "none",
                    border: "none",
                    borderBottom: selectedTab === "tshirt" ? "2px solid rgba(255,255,255,0.8)" : "2px solid transparent",
                    color: selectedTab === "tshirt" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  Textil
                </button>
              )}
            </div>

            {/* Print options */}
            {selectedTab === "print" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
                {materials.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label className="font-body" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Material</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {materials.map((mat) => (
                        <button
                          key={mat}
                          onClick={() => setSelectedMaterial(mat as string)}
                          className="font-body"
                          style={{
                            padding: "10px 16px",
                            fontSize: 11,
                            letterSpacing: "0.04em",
                            border: selectedMaterial === mat ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                            background: selectedMaterial === mat ? "rgba(255,255,255,0.04)" : "transparent",
                            color: selectedMaterial === mat ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {mat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div>
                    <label className="font-body" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Tama&ntilde;o</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {sizes.map((size) => {
                        const variant = printVariants.find((v: Variant) => v.option2_value === selectedMaterial && v.option3_value === size);
                        return (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size as string)}
                            className="font-body"
                            style={{
                              padding: "10px 16px",
                              fontSize: 11,
                              letterSpacing: "0.04em",
                              border: selectedSize === size ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                              background: selectedSize === size ? "rgba(255,255,255,0.04)" : "transparent",
                              color: selectedSize === size ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              textAlign: "center",
                            }}
                          >
                            <span>{size}</span>
                            {variant && (
                              <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                                ${Number(variant.price).toLocaleString("es-MX")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* T-shirt options */}
            {selectedTab === "tshirt" && tshirtVariants.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
                <label className="font-body" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Talla</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tshirtVariants.map((v: Variant) => (
                    <button
                      key={v.sku}
                      className="font-body"
                      style={{ padding: "10px 16px", fontSize: 11, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer", textAlign: "center" }}
                    >
                      {v.option3_value}
                      <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>${Number(v.price).toLocaleString("es-MX")}</span>
                    </button>
                  ))}
                </div>
                <p className="font-body" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>
                  Playera oversized &middot; Algod&oacute;n 300g &middot; Impresi&oacute;n DTF
                </p>
              </motion.div>
            )}

            {/* Buttons */}
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={handleAddToCart}
                disabled={!currentVariant}
                className="font-body"
                style={{
                  width: "100%",
                  padding: "14px 0",
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: currentVariant ? "pointer" : "not-allowed",
                  opacity: currentVariant ? 1 : 0.3,
                  background: addedToCart ? "rgba(34,80,34,0.5)" : "white",
                  color: addedToCart ? "rgba(150,220,150,1)" : "black",
                  transition: "all 0.3s",
                }}
              >
                {addedToCart ? "Agregado al carrito" : "Agregar al carrito"}
              </button>

              {selectedTab === "print" && activeImage && (
                <button
                  onClick={() => setShowVisualizer(!showVisualizer)}
                  className="font-body"
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    fontSize: 11,
                    fontWeight: 300,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {showVisualizer ? "Cerrar visualizador" : "Pru\u00e9balo en tu pared"}
                </button>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {product.tags.filter((t) => !["1:1","1:2","2:1","1:3","3:1","2:3","3:2","4:1","1A1","1A2","1A3","2A1","2A3","3A1","3A2","4A1"].includes(t)).map((tag) => (
                    <span key={tag} className="font-body" style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.04)", padding: "4px 10px" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0120 10.2c0 7.3-8 11.8-8 11.8z" />
                </svg>
                <span className="font-body" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Incluye soporte posterior para montaje en pared</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-body" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Certificaci&oacute;n Original EMILIO EBEHAR</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wall Visualizer */}
      <AnimatePresence>
        {showVisualizer && activeImage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "clamp(16px, 3vw, 48px)" }}>
              <WallVisualizer imageUrl={activeImage} productTitle={product.title} aspectRatio={product.aspect_ratio} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
