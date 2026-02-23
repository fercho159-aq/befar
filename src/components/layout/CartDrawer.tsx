"use client";

import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function CartDrawer() {
  const { cart, cartOpen, toggleCart, removeFromCart, updateQuantity } =
    useStore();
  const total = cart.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer - full width on mobile, max-w on desktop */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 50,
              width: "100%",
              maxWidth: 420,
              background: "#0a0a0a",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h2
                className="font-body"
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.8)",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Carrito ({cart.length})
              </h2>
              <button
                onClick={toggleCart}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 8,
                  color: "rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", WebkitOverflowScrolling: "touch" }}>
              {cart.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <p
                    className="font-body"
                    style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}
                  >
                    Tu carrito est&aacute; vac&iacute;o
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {cart.map((item) => (
                    <motion.div
                      key={item.variant.sku}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{ display: "flex", gap: 14 }}
                    >
                      {/* Image */}
                      <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0, background: "#111", overflow: "hidden" }}>
                        <Image src={item.image} alt={item.product.title} fill style={{ objectFit: "cover" }} sizes="72px" />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          className="font-body"
                          style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}
                        >
                          {item.product.title}
                        </h3>
                        <p className="font-body" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                          {item.variant.option2_value} &middot; {item.variant.option3_value}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                          {/* Quantity */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              onClick={() => updateQuantity(item.variant.sku, item.quantity - 1)}
                              style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.12)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}
                            >
                              &minus;
                            </button>
                            <span className="font-body" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", width: 16, textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variant.sku, item.quantity + 1)}
                              style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.12)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}
                            >
                              +
                            </button>
                          </div>
                          {/* Price */}
                          <span className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                            ${(item.variant.price * item.quantity).toLocaleString("es-MX")}
                          </span>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.variant.sku)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.2)", alignSelf: "flex-start" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: "16px 20px", paddingBottom: "max(16px, env(safe-area-inset-bottom))", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span className="font-body" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Total</span>
                  <span className="font-body" style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.9)" }}>${total.toLocaleString("es-MX")} MXN</span>
                </div>
                <button
                  className="font-body"
                  style={{ width: "100%", padding: "14px 0", background: "white", color: "black", fontSize: 11, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", border: "none", cursor: "pointer" }}
                >
                  Proceder al pago
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
