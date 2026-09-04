/* =========================================================
   ELINA MUSHROOM ADVENTURE
   Professional Canvas Game Engine
   ========================================================= */

"use strict";

/* =========================
   DOM
========================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mainMenu = document.getElementById("mainMenu");
const worldMenu = document.getElementById("worldMenu");
const levelMenu = document.getElementById("levelMenu");
const gameScreen = document.getElementById("gameScreen");

const pauseMenu = document.getElementById("pauseMenu");
const gameOverMenu = document.getElementById("gameOverMenu");
const winMenu = document.getElementById("winMenu");

const startGame = document.getElementById("startGame");
const worldSelect = document.getElementById("worldSelect");
const settingsButton = document.getElementById("settingsButton");

const backFromWorlds = document.getElementById("backFromWorlds");
const backFromLevels = document.getElementById("backFromLevels");

const levelList = document.getElementById("levelList");

const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const exitButton = document.getElementById("exitButton");

const tryAgainButton = document.getElementById("tryAgainButton");
const gameOverHome = document.getElementById("gameOverHome");

const nextLevelButton = document.getElementById("nextLevelButton");
const winHomeButton = document.getElementById("winHomeButton");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const jumpButton = document.getElementById("jumpButton");
const shootButton = document.getElementById("shootButton");

const livesEl = document.getElementById("lives");
const coinsEl = document.getElementById("coins");
const scoreEl = document.getElementById("score");
const currentWorldEl = document.getElementById("currentWorld");
const currentLevelEl = document.getElementById("currentLevel");

const finalScoreEl = document.getElementById("finalScore");
const winScoreEl = document.getElementById("winScore");

const gameMessage = document.getElementById("gameMessage");


/* =========================
   CANVAS
========================= */

let W = 960;
let H = 540;
let DPR = 1;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    W = Math.max(320, rect.width);
    H = Math.max(240, rect.height);

    DPR = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (level && gameRunning) {
        repositionLevel();
    }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => {
    setTimeout(resizeCanvas, 150);
});


/* =========================
   GAME STATE
========================= */

let gameRunning = false;
let paused = false;
let animationId = null;
let sessionId = 0;

let currentWorld = 1;
let currentLevel = 1;

let score = 0;
let coins = 0;
let lives = 3;
let ammo = 7;

let soundEnabled = true;

let cameraX = 0;

let level = null;

let keys = {
    left: false,
    right: false,
    jump: false,
    shoot: false
};

let previousTime = 0;


/* =========================
   WORLD DATA
========================= */

const WORLDS = {
    1: {
        name: "جنگل",
        theme: "forest",
        skyTop: "#55c9ff",
        skyBottom: "#dff9ff",
        ground: "#80512d",
        grass: "#57bd35"
    },

    2: {
        name: "برف",
        theme: "snow",
        skyTop: "#9de6ff",
        skyBottom: "#f7ffff",
        ground: "#8ba4b5",
        grass: "#ffffff"
    },

    3: {
        name: "آب",
        theme: "water",
        skyTop: "#249bd4",
        skyBottom: "#b8f2ff",
        ground: "#267b86",
        grass: "#42d6c0"
    },

    4: {
        name: "آتش",
        theme: "fire",
        skyTop: "#3b1820",
        skyBottom: "#e35a28",
        ground: "#492b29",
        grass: "#df6b22"
    }
};


/* =========================
   PLAYER
========================= */

const player = {
    x: 100,
    y: 100,

    width: 44,
    height: 64,

    vx: 0,
    vy: 0,

    speed: 5.2,
    jumpPower: 13.5,

    direction: 1,

    onGround: false,

    coyote: 0,

    animFrame: 0,
    animTimer: 0,

    state: "idle",

    invincible: 0,
    shootCooldown: 0,

    blinkTimer: 0
};


/* =========================
   ARRAYS
========================= */

let particles = [];
let bullets = [];
let floatingTexts = [];
let decorations = [];


/* =========================
   AUDIO
========================= */

let audioContext = null;

function ensureAudio() {
    if (!soundEnabled) return;

    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            audioContext = null;
        }
    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }
}

function playTone(frequency, duration, type = "sine", volume = 0.035) {
    if (!soundEnabled) return;

    ensureAudio();

    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {}
}

function playSfx(name) {
    if (!soundEnabled) return;

    if (name === "jump") {
        playTone(420, 0.08, "square", 0.025);
        setTimeout(() => playTone(620, 0.08, "square", 0.02), 35);
    }

    if (name === "coin") {
        playTone(780, 0.07, "sine", 0.035);
        setTimeout(() => playTone(1100, 0.09, "sine", 0.025), 45);
    }

    if (name === "shoot") {
        playTone(230, 0.06, "sawtooth", 0.025);
    }

    if (name === "stomp") {
        playTone(110, 0.09, "square", 0.03);
    }

    if (name === "hurt") {
        playTone(160, 0.15, "sawtooth", 0.03);
    }

    if (name === "win") {
        playTone(523, 0.12, "sine", 0.035);

        setTimeout(() => {
            playTone(659, 0.12, "sine", 0.035);
        }, 100);

        setTimeout(() => {
            playTone(784, 0.18, "sine", 0.04);
        }, 210);
    }
}


/* =========================
   UTILS
========================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
}

function rectsOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


/* =========================
   SAVE DATA
========================= */

function saveBestScore() {
    try {
        const oldScore = Number(localStorage.getItem("elinaBestScore") || 0);

        if (score > oldScore) {
            localStorage.setItem("elinaBestScore", String(score));
        }
    } catch (e) {}
}


/* =========================
   MENU
========================= */

function showOnly(section) {
    mainMenu.classList.add("hidden");
    worldMenu.classList.add("hidden");
    levelMenu.classList.add("hidden");
    gameScreen.classList.add("hidden");

    if (section) {
        section.classList.remove("hidden");
    }
}

function openMainMenu() {
    gameRunning = false;
    paused = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    pauseMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
    winMenu.classList.add("hidden");

    showOnly(mainMenu);
}

function openWorldMenu() {
    gameRunning = false;
    showOnly(worldMenu);
}

function openLevelMenu(worldNumber) {
    currentWorld = worldNumber;

    levelList.innerHTML = "";

    for (let i = 1; i <= 10; i++) {
        const button = document.createElement("button");

        button.className = "world-card";
        button.innerHTML = `
            <span class="world-icon">${i === 10 ? "👑" : "⭐"}</span>
            <span>مرحله ${i}</span>
            <small>LEVEL ${i}</small>
        `;

        button.addEventListener("click", () => {
            startGameAt(currentWorld, i);
        });

        levelList.appendChild(button);
    }

    showOnly(levelMenu);
}


/* =========================
   MENU EVENTS
========================= */

startGame.addEventListener("click", () => {
    ensureAudio();
    startGameAt(currentWorld, currentLevel);
});

worldSelect.addEventListener("click", () => {
    openWorldMenu();
});

settingsButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    settingsButton.textContent =
        soundEnabled ? "🔊 صدا: روشن" : "🔇 صدا: خاموش";

    ensureAudio();
});

