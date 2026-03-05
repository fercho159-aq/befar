"use client";

import { useStore } from "@/store/useStore";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Galer\u00eda" },
  { href: "/gallery", label: "Colecci\u00f3n" },
  { href: "/about", label: "Artista" },
];

export default function Navbar() {
  const { cart, toggleCart, menuOpen, toggleMenu } = useStore();
  const pathname = usePathname();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, toggleMenu]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        {/* Backdrop gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transition: "all 0.6s ease",
            background: scrolled
              ? "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 80%, transparent 100%)"
              : "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)",
            backdropFilter: scrolled ? "blur(10px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
          }}
        />

        {/* Content row */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px clamp(20px, 4vw, 48px)",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Image
              src="/logo-ebehar.png"
              alt="Ebehar Photography"
              width={160}
              height={40}
              style={{
                height: "clamp(28px, 3vw, 38px)",
                width: "auto",
                filter: "brightness(0) invert(1)",
                opacity: 0.9,
                userSelect: "none",
              }}
              priority
            />
          </Link>

          {/* Desktop nav links (center) */}
          <div
            style={{
              alignItems: "center",
              gap: "clamp(24px, 3vw, 36px)",
            }}
            className="hidden md:flex"
          >
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: "none",
                    position: "relative",
                    paddingBottom: 3,
                  }}
                >
                  <span
                    className="font-body"
                    style={{
                      fontSize: 11,
                      fontWeight: 300,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: active
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.4)",
                      transition: "color 0.4s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    }}
                  >
                    {link.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: "rgba(255,255,255,0.3)",
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side: cart (always) + hamburger (mobile) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Cart - visible on all screens */}
            <button
              onClick={toggleCart}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <AnimatePresence mode="wait">
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="font-body"
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -4,
                      fontSize: 8,
                      fontWeight: 500,
                      background: "white",
                      color: "black",
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Hamburger - mobile only */}
            <button
              onClick={toggleMenu}
              aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
              className="flex md:hidden"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <div style={{ width: 22, height: 14, position: "relative" }}>
                <motion.span
                  animate={
                    menuOpen
                      ? { rotate: 45, y: 6, width: "100%" }
                      : { rotate: 0, y: 0, width: "100%" }
                  }
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "block",
                    height: 1.5,
                    background: "rgba(255,255,255,0.65)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    transformOrigin: "center",
                  }}
                />
                <motion.span
                  animate={
                    menuOpen
                      ? { opacity: 0, scaleX: 0 }
                      : { opacity: 1, scaleX: 1 }
                  }
                  transition={{ duration: 0.25 }}
                  style={{
                    display: "block",
                    height: 1.5,
                    background: "rgba(255,255,255,0.4)",
                    position: "absolute",
                    top: "50%",
                    right: 0,
                    width: "65%",
                    transformOrigin: "right",
                    marginTop: -0.75,
                  }}
                />
                <motion.span
                  animate={
                    menuOpen
                      ? { rotate: -45, y: -6, width: "100%" }
                      : { rotate: 0, y: 0, width: "80%" }
                  }
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "block",
                    height: 1.5,
                    background: "rgba(255,255,255,0.5)",
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    transformOrigin: "center",
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile fullscreen menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: "fixed", inset: 0, zIndex: 45 }}
          >
            {/* Background – tap to close */}
            <div onClick={toggleMenu} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.97)" }} />

            {/* Decorative circle */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 180,
                height: 180,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.02)",
              }}
            />

            {/* Links */}
            <div
              style={{
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <nav style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {NAV_LINKS.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{
                        delay: 0.06 + i * 0.05,
                        duration: 0.45,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={toggleMenu}
                        className="font-display"
                        style={{
                          display: "block",
                          padding: "10px 0",
                          fontSize: "2.2rem",
                          fontWeight: 300,
                          letterSpacing: "0.1em",
                          color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                          textDecoration: "none",
                          transition: "color 0.3s",
                        }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Bottom tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="font-body"
                style={{
                  position: "absolute",
                  bottom: 32,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 9,
                  fontWeight: 300,
                  letterSpacing: "0.3em",
                  color: "rgba(255,255,255,0.1)",
                  textTransform: "uppercase",
                }}
              >
                {"Fotograf\u00eda de arte original certificada"}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
