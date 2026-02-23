"use client";

import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useStore } from "@/store/useStore";
import type { WallTexture, FrameType } from "@/types/product";
import * as THREE from "three";
import { motion } from "framer-motion";

// ─── Wall texture configs ────────────────────────────────────────────────
const WALL_CONFIGS: Record<
  WallTexture,
  { label: string; color: string; roughness: number; bumpScale: number }
> = {
  "white-plaster": {
    label: "Yeso Blanco",
    color: "#f5f0eb",
    roughness: 0.85,
    bumpScale: 0.02,
  },
  brick: {
    label: "Ladrillo Pintado",
    color: "#e8ddd0",
    roughness: 0.95,
    bumpScale: 0.15,
  },
  concrete: {
    label: "Concreto Pulido",
    color: "#c8c2bc",
    roughness: 0.4,
    bumpScale: 0.05,
  },
  wood: {
    label: "Madera",
    color: "#8b7355",
    roughness: 0.7,
    bumpScale: 0.08,
  },
};

// ─── Frame configs ──────────────────────────────────────────────────────
const FRAME_CONFIGS: Record<
  FrameType,
  { label: string; color: string; depth: number; width: number }
> = {
  none: { label: "Sin Marco", color: "#000000", depth: 0, width: 0 },
  "black-matte": {
    label: "Negro Mate",
    color: "#1a1a1a",
    depth: 0.04,
    width: 0.06,
  },
  "natural-wood": {
    label: "Madera Natural",
    color: "#a0845c",
    depth: 0.05,
    width: 0.07,
  },
};

