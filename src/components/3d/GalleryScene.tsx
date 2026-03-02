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
  const [hasInteracted, setHasInteracted] = useState(false);

  // Smooth scroll refs
  const scrollAccum = useRef(0);
  const isAnimating = useRef(false);
  const artworkRef = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);

  // Touch refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isTouchDragging = useRef(false);

  useEffect(() => {
    setGalleryProducts(products);
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, [products, setGalleryProducts]);

  // Auto-hide hint
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => setHasInteracted(true), 6000);
    return () => clearTimeout(t);
  }, [loaded]);

  const markInteracted = useCallback(() => {
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, products.length - 1));
      if (clamped === activeGalleryIndex) return;
      setDirection(clamped > activeGalleryIndex ? 1 : -1);
      setActiveGalleryIndex(clamped);
      markInteracted();
    },
    [activeGalleryIndex, products.length, setActiveGalleryIndex, markInteracted]
  );

  const goNext = useCallback(() => goTo(activeGalleryIndex + 1), [activeGalleryIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeGalleryIndex - 1), [activeGalleryIndex, goTo]);

  // ── Butter-smooth wheel handling ──
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isAnimating.current) return;
      // Normalize deltaY across browsers/devices (trackpad vs mouse wheel)
      const delta = Math.abs(e.deltaY) > 100 ? e.deltaY * 0.3 : e.deltaY;
      scrollAccum.current += delta;
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // ── RAF loop: smooth physics + micro-offset ──
  useEffect(() => {
    const THRESHOLD = 60;
    const FRICTION = 0.88;
    const LOCK_TIME = 800; // ms to lock after transition

    const tick = () => {
      // Skip visual offset during touch drag (touch has its own handler)
      if (!isTouchDragging.current && artworkRef.current && !isAnimating.current) {
        const accum = scrollAccum.current;
        // Micro-offset: image subtly shifts in scroll direction
        const offset = Math.max(-40, Math.min(40, accum * 0.2));
        artworkRef.current.style.transform = `translate3d(${-offset}px, 0, 0)`;
        artworkRef.current.style.transition = "transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)";
      }

      // Threshold check
      if (Math.abs(scrollAccum.current) > THRESHOLD && !isAnimating.current) {
        isAnimating.current = true;
        const dir = scrollAccum.current > 0 ? 1 : -1;
        scrollAccum.current = 0;

        if (dir > 0) goNext();
        else goPrev();

        // Reset artwork offset
        if (artworkRef.current) {
          artworkRef.current.style.transform = "translate3d(0, 0, 0)";
          artworkRef.current.style.transition = "transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)";
        }

        setTimeout(() => { isAnimating.current = false; }, LOCK_TIME);
      } else if (!isAnimating.current) {
        // Friction decay
        scrollAccum.current *= FRICTION;
        if (Math.abs(scrollAccum.current) < 0.3) scrollAccum.current = 0;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [goNext, goPrev]);

  // ── Smooth touch drag ──
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchCurrentX.current = e.touches[0].clientX;
      isTouchDragging.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging.current || isAnimating.current) return;
      touchCurrentX.current = e.touches[0].clientX;
      const diffX = touchStartX.current - touchCurrentX.current;

      // Apply resistance at edges
      const atStart = activeGalleryIndex === 0 && diffX < 0;
      const atEnd = activeGalleryIndex === products.length - 1 && diffX > 0;
      const resistance = (atStart || atEnd) ? 0.15 : 0.5;
      const offset = diffX * resistance;

      if (artworkRef.current) {
        artworkRef.current.style.transform = `translate3d(${-offset}px, 0, 0)`;
        artworkRef.current.style.transition = "none";
      }
    };

    const onTouchEnd = () => {
      isTouchDragging.current = false;
      const diff = touchStartX.current - touchCurrentX.current;

      if (Math.abs(diff) > 40 && !isAnimating.current) {
        isAnimating.current = true;
        if (diff > 0) goNext();
        else goPrev();

        if (artworkRef.current) {
          artworkRef.current.style.transform = "translate3d(0, 0, 0)";
          artworkRef.current.style.transition = "transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)";
        }
        setTimeout(() => { isAnimating.current = false; }, 800);
      } else {
        // Snap back
        if (artworkRef.current) {
          artworkRef.current.style.transform = "translate3d(0, 0, 0)";
          artworkRef.current.style.transition = "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)";
        }
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [goNext, goPrev, activeGalleryIndex, products.length]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isAnimating.current) return;
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

  // Apple-style slide variants: long duration, subtle movement
  const slideVariants = {
    enter: (d: number) => ({
      opacity: 0,
      scale: 1.04,
      x: d > 0 ? 60 : -60,
      filter: "blur(4px)",
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      filter: "blur(0px)",
    },
    exit: (d: number) => ({
      opacity: 0,
      scale: 0.97,
      x: d > 0 ? -40 : 40,
      filter: "blur(4px)",
    }),
  };

  const slideTransition = {
    duration: 0.9,
    ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number],
  };

  return (
    <div style={{ width: "100%", height: "100dvh", position: "relative", overflow: "hidden", background: "#000", touchAction: "none" }}>

      {/* Blurred background */}
      <AnimatePresence mode="popLayout">
        {imageSrc && loaded && (
          <motion.div
            key={`bg-${p.handle}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: "absolute", inset: "-50px", zIndex: 0, filter: "blur(70px) saturate(1.4)" }}
          >
            <Image src={imageSrc} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark radial overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.85) 100%)" }} />

      {/* Centered artwork with scroll micro-offset */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 16px 190px" }}>
        <div ref={artworkRef} style={{ width: "100%", maxWidth: 700, maxHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", willChange: "transform" }}>
          <AnimatePresence mode="wait" custom={direction}>
            {imageSrc && loaded && (
              <motion.div
                key={p.handle}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Link href={`/product/${p.handle}`} style={{ display: "block", position: "relative", width: "100%", cursor: "pointer" }}>
                  <div style={{ position: "absolute", inset: "8px -8px -8px 8px", background: "rgba(0,0,0,0.5)", filter: "blur(24px)", zIndex: -1 }} />
                  <div style={{ background: "#ffffff", padding: 12 }}>
                    <Image
                      src={imageSrc}
                      alt={p.title}
                      width={800}
                      height={p.aspect_ratio === "2:3" ? 1200 : p.aspect_ratio === "3:2" ? 533 : p.aspect_ratio === "16:9" ? 450 : p.aspect_ratio === "4:3" ? 600 : 800}
                      sizes="(max-width: 768px) 90vw, 700px"
                      style={{ width: "100%", height: "auto", maxHeight: "calc(100dvh - 300px)", objectFit: "contain", display: "block" }}
                      priority
                    />
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Gradients */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.75) 30%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />
      </div>

      {/* Bottom info panel */}
      <AnimatePresence mode="wait">
        {p && loaded && (
          <motion.div
            key={`info-${p.handle}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "0 clamp(16px, 4vw, 48px) clamp(20px, 3vh, 32px)" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Title + location */}
              <div>
                {p.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 16, height: 1, background: "rgba(255,255,255,0.25)", display: "block" }} />
                    <span className="font-body" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                      {p.location}
                    </span>
                  </div>
                )}
                <h1 className="font-display" style={{ fontSize: "clamp(1.4rem, 5vw, 3rem)", fontWeight: 300, color: "rgba(255,255,255,0.94)", lineHeight: 1.15, letterSpacing: "0.02em", margin: 0 }}>
                  {p.title}
                </h1>
              </div>

              {/* Price + CTA */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {p.min_price > 0 && (
                  <span className="font-body" style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.35)" }}>
                    Desde <span style={{ color: "rgba(255,255,255,0.6)" }}>${Number(p.min_price).toLocaleString("es-MX")}</span> MXN
                  </span>
                )}
                <Link
                  href={`/product/${p.handle}`}
                  className="font-body"
                  style={{
                    pointerEvents: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    fontSize: 10,
                    fontWeight: 400,
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.85)",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.04)",
                    transition: "all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                >
                  <span>Ver obra</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Navigation row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto" }}>
                <button
                  onClick={goPrev}
                  disabled={activeGalleryIndex === 0}
                  style={{
                    width: 36, height: 36,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: activeGalleryIndex === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)",
                    cursor: activeGalleryIndex === 0 ? "default" : "pointer",
                    transition: "all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
                </button>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="font-body" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                      {String(activeGalleryIndex + 1).padStart(2, "0")} de {String(products.length).padStart(2, "0")}
                    </span>
                    <Link
                      href="/gallery"
                      className="font-body"
                      style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textDecoration: "none", textTransform: "uppercase", transition: "color 0.4s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                    >
                      {"Ver toda la colecci\u00f3n"}
                    </Link>
                  </div>
                  <div style={{ width: "100%", height: 2, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", borderRadius: 1 }}>
                    <motion.div
                      style={{ position: "absolute", top: 0, left: 0, bottom: 0, background: "rgba(255,255,255,0.35)", borderRadius: 1 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                </div>

                <button
                  onClick={goNext}
                  disabled={activeGalleryIndex === products.length - 1}
                  style={{
                    width: 36, height: 36,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: activeGalleryIndex === products.length - 1 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)",
                    cursor: activeGalleryIndex === products.length - 1 ? "default" : "pointer",
                    transition: "all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Swipe / Scroll hint ── */}
      <AnimatePresence>
        {loaded && !hasInteracted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "24px 36px",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Mobile: swipe hint */}
              <div className="flex md:hidden" style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
                <motion.div
                  animate={{ x: [0, -18, 0, 18, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ opacity: 0.25 }}>
                    <path d="M5 1L1 5L5 9" stroke="white" strokeWidth="1.2" />
                  </svg>
                  <svg width="22" height="28" viewBox="0 0 22 28" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2">
                    <rect x="1" y="1" width="20" height="26" rx="10" />
                    <circle cx="11" cy="9" r="2" fill="rgba(255,255,255,0.3)" stroke="none" />
                    <path d="M8 14l3 4 3-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ opacity: 0.25 }}>
                    <path d="M1 1L5 5L1 9" stroke="white" strokeWidth="1.2" />
                  </svg>
                </motion.div>
                <span className="font-body" style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                  Desliza para explorar
                </span>
              </div>

              {/* Desktop: scroll hint */}
              <div className="hidden md:flex" style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 38, border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 12, position: "relative", display: "flex", justifyContent: "center" }}>
                  <motion.div
                    animate={{ y: [4, 14, 4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.5)", position: "absolute", top: 6 }}
                  />
                </div>
                <span className="font-body" style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                  Scroll para explorar
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <span className="font-body" style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.1em", color: "rgba(255,255,255,0.18)" }}>
                  o usa las flechas
                </span>
                <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side scroll label */}
      <div className="hidden md:flex" style={{ position: "absolute", left: "clamp(20px, 2.5vw, 48px)", top: "50%", transform: "translateY(-50%)", zIndex: 10, pointerEvents: "none", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.04)" }} />
        <span className="font-body" style={{ fontSize: 8, fontWeight: 300, letterSpacing: "0.18em", color: "rgba(255,255,255,0.1)", textTransform: "uppercase", writingMode: "vertical-lr" }}>Scroll</span>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Preload adjacent images */}
      {prevImg && <link rel="preload" as="image" href={prevImg} />}
      {nextImg && <link rel="preload" as="image" href={nextImg} />}

      {/* Intro screen */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: "absolute", inset: 0, zIndex: 50, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ textAlign: "center" }}>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-display"
                style={{ fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 300, letterSpacing: "0.5em", color: "rgba(255,255,255,0.45)" }}
              >
                Emilio Ebehar
              </motion.span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ height: 1, background: "rgba(255,255,255,0.12)", width: 80, margin: "14px auto 0", transformOrigin: "left" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