backFromWorlds.addEventListener("click", () => {
    openMainMenu();
});

backFromLevels.addEventListener("click", () => {
    openWorldMenu();
});

document.querySelectorAll(".world-card").forEach(card => {
    card.addEventListener("click", () => {
        const world = Number(card.dataset.world);
        openLevelMenu(world);
    });
});

pauseButton.addEventListener("click", togglePause);

resumeButton.addEventListener("click", () => {
    paused = false;
    pauseMenu.classList.add("hidden");
});

restartButton.addEventListener("click", () => {
    pauseMenu.classList.add("hidden");
    startGameAt(currentWorld, currentLevel);
});

exitButton.addEventListener("click", () => {
    openMainMenu();
});

tryAgainButton.addEventListener("click", () => {
    gameOverMenu.classList.add("hidden");
    startGameAt(currentWorld, currentLevel);
});

gameOverHome.addEventListener("click", () => {
    openMainMenu();
});

nextLevelButton.addEventListener("click", () => {
    winMenu.classList.add("hidden");

    if (currentLevel < 10) {
        startGameAt(currentWorld, currentLevel + 1);
    } else if (currentWorld < 4) {
        startGameAt(currentWorld + 1, 1);
    } else {
        openMainMenu();
    }
});

winHomeButton.addEventListener("click", () => {
    openMainMenu();
});


/* =========================
   KEYBOARD
========================= */

window.addEventListener("keydown", e => {
    ensureAudio();

    if (
        e.key === "ArrowLeft" ||
        e.key.toLowerCase() === "a"
    ) {
        keys.left = true;
        e.preventDefault();
    }

    if (
        e.key === "ArrowRight" ||
        e.key.toLowerCase() === "d"
    ) {
        keys.right = true;
        e.preventDefault();
    }

    if (
        e.key === "ArrowUp" ||
        e.key === " " ||
        e.key.toLowerCase() === "w"
    ) {
        if (!keys.jump) {
            jump();
        }

        keys.jump = true;
        e.preventDefault();
    }

    if (
        e.key.toLowerCase() === "f" ||
        e.key.toLowerCase() === "x"
    ) {
        keys.shoot = true;
        e.preventDefault();
    }

    if (e.key === "Escape") {
        togglePause();
    }
});

window.addEventListener("keyup", e => {
    if (
        e.key === "ArrowLeft" ||
        e.key.toLowerCase() === "a"
    ) {
        keys.left = false;
    }

    if (
        e.key === "ArrowRight" ||
        e.key.toLowerCase() === "d"
    ) {
        keys.right = false;
    }

    if (
        e.key === "ArrowUp" ||
        e.key === " " ||
        e.key.toLowerCase() === "w"
    ) {
        keys.jump = false;
    }

    if (
        e.key.toLowerCase() === "f" ||
        e.key.toLowerCase() === "x"
    ) {
        keys.shoot = false;
    }
});


/* =========================
   MOBILE CONTROLS
========================= */

function holdButton(button, down, up) {
    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        ensureAudio();
        down();
    });

    button.addEventListener("pointerup", e => {
        e.preventDefault();
        up();
    });

    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
}

holdButton(
    leftButton,
    () => keys.left = true,
    () => keys.left = false
);

holdButton(
    rightButton,
    () => keys.right = true,
    () => keys.right = false
);

holdButton(
    jumpButton,
    () => {
        if (!keys.jump) {
            jump();
        }

        keys.jump = true;
    },
    () => keys.jump = false
);

holdButton(
    shootButton,
    () => keys.shoot = true,
    () => keys.shoot = false
);


/* =========================
   LEVEL CREATION
========================= */

function createLevel(worldNumber, levelNumber) {
    const worldData = WORLDS[worldNumber];

    const width = 5200 + levelNumber * 180;

    const groundY = H * 0.78;

    const newLevel = {
        width,
        groundY,
        platforms: [],
        coins: [],
        enemies: [],
        bullets: [],
        flag: null,
        boss: null,
        cage: null
    };

    /* Ground */

    newLevel.ground = {
        x: 0,
        y: groundY,
        width: width,
        height: 400
    };


    /* Platforms */

    const platformCount = 14 + levelNumber;

    for (let i = 0; i < platformCount; i++) {
        const x = 380 + i * 330 + random(-60, 70);

        const offsetY = random(-190, -70);

        const widthPlatform = random(120, 220);

        newLevel.platforms.push({
            x,
            y: groundY + offsetY,
            baseOffset: offsetY,
            width: widthPlatform,
            height: 30
        });
    }


    /* Coins */

    for (let i = 0; i < 65 + levelNumber * 4; i++) {
        let x;
        let y;

        if (i % 3 === 0) {
            x = 250 + i * 72;
            y = groundY - random(75, 155);
        } else {
            x = 180 + i * 80;
            y = groundY - random(30, 100);
        }

        newLevel.coins.push({
            x,
            y,
            radius: 12,
            collected: false,
            rotation: random(0, Math.PI * 2),
            baseY: y
        });
    }


    /* Enemies */

    const enemyCount = 7 + Math.floor(levelNumber / 2);

    for (let i = 0; i < enemyCount; i++) {
        const x = 600 + i * 520 + random(-100, 100);

        let type;

        if (worldNumber === 1) {
            const types = ["snail", "bee", "turtle"];
            type = types[i % types.length];
        } else if (worldNumber === 2) {
            type = "snow";
        } else if (worldNumber === 3) {
            type = "fish";
        } else {
            type = "fireball";
        }

        const enemy = {
            type,
            x,
            y: groundY - 42,
            baseY: groundY - 42,

            width: 48,
            height: 42,

            vx: type === "bee" ? 1.5 : 1.2,
            vy: 0,

            direction: 1,

            startX: x,

            patrol: random(100, 180),

            alive: true,

            anim: random(0, 10),

            phase: random(0, Math.PI * 2)
        };

        if (type === "bee") {
            enemy.baseY = groundY - random(110, 190);
            enemy.y = enemy.baseY;
        }

        if (type === "fish") {
            enemy.baseY = groundY - random(90, 180);
            enemy.y = enemy.baseY;
        }

        newLevel.enemies.push(enemy);
    }


    /* Flag */

    newLevel.flag = {
        x: width - 400,
        y: groundY - 125,
        width: 24,
        height: 125
    };


    /* Father cage */

    newLevel.cage = {
        x: width - 280,
        y: groundY - 120,
        width: 90,
        height: 120
    };


    /* Boss */

    if (levelNumber === 10) {
        newLevel.boss = {
            type: worldNumber === 1 ? "forestBoss" : "boss",

            x: width - 720,
            y: groundY - 105,

            width: 100,
            height: 105,

            vx: 1.5,
            vy: 0,

            health: 10,
            maxHealth: 10,

            alive: true,

            direction: -1,

            attackTimer: 0
        };
    }

    return newLevel;
}


/* =========================
   RESPONSIVE LEVEL
========================= */

