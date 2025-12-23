
// pages/jugar.js (o app/jugar/page.js si usas App Router)
import Link from "next/link";
import GameWrapper from "../components/Game/GameWrapper";

export default function PaginaJuego() {


    return (
        <div className="bg-zinc-950 min-h-dvh min-w-dvw relative flex flex-col items-center justify-center overflow-hidden font-sans text-white">

            {/* --- 1. AVISO DE ROTACIÓN (Solo visible en móviles verticales) --- */}
            {/* Usamos 'portrait:flex' y 'landscape:hidden' para controlar visibilidad */}
            <div className="fixed inset-0 z-50 bg-black flex-col items-center justify-center text-center p-8 hidden portrait:flex lg:portrait:hidden">
                <div className="animate-bounce text-6xl mb-4">🔄</div>
                <h2 className="text-2xl font-bold text-amber-500 mb-2">Gira tu dispositivo</h2>
                <p className="text-zinc-400">Este juego está diseñado para jugarse en modo horizontal.</p>
            </div>

            {/* Background Gradients & Noise */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg...')] opacity-[0.05] z-0 pointer-events-none"></div>

            <div className="z-10 w-full h-full flex flex-col items-center justify-center p-2 lg:p-4">

                {/* --- 2. TÍTULO (Oculto en móvil horizontal para ganar espacio) --- */}
                <h1 className="hidden md:block text-3xl md:text-5xl font-bold mb-4 md:mb-8 font-playfair bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
                    Sala de Juego
                </h1>

                {/* --- 3. CONTENEDOR DEL JUEGO (Full Screen en móvil) --- */}
                {/* En móvil: w-full h-full absolute inset-0. En PC: relativo con aspect-video */}
                <div className="
                    w-full h-full absolute inset-0 md:relative md:w-full md:max-w-6xl md:h-auto md:aspect-video 
                    md:border md:border-amber-500/30 md:rounded-xl overflow-hidden 
                    md:shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-zinc-900/80 backdrop-blur-md
                ">
                    <GameWrapper />
                </div>

                {/* --- 4. BOTÓN SALIR (Flotante y pequeño en móvil) --- */}
                <Link href="/" className="
                    absolute top-4 right-4 md:static md:mt-8 
                    group px-4 py-2 md:px-8 md:py-3 
                    bg-zinc-800/80 md:bg-gradient-to-b md:from-zinc-800 md:to-zinc-900 
                    border border-zinc-700 hover:border-amber-500/50 
                    text-zinc-300 hover:text-white rounded-full font-semibold 
                    transition-all duration-300 z-20
                ">
                    <span className="flex items-center gap-2 text-sm md:text-base">
                        <span className="hidden md:inline">← Volver al Lobby</span>
                        <span className="md:hidden">✕ Salir</span>
                    </span>
                </Link>
            </div>
        </div>
    );
}