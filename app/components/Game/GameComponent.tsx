// components/Game/GameComponent.jsx

import { useEffect, useRef } from 'react';
import initGame from './GameEngine';

const GameComponent = () => {
    const gameRef = useRef<any>(null); // Guarda la instancia del juego
    const initializedRef = useRef(false); // Evita doble carga en React 18

    useEffect(() => {
        // Si ya se inicializó, no hacer nada
        if (initializedRef.current) return;

        // Iniciar el juego
        const game = initGame('phaser-container');
        gameRef.current = game;
        initializedRef.current = true;

        // Cleanup: Cuando sales de la página, destruir el juego
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
                initializedRef.current = false;
                console.log('Juego destruido');
            }
        };
    }, []);

    // React renderiza solo este DIV vacío. Phaser lo rellenará.
    return (
        <div
            id="phaser-container"
            style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
        />
    );
};

export default GameComponent;