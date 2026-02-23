import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-extralight text-white/20">404</h1>
        <p className="text-sm text-white/40 mt-4 tracking-wider">
          Página no encontrada
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 text-xs tracking-[0.2em] uppercase border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all"
        >
          Volver a la galería
        </Link>
      </div>
    </div>
  );
}