function repositionLevel() {
    if (!level) return;

    const oldGround = level.groundY;
    const newGround = H * 0.78;

    const difference = newGround - oldGround;

    level.groundY = newGround;

    level.ground.y = newGround;

    level.platforms.forEach(platform => {
        platform.y = newGround + platform.baseOffset;
    });

    level.coins.forEach(coin => {
        coin.y = coin.baseY + difference;
        coin.baseY = coin.y;
    });

    level.enemies.forEach(enemy => {
        if (enemy.type === "bee" || enemy.type === "fish") {
            enemy.y += difference;
            enemy.baseY += difference;
        } else {
            enemy.y = newGround - enemy.height;
            enemy.baseY = enemy.y;
        }
    });

    level.flag.y = newGround - level.flag.height;

    level.cage.y = newGround - level.cage.height;

    if (level.boss) {
        level.boss.y = newGround - level.boss.height;
    }
}


/* =========================
   START GAME
========================= */

function startGameAt(worldNumber, levelNumber) {
    ensureAudio();

    currentWorld = clamp(worldNumber, 1, 4);
    currentLevel = clamp(levelNumber, 1, 10);

    score = 0;
    coins = 0;
    lives = 3;
    ammo = 7;

    cameraX = 0;

    player.x = 100;
    player.y = 100;
    player.vx = 0;
    player.vy = 0;
    player.direction = 1;
    player.onGround = false;
    player.invincible = 0;
    player.shootCooldown = 0;

    particles = [];
    bullets = [];
    floatingTexts = [];
    decorations = [];

    level = createLevel(currentWorld, currentLevel);

    resizeCanvas();

    updateHUD();

    pauseMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
    winMenu.classList.add("hidden");

    showOnly(gameScreen);

    gameRunning = true;
    paused = false;

    sessionId++;

    const thisSession = sessionId;

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    previousTime = performance.now();

    function loop(time) {
        if (!gameRunning || thisSession !== sessionId) return;

        const dt = Math.min((time - previousTime) / 16.6667, 2);

        previousTime = time;

        if (!paused) {
            update(dt);
        }

        draw();

        animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);
}


/* =========================
   UPDATE
========================= */

function update(dt) {
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);

    collectCoins();
    checkEnemyCollision();

    updateCamera(dt);

    if (level.boss && level.boss.alive) {
        updateBoss(dt);
    }

    checkFlag();

    player.animTimer += dt;

    if (player.animTimer > 6) {
        player.animTimer = 0;
        player.animFrame++;
    }
}


/* =========================
   PLAYER UPDATE
========================= */

function updatePlayer(dt) {
    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    if (player.shootCooldown > 0) {
        player.shootCooldown -= dt;
    }

    let targetSpeed = 0;

    if (keys.left) {
        targetSpeed -= player.speed;
        player.direction = -1;
    }

    if (keys.right) {
        targetSpeed += player.speed;
        player.direction = 1;
    }

    player.vx += (targetSpeed - player.vx) * 0.25 * dt;

    if (!keys.left && !keys.right) {
        player.vx *= Math.pow(0.78, dt);
    }

    player.vy += 0.65 * dt;

    if (player.vy > 16) {
        player.vy = 16;
    }

    const oldY = player.y;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = clamp(
        player.x,
        20,
        level.width - player.width - 20
    );

    player.onGround = false;

    /* Ground */

    if (
        player.y + player.height >= level.groundY &&
        player.vy >= 0
    ) {
        player.y = level.groundY - player.height;
        player.vy = 0;
        player.onGround = true;
    }


    /* Platforms */

    for (const platform of level.platforms) {
        const wasAbove =
            oldY + player.height <= platform.y + 8;

        const nowBelow =
            player.y + player.height >= platform.y;

        const horizontal =
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width;

        if (
            wasAbove &&
            nowBelow &&
            horizontal &&
            player.vy >= 0
        ) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;
        }
    }


    /* State */

    if (!player.onGround) {
        player.state = player.vy < 0 ? "jump" : "fall";
    } else if (Math.abs(player.vx) > 0.5) {
        player.state = "run";
    } else {
        player.state = "idle";
    }


    /* Run dust */

    if (
        player.onGround &&
        Math.abs(player.vx) > 2 &&
        Math.random() < 0.10 * dt
    ) {
        spawnParticles(
            player.x + player.width / 2,
            player.y + player.height - 3,
            "dust",
            1
        );
    }


    /* Shoot */

    if (keys.shoot) {
        shoot();
    }
}


/* =========================
   JUMP
========================= */

function jump() {
    if (!gameRunning || paused) return;

    if (player.onGround) {
        player.vy = -player.jumpPower;
        player.onGround = false;

        spawnParticles(
            player.x + player.width / 2,
            player.y + player.height,
            "jump",
            7
        );

        playSfx("jump");
    }
}


/* =========================
   SHOOT
========================= */

function shoot() {
    if (!gameRunning || paused) return;

    if (player.shootCooldown > 0) return;

    if (ammo <= 0) {
        return;
    }

    ammo--;

    player.shootCooldown = 15;

    const startX =
        player.direction === 1
            ? player.x + player.width
            : player.x - 8;

    const startY = player.y + 29;

    bullets.push({
        x: startX,
        y: startY,

        vx: player.direction * 10,

        radius: 6,

        life: 80,

        direction: player.direction
    });

    spawnParticles(startX, startY, "spark", 5);

    playSfx("shoot");
}


/* =========================
   BULLETS
========================= */

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            bullet.x < -100 ||
            bullet.x > level.width + 100
        ) {
            bullets.splice(i, 1);
            continue;
        }

        for (const enemy of level.enemies) {
            if (!enemy.alive) continue;

            if (
                bullet.x + bullet.radius > enemy.x &&
                bullet.x - bullet.radius < enemy.x + enemy.width &&
                bullet.y + bullet.radius > enemy.y &&
                bullet.y - bullet.radius < enemy.y + enemy.height
            ) {
                enemy.alive = false;

                score += 100;

                spawnParticles(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    "hit",
                    14
                );

                floatingTexts.push({
                    x: enemy.x,
                    y: enemy.y,
                    text: "+100",
                    life: 45
                });

                playSfx("stomp");

                bullets.splice(i, 1);

                break;
            }
        }


        /* Boss bullet hit */

        if (
            level.boss &&
            level.boss.alive &&
            bullet.x + bullet.radius > level.boss.x &&
            bullet.x - bullet.radius <
                level.boss.x + level.boss.width &&
            bullet.y + bullet.radius > level.boss.y &&
            bullet.y - bullet.radius <
                level.boss.y + level.boss.height
        ) {
            level.boss.health--;

            spawnParticles(
                bullet.x,
                bullet.y,
                "hit",
                8
            );

            bullets.splice(i, 1);

            if (level.boss.health <= 0) {
                level.boss.alive = false;

                score += 1000;

                spawnParticles(
                    level.boss.x + level.boss.width / 2,
                    level.boss.y + level.boss.height / 2,
                    "star",
                    40
                );

                playSfx("win");
            }
        }
    }
}


/* =========================
   ENEMIES
========================= */

