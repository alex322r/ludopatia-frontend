import Phaser from 'phaser';
import { io } from 'socket.io-client';

export default function initSlotsGame(containerId) {
    const config = {
        type: Phaser.AUTO,
        parent: containerId,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1280,
            height: 720,
        },
        backgroundColor: '#1a1a2e',
        scene: { preload, create, update }
    };
    return new Phaser.Game(config);
}

// Símbolos y sus colores
const SYMBOL_DATA = {
    cherry: { color: 0xff4757, emoji: '🍒' },
    lemon: { color: 0xffd32a, emoji: '🍋' },
    bell: { color: 0xffc048, emoji: '🔔' },
    star: { color: 0xffd700, emoji: '⭐' },
    seven: { color: 0xff6b6b, emoji: '7️⃣' }
};

const SYMBOLS = ['cherry', 'lemon', 'bell', 'star', 'seven'];

function preload() {
    this.load.image('felt', '/assets/felt.png');
    this.load.image('lum', '/assets/lum.png');
    this.load.spritesheet('chips', '/assets/chips.png', {
        frameWidth: 320,
        frameHeight: 320,
    });
}

function create() {
    const self = this;
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Estado del juego
    this.selectedBet = 10;
    this.chipIndex = 5;
    this.isSpinning = false;
    this.reelSymbols = [];
    this.chipButtons = [];

    // Fondo
    this.felt = this.add.tileSprite(0, 0, width, height, 'felt');
    this.felt.setOrigin(0, 0);
    this.felt.setDisplaySize(width, height);

    // --- CREAR PARTÍCULAS DE VICTORIA ---
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(15, 15, 15);
    graphics.generateTexture('coinParticle', 30, 30);

    this.victoryEmitter = this.add.particles(0, 0, 'coinParticle', {
        x: { min: 0, max: width },
        y: -50,
        speed: { min: 150, max: 400 },
        angle: { min: 0, max: 360 },
        gravityY: 300,
        lifespan: { min: 2000, max: 4000 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        tint: [0xffd700, 0xffa500, 0xffff00],
        blendMode: 'ADD',
        emitting: false
    }).setDepth(1000);

    // --- CONEXIÓN AL SERVIDOR ---
    let serverHost, protocol, port;
    if (process.env.NODE_ENV === 'development') {
        serverHost = 'localhost';
        protocol = 'http';
        port = 8082;
    } else {
        serverHost = process.env.NEXT_PUBLIC_SLOTS_SERVER_URL || process.env.NEXT_PUBLIC_GAME_SERVER_URL;
        protocol = 'https';
    }

    this.socket = io(`${protocol}://${serverHost}${port ? `:${port}` : ''}`);

    // --- CREAR MÁQUINA DE SLOTS ---
    createSlotMachine(this, centerX, centerY);

    // --- HUD INFERIOR ---
    this.add.rectangle(width / 2, height - 40, width, 80, 0x000000, 0.8);

    this.txtCredits = this.add.text(50, height - 40, 'Créditos: $---', {
        fontSize: '32px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Botones de fichas
    createChipButton(this, width - 340, height - 50, 10, 5);
    createChipButton(this, width - 220, height - 50, 50, 3);
    createChipButton(this, width - 100, height - 50, 100, 6);
    updateChipVisuals(this, 10);

    // --- BOTÓN SPIN ---
    const spinBtn = this.add.rectangle(centerX, height - 130, 200, 60, 0xd4af37)
        .setInteractive({ useHandCursor: true });

    this.spinBtnGlow = this.add.rectangle(centerX, height - 130, 210, 70, 0xffd700, 0.3);

    this.txtSpin = this.add.text(centerX, height - 130, '🎰 GIRAR', {
        fontSize: '28px', color: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Animación de brillo del botón
    this.tweens.add({
        targets: this.spinBtnGlow,
        alpha: { from: 0.3, to: 0.8 },
        scale: { from: 1, to: 1.1 },
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    spinBtn.on('pointerdown', () => {
        if (this.isSpinning) return;
        this.socket.emit('spin', { bet: this.selectedBet });
    });

    spinBtn.on('pointerover', () => spinBtn.setFillStyle(0xffd700));
    spinBtn.on('pointerout', () => spinBtn.setFillStyle(0xd4af37));

    // --- TEXTO DE RESULTADO ---
    this.txtResult = this.add.text(centerX, 100, '', {
        fontSize: '48px', color: '#ffd700', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    // Viñeta
    const vignette = this.add.image(width / 2, height / 2, 'lum');
    vignette.setDisplaySize(width, height);
    vignette.setAlpha(0.6);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // --- PANTALLA DE CARGA ---
    createLoadingScreen(this);

    // --- EVENTOS DEL SERVIDOR ---
    this.socket.on('initialState', (data) => {
        animateValue(this, this.txtCredits, data.credits, 'Créditos: $');
        removeLoadingScreen(this);
    });

    this.socket.on('spinStarted', (data) => {
        this.isSpinning = true;
        this.txtResult.setAlpha(0);
        animateValue(this, this.txtCredits, data.newBalance, 'Créditos: $');
        startSpinAnimation(this);
    });

    this.socket.on('spinResult', (data) => {
        stopSpinAnimation(this, data.reels, () => {
            this.isSpinning = false;
            animateValue(this, this.txtCredits, data.newBalance, 'Créditos: $');
            showResult(this, data);
        });
    });

    this.socket.on('error', (data) => {
        this.txtResult.setText(data.message);
        this.txtResult.setColor('#ff4444');
        this.txtResult.setAlpha(1);
        this.tweens.add({
            targets: this.txtResult,
            alpha: 0,
            delay: 2000,
            duration: 500
        });
    });

    // Cleanup
    this.events.on('destroy', () => {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
        }
    });
}

function update() { }

// --- FUNCIONES AUXILIARES ---

function createSlotMachine(scene, centerX, centerY) {
    const reelWidth = 150;
    const reelHeight = 180;
    const spacing = 20;
    const totalWidth = (reelWidth * 3) + (spacing * 2);
    const startX = centerX - totalWidth / 2 + reelWidth / 2;

    // Marco de la máquina
    const frameGraphics = scene.add.graphics();
    frameGraphics.fillStyle(0x2d2d44, 1);
    frameGraphics.fillRoundedRect(
        centerX - totalWidth / 2 - 40,
        centerY - reelHeight / 2 - 60,
        totalWidth + 80,
        reelHeight + 120,
        20
    );

    // Borde dorado
    frameGraphics.lineStyle(4, 0xd4af37, 1);
    frameGraphics.strokeRoundedRect(
        centerX - totalWidth / 2 - 40,
        centerY - reelHeight / 2 - 60,
        totalWidth + 80,
        reelHeight + 120,
        20
    );

    // Título
    scene.add.text(centerX, centerY - reelHeight / 2 - 30, '🎰 ROYAL SLOTS 🎰', {
        fontSize: '32px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Crear los 3 carretes
    scene.reelContainers = [];
    scene.reelSymbols = [];

    for (let i = 0; i < 3; i++) {
        const reelX = startX + (i * (reelWidth + spacing));

        // Fondo del carrete
        const reelBg = scene.add.rectangle(reelX, centerY, reelWidth, reelHeight, 0x111122);
        reelBg.setStrokeStyle(2, 0x444466);

        // Contenedor para símbolos (para animación)
        const container = scene.add.container(reelX, centerY);
        scene.reelContainers.push(container);

        // Símbolo principal
        const symbolText = scene.add.text(0, 0, '❓', {
            fontSize: '80px'
        }).setOrigin(0.5);
        container.add(symbolText);
        scene.reelSymbols.push(symbolText);
    }
}

function createChipButton(scene, x, y, value, index) {
    const circle = scene.add.sprite(x, y, 'chips', index).setInteractive();

    scene.add.text(x, y, value.toString(), {
        color: '#000', fontSize: '20px', fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnObj = { circle, value };
    scene.chipButtons.push(btnObj);

    circle.on('pointerdown', () => {
        scene.selectedBet = value;
        scene.chipIndex = index;
        updateChipVisuals(scene, value);
    });
}

function updateChipVisuals(scene, selectedValue) {
    scene.chipButtons.forEach(btn => {
        btn.circle.setScale(btn.value === selectedValue ? 0.3 : 0.2);
    });
}

function createLoadingScreen(scene) {
    const { width, height } = scene.scale;
    scene.loadingContainer = scene.add.container(0, 0).setDepth(9999);

    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    bg.setInteractive();
    scene.loadingContainer.add(bg);

    const loadingText = scene.add.text(width / 2, height / 2, '🎰 Conectando...', {
        fontSize: '36px', color: '#d4af37', fontStyle: 'bold'
    }).setOrigin(0.5);
    scene.loadingContainer.add(loadingText);

    scene.tweens.add({
        targets: loadingText,
        alpha: { from: 1, to: 0.5 },
        duration: 600,
        yoyo: true,
        repeat: -1
    });
}

function removeLoadingScreen(scene) {
    if (!scene.loadingContainer) return;
    scene.tweens.add({
        targets: scene.loadingContainer,
        alpha: 0,
        duration: 500,
        onComplete: () => {
            scene.loadingContainer?.destroy();
            scene.loadingContainer = null;
        }
    });
}

function animateValue(scene, textObject, targetValue, prefix = '') {
    if (!textObject) return;
    if (textObject.currentTween) {
        textObject.currentTween.remove();
    }

    const startValue = textObject.currentVal || 0;
    scene.tweens.addCounter({
        from: startValue,
        to: targetValue,
        duration: 800,
        ease: 'Power2',
        onUpdate: (tween) => {
            const value = Math.floor(tween.getValue());
            textObject.setText(`${prefix}${value}`);
            textObject.currentVal = value;
        }
    });
}

function startSpinAnimation(scene) {
    // Animar cada carrete con diferentes velocidades
    scene.spinTweens = [];

    scene.reelSymbols.forEach((symbol, index) => {
        const randomSymbols = SYMBOLS.map(s => SYMBOL_DATA[s].emoji);
        let counter = 0;

        const spinInterval = scene.time.addEvent({
            delay: 50 + (index * 10),
            callback: () => {
                symbol.setText(randomSymbols[counter % randomSymbols.length]);
                counter++;
            },
            loop: true
        });

        scene.spinTweens.push(spinInterval);

        // Efecto de blur/shake
        scene.tweens.add({
            targets: scene.reelContainers[index],
            y: { from: scene.scale.height / 2 - 5, to: scene.scale.height / 2 + 5 },
            duration: 50,
            yoyo: true,
            repeat: -1
        });
    });
}

function stopSpinAnimation(scene, reels, callback) {
    // Detener cada carrete con delay
    reels.forEach((symbolIndex, reelIndex) => {
        scene.time.delayedCall(300 + (reelIndex * 400), () => {
            // Detener el interval
            if (scene.spinTweens[reelIndex]) {
                scene.spinTweens[reelIndex].remove();
            }

            // Detener tweens del contenedor
            scene.tweens.killTweensOf(scene.reelContainers[reelIndex]);
            scene.reelContainers[reelIndex].y = scene.scale.height / 2;

            // Mostrar símbolo final con animación de rebote
            const symbolName = SYMBOLS[symbolIndex];
            const symbol = scene.reelSymbols[reelIndex];

            symbol.setText(SYMBOL_DATA[symbolName].emoji);

            scene.tweens.add({
                targets: symbol,
                scale: { from: 1.5, to: 1 },
                duration: 200,
                ease: 'Back.out'
            });

            // Efecto de impacto
            scene.cameras.main.shake(50, 0.003);

            // Callback después del último carrete
            if (reelIndex === 2) {
                scene.time.delayedCall(300, callback);
            }
        });
    });
}

function showResult(scene, data) {
    const { winType, winnings, multiplier } = data;

    if (winType === 'JACKPOT') {
        scene.txtResult.setText(`🎉 ¡JACKPOT! +$${winnings} 🎉`);
        scene.txtResult.setColor('#ffd700');
        scene.cameras.main.shake(300, 0.01);
        scene.victoryEmitter.explode(100);
    } else if (winType === 'THREE_OF_A_KIND') {
        scene.txtResult.setText(`🌟 ¡TRES IGUALES! +$${winnings}`);
        scene.txtResult.setColor('#00ff00');
        scene.victoryEmitter.explode(50);
    } else if (winType === 'TWO_OF_A_KIND') {
        scene.txtResult.setText(`✨ ¡DOS IGUALES! +$${winnings}`);
        scene.txtResult.setColor('#88ff88');
        scene.victoryEmitter.explode(20);
    } else {
        scene.txtResult.setText('Sin premio');
        scene.txtResult.setColor('#ff6666');
    }

    scene.txtResult.setAlpha(1);
    scene.tweens.add({
        targets: scene.txtResult,
        scale: { from: 0.5, to: 1 },
        duration: 300,
        ease: 'Back.out'
    });

    // Ocultar después de unos segundos
    scene.tweens.add({
        targets: scene.txtResult,
        alpha: 0,
        delay: 3000,
        duration: 500
    });
}
