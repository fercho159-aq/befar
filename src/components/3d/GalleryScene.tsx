"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/store/useStore";
import type { ProductWithDetails } from "@/types/product";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function GalleryScene({
  products,
}: {
  products: ProductWithDetails[];
}) {
  const { activeGalleryIndex, setActiveGalleryIndex, setGalleryProducts } =
    useStore();
  const [loaded, setLoaded] = useState(false);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const lastScroll = useRef(0);

  useEffect(() => {
    setGalleryProducts(products);
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, [products, setGalleryProducts]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, products.length - 1));
      if (clamped === activeGalleryIndex) return;
      setDirection(clamped > activeGalleryIndex ? 1 : -1);
      setActiveGalleryIndex(clamped);
    },
    [activeGalleryIndex, products.length, setActiveGalleryIndex]
  );

  const goNext = useCallback(() => goTo(activeGalleryIndex + 1), [activeGalleryIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeGalleryIndex - 1), [activeGalleryIndex, goTo]);

  // Scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScroll.current < 500) return;
      lastScroll.current = now;
      if (e.deltaY > 15) goNext();
      else if (e.deltaY < -15) goPrev();
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goNext, goPrev]);

  // Touch swipe
  useEffect(() => {
    const onStart = (e: TouchEvent) => setTouchStart(e.touches[0].clientX);
    const onEnd = (e: TouchEvent) => {
      if (touchStart === null) return;
      const diff = touchStart - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) goNext();
        else goPrev();
      }
      setTouchStart(null);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [touchStart, goNext, goPrev]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const p = products[activeGalleryIndex];
  const progress = ((activeGalleryIndex + 1) / products.length) * 100;
  const imageSrc = p?.images?.[0]?.src;
  const prevImg = products[activeGalleryIndex - 1]?.images?.[0]?.src;
  const nextImg = products[activeGalleryIndex + 1]?.images?.[0]?.src;

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, scale: 1.03, x: d > 0 ? 30 : -30 }),
    center: { opacity: 1, scale: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, scale: 0.98, x: d > 0 ? -20 : 20 }),
  };

  return (
    <div style={{ width: "100%", height: "100dvh", position: "relative", overflow: "hidden", background: "#000", touchAction: "pan-y" }}>

      {/* Blurred background */}
      <AnimatePresence mode="popLayout">
        {imageSrc && loaded && (
          <motion.div
            key={`bg-${p.handle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ position: "absolute", inset: "-40px", zIndex: 0, filter: "blur(60px) saturate(1.4)" }}
          >
            <Image src={imageSrc} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark radial overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)" }} />

      {/* Centered artwork - adjusted padding for mobile */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 16px 140px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          {imageSrc && loaded && (
            <motion.div
              key={p.handle}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", width: "100%", maxWidth: 700, maxHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Link href={`/product/${p.handle}`} style={{ display: "block", position: "relative", width: "100%", cursor: "pointer" }}>
                <div style={{ position: "absolute", inset: "8px -8px -8px 8px", background: "rgba(0,0,0,0.5)", filter: "blur(24px)", zIndex: -1 }} />
                <Image
                  src={imageSrc}
                  alt={p.title}
                  width={800}
                  height={p.aspect_ratio === "2:3" ? 1200 : p.aspect_ratio === "3:2" ? 533 : p.aspect_ratio === "16:9" ? 450 : p.aspect_ratio === "4:3" ? 600 : 800}
                  sizes="(max-width: 768px) 90vw, 700px"
                  style={{ width: "100%", height: "auto", maxHeight: "calc(100dvh - 220px)", objectFit: "contain", display: "block" }}
                  priority
                />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gradients */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />
      </div>

      {/* Bottom info - compact for mobile */}
      <AnimatePresence mode="wait">
        {p && loaded && (
          <motion.div
            key={`info-${p.handle}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, pointerEvents: "none", padding: "0 16px 16px" }}
          >
            {/* Mobile: stacked layout. Desktop: side by side */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Title row */}
              <div>
                {p.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 12, height: 1, background: "rgba(255,255,255,0.2)", display: "block" }} />
                    <span className="font-body" style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                      {p.location}
                    </span>
                  </div>
                )}
                <h1 className="font-display" style={{ fontSize: "clamp(1.25rem, 5vw, 3rem)", fontWeight: 300, color: "rgba(255,255,255,0.92)", lineHeight: 1.15, letterSpacing: "0.02em", margin: 0 }}>
                  {p.title}
                </h1>
              </div>

              {/* Price + CTA + Counter row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {p.min_price > 0 && (
                    <span className="font-body" style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.3)" }}>
                      Desde <span style={{ color: "rgba(255,255,255,0.55)" }}>${Number(p.min_price).toLocaleString("es-MX")}</span> MXN
                    </span>
                  )}
                  <Link
                    href={`/product/${p.handle}`}
                    className="font-body"
                    style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 300, letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", textDecoration: "none" }}
                  >
                    <span>Ver obra</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Counter + arrows */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto", flexShrink: 0 }}>
                  <span className="font-display" style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>
                    {String(activeGalleryIndex + 1).padStart(2, "0")}
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", margin: "0 2px" }}>/</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>{String(products.length).padStart(2, "0")}</span>
                  </span>
                  <div style={{ display: "flex", gap: 3 }}>
                    <button
                      onClick={goPrev}
                      disabled={activeGalleryIndex === 0}
                      style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.08)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", color: activeGalleryIndex === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)", cursor: activeGalleryIndex === 0 ? "default" : "pointer" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                      onClick={goNext}
                      disabled={activeGalleryIndex === products.length - 1}
                      style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.08)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", color: activeGalleryIndex === products.length - 1 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)", cursor: activeGalleryIndex === products.length - 1 ? "default" : "pointer" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar - full width */}
              <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                <motion.div style={{ position: "absolute", top: 0, left: 0, bottom: 0, background: "rgba(255,255,255,0.3)" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.45, ease: "easeOut" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop scroll hint */}
      <div className="hidden md:flex" style={{ position: "absolute", left: "clamp(20px, 2.5vw, 48px)", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.04)" }} />
        <span className="font-body" style={{ fontSize: 8, fontWeight: 300, letterSpacing: "0.18em", color: "rgba(255,255,255,0.1)", textTransform: "uppercase", writingMode: "vertical-lr" }}>Scroll to explore</span>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Preload */}
      {prevImg && <link rel="preload" as="image" href={prevImg} />}
      {nextImg && <link rel="preload" as="image" href={nextImg} />}

      {/* Intro */}
      <AnimatePresence>
        {!loaded && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: "absolute", inset: 0, zIndex: 50, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display" style={{ fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 300, letterSpacing: "0.5em", color: "rgba(255,255,255,0.45)" }}>Ebehar</motion.span>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ height: 1, background: "rgba(255,255,255,0.12)", width: 80, margin: "14px auto 0", transformOrigin: "left" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
