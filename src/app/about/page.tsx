"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black pt-28 pb-20 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-4">
            El Artista
          </p>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-wide text-white">
            Emilio Ebehar
          </h1>

          <div className="mt-12 space-y-6 text-sm text-white/50 font-light leading-relaxed">
            <p>
              Fotógrafo mexicano cuya obra captura la esencia de lugares
              extraordinarios alrededor del mundo. Desde las formaciones
              geológicas de The Wave en Arizona hasta las barreras del Támesis en
              Londres, cada imagen es un testimonio de exploración y visión
              artística.
            </p>
            <p>
              Las obras están disponibles en materiales premium: Acrílico con
              impresión directa, Dibond de aluminio compuesto y Chromaluxe, el
              estándar más alto en impresión fotográfica. Cada pieza incluye
              certificación de autenticidad.
            </p>
            <p>
              La colección también incluye una línea textil con playeras
              oversized de algodón de 300 gramos, impresas con tecnología DTF de
              alta calidad.
            </p>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-[10px] tracking-[0.3em] text-white/20 uppercase">
              Original Certified EMILIO EBEHAR
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
