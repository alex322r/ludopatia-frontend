// pages/jugar.js (o app/jugar/page.js si usas App Router)
import GameWrapper from "../components/Game/GameWrapper";

export default function PaginaJuego() {
    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-white text-3xl mb-4">Sala de Juego</h1>

            {/* CAMBIO AQUÍ: Definimos ancho y alto del CONTENEDOR */}
            {/* w-full: Ancho completo disponible */}
            {/* max-w-5xl: Pero no más ancho que esto (para PC) */}
            {/* aspect-video: Mantiene proporción 16:9 automáticamente */}
            {/* h-[60vh] o h-auto: Definimos una altura controlada */}
            <div className="w-full max-w-5xl aspect-video border-4 border-blue-500 rounded-lg overflow-hidden shadow-2xl relative">
                <GameWrapper />
            </div>

            <button className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors">
                Salir de la partida
            </button>
        </div>
    );
}