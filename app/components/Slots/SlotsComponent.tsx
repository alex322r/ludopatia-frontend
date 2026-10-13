// components/Slots/SlotsComponent.tsx

import { useEffect, useRef } from 'react';
import initSlotsGame from './SlotsEngine';

const SlotsComponent = () => {
    const gameRef = useRef<any>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;

        const game = initSlotsGame('slots-container');
        gameRef.current = game;
        initializedRef.current = true;

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
                initializedRef.current = false;
                console.log('Juego de Slots destruido');
            }
        };
    }, []);

    return (
        <div
            id="slots-container"
            style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
        />
    );
};

export default SlotsComponent;
