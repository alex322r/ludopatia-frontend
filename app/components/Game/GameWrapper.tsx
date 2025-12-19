// components/Game/GameWrapper.jsx
"use client"; // <--- Importante: Esto lo convierte en Client Component

import dynamic from 'next/dynamic';

// Movemos la importación dinámica AQUÍ dentro
const GameComponent = dynamic(
    () => import('./GameComponent'),
    { ssr: false }
);

const GameWrapper = () => {
    return <GameComponent />;
};

export default GameWrapper;