// ─── Procedural wall material ────────────────────────────────────────────
function WallSurface({ wallType }: { wallType: WallTexture }) {
  const config = WALL_CONFIGS[wallType];

  // Generate procedural bump map
  const bumpTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    if (wallType === "brick") {
      // Brick pattern
      ctx.fillStyle = "#d4c4b0";
      ctx.fillRect(0, 0, size, size);
      const brickW = 80;
      const brickH = 35;
      const mortarW = 4;
      for (let row = 0; row < size / (brickH + mortarW); row++) {
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let col = -1; col < size / (brickW + mortarW) + 1; col++) {
          const x = col * (brickW + mortarW) + offset;
          const y = row * (brickH + mortarW);
          const shade = 180 + Math.random() * 40;
          ctx.fillStyle = `rgb(${shade}, ${shade - 20}, ${shade - 40})`;
          ctx.fillRect(x, y, brickW, brickH);
        }
      }
      ctx.fillStyle = "#bbb0a0";
      for (let row = 0; row < size / (brickH + mortarW); row++) {
        ctx.fillRect(0, row * (brickH + mortarW) + brickH, size, mortarW);
      }
    } else if (wallType === "concrete") {
      ctx.fillStyle = "#b8b0a8";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const g = Math.random() * 30 + 160;
        ctx.fillStyle = `rgba(${g}, ${g}, ${g}, 0.15)`;
        ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
      }
    } else if (wallType === "wood") {
      ctx.fillStyle = "#7a6545";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 60; i++) {
        const y = i * (size / 60) + Math.random() * 4;
        ctx.strokeStyle = `rgba(${60 + Math.random() * 30}, ${40 + Math.random() * 20}, ${20 + Math.random() * 15}, ${0.1 + Math.random() * 0.2})`;
        ctx.lineWidth = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 20) {
          ctx.lineTo(x, y + Math.sin(x * 0.02) * 2);
        }
        ctx.stroke();
      }
    } else {
      // White plaster - subtle noise
      ctx.fillStyle = "#f0ebe5";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const g = Math.random() * 20 + 230;
        ctx.fillStyle = `rgba(${g}, ${g - 2}, ${g - 5}, 0.08)`;
        ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }, [wallType]);

  return (
    <mesh position={[0, 0, -0.05]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial
        color={config.color}
        roughness={config.roughness}
        bumpMap={bumpTexture}
        bumpScale={config.bumpScale}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}

// ─── Artwork on Wall ──────────────────────────────────────────────────────
function WallArtwork({
  imageUrl,
  artworkScale,
  aspectRatio,
}: {
  imageUrl: string;
  artworkScale: number;
  aspectRatio: string | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (!imageUrl || !matRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      tex.colorSpace = THREE.SRGBColorSpace;
      if (matRef.current) {
        matRef.current.map = tex;
        matRef.current.color.set("#ffffff");
        matRef.current.needsUpdate = true;
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const aspect = useMemo(() => {
    if (aspectRatio === "2:3") return { w: 2, h: 3 };
    if (aspectRatio === "3:2") return { w: 3, h: 2 };
    if (aspectRatio === "16:9") return { w: 16, h: 9 };
    return { w: 3, h: 2 };
  }, [aspectRatio]);

  const baseScale = 1.8;
  const width =
    (aspect.w / Math.max(aspect.w, aspect.h)) * baseScale * artworkScale;
  const height =
    (aspect.h / Math.max(aspect.w, aspect.h)) * baseScale * artworkScale;

  return (
    <group position={[0, 0.3, 0]}>
      <mesh ref={meshRef} position={[0, 0, 0.02]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={matRef} color="#333333" toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Frame Geometry ──────────────────────────────────────────────────────
function FrameMesh({
  frameType,
  artworkScale,
  aspectRatio,
}: {
  frameType: FrameType;
  artworkScale: number;
  aspectRatio: string | null;
}) {
  const config = FRAME_CONFIGS[frameType];
  if (frameType === "none") return null;

  const aspect = useMemo(() => {
    if (aspectRatio === "2:3") return { w: 2, h: 3 };
    if (aspectRatio === "3:2") return { w: 3, h: 2 };
    if (aspectRatio === "16:9") return { w: 16, h: 9 };
    return { w: 3, h: 2 };
  }, [aspectRatio]);

  const baseScale = 1.8;
  const width =
    (aspect.w / Math.max(aspect.w, aspect.h)) * baseScale * artworkScale;
  const height =
    (aspect.h / Math.max(aspect.w, aspect.h)) * baseScale * artworkScale;
  const fw = config.width;
  const fd = config.depth;

  return (
    <group position={[0, 0.3, 0.01]}>
      {/* Top */}
      <mesh position={[0, height / 2 + fw / 2, fd / 2]}>
        <boxGeometry args={[width + fw * 2, fw, fd]} />
        <meshStandardMaterial
          color={config.color}
          roughness={frameType === "natural-wood" ? 0.6 : 0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -(height / 2 + fw / 2), fd / 2]}>
        <boxGeometry args={[width + fw * 2, fw, fd]} />
        <meshStandardMaterial
          color={config.color}
          roughness={frameType === "natural-wood" ? 0.6 : 0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Left */}
      <mesh position={[-(width / 2 + fw / 2), 0, fd / 2]}>
        <boxGeometry args={[fw, height, fd]} />
        <meshStandardMaterial
          color={config.color}
          roughness={frameType === "natural-wood" ? 0.6 : 0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Right */}
      <mesh position={[width / 2 + fw / 2, 0, fd / 2]}>
        <boxGeometry args={[fw, height, fd]} />
        <meshStandardMaterial
          color={config.color}
          roughness={frameType === "natural-wood" ? 0.6 : 0.9}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

// ─── 3D Scene (lightweight — no env map, no shadows) ─────────────────────
function VisualizerScene({
  imageUrl,
  aspectRatio,
}: {
  imageUrl: string;
  aspectRatio: string | null;
}) {
  const { wallTexture, frameType, artworkScale } = useStore();

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[0, 4, 4]} intensity={0.8} color="#faf0e6" />
      <pointLight position={[-3, 2, 2]} intensity={0.3} />

      <WallSurface wallType={wallTexture} />
      <WallArtwork
        imageUrl={imageUrl}
        artworkScale={artworkScale}
        aspectRatio={aspectRatio}
      />
      <FrameMesh
        frameType={frameType}
        artworkScale={artworkScale}
        aspectRatio={aspectRatio}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
      />
    </>
  );
}

// ─── Control Panel ──────────────────────────────────────────────────────
function ControlPanel() {
  const {
    wallTexture,
    setWallTexture,
    frameType,
    setFrameType,
    artworkScale,
    setArtworkScale,
  } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 space-y-6"
    >
      {/* Wall Texture Selector */}
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-sm w-48">
        <h4 className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-3">
          Textura de pared
        </h4>
        <div className="space-y-1.5">
          {(Object.keys(WALL_CONFIGS) as WallTexture[]).map((key) => (
            <button
              key={key}
              onClick={() => setWallTexture(key)}
              className={`w-full text-left px-3 py-2 text-xs transition-all duration-200 ${
                wallTexture === key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: WALL_CONFIGS[key].color }}
                />
                {WALL_CONFIGS[key].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Selector */}
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-sm w-48">
        <h4 className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-3">
          Tipo de marco
        </h4>
        <div className="space-y-1.5">
          {(Object.keys(FRAME_CONFIGS) as FrameType[]).map((key) => (
            <button
              key={key}
              onClick={() => setFrameType(key)}
              className={`w-full text-left px-3 py-2 text-xs transition-all duration-200 ${
                frameType === key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{
                    backgroundColor:
                      key === "none" ? "transparent" : FRAME_CONFIGS[key].color,
                  }}
                />
                {FRAME_CONFIGS[key].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Size Slider */}
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-sm w-48">
        <h4 className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-3">
          Tamaño
        </h4>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={artworkScale}
          onChange={(e) => setArtworkScale(parseFloat(e.target.value))}
          className="w-full accent-white h-px appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[9px] text-white/30">Pequeño</span>
          <span className="text-[9px] text-white/30">Grande</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main exported component ─────────────────────────────────────────────
export default function WallVisualizer({
  imageUrl,
  productTitle,
  aspectRatio,
}: {
  imageUrl: string;
  productTitle: string;
  aspectRatio: string | null;
}) {
  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] bg-neutral-950 rounded-sm overflow-hidden">
      {/* Header label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-4 z-10"
      >
        <span className="text-[10px] tracking-[0.2em] text-white/30 uppercase">
          Pruébalo en tu pared
        </span>
      </motion.div>

      {/* 3D Canvas */}
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{ position: [0, 0.3, 4], fov: 45 }}
      >
        <Suspense fallback={null}>
          <VisualizerScene imageUrl={imageUrl} aspectRatio={aspectRatio} />
        </Suspense>
      </Canvas>

      {/* Control Panel */}
      <ControlPanel />

      {/* Interaction hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 left-4 text-[10px] tracking-wider text-white/20 uppercase"
      >
        Arrastra para rotar · Scroll para zoom
      </motion.p>
    </div>
  );
}
