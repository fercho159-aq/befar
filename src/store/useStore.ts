"use client";

import { create } from "zustand";
import type {
  CartItem,
  WallTexture,
  FrameType,
  ProductWithDetails,
} from "@/types/product";

interface AppState {
  // Cart
  cart: CartItem[];
  cartOpen: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  toggleCart: () => void;
  cartTotal: () => number;

  // Navigation
  menuOpen: boolean;
  toggleMenu: () => void;

  // Gallery 3D
  activeGalleryIndex: number;
  setActiveGalleryIndex: (index: number) => void;
  galleryProducts: ProductWithDetails[];
  setGalleryProducts: (products: ProductWithDetails[]) => void;

  // Wall Visualizer
  wallTexture: WallTexture;
  frameType: FrameType;
  artworkScale: number;
  setWallTexture: (texture: WallTexture) => void;
  setFrameType: (frame: FrameType) => void;
  setArtworkScale: (scale: number) => void;

  // Filters
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Cart
  cart: [],
  cartOpen: false,
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (i) => i.variant.sku === item.variant.sku
      );
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.variant.sku === item.variant.sku
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),
  removeFromCart: (sku) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.variant.sku !== sku),
    })),
  updateQuantity: (sku, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((i) => i.variant.sku !== sku)
          : state.cart.map((i) =>
              i.variant.sku === sku ? { ...i, quantity } : i
            ),
    })),
  toggleCart: () =>
    set((state) => ({
      cartOpen: !state.cartOpen,
      // Close mobile menu when opening cart
      menuOpen: !state.cartOpen ? false : state.menuOpen,
    })),
  cartTotal: () =>
    get().cart.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    ),

  // Navigation
  menuOpen: false,
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),

  // Gallery 3D
  activeGalleryIndex: 0,
  setActiveGalleryIndex: (index) => set({ activeGalleryIndex: index }),
  galleryProducts: [],
  setGalleryProducts: (products) => set({ galleryProducts: products }),

  // Wall Visualizer
  wallTexture: "white-plaster",
  frameType: "black-matte",
  artworkScale: 1,
  setWallTexture: (texture) => set({ wallTexture: texture }),
  setFrameType: (frame) => set({ frameType: frame }),
  setArtworkScale: (scale) => set({ artworkScale: scale }),

  // Filters
  activeFilter: null,
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));
