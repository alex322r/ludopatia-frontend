// pages/jugar.js (o app/jugar/page.js si usas App Router)
import Link from "next/link";
import GameWrapper from "../components/Game/GameWrapper";

export default function PaginaJuego() {
    return (
        <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
            {/* Background Gradients & Noise */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.05] z-0 pointer-events-none"></div>

            <div className="relative z-10 w-full flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 font-playfair bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
                    Sala de Juego
                </h1>

                {/* CAMBIO AQUÍ: Definimos ancho y alto del CONTENEDOR */}
                {/* w-full: Ancho completo disponible */}
                {/* max-w-5xl: Pero no más ancho que esto (para PC) */}
                {/* aspect-video: Mantiene proporción 16:9 automáticamente */}
                {/* h-[60vh] o h-auto: Definimos una altura controlada */}
                <div className="w-full max-w-6xl aspect-video border border-amber-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] relative bg-zinc-900/80 backdrop-blur-md">
                    <GameWrapper />
                </div>

                <Link href="/" className="mt-8 group relative px-8 py-3 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-white rounded-full font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <span className="relative z-10 flex items-center gap-2">
                        ← Volver al Lobby
                    </span>
                </Link>
            </div>
        </div>
    );
}