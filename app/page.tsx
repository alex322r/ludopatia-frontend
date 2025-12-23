import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const games = [
    {
      id: "carta-mayor",
      title: "Carta Mayor",
      description: "Juega a la carta más alta y multiplica tu apuesta.",
      image: "/assets/carta-mayor.png",
      href: "/jugar",
    },
    {
      id: "slots",
      title: "Tragamonedas Royal",
      description: "Gira y gana con nuestros slots de última generación.",
      image: "/assets/slots.png",
      href: "/jugar",
    },
    {
      id: "roulette",
      title: "Ruleta Europea",
      description: "La elegancia del azar en una rueda giratoria.",
      image: "/assets/roulette.png",
      href: "/jugar",
    },
    {
      id: "blackjack",
      title: "Blackjack Pro",
      description: "Desafía al dealer y busca el 21 perfecto.",
      image: "/assets/blackjack.png",
      href: "/jugar",
    },
    {
      id: "poker",
      title: "Poker High Stakes",
      description: "Demuestra tu habilidad en las mesas más exclusivas.",
      image: "/assets/poker.png",
      href: "/jugar",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500 selection:text-black font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[80vh] flex items-center justify-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/back-ground.png"
            alt="Casino Background"
            fill
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.05] z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

        <div className="container mx-auto px-4 relative z-20 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
            <span className="text-amber-400 text-sm font-semibold tracking-wider uppercase">Bienvenidos a la Excelencia</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] font-playfair tracking-tight">
            LUDOPATIA CASINO
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Donde la suerte encuentra el lujo. Vive una experiencia de juego inmersiva con premios instantáneos y seguridad de clase mundial.
          </p>
          <button className="group relative px-10 py-5 bg-gradient-to-b from-amber-400 to-amber-600 text-black font-bold text-lg rounded-full shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:scale-105 transition-all duration-300 overflow-hidden">
            <span className="relative z-10 tracking-widest">EMPEZAR A JUGAR</span>
            <div className="absolute inset-0 bg-white/30 group-hover:bg-white/40 transition-colors"></div>
            <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
          </button>
        </div>
      </div>

      {/* Game Grid */}
      <div className="container mx-auto px-4 py-20 relative z-20">
        <div className="flex items-center justify-center gap-6 mb-16">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white font-playfair drop-shadow-md">
            Sala de Juegos
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
          {games.map((game, index) => (
            <Link
              key={game.id}
              href={game.href}
              className={`group relative h-96 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${index === 0 ? "md:col-span-2 lg:col-span-2" : ""
                }`}
            >
              {/* Card Background & Glassmorphism */}
              <div className="absolute inset-0 bg-zinc-900/30 border border-white/5 group-hover:border-amber-500/40 transition-colors z-10"></div>

              {/* Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={game.image}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl font-bold text-white mb-2 font-playfair drop-shadow-lg group-hover:text-amber-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-zinc-300 text-sm md:text-base mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 max-w-md">
                    {game.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-amber-500 font-semibold tracking-wider text-sm uppercase group-hover:gap-4 transition-all duration-300">
                    Jugar Ahora <span className="text-xl">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 relative py-12">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-playfair font-bold text-amber-500/80 mb-6">LUDOPATIA</h2>
          <p className="text-zinc-500 text-sm mb-4">© 2025 Ludopatia Casino. Excelencia en cada apuesta.</p>
          <div className="flex justify-center gap-6 text-xs text-zinc-600 tracking-widest uppercase">
            <span>Juego Responsable</span>
            <span>Términos y Condiciones</span>
            <span>Privacidad</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