function updateEnemies(dt) {
    for (const enemy of level.enemies) {
        if (!enemy.alive) continue;

        enemy.anim += dt;

        if (
            enemy.type === "bee" ||
            enemy.type === "fish"
        ) {
            enemy.x += enemy.vx * enemy.direction * dt;

            enemy.y =
                enemy.baseY +
                Math.sin(
                    enemy.anim * 0.08 +
                    enemy.phase
                ) * 22;

            if (
                enemy.x > enemy.startX + enemy.patrol ||
                enemy.x < enemy.startX - enemy.patrol
            ) {
                enemy.direction *= -1;
            }

            continue;
        }

        enemy.x += enemy.vx * enemy.direction * dt;

        if (
            enemy.x > enemy.startX + enemy.patrol ||
            enemy.x < enemy.startX - enemy.patrol
        ) {
            enemy.direction *= -1;
        }

        enemy.y = level.groundY - enemy.height;
    }
}


/* =========================
   BOSS
========================= */

function updateBoss(dt) {
    const boss = level.boss;

    if (!boss || !boss.alive) return;

    boss.attackTimer += dt;

    boss.x += boss.vx * boss.direction * dt;

    if (
        boss.x < level.width - 1100 ||
        boss.x > level.width - 450
    ) {
        boss.direction *= -1;
    }

    boss.y = level.groundY - boss.height;
}


/* =========================
   COINS
========================= */

function collectCoins() {
    for (const coin of level.coins) {
        if (coin.collected) continue;

        const dx =
            player.x + player.width / 2 - coin.x;

        const dy =
            player.y + player.height / 2 - coin.y;

        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 35) {
            coin.collected = true;

            coins++;
            score += 25;

            spawnParticles(
                coin.x,
                coin.y,
                "coin",
                12
            );

            floatingTexts.push({
                x: coin.x,
                y: coin.y,
                text: "+25",
                life: 40
            });

            playSfx("coin");

            updateHUD();
        }
    }
}


/* =========================
   ENEMY COLLISION
========================= */

function checkEnemyCollision() {
    if (player.invincible > 0) return;

    for (const enemy of level.enemies) {
        if (!enemy.alive) continue;

        if (rectsOverlap(player, enemy)) {
            const playerBottom =
                player.y + player.height;

            const enemyTop = enemy.y;

            /* Stomp */

            if (
                player.vy > 0 &&
                playerBottom - enemyTop < 24
            ) {
                enemy.alive = false;

                player.vy = -9;

                score += 100;

                spawnParticles(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    "hit",
                    14
                );

                floatingTexts.push({
                    x: enemy.x,
                    y: enemy.y,
                    text: "+100",
                    life: 45
                });

                playSfx("stomp");

                continue;
            }

            damagePlayer();

            break;
        }
    }


    /* Boss collision */

    if (
        level.boss &&
        level.boss.alive &&
        rectsOverlap(player, level.boss)
    ) {
        damagePlayer();
    }
}


/* =========================
   DAMAGE
========================= */

function damagePlayer() {
    if (player.invincible > 0) return;

    lives--;

    player.invincible = 110;

    player.vx =
        player.direction === 1
            ? -7
            : 7;

    player.vy = -8;

    spawnParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        "hit",
        16
    );

    playSfx("hurt");

    updateHUD();

    if (lives <= 0) {
        gameOver();
    }
}


/* =========================
   FLAG / WIN
========================= */

function checkFlag() {
    if (!level.flag) return;

    const flagArea = {
        x: level.flag.x - 15,
        y: level.flag.y,
        width: 60,
        height: level.flag.height
    };

    if (
        rectsOverlap(player, flagArea) &&
        (!level.boss || !level.boss.alive)
    ) {
        winLevel();
    }
}


/* =========================
   WIN
========================= */

function winLevel() {
    if (!gameRunning) return;

    gameRunning = false;

    saveBestScore();

    spawnParticles(
        player.x,
        player.y,
        "star",
        35
    );

    playSfx("win");

    winScoreEl.textContent = score;

    winMenu.classList.remove("hidden");

    if (
        currentWorld === 4 &&
        currentLevel === 10
    ) {
        nextLevelButton.textContent = "🏆 پایان ماجراجویی";
    } else if (currentLevel === 10) {
        nextLevelButton.textContent = "🌍 دنیای بعد";
    } else {
        nextLevelButton.textContent = "🚩 مرحله بعد";
    }
}


/* =========================
   GAME OVER
========================= */

function gameOver() {
    gameRunning = false;

    saveBestScore();

    finalScoreEl.textContent = score;

    gameOverMenu.classList.remove("hidden");
}


/* =========================
   PAUSE
========================= */

function togglePause() {
    if (!gameRunning) return;

    paused = !paused;

    if (paused) {
        pauseMenu.classList.remove("hidden");
    } else {
        pauseMenu.classList.add("hidden");
    }
}


/* =========================
   CAMERA
========================= */

function updateCamera(dt) {
    const target =
        player.x - W * 0.35;

    cameraX +=
        (target - cameraX) *
        0.08 *
        dt;

    cameraX = clamp(
        cameraX,
        0,
        Math.max(0, level.width - W)
    );
}


/* =========================
   PARTICLES
========================= */

