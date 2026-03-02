"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { ProductWithDetails } from "@/types/product";

const CATEGORY_FILTERS = [
  { key: null, label: "Todas" },
  { key: "NATURE", label: "Naturaleza" },
  { key: "ARQUITECTURE", label: "Arquitectura" },
  { key: "ART", label: "Arte" },
];


export default function GalleryGrid({
  products,
  tags,
}: {
  products: ProductWithDetails[];
  tags: string[];
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!activeFilter) return products;
    return products.filter((p) => p.tags?.includes(activeFilter));
  }, [products, activeFilter]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        paddingTop: 100,
        paddingBottom: 80,
        paddingLeft: "clamp(16px, 3vw, 48px)",
        paddingRight: "clamp(16px, 3vw, 48px)",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: 40 }}
      >
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            fontWeight: 300,
            letterSpacing: "0.04em",
            color: "rgba(255,255,255,0.9)",
            margin: 0,
          }}
        >
          Colecci&oacute;n
        </h1>
        <p
          className="font-body"
          style={{
            fontSize: "clamp(12px, 1.2vw, 14px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.35)",
            marginTop: 10,
            maxWidth: 440,
            lineHeight: 1.6,
          }}
        >
          Fotograf&iacute;as originales certificadas. Cada obra captura un momento
          &uacute;nico, disponible en m&uacute;ltiples materiales y tama&ntilde;os.
        </p>
      </motion.div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4, scrollbarWidth: "none" }}>
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key || "all"}
              onClick={() => setActiveFilter(filter.key)}
              className="font-body"
              style={{
                padding: "7px 14px",
                fontSize: 10,
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontWeight: 300,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                }
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p
        className="font-body"
        style={{
          fontSize: 11,
          fontWeight: 300,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.1em",
          marginBottom: 24,
        }}
      >
        {filteredProducts.length} obras
      </p>

      {/* Grid - uniform cards */}
      <div
        style={{
          display: "grid",
          gap: 6,
        }}
        className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, i) => {
            const imageSrc = product.images?.[0]?.src;
            const isHovered = hoveredProduct === product.handle;

            return (
              <motion.div
                key={product.handle}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.4 }}
              >
                <Link
                  href={`/product/${product.handle}`}
                  style={{
                    display: "block",
                    position: "relative",
                    background: "#ffffff",
                    textDecoration: "none",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    padding: 12,
                  }}
                  onMouseEnter={() => setHoveredProduct(product.handle)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        style={{
                          objectFit: "contain",
                          transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                          transform: isHovered ? "scale(1.05)" : "scale(1)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ color: "rgba(0,0,0,0.15)", fontSize: 11 }}>
                          Sin imagen
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: isHovered
                          ? "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)"
                          : "transparent",
                        transition: "all 0.5s ease",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: "clamp(8px, 1.5vw, 16px)",
                      }}
                    >
                      <div
                        style={{
                          transform: isHovered ? "translateY(0)" : "translateY(6px)",
                          opacity: isHovered ? 1 : 0,
                          transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        <h3
                          className="font-display"
                          style={{
                            fontSize: "clamp(14px, 1.4vw, 18px)",
                            fontWeight: 300,
                            color: "rgba(255,255,255,0.92)",
                            letterSpacing: "0.02em",
                            margin: 0,
                            lineHeight: 1.3,
                          }}
                        >
                          {product.title}
                        </h3>
                        {product.location && (
                          <p
                            className="font-body"
                            style={{
                              fontSize: 9,
                              fontWeight: 300,
                              color: "rgba(255,255,255,0.4)",
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              marginTop: 5,
                            }}
                          >
                            {product.location}
                          </p>
                        )}
                        {product.min_price > 0 && (
                          <p
                            className="font-body"
                            style={{
                              fontSize: 11,
                              fontWeight: 300,
                              color: "rgba(255,255,255,0.5)",
                              marginTop: 6,
                            }}
                          >
                            Desde ${Number(product.min_price).toLocaleString("es-MX")} MXN
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
