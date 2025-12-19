import Phaser from 'phaser';
import { io } from 'socket.io-client';

export default function initGame(containerId) {
    const config = {
        type: Phaser.AUTO,
        parent: containerId,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1280,
            height: 720,
            min: {
                width: 320,
                height: 180
            },
            max: {
                width: 1920,
                height: 1080
            }
        },

        backgroundColor: '#2d2d2d',
        scene: { preload, create, update }
    };
    return new Phaser.Game(config);
}

let socket;
let spriteLeftCard, spriteRightCard;
let txtStatus, txtResult;
let zoneLeft, zoneRight;
let txtTimer;
let timerEvent;

function preload() {

    // 2. Cargar el spritesheet
    // IMPORTANTE: frameWidth y frameHeight deben ser el tamaño EXACTO 
    // de una sola carta dentro de tu imagen grande. ¡Mídelo!
    this.load.spritesheet('cardsDeck', '/assets/cards.png', {
        frameWidth: 290,
        frameHeight: 400,


    });
    this.load.image('cardBack', '/assets/back.png', {
        frameWidth: 290,
        frameHeight: 400,
    });
}

function create() {



    const self = this;
    socket = io(`http://${process.env.GAME_SERVER_URL ?? 'localhost'}:8081`); // Asegúrate que coincida con tu server
    //spriteLeftCard = this.add.sprite(200, 300);
    //spriteRightCard = this.add.sprite(600, 300);

    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // --- INTERFAZ VISUAL ---

    // 1. Zonas de Click (Izquierda vs Derecha)
    zoneLeft = this.add.rectangle(width * 0.25, centerY, width * 0.5, height, 0x880000).setInteractive();
    zoneRight = this.add.rectangle(width * 0.75, centerY, width * 0.5, height, 0x000088).setInteractive();

    this.add.text(width * 0.25, 50, 'IZQUIERDA', { fontSize: '24px' });
    this.add.text(width * 0.75, 50, 'DERECHA', { fontSize: '24px' });

    spriteLeftCard = this.add.sprite(width * 0.25, centerY, 'cardBack').setScale(0.5);
    spriteRightCard = this.add.sprite(width * 0.75, centerY, 'cardBack').setScale(0.5);

    // 3. Estado del juego
    txtStatus = this.add.text(centerX, height - 50, 'Esperando...', { fontSize: '20px' }).setOrigin(0.5);
    txtResult = this.add.text(centerX, centerY, '', { fontSize: '64px', color: '#ffff00', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    txtTimer = this.add.text(width / 2, height / 2, '', {
        fontSize: '200px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10
    }).setOrigin(0.5).setAlpha(0);


    // --- EVENTOS DEL JUGADOR ---


    zoneLeft.on('pointerdown', () => {
        socket.emit('apostar', 'left');
        zoneLeft.setFillStyle(0xff0000); // Feedback visual (Brillante)
        zoneRight.setFillStyle(0x000044); // Opacar el otro
    });

    zoneRight.on('pointerdown', () => {
        socket.emit('apostar', 'right');
        zoneRight.setFillStyle(0x0000ff); // Feedback visual (Brillante)
        zoneLeft.setFillStyle(0x440000); // Opacar el otro
    });



    // --- EVENTOS DEL SERVIDOR ---

    // A. Nueva Ronda

    socket.on('newRound', (data) => {
        // Resetear visuales
        spriteLeftCard.setTexture('cardBack');
        spriteRightCard.setTexture('cardBack');

        txtResult.setText('');
        txtStatus.setText(data.message);
        txtStatus.setColor('#ffffff');



        // Resetear colores de zonas
        zoneLeft.setFillStyle(0x880000);
        zoneRight.setFillStyle(0x000088);

        // Habilitar clicks
        zoneLeft.setInteractive();
        zoneRight.setInteractive();

        startCountdown(5, self);

    });

    // B. Confirmación de apuesta
    socket.on('apuestaConfirmada', (lado) => {
        txtStatus.setText(`Apostaste a: ${lado.toUpperCase()}`);
    });

    socket.on('betsClosed', (data) => {

        if (txtTimer) txtTimer.setAlpha(0);
        if (timerEvent) timerEvent.remove();

        txtStatus.setText(data.message);
        txtStatus.setColor('#ffaa00');

        zoneLeft.disableInteractive();
        zoneRight.disableInteractive();

        self.tweens.add({
            targets: [spriteLeftCard, spriteRightCard],
            angle: { from: -5, to: 5 }, // Rotar un poquito
            duration: 100,
            yoyo: true,
            repeat: 50 // Repetir 10 veces (aprox 1 seg de temblor)
        });

    })

    // C. Resultado final
    socket.on('roundResult', (data) => {

        self.tweens.killAll();
        spriteLeftCard.setAngle(0);
        spriteRightCard.setAngle(0);
        // 1. Calcular qué frame necesitamos para cada carta
        const frameIndexLeft = getCardFrameIndex(data.cardLeft.value, data.cardLeft.suit);
        const frameIndexRight = getCardFrameIndex(data.cardRight.value, data.cardRight.suit);

        // 2. Cambiar la textura al spritesheet ('cardsDeck') y usar el frame calculado
        spriteLeftCard.setTexture('cardsDeck', frameIndexLeft);
        spriteRightCard.setTexture('cardsDeck', frameIndexRight);

        // 1. Mostrar las cartas
        //txtLeftCard.setText(`${data.cardLeft.display}\n${data.cardLeft.suit}`);
        //txtRightCard.setText(`${data.cardRight.display}\n${data.cardRight.suit}`);

        // 2. Deshabilitar clicks
        zoneLeft.disableInteractive();
        zoneRight.disableInteractive();

        // 3. Mostrar resultado PERSONALIZADO
        const myResult = data.results[socket.id];

        // Limpiamos colores previos
        txtResult.setColor('#ffffff');

        if (!myResult || myResult.status === 'NO_BET') {
            // CASO: NO APOSTÓ
            txtResult.setText('NO JUGASTE');
            txtResult.setColor('#aaaaaa'); // Gris
            txtStatus.setText('Espera la siguiente ronda');
        }
        else if (myResult.status === 'WIN') {
            // CASO: GANÓ
            txtResult.setText('¡GANASTE!');
            txtResult.setColor('#00ff00'); // Verde
        }
        else if (myResult.status === 'LOSE') {
            // CASO: PERDIÓ
            txtResult.setText('PERDISTE');
            txtResult.setColor('#ff0000'); // Rojo
        }
        else if (myResult.status === 'TIE') {
            // CASO: EMPATE (Si ambos ganan o la casa gana, depende tus reglas)
            txtResult.setText('¡EMPATE!');
            txtResult.setColor('#ffff00'); // Amarillo
        }
    });


}

function update() { }

function getCardFrameIndex(value, suit) {

    let column = 0;
    let row = 0;

    if (value == 14) {
        column = 0;
    } else {
        column = value - 1;
    }

    if (suit === '♥') row = 0; // Hearts
    else if (suit === '♠') row = 1; // Spades
    else if (suit === '♦') row = 2; // Diamonds
    else if (suit === '♣') row = 3; // Clubs



    return row * 13 + column;
}

function startCountdown(seconds, scene) {
    // 1. Mostrar el texto inicial
    let counter = seconds;
    txtTimer.setText(counter);
    txtTimer.setAlpha(0.5); // Hacemos visible el número (medio transparente)
    txtTimer.setScale(1); // Reiniciar tamaño si hicimos animaciones

    // 2. Si ya había un timer corriendo, lo matamos para evitar bugs
    if (timerEvent) timerEvent.remove();

    // 3. Crear el evento de Phaser que se repite cada 1 segundo
    timerEvent = scene.time.addEvent({
        delay: 1000,                // Esperar 1 segundo
        callback: () => {
            counter--;              // Restar 1 al contador

            if (counter > 0) {
                // Si todavía queda tiempo, actualizamos el número
                txtTimer.setText(counter);

                // Pequeña animación de "palpito" cada segundo
                scene.tweens.add({
                    targets: txtTimer,
                    scale: { from: 1.5, to: 1 }, // Se hace grande y se achica
                    alpha: { from: 1, to: 0.5 }, // Brilla y se apaga
                    duration: 400,
                    ease: 'Back.out'
                });
            } else {
                // Si llegó a 0, ocultamos el texto
                txtTimer.setAlpha(0);
            }
        },
        repeat: seconds - 1 // Repetir (5 - 1) = 4 veces más
    });
}