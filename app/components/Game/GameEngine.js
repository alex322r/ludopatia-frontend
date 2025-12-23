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

        },

        backgroundColor: '#2d2d2d',
        scene: { preload, create, update }
    };
    return new Phaser.Game(config);
}


function preload() {

    // 2. Cargar el spritesheet
    // IMPORTANTE: frameWidth y frameHeight deben ser el tamaño EXACTO 
    // de una sola carta dentro de tu imagen grande. ¡Mídelo!
    this.load.spritesheet('cardsDeck', '/assets/cards.png', {
        frameWidth: 290,
        frameHeight: 400,


    });

    this.load.spritesheet('chips', '/assets/chips.png', {
        frameWidth: 320,
        frameHeight: 320,
    });

    this.load.image('cardBack', '/assets/back.png', {
        frameWidth: 290,
        frameHeight: 400,
    });

    this.load.image('lum', '/assets/lum.png');
    this.load.image('felt', '/assets/felt.png');



}

function create() {


    const self = this;
    //spriteLeftCard = this.add.sprite(200, 300);
    //spriteRightCard = this.add.sprite(600, 300);

    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.selectedChip = 10;
    this.realBalance = 0;
    this.chipButtons = [];
    this.isLoading = true;
    this.chipIndex = 0;

    //felt background
    this.felt = this.add.tileSprite(0, 0, width, height, 'felt');
    this.felt.setOrigin(0, 0);
    this.felt.setDisplaySize(width, height);

    this.historyGroup = this.add.group();
    this.loadingContainer = null;


    // Crear gráfico para la textura
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    graphics.fillStyle(0xffffff, 1); // Usamos BLANCO base para poder teñirlo (tint) después

    // Dibujar una estrella simple
    const points = 5;
    const outerRadius = 15;
    const innerRadius = 7;
    let step = Math.PI / points;
    let angle = -Math.PI / 2; // Empezar arriba

    graphics.beginPath();
    for (let i = 0; i < points; i++) {
        graphics.lineTo(Math.cos(angle) * outerRadius + 15, Math.sin(angle) * outerRadius + 15);
        angle += step;
        graphics.lineTo(Math.cos(angle) * innerRadius + 15, Math.sin(angle) * innerRadius + 15);
        angle += step;
    }
    graphics.closePath();
    graphics.fillPath();

    // Generar textura
    graphics.generateTexture('starParticle', 30, 30);

    // Configura el emisor (pero déjalo apagado)

    this.victoryEmitter = this.add.particles(0, 0, 'starParticle', {
        // Emitir a lo ancho de la pantalla
        x: { min: 0, max: 800 },
        y: -50, // Empezar justo fuera de la pantalla arriba

        // FISICA: Una explosión inicial que se frena
        speed: { min: 150, max: 450 },
        angle: { min: 0, max: 360 }, // Salen en todas direcciones al explotar
        gravityY: 350, // Caen pesadamente

        // VIDA Y APARIENCIA
        lifespan: { min: 2000, max: 4000 }, // Algunos duran más
        scale: { start: 0.8, end: 0 }, // Se hacen pequeños hasta desaparecer
        alpha: { start: 1, end: 0 },   // Se desvanecen suavemente
        rotate: { min: 0, max: 360 },  // Rotación inicial
        rotateSpeed: { min: 100, max: 200 }, // Giran mientras caen (efecto confeti)

        // COLORES: Una mezcla de dorado, naranja y blanco
        tint: [0xffd700, 0xffa500, 0xffffff, 0xffff00],

        // MODO DE MEZCLA: Hace que brillen al superponerse (efecto luz)
        blendMode: 'ADD',

        emitting: false
    }).setDepth(1000);





    let serverHost;
    let protocol;
    let port;
    if (process.env.NODE_ENV === 'development') {
        serverHost = '192.168.18.23';
        protocol = 'http';
        port = 8081;
    } else {
        serverHost = process.env.NEXT_PUBLIC_GAME_SERVER_URL;
        protocol = 'https';
    }


    this.socket = io(`${protocol}://${serverHost}${port ? `:${port}` : ''}`);

    createLoadingScreen(this);

    // --- INTERFAZ VISUAL ---

    // 1. Zonas de Click (Izquierda vs Derecha)
    this.zoneLeft = this.add.rectangle(width * 0.25, centerY + 160, width * 0.1, 100, 0x880000).setInteractive();
    this.zoneRight = this.add.rectangle(width * 0.75, centerY + 160, width * 0.1, 100, 0x000088).setInteractive();


    this.totalBetTextLeft = this.add.text(width * 0.23, 200, '$ 0', { fontSize: '24px' });
    this.totalBetTextRight = this.add.text(width * 0.73, 200, '$ 0', { fontSize: '24px' });

    this.txtStatus = this.add.text(centerX, height - 50, 'Esperando...', { fontSize: '20px' }).setOrigin(0.5);
    this.txtResult = this.add.text(centerX, centerY, '', { fontSize: '64px', color: '#ffff00', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);

    this.add.text(width * 0.20, 160, 'IZQUIERDA', { fontSize: '24px' });
    this.add.text(width * 0.71, 160, 'DERECHA', { fontSize: '24px' });

    this.spriteLeftCard = this.add.sprite(width * 0.25, centerY, 'cardBack').setScale(0.5);
    this.spriteRightCard = this.add.sprite(width * 0.75, centerY, 'cardBack').setScale(0.5);

    this.spriteLeftCard.setInteractive();
    this.spriteLeftCard.on('pointerdown', () => {
        this.socket.emit('apostar', { side: 'left', amount: this.selectedChip });
    });
    this.spriteRightCard.setInteractive();
    this.spriteRightCard.on('pointerdown', () => {
        this.socket.emit('apostar', { side: 'right', amount: this.selectedChip });
    });

    // 3. Estado del juego

    this.txtTimer = this.add.text(width / 2, height / 2, '', {
        fontSize: '200px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10
    }).setOrigin(0.5).setAlpha(0);

    // --- 1. INTERFAZ DE CRÉDITOS (HUD) ---
    // Fondo negro semitransparente para la UI inferior
    this.add.rectangle(width / 2, height - 40, width, 80, 0x000000, 0.7);

    // Texto de saldo
    this.txtCredits = this.add.text(50, height - 40, 'Créditos: $---', {
        fontSize: '32px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0, 0.5); // Alineado a la izquierda

    // --- 2. BOTONES DE FICHAS ---
    // Creamos 3 botones: 10, 50, 100
    createChipButton(this, width - 340, height - 50, 10, 5);
    createChipButton(this, width - 220, height - 50, 50, 3);
    createChipButton(this, width - 100, height - 50, 100, 6);

    // Marcar visualmente el de 10 como seleccionado inicialmente
    updateChipVisuals(this, 10);


    // --- EVENTOS DEL JUGADOR ---


    this.zoneLeft.on('pointerdown', (pointer) => {

        throwChipAnimation(this, pointer.x, pointer.y, width * 0.25, centerY, this.chipIndex);

        this.socket.emit('apostar', { side: 'left', amount: this.selectedChip });
        this.zoneLeft.setFillStyle(0xff0000); // Feedback visual (Brillante)
        this.zoneRight.setFillStyle(0x000044); // Opacar el otro
    });

    this.zoneRight.on('pointerdown', (pointer) => {

        throwChipAnimation(this, pointer.x, pointer.y, width * 0.75, centerY, this.chipIndex);
        this.socket.emit('apostar', { side: 'right', amount: this.selectedChip });
        this.zoneRight.setFillStyle(0x0000ff); // Feedback visual (Brillante)
        this.zoneLeft.setFillStyle(0x440000); // Opacar el otro
    });


    const vignette = this.add.image(width / 2, height / 2, 'lum');
    vignette.setDisplaySize(width, height);
    vignette.setAlpha(0.7); // Ajusta la oscuridad
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY); // Modo de fusión pro


    // --- EVENTOS DEL SERVIDOR ---

    this.socket.on('updatePools', (data) => {

        animateValue(this, this.totalBetTextLeft, data.left, '$ ');
        animateValue(this, this.totalBetTextRight, data.right, '$ ');

    })


    this.socket.on('initialState', (data) => {

        this.realBalance = data.credits;
        // 1. Actualizar datos (créditos, etc)
        animateValue(this, this.txtCredits, data.credits, 'Créditos: $');

        updateHistory(this, data.history);

        // 2. Lógica de estado (Tu código anterior para bloquear/desbloquear zonas)
        if (data.gameState === 'BETTING') {
            this.zoneLeft.setInteractive();
            this.zoneRight.setInteractive();
            this.txtStatus.setText('¡Hagan sus apuestas!');
        } else {
            // Si llegamos tarde, bloqueamos visualmente las zonas (pero ya sin pantalla de carga)
            this.txtStatus.setText('Ronda en curso... Espera la siguiente');
            this.zoneLeft.setFillStyle(0x440000);
            this.zoneRight.setFillStyle(0x000044);
            this.zoneLeft.disableInteractive();
            this.zoneRight.disableInteractive();
        }

        // 3. ¡QUITAR LA PANTALLA DE CARGA!
        removeLoadingScreen(this);
    });


    // Actualizar saldo inicial 

    // A. Nueva Ronda

    this.socket.on('newRound', (data) => {

        this.tweens.killAll();

        // Resetear visuales
        this.spriteLeftCard.setTexture('cardBack');
        this.spriteRightCard.setTexture('cardBack');

        this.txtResult.setText('');
        this.txtStatus.setText(data.message);
        this.txtStatus.setColor('#ffffff');

        // Resetear colores de zonas
        this.zoneLeft.setFillStyle(0x880000);
        this.zoneRight.setFillStyle(0x000088);

        // Habilitar clicks
        this.zoneLeft.setInteractive();
        this.zoneRight.setInteractive();

        this.totalBetTextLeft.setText('$ 0');
        this.totalBetTextRight.setText('$ 0');

        this.totalBetTextLeft.currentVal = 0;
        this.totalBetTextRight.currentVal = 0;

        //animateValue(this, this.totalBetTextLeft, 0, '$ ');
        //animateValue(this, this.totalBetTextRight, 0, '$ ');


        startCountdown(10, self);

    });

    // B. Confirmación de apuesta

    this.socket.on('apuestaConfirmada', (data) => {
        // data: { side: 'left', newBalance: 900 }

        this.realBalance = data.newBalance;

        // Si data.newBalance no existe, usaremos 0 o el texto actual para que no salga "undefined"
        const nuevoSaldo = (data.newBalance !== undefined) ? data.newBalance : 'ERROR';

        this.txtStatus.setText(`Apostaste $${this.selectedChip} a ${data.side.toUpperCase()}`);

        // Iluminar la zona seleccionada
        if (data.side === 'left') {
            this.zoneLeft.setFillStyle(0xff0000);
            this.zoneRight.setFillStyle(0x000044);
        } else {
            this.zoneRight.setFillStyle(0x0000ff);
            this.zoneLeft.setFillStyle(0x440000);
        }

    });

    this.socket.on('betsClosed', (data) => {


        if (this.txtTimer) this.txtTimer.setAlpha(0);
        if (this.timerEvent) this.timerEvent.remove();

        this.txtStatus.setText(data.message);
        this.txtStatus.setColor('#ffaa00');
        animateValue(this, this.txtCredits, this.realBalance, 'Creditos: $');

        this.zoneLeft.disableInteractive();
        this.zoneRight.disableInteractive();

        // Opcional: Bajar un poco el brillo para indicar que "se cerró"
        if (this.zoneLeft.fillColor === 0xff0000) this.zoneLeft.setFillStyle(0xaa0000);
        if (this.zoneRight.fillColor === 0x0000ff) this.zoneRight.setFillStyle(0x0000aa);

        self.tweens.add({
            targets: [this.spriteLeftCard, this.spriteRightCard],
            angle: { from: -5, to: 5 }, // Rotar un poquito
            duration: 100,
            yoyo: true,
            repeat: 50 // Repetir 10 veces (aprox 1 seg de temblor)
        });

    })

    // C. Resultado final
    this.socket.on('roundResult', (data) => {

        this.cameras.main.shake(100, 0.005);

        updateHistory(this, data.history);

        this.tweens.killAll();
        this.spriteLeftCard.setAngle(0);
        this.spriteRightCard.setAngle(0);
        // 1. Calcular qué frame necesitamos para cada carta
        const frameIndexLeft = getCardFrameIndex(data.cardLeft.value, data.cardLeft.suit);
        const frameIndexRight = getCardFrameIndex(data.cardRight.value, data.cardRight.suit);

        // 2. Cambiar la textura al spritesheet ('cardsDeck') y usar el frame calculado
        //spriteLeftCard.setTexture('cardsDeck', frameIndexLeft);
        //spriteRightCard.setTexture('cardsDeck', frameIndexRight);

        flipCard(this, this.spriteLeftCard, 'cardsDeck', frameIndexLeft);
        flipCard(this, this.spriteRightCard, 'cardsDeck', frameIndexRight);

        // 1. Mostrar las cartas
        //txtLeftCard.setText(`${data.cardLeft.display}\n${data.cardLeft.suit}`);
        //txtRightCard.setText(`${data.cardRight.display}\n${data.cardRight.suit}`);

        // 2. Deshabilitar clicks
        this.zoneLeft.disableInteractive();
        this.zoneRight.disableInteractive();

        // 3. Mostrar resultado PERSONALIZADO
        const myResult = data.results[this.socket.id];

        // Limpiamos colores previos
        this.txtResult.setColor('#ffffff');

        this.realBalance = data.results[this.socket.id].currentCredits;

        if (myResult) {

            const nuevoSaldo = myResult.currentCredits;
            animateValue(this, this.txtCredits, nuevoSaldo, 'Creditos: $');

            if (myResult.status === 'NO_BET') {
                // CASO: NO APOSTÓ
                this.txtResult.setText('NO JUGASTE');
                this.txtResult.setColor('#aaaaaa'); // Gris
                this.txtStatus.setText('Espera la siguiente ronda');
            }
            else if (myResult.status === 'WIN') {
                // CASO: GANÓ
                this.txtResult.setText('¡GANASTE!');
                this.txtResult.setColor('#00ff00'); // Verde

                this.victoryEmitter.start();

                // Detener la emisión suavemente después de 2 segundos
                this.time.delayedCall(2000, () => {
                    this.victoryEmitter.stop();
                });

            }
            else if (myResult.status === 'LOSE') {
                // CASO: PERDIÓ
                this.txtResult.setText('PERDISTE');
                this.txtResult.setColor('#ff0000'); // Rojo
            }
            else if (myResult.status === 'TIE') {
                // CASO: EMPATE (Si ambos ganan o la casa gana, depende tus reglas)
                this.txtResult.setText('¡EMPATE!');
                this.txtResult.setColor('#ffff00'); // Amarillo
            }

        }

    });

    this.events.on('destroy', () => {
        console.log("Destruyendo escena y desconectando socket...");

        // 1. Detener todas las animaciones pendientes
        this.tweens.killAll();

        // 2. Desconectar el socket para que deje de recibir mensajes
        if (this.socket) {
            this.socket.removeAllListeners(); // Dejar de escuchar eventos
            this.socket.disconnect();         // Cortar el cable
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
    scene.txtTimer.setText(counter);
    scene.txtTimer.setAlpha(0.5); // Hacemos visible el número (medio transparente)
    scene.txtTimer.setScale(1); // Reiniciar tamaño si hicimos animaciones

    // 2. Si ya había un timer corriendo, lo matamos para evitar bugs
    if (scene.timerEvent) scene.timerEvent.remove();

    // 3. Crear el evento de Phaser que se repite cada 1 segundo
    scene.timerEvent = scene.time.addEvent({
        delay: 1000,                // Esperar 1 segundo
        callback: () => {
            counter--;              // Restar 1 al contador

            if (counter > 0) {
                // Si todavía queda tiempo, actualizamos el número
                scene.txtTimer.setText(counter);

                // Pequeña animación de "palpito" cada segundo
                scene.tweens.add({
                    targets: scene.txtTimer,
                    scale: { from: 1.5, to: 1 }, // Se hace grande y se achica
                    alpha: { from: 1, to: 0.5 }, // Brilla y se apaga
                    duration: 400,
                    ease: 'Back.out'
                });
            } else {
                // Si llegó a 0, ocultamos el texto
                scene.txtTimer.setAlpha(0);
            }
        },
        repeat: seconds - 1 // Repetir (5 - 1) = 4 veces más
    });
}

function createChipButton(scene, x, y, value, index) {
    // 1. Dibujar círculo (Ficha)
    //const circle = scene.add.circle(x, y, 45, 0xffffff).setInteractive();

    const circle = scene.add.sprite(x, y, 'chips', index).setInteractive();
    //circle.setStrokeStyle(4, 0x000000); // Borde negro

    // 2. Texto del valor encima
    const text = scene.add.text(x, y, value.toString(), {
        color: '#000', fontSize: '20px', fontStyle: 'bold'
    }).setOrigin(0.5);

    // 3. Guardar referencia para cambiar colores luego
    const btnObj = { circle, value };
    scene.chipButtons.push(btnObj);

    // 4. Evento Click
    circle.on('pointerdown', () => {
        scene.selectedChip = value;
        scene.chipIndex = index;
        updateChipVisuals(scene, value);
    });
}

function updateChipVisuals(scene, selectedValue) {
    scene.chipButtons.forEach(btn => {
        if (btn.value === selectedValue) {
            btn.circle.setScale(0.3); // Un poco más grande
        } else {
            btn.circle.setScale(0.2);
        }
    });
}

function createLoadingScreen(scene) {
    const { width, height } = scene.scale;

    // 1. Contenedor: Agrupa todo para manejarlo fácil
    scene.loadingContainer = scene.add.container(0, 0);

    // IMPORTANTE: 'depth' (profundidad) alto asegura que esté ENCIMA de todo
    scene.loadingContainer.setDepth(9999);

    // 2. Fondo: Rectángulo negro/verde oscuro que tapa el juego
    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    bg.setInteractive(); // Bloquea clicks para que no pasen al juego de abajo
    scene.loadingContainer.add(bg);

    // 3. Animación: Una carta girando en el centro
    const spinnerCard = scene.add.sprite(width / 2, height / 2 - 50, 'cardBack');
    spinnerCard.setScale(0.8);
    scene.loadingContainer.add(spinnerCard);

    // Animación de giro constante (Tween)
    scene.tweens.add({
        targets: spinnerCard,
        angle: 360,
        duration: 2000,
        repeat: -1, // Infinito
        ease: 'Linear'
    });

    // 4. Texto: "Conectando al Casino..."
    const textLoading = scene.add.text(width / 2, height / 2 + 80, 'CONECTANDO AL CASINO...', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#d4af37', // Color Dorado
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Efecto de parpadeo en el texto
    scene.tweens.add({
        targets: textLoading,
        alpha: { from: 1, to: 0.5 },
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    scene.loadingContainer.add(textLoading);
}

function removeLoadingScreen(scene) {
    if (!scene.loadingContainer) return;

    // Efecto de desvanecimiento (Fade Out) elegante
    scene.tweens.add({
        targets: scene.loadingContainer,
        alpha: 0,
        duration: 1000, // Tarda 1 segundo en desaparecer
        onComplete: () => {
            if (scene.loadingContainer) {
                scene.loadingContainer.destroy(); // Eliminar de la memoria
                scene.loadingContainer = null;
            }
            scene.isLoading = false;
        }
    });
}

function flipCard(scene, sprite, texture, frameIndex) {

    scene.tweens.add({
        targets: sprite,
        scaleX: 0,
        duration: 250,
        ease: 'Linear',
        onComplete: () => {
            sprite.setTexture(texture, frameIndex);
            scene.tweens.add({
                targets: sprite,
                scaleX: 0.5,
                duration: 250,
                ease: 'Linear'
            })
        }
    })

}

function updateHistory(scene, historyArray) {

    if (!historyArray) historyArray = []

    if (scene.historyGroup) {
        // destroy(true) removes children and the group itself safely
        scene.historyGroup.clear(true, true);
    } else {
        // Always create a fresh group
        scene.historyGroup = scene.add.group();
    }
    const startX = scene.scale.width / 2 - (historyArray.length * 20);
    const y = 50;

    historyArray.forEach((winner, index) => {

        let color = 0xffffff;
        if (winner === 'left') color = 0xff0000;
        else if (winner === 'right') color = 0x00ff00;
        else color = 0xffff00;

        const dot = scene.add.circle(startX + (index * 40), y, 10, color);
        dot.setStrokeStyle(2, 0xffffff);
        scene.historyGroup.add(dot);


    })
}

function animateValue(scene, textObject, targetValue, prefix = '') {


    if (!textObject) return;
    if (textObject.currentTween) {
        textObject.currentTween.remove();
        textObject.currentTween = null;
    }

    const startValue = textObject.currentVal || 0;

    scene.tweens.addCounter({
        from: startValue,
        to: targetValue,
        duration: 1000,
        ease: 'Power2',
        onUpdate: (tween) => {
            const value = Math.floor(tween.getValue());
            //console.log("Animating value", value);
            textObject.setText(`${prefix}${value}`);
            textObject.currentVal = value;


        }
    })

}

function throwChipAnimation(scene, startX, startY, endX, endY, value) {
    // 1. Crear un sprite temporal de ficha
    const tempChip = scene.add.sprite(startX, startY, 'chips', value);

    // 2. Animar movimiento hacia la zona
    scene.tweens.add({
        targets: tempChip,
        x: endX,
        y: endY,
        scale: { from: 1, to: 0.5 }, // Se aleja (perspectiva)
        duration: 400,
        ease: 'Back.out', // Efecto de rebote al llegar
        onComplete: () => {
            // 3. Destruir ficha y hacer un pequeño "flash" en la zona
            tempChip.destroy();

            // Efecto de impacto en la zona de destino
            const impact = scene.add.circle(endX, endY, 30, 0xffffff, 0.5);
            scene.tweens.add({
                targets: impact,
                scale: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => impact.destroy()
            });
        }
    });
}