function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        let particle = {
            x,
            y,

            vx: random(-3, 3),
            vy: random(-4, 1),

            life: random(20, 45),
            maxLife: 45,

            size: random(2, 6),

            type
        };

        if (type === "dust") {
            particle.vx = random(-1.5, 1.5);
            particle.vy = random(-1.5, 0);
            particle.size = random(3, 7);
        }

        if (type === "coin") {
            particle.vx = random(-3, 3);
            particle.vy = random(-4, -1);
            particle.size = random(2, 5);
        }

        if (type === "star") {
            particle.vx = random(-5, 5);
            particle.vy = random(-6, 2);
            particle.size = random(3, 7);
        }

        if (type === "spark") {
            particle.vx = random(-5, 5);
            particle.vy = random(-5, 5);
            particle.size = random(2, 4);
        }

        particles.push(particle);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vy += 0.12 * dt;

        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        const alpha =
            clamp(p.life / p.maxLife, 0, 1);

        ctx.globalAlpha = alpha;

        if (p.type === "dust") {
            ctx.fillStyle = "#d8c4a4";

            ctx.beginPath();
            ctx.arc(
                p.x - cameraX,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        else if (p.type === "coin") {
            ctx.fillStyle = "#ffd83d";

            ctx.beginPath();
            ctx.arc(
                p.x - cameraX,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        else if (p.type === "hit") {
            ctx.fillStyle =
                Math.random() > 0.5
                    ? "#ffcc33"
                    : "#ffffff";

            ctx.beginPath();
            ctx.arc(
                p.x - cameraX,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        else if (p.type === "star") {
            drawStar(
                p.x - cameraX,
                p.y,
                p.size,
                "#ffe66d"
            );
        }

        else {
            ctx.fillStyle = "#fff3a1";

            ctx.beginPath();
            ctx.arc(
                p.x - cameraX,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}


/* =========================
   FLOATING TEXT
========================= */

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const text = floatingTexts[i];

        text.y -= 0.7 * dt;
        text.life -= dt;

        if (text.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function drawFloatingTexts() {
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";

    for (const text of floatingTexts) {
        ctx.globalAlpha =
            clamp(text.life / 40, 0, 1);

        ctx.fillStyle = "#fff7a8";

        ctx.strokeStyle = "#7b4b16";
        ctx.lineWidth = 4;

        ctx.strokeText(
            text.text,
            text.x - cameraX,
            text.y
        );

        ctx.fillText(
            text.text,
            text.x - cameraX,
            text.y
        );
    }

    ctx.globalAlpha = 1;
}


/* =========================
   DRAW
========================= */

function draw() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();

    ctx.save();

    drawWorldDecorations();

    drawPlatforms();

    drawCoins();

    drawEnemies();

    if (level.boss && level.boss.alive) {
        drawBoss(level.boss);
    }

    drawFlag();

    drawCage();

    drawBullets();

    drawPlayer();

    ctx.restore();

    drawParticles();

    drawFloatingTexts();
}


/* =========================
   BACKGROUND
========================= */

function drawBackground() {
    const world = WORLDS[currentWorld];

    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        H
    );

    gradient.addColorStop(0, world.skyTop);
    gradient.addColorStop(1, world.skyBottom);

    ctx.fillStyle = gradient;

    ctx.fillRect(0, 0, W, H);

    if (world.theme === "forest") {
        drawForestBackground();
    }

    if (world.theme === "snow") {
        drawSnowBackground();
    }

    if (world.theme === "water") {
        drawWaterBackground();
    }

    if (world.theme === "fire") {
        drawFireBackground();
    }
}


/* =========================
   FOREST BACKGROUND
========================= */

function drawForestBackground() {
    /* Sun */

    const sunX = W * 0.78;
    const sunY = H * 0.18;

    const sunGradient = ctx.createRadialGradient(
        sunX,
        sunY,
        5,
        sunX,
        sunY,
        100
    );

    sunGradient.addColorStop(0, "rgba(255,255,190,0.9)");
    sunGradient.addColorStop(1, "rgba(255,255,190,0)");

    ctx.fillStyle = sunGradient;

    ctx.beginPath();
    ctx.arc(sunX, sunY, 100, 0, Math.PI * 2);
    ctx.fill();


    /* Clouds */

    drawCloud(130, 90, 1.1);
    drawCloud(450, 70, 0.8);
    drawCloud(770, 120, 1);


    /* Mountains */

    ctx.fillStyle = "#72abc0";

    drawMountain(0, H * 0.58, 250, 230);
    drawMountain(180, H * 0.60, 330, 260);
    drawMountain(430, H * 0.58, 300, 220);
    drawMountain(680, H * 0.60, 340, 250);
    drawMountain(880, H * 0.58, 280, 230);


    /* Far forest */

    drawTree(70, H * 0.54, 1.2, true);
    drawTree(220, H * 0.55, 0.9, true);
    drawTree(360, H * 0.52, 1.1, true);
    drawTree(520, H * 0.54, 0.9, true);
    drawTree(700, H * 0.53, 1.2, true);
    drawTree(850, H * 0.54, 1, true);
}


/* =========================
   OTHER BACKGROUNDS
========================= */

function drawSnowBackground() {
    drawCloud(150, 80, 1);
    drawCloud(650, 110, 1.2);

    ctx.fillStyle = "#d9f4ff";

    drawMountain(0, H * 0.65, 300, 260);
    drawMountain(260, H * 0.65, 360, 290);
    drawMountain(600, H * 0.65, 330, 280);

    for (let i = 0; i < 50; i++) {
        const x = (i * 97) % W;
        const y = (i * 53) % H;

        ctx.fillStyle = "rgba(255,255,255,0.7)";

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWaterBackground() {
    drawCloud(180, 90, 1);
    drawCloud(700, 100, 1.2);

    ctx.fillStyle = "#54a8b9";

    drawMountain(0, H * 0.62, 280, 230);
    drawMountain(300, H * 0.62, 350, 250);
    drawMountain(680, H * 0.62, 300, 230);

    ctx.fillStyle = "rgba(255,255,255,0.35)";

    for (let i = 0; i < 12; i++) {
        ctx.fillRect(
            (i * 100) % W,
            H * 0.65 + (i % 3) * 8,
            50,
            3
        );
    }
}

function drawFireBackground() {
    ctx.fillStyle = "rgba(255,170,50,0.25)";

    for (let i = 0; i < 25; i++) {
        const x = (i * 83) % W;
        const y = H - ((i * 47) % 250);

        ctx.beginPath();
        ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = "#572d2b";

    for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 180, H * 0.66);
        ctx.lineTo(i * 180 + 90, H * 0.48);
        ctx.lineTo(i * 180 + 180, H * 0.66);
        ctx.closePath();
        ctx.fill();
    }
}


/* =========================
   CLOUD
========================= */

function drawCloud(x, y, scale) {
    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(255,255,255,0.92)";

    ctx.beginPath();

    ctx.arc(-35, 10, 28, 0, Math.PI * 2);
    ctx.arc(0, -5, 35, 0, Math.PI * 2);
    ctx.arc(38, 8, 27, 0, Math.PI * 2);

    ctx.fillRect(-55, 5, 110, 30);

    ctx.fill();

    ctx.restore();
}


/* =========================
   MOUNTAIN
========================= */

function drawMountain(x, baseY, width, height) {
    ctx.beginPath();

    ctx.moveTo(x, baseY);
    ctx.lineTo(x + width / 2, baseY - height);
    ctx.lineTo(x + width, baseY);

    ctx.closePath();

    ctx.fill();
}


/* =========================
   TREE
========================= */

function drawTree(x, y, scale = 1, far = false) {
    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = far
        ? "#4c9b55"
        : "#704124";

    ctx.fillRect(-18, 0, 36, 115);

    ctx.fillStyle = far
        ? "#57b966"
        : "#279b45";

    ctx.beginPath();
    ctx.arc(-45, -15, 45, 0, Math.PI * 2);
    ctx.arc(0, -45, 55, 0, Math.PI * 2);
    ctx.arc(48, -12, 43, 0, Math.PI * 2);

    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.08)";

    ctx.beginPath();
    ctx.arc(-15, -65, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}


/* =========================
   WORLD DECORATIONS
========================= */

function drawWorldDecorations() {
    if (currentWorld !== 1) return;

    /* Big foreground trees */

    const treePositions = [
        60,
        950,
        1850,
        2850,
        3900,
        4850
    ];

    for (const x of treePositions) {
        const screenX = x - cameraX * 0.35;

        if (
            screenX > -180 &&
            screenX < W + 180
        ) {
            drawTree(
                screenX,
                H * 0.69,
                1.05,
                false
            );
        }
    }

    /* Bushes */

    for (let x = 100; x < level.width; x += 230) {
        const sx = x - cameraX * 0.65;

        if (sx > -100 && sx < W + 100) {
            drawBush(sx, level.groundY + 4, 1);
        }
    }

    /* Flowers */

    for (let x = 160; x < level.width; x += 310) {
        const sx = x - cameraX;

        if (sx > -30 && sx < W + 30) {
            drawFlower(
                sx,
                level.groundY
            );
        }
    }
}


/* =========================
   BUSH
========================= */

function drawBush(x, y, scale = 1) {
    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "#2c963d";

    ctx.beginPath();

    ctx.arc(-18, 0, 18, 0, Math.PI * 2);
    ctx.arc(0, -10, 24, 0, Math.PI * 2);
    ctx.arc(22, 0, 18, 0, Math.PI * 2);

    ctx.fill();

    ctx.restore();
}


/* =========================
   FLOWER
========================= */

function drawFlower(x, y) {
    ctx.strokeStyle = "#3e9c42";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 22);
    ctx.stroke();

    ctx.fillStyle = "#ff6d7a";

    for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;

        ctx.beginPath();
        ctx.arc(
            x + Math.cos(a) * 7,
            y - 27 + Math.sin(a) * 7,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.fillStyle = "#ffd33d";

    ctx.beginPath();
    ctx.arc(x, y - 27, 4, 0, Math.PI * 2);
    ctx.fill();
}


/* =========================
   PLATFORMS
========================= */

function drawPlatforms() {
    const world = WORLDS[currentWorld];

    /* Ground */

    const groundScreenX =
        -cameraX;

    ctx.fillStyle = world.ground;

    ctx.fillRect(
        groundScreenX,
        level.groundY,
        level.width,
        300
    );

    /* Ground texture */

    for (
        let x = Math.floor(cameraX / 45) * 45;
        x < cameraX + W + 45;
        x += 45
    ) {
        const sx = x - cameraX;

        ctx.fillStyle =
            (Math.floor(x / 45) % 2 === 0)
                ? "rgba(70,40,20,0.18)"
                : "rgba(255,255,255,0.05)";

        ctx.fillRect(
            sx,
            level.groundY + 28,
            24,
            12
        );
    }

    /* Grass top */

    ctx.fillStyle = world.grass;

    ctx.fillRect(
        -cameraX,
        level.groundY - 7,
        level.width,
        13
    );

    /* Grass blades */

    ctx.fillStyle = "#3c9d2b";

    for (
        let x = Math.floor(cameraX / 25) * 25;
        x < cameraX + W + 25;
        x += 25
    ) {
        const sx = x - cameraX;

        ctx.beginPath();

        ctx.moveTo(sx, level.groundY + 5);
        ctx.lineTo(sx + 5, level.groundY - 6);
        ctx.lineTo(sx + 8, level.groundY + 5);

        ctx.fill();
    }


    /* Platforms */

    for (const platform of level.platforms) {
        const sx = platform.x - cameraX;

        if (
            sx + platform.width < 0 ||
            sx > W
        ) {
            continue;
        }

        ctx.fillStyle = world.ground;

        roundRect(
            sx,
            platform.y,
            platform.width,
            platform.height,
            7
        );

        ctx.fill();

        ctx.fillStyle = world.grass;

        roundRect(
            sx,
            platform.y - 6,
            platform.width,
            11,
            6
        );

        ctx.fill();

        ctx.fillStyle = "rgba(50,30,15,0.25)";

        for (
            let xx = sx + 18;
            xx < sx + platform.width - 10;
            xx += 32
        ) {
            ctx.beginPath();

            ctx.arc(
                xx,
                platform.y + 18,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }
}


/* =========================
   COINS
========================= */

function drawCoins() {
    for (const coin of level.coins) {
        if (coin.collected) continue;

        coin.rotation += 0.07;

        const sx = coin.x - cameraX;

        if (sx < -30 || sx > W + 30) {
            continue;
        }

        const scale =
            Math.abs(Math.cos(coin.rotation)) * 0.55 + 0.45;

        /* Glow */

        const glow = ctx.createRadialGradient(
            sx,
            coin.y,
            1,
            sx,
            coin.y,
            28
        );

        glow.addColorStop(
            0,
            "rgba(255,240,100,0.55)"
        );

        glow.addColorStop(
            1,
            "rgba(255,240,100,0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.arc(sx, coin.y, 28, 0, Math.PI * 2);
        ctx.fill();


        /* Coin */

        ctx.save();

        ctx.translate(sx, coin.y);
        ctx.scale(scale, 1);

        ctx.fillStyle = "#ffb900";

        ctx.beginPath();
        ctx.ellipse(
            0,
            0,
            13,
            15,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#fff19a";
        ctx.lineWidth = 3;

        ctx.stroke();

        ctx.fillStyle = "#fff3a0";

        ctx.beginPath();
        ctx.ellipse(
            -3,
            -4,
            3,
            6,
            -0.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


/* =========================
   ENEMIES
========================= */

function drawEnemies() {
    for (const enemy of level.enemies) {
        if (!enemy.alive) continue;

        const sx = enemy.x - cameraX;

        if (
            sx + enemy.width < 0 ||
            sx > W
        ) {
            continue;
        }

        if (enemy.type === "snail") {
            drawSnail(enemy);
        }

        else if (enemy.type === "bee") {
            drawBee(enemy);
        }

        else if (enemy.type === "turtle") {
            drawTurtle(enemy);
        }

        else if (enemy.type === "snow") {
            drawSnowEnemy(enemy);
        }

        else if (enemy.type === "fish") {
            drawFish(enemy);
        }

        else if (enemy.type === "fireball") {
            drawFireEnemy(enemy);
        }
    }
}


/* =========================
   SNAIL
========================= */

function drawSnail(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    ctx.save();

    ctx.translate(
        x + enemy.width / 2,
        y + enemy.height
    );

    if (enemy.direction < 0) {
        ctx.scale(-1, 1);
    }

    /* Body */

    ctx.fillStyle = "#d89155";

    ctx.beginPath();
    ctx.ellipse(
        5,
        -14,
        25,
        13,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Shell */

    ctx.fillStyle = "#9a5a35";

    ctx.beginPath();
    ctx.arc(
        -8,
        -27,
        18,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#6f3d27";
    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
        -8,
        -27,
        10,
        0,
        Math.PI * 1.8
    );

    ctx.stroke();

    /* Eyes */

    ctx.strokeStyle = "#5a3624";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(18, -20);
    ctx.lineTo(23, -32);

    ctx.moveTo(30, -20);
    ctx.lineTo(35, -31);

    ctx.stroke();

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(23, -33, 4, 0, Math.PI * 2);
    ctx.arc(35, -32, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();
    ctx.arc(23, -33, 2, 0, Math.PI * 2);
    ctx.arc(35, -32, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}


/* =========================
   BEE
========================= */

function drawBee(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    const wingMove =
        Math.sin(enemy.anim * 0.35) * 4;

    ctx.save();

    ctx.translate(
        x + enemy.width / 2,
        y + enemy.height / 2
    );

    if (enemy.direction < 0) {
        ctx.scale(-1, 1);
    }

    /* Wings */

    ctx.fillStyle = "rgba(235,250,255,0.75)";

    ctx.beginPath();

    ctx.ellipse(
        -12,
        -15 + wingMove,
        14,
        8,
        -0.5,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        12,
        -15 - wingMove,
        14,
        8,
        0.5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Body */

    ctx.fillStyle = "#f4b51d";

    ctx.beginPath();
    ctx.ellipse(
        0,
        0,
        23,
        17,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Stripes */

    ctx.strokeStyle = "#3d3020";
    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.moveTo(-8, -14);
    ctx.lineTo(-8, 14);

    ctx.moveTo(5, -15);
    ctx.lineTo(5, 15);

    ctx.stroke();


    /* Eyes */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(14, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();
    ctx.arc(15, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}


/* =========================
   TURTLE
========================= */

function drawTurtle(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    ctx.save();

    ctx.translate(
        x + enemy.width / 2,
        y + enemy.height
    );

    if (enemy.direction < 0) {
        ctx.scale(-1, 1);
    }

    /* Legs */

    ctx.fillStyle = "#4c9e3e";

    ctx.fillRect(-20, -12, 12, 14);
    ctx.fillRect(10, -12, 12, 14);

    /* Shell */

    ctx.fillStyle = "#347c32";

    ctx.beginPath();
    ctx.ellipse(
        0,
        -28,
        27,
        20,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#1f5d27";
    ctx.lineWidth = 3;

    ctx.stroke();

    /* Shell pattern */

    ctx.strokeStyle = "rgba(190,220,80,0.5)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-15, -37);
    ctx.lineTo(15, -18);

    ctx.moveTo(15, -37);
    ctx.lineTo(-15, -18);

    ctx.stroke();

    /* Head */

    ctx.fillStyle = "#65b94b";

    ctx.beginPath();
    ctx.arc(
        27,
        -25,
        12,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(31, -29, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();
    ctx.arc(32, -29, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}


/* =========================
   OTHER ENEMIES
========================= */

function drawSnowEnemy(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
        x + 24,
        y + 22,
        23,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();
    ctx.arc(x + 17, y + 17, 3, 0, Math.PI * 2);
    ctx.arc(x + 31, y + 17, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f18b2d";

    ctx.beginPath();
    ctx.moveTo(x + 24, y + 23);
    ctx.lineTo(x + 36, y + 26);
    ctx.lineTo(x + 24, y + 29);
    ctx.closePath();
    ctx.fill();
}

function drawFish(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    ctx.save();

    if (enemy.direction < 0) {
        ctx.translate(x + enemy.width, y);
        ctx.scale(-1, 1);
        ctx.translate(-x, -y);
    }

    ctx.fillStyle = "#f18a43";

    ctx.beginPath();

    ctx.ellipse(
        x + 25,
        y + 22,
        25,
        17,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#ffbd4b";

    ctx.beginPath();

    ctx.moveTo(x, y + 22);
    ctx.lineTo(x - 18, y + 7);
    ctx.lineTo(x - 18, y + 37);
    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(x + 35, y + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();
    ctx.arc(x + 36, y + 16, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawFireEnemy(enemy) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    const pulse =
        Math.sin(enemy.anim * 0.18) * 3;

    ctx.fillStyle = "#ff9e25";

    ctx.beginPath();

    ctx.arc(
        x + 24,
        y + 23,
        22 + pulse,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#ffdf4f";

    ctx.beginPath();

    ctx.arc(
        x + 18,
        y + 16,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#5c211a";

    ctx.beginPath();

    ctx.arc(x + 17, y + 22, 3, 0, Math.PI * 2);
    ctx.arc(x + 32, y + 22, 3, 0, Math.PI * 2);

    ctx.fill();
}


/* =========================
   BOSS DRAW
========================= */

function drawBoss(boss) {
    const x = boss.x - cameraX;
    const y = boss.y;

    ctx.save();

    ctx.translate(
        x + boss.width / 2,
        y + boss.height / 2
    );

    /* Shadow */

    ctx.fillStyle = "rgba(0,0,0,0.25)";

    ctx.beginPath();
    ctx.ellipse(
        0,
        boss.height / 2,
        50,
        12,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Body */

    ctx.fillStyle = "#68402d";

    roundRect(
        -45,
        -35,
        90,
        70,
        20
    );

    ctx.fill();


    /* Leaves */

    ctx.fillStyle = "#3b9c3e";

    ctx.beginPath();

    ctx.arc(-32, -45, 28, 0, Math.PI * 2);
    ctx.arc(0, -55, 32, 0, Math.PI * 2);
    ctx.arc(33, -45, 28, 0, Math.PI * 2);

    ctx.fill();


    /* Eyes */

    ctx.fillStyle = "#ffdc3b";

    ctx.beginPath();
    ctx.arc(-17, -15, 7, 0, Math.PI * 2);
    ctx.arc(17, -15, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();
    ctx.arc(-17, -15, 3, 0, Math.PI * 2);
    ctx.arc(17, -15, 3, 0, Math.PI * 2);
    ctx.fill();


    /* Mouth */

    ctx.fillStyle = "#211817";

    roundRect(
        -20,
        0,
        40,
        18,
        6
    );

    ctx.fill();


    /* Health bar */

    const healthWidth = 100;

    ctx.fillStyle = "rgba(0,0,0,0.45)";

    ctx.fillRect(
        -healthWidth / 2,
        -78,
        healthWidth,
        8
    );

    ctx.fillStyle = "#e84343";

    ctx.fillRect(
        -healthWidth / 2,
        -78,
        healthWidth *
            (boss.health / boss.maxHealth),
        8
    );

    ctx.restore();
}


/* =========================
   FLAG
========================= */

function drawFlag() {
    const flag = level.flag;

    const x = flag.x - cameraX;

    ctx.strokeStyle = "#6c461f";
    ctx.lineWidth = 7;

    ctx.beginPath();

    ctx.moveTo(x, flag.y);
    ctx.lineTo(x, flag.y + flag.height);

    ctx.stroke();


    /* Flag */

    ctx.fillStyle = "#ef3d43";

    ctx.beginPath();

    ctx.moveTo(x + 3, flag.y + 8);
    ctx.lineTo(x + 70, flag.y + 30);
    ctx.lineTo(x + 3, flag.y + 55);

    ctx.closePath();

    ctx.fill();


    /* Mushroom logo */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
        x + 27,
        flag.y + 31,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================
   CAGE
========================= */

function drawCage() {
    const cage = level.cage;

    const x = cage.x - cameraX;
    const y = cage.y;

    /* Cage */

    ctx.fillStyle = "#b47a3c";

    roundRect(
        x,
        y,
        cage.width,
        cage.height,
        8
    );

    ctx.fill();

    ctx.strokeStyle = "#633b1e";
    ctx.lineWidth = 6;

    ctx.strokeRect(
        x,
        y,
        cage.width,
        cage.height
    );

    for (let i = 1; i < 5; i++) {
        ctx.beginPath();

        ctx.moveTo(
            x + i * 18,
            y + 5
        );

        ctx.lineTo(
            x + i * 18,
            y + cage.height - 5
        );

        ctx.stroke();
    }


    /* Father */

    ctx.fillStyle = "#f0bd8c";

    ctx.beginPath();

    ctx.arc(
        x + 45,
        y + 36,
        16,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#4a2c20";

    ctx.beginPath();

    ctx.arc(
        x + 45,
        y + 30,
        17,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#315caa";

    ctx.fillRect(
        x + 28,
        y + 50,
        34,
        45
    );
}


/* =========================
   BULLETS DRAW
========================= */

function drawBullets() {
    for (const bullet of bullets) {
        const x = bullet.x - cameraX;

        const gradient = ctx.createRadialGradient(
            x,
            bullet.y,
            1,
            x,
            bullet.y,
            13
        );

        gradient.addColorStop(
            0,
            "#ffffff"
        );

        gradient.addColorStop(
            0.4,
            "#fff3a0"
        );

        gradient.addColorStop(
            1,
            "rgba(255,160,30,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(
            x,
            bullet.y,
            13,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#ffd22f";

        ctx.beginPath();
        ctx.arc(
            x,
            bullet.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =========================
   ELINA
========================= */

function drawPlayer() {
    if (
        player.invincible > 0 &&
        Math.floor(player.invincible / 6) % 2 === 0
    ) {
        return;
    }

    const x =
        player.x - cameraX;

    const y =
        player.y;

    ctx.save();

    ctx.translate(
        x + player.width / 2,
        y + player.height
    );

    if (player.direction < 0) {
        ctx.scale(-1, 1);
    }

    const running =
        player.state === "run";

    const jumping =
        player.state === "jump" ||
        player.state === "fall";

    const frame =
        player.animFrame % 4;

    const legSwing =
        running
            ? Math.sin(frame * Math.PI / 2) * 8
            : 0;

    const bodyBob =
        running
            ? Math.abs(Math.sin(frame * Math.PI / 2)) * 2
            : jumping
                ? -2
                : 0;


    /* Shadow */

    ctx.save();

    ctx.scale(
        1,
        0.35
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.20)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        5,
        25,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    /* Legs */

    ctx.strokeStyle = "#244e91";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";

    ctx.beginPath();

    if (jumping) {
        ctx.moveTo(-8, -12);
        ctx.lineTo(-14, -2);

        ctx.moveTo(8, -12);
        ctx.lineTo(15, -2);
    } else {
        ctx.moveTo(-8, -12);
        ctx.lineTo(
            -8 + legSwing,
            0
        );

        ctx.moveTo(8, -12);
        ctx.lineTo(
            8 - legSwing,
            0
        );
    }

    ctx.stroke();


    /* Shoes */

    ctx.fillStyle = "#e63f43";

    ctx.beginPath();

    ctx.ellipse(
        -13 + legSwing,
        2,
        13,
        6,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        13 - legSwing,
        2,
        13,
        6,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Body */

    ctx.fillStyle = "#e7433e";

    roundRect(
        -17,
        -48 + bodyBob,
        34,
        38,
        10
    );

    ctx.fill();


    /* Shirt highlight */

    ctx.fillStyle = "#ff6a5e";

    roundRect(
        -10,
        -45 + bodyBob,
        9,
        28,
        5
    );

    ctx.fill();


    /* Belt */

    ctx.fillStyle = "#f6c936";

    ctx.fillRect(
        -16,
        -19 + bodyBob,
        32,
        6
    );


    /* Arms */

    ctx.strokeStyle = "#f2bd91";
    ctx.lineWidth = 8;

    ctx.beginPath();

    if (running) {
        ctx.moveTo(
            -15,
            -39 + bodyBob
        );

        ctx.lineTo(
            -24,
            -28 + legSwing
        );

        ctx.moveTo(
            15,
            -39 + bodyBob
        );

        ctx.lineTo(
            24,
            -28 - legSwing
        );
    } else {
        ctx.moveTo(
            -15,
            -39 + bodyBob
        );

        ctx.lineTo(
            -23,
            -27
        );

        ctx.moveTo(
            15,
            -39 + bodyBob
        );

        ctx.lineTo(
            23,
            -27
        );
    }

    ctx.stroke();


    /* Head */

    ctx.fillStyle = "#f4c096";

    ctx.beginPath();

    ctx.arc(
        0,
        -66 + bodyBob,
        19,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Hair */

    ctx.fillStyle = "#5b2e20";

    ctx.beginPath();

    ctx.arc(
        -5,
        -76 + bodyBob,
        20,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        -19,
        -63 + bodyBob,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Ponytail */

    ctx.fillStyle = "#5b2e20";

    ctx.beginPath();

    ctx.ellipse(
        -22,
        -69 + bodyBob,
        12,
        18,
        -0.5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Cap */

    ctx.fillStyle = "#e53e42";

    ctx.beginPath();

    ctx.ellipse(
        0,
        -82 + bodyBob,
        23,
        11,
        0,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillRect(
        -17,
        -83 + bodyBob,
        35,
        10
    );


    /* Cap highlight */

    ctx.fillStyle = "#ff7771";

    ctx.beginPath();

    ctx.arc(
        8,
        -86 + bodyBob,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Cap emblem */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        0,
        -85 + bodyBob,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#e53e42";

    ctx.beginPath();

    ctx.arc(
        0,
        -85 + bodyBob,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Eyes */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.ellipse(
        7,
        -66 + bodyBob,
        5,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();

    ctx.arc(
        9,
        -66 + bodyBob,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Smile */

    ctx.strokeStyle = "#873c35";
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        7,
        -59 + bodyBob,
        6,
        0.1,
        1.3
    );

    ctx.stroke();


    /* Shooting hand / muzzle */

    if (keys.shoot && player.shootCooldown > 10) {
        ctx.fillStyle = "#ffd85a";

        ctx.beginPath();

        ctx.arc(
            30,
            -28,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}


/* =========================
   STAR
========================= */

function drawStar(x, y, radius, fill) {
    ctx.save();

    ctx.translate(x, y);

    ctx.fillStyle = fill;

    ctx.beginPath();

    for (let i = 0; i < 10; i++) {
        const angle =
            -Math.PI / 2 +
            i * Math.PI / 5;

        const r =
            i % 2 === 0
                ? radius
                : radius * 0.42;

        const px =
            Math.cos(angle) * r;

        const py =
            Math.sin(angle) * r;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


/* =========================
   ROUND RECT
========================= */

function roundRect(
    x,
    y,
    width,
    height,
    radius
) {
    const r = Math.min(
        radius,
        width / 2,
        height / 2
    );

    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );

    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );

    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );

    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );

    ctx.closePath();
}


/* =========================
   HUD
========================= */

function updateHUD() {
    livesEl.textContent = lives;
    coinsEl.textContent = coins;
    scoreEl.textContent = score;

    currentWorldEl.textContent =
        currentWorld;

    currentLevelEl.textContent =
        currentLevel;
}


/* =========================
   INITIALIZE
========================= */

resizeCanvas();
updateHUD();

showOnly(mainMenu);


/* =========================
   PREVENT MOBILE GESTURES
========================= */

document.addEventListener(
    "touchmove",
    e => {
        if (gameRunning) {
            e.preventDefault();
        }
    },
    { passive: false }
);

document.addEventListener(
    "contextmenu",
    e => {
        if (gameRunning) {
            e.preventDefault();
        }
    }
);
