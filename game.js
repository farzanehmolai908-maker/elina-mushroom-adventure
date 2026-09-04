/* =========================================================
   ELINA MUSHROOM ADVENTURE
   Main Canvas Game Engine
   ========================================================= */

"use strict";

/* =========================================================
   DOM
========================================================= */

const $ = (id) => document.getElementById(id);

const mainMenu = $("mainMenu");
const worldMenu = $("worldMenu");
const levelMenu = $("levelMenu");
const gameScreen = $("gameScreen");

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

const startGameButton = $("startGame");
const worldSelectButton = $("worldSelect");
const settingsButton = $("settingsButton");

const backFromWorlds = $("backFromWorlds");
const backFromLevels = $("backFromLevels");

const levelList = $("levelList");

const pauseButton = $("pauseButton");
const resumeButton = $("resumeButton");
const restartButton = $("restartButton");
const exitButton = $("exitButton");

const tryAgainButton = $("tryAgainButton");
const gameOverHome = $("gameOverHome");

const nextLevelButton = $("nextLevelButton");
const winHomeButton = $("winHomeButton");

const livesText = $("lives");
const coinsText = $("coins");
const scoreText = $("score");
const currentWorldText = $("currentWorld");
const currentLevelText = $("currentLevel");

const gameMessage = $("gameMessage");

const pauseMenu = $("pauseMenu");
const gameOverMenu = $("gameOverMenu");
const winMenu = $("winMenu");

const finalScore = $("finalScore");
const winScore = $("winScore");


/* =========================================================
   CANVAS
========================================================= */

let canvasWidth = 800;
let canvasHeight = 450;
let dpr = 1;

function resizeCanvas() {

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasWidth = gameScreen.clientWidth || window.innerWidth;
    canvasHeight = gameScreen.clientHeight || window.innerHeight;

    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);

    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);


/* =========================================================
   GAME STATE
========================================================= */

let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let gameWon = false;

let selectedWorld = 1;
let currentLevel = 1;

let lives = 3;
let coins = 0;
let score = 0;

let cameraX = 0;

let levelData = null;

let lastTime = 0;


/* =========================================================
   INPUT
========================================================= */

const keys = {
    left: false,
    right: false,
    jump: false,
    shoot: false
};

window.addEventListener("keydown", (e) => {

    if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "A", "d", "D", "w", "W", "f", "F"].includes(e.key)
    ) {
        e.preventDefault();
    }

    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.left = true;
    }

    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.right = true;
    }

    if (
        e.key === "ArrowUp" ||
        e.key === " " ||
        e.key === "w" ||
        e.key === "W"
    ) {
        if (!keys.jump) {
            keys.jump = true;
        }
    }

    if (e.key === "f" || e.key === "F") {
        keys.shoot = true;
    }
});

window.addEventListener("keyup", (e) => {

    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.left = false;
    }

    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.right = false;
    }

    if (
        e.key === "ArrowUp" ||
        e.key === " " ||
        e.key === "w" ||
        e.key === "W"
    ) {
        keys.jump = false;
    }

    if (e.key === "f" || e.key === "F") {
        keys.shoot = false;
    }
});


/* =========================================================
   MOBILE BUTTONS
========================================================= */

function holdButton(button, onDown, onUp) {

    if (!button) return;

    button.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        button.setPointerCapture?.(e.pointerId);
        onDown();
    });

    button.addEventListener("pointerup", (e) => {
        e.preventDefault();
        onUp();
    });

    button.addEventListener("pointercancel", onUp);
    button.addEventListener("pointerleave", onUp);
}

holdButton(
    $("leftButton"),
    () => keys.left = true,
    () => keys.left = false
);

holdButton(
    $("rightButton"),
    () => keys.right = true,
    () => keys.right = false
);

holdButton(
    $("jumpButton"),
    () => keys.jump = true,
    () => keys.jump = false
);

holdButton(
    $("shootButton"),
    () => keys.shoot = true,
    () => keys.shoot = false
);


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 100,
    y: 200,

    width: 38,
    height: 62,

    vx: 0,
    vy: 0,

    speed: 5.2,
    jumpPower: 13,

    onGround: false,

    direction: 1,

    animTime: 0,

    invincible: 0,

    shootCooldown: 0,

    ammo: 7,

    maxAmmo: 7,

    ammoTimer: 0
};


/* =========================================================
   LEVEL OBJECTS
========================================================= */

let platforms = [];
let enemies = [];
let levelCoins = [];
let bullets = [];

let flag = null;
let boss = null;
let father = null;


/* =========================================================
   WORLD INFORMATION
========================================================= */

const worlds = {

    1: {
        name: "جنگل",
        skyTop: "#54c7ff",
        skyBottom: "#b9f2ff",
        ground: "#4c9b35",
        grass: "#72c94b",
        platform: "#80552d",
        enemy: "snail"
    },

    2: {
        name: "برف",
        skyTop: "#8ddcff",
        skyBottom: "#eafaff",
        ground: "#dcecf2",
        grass: "#ffffff",
        platform: "#a8c9d6",
        enemy: "penguin"
    },

    3: {
        name: "آب",
        skyTop: "#35aee8",
        skyBottom: "#9de8ff",
        ground: "#176f8f",
        grass: "#39a9a1",
        platform: "#6b553e",
        enemy: "fish"
    },

    4: {
        name: "آتش",
        skyTop: "#541d26",
        skyBottom: "#d65b28",
        ground: "#4a2620",
        grass: "#d77b26",
        platform: "#703a28",
        enemy: "bomb"
    }
};


/* =========================================================
   LEVEL GENERATION
========================================================= */

function createLevel(world, level) {

    const data = {

        width: 6500 + level * 250,

        groundY: Math.max(320, canvasHeight - 90),

        platforms: [],
        enemies: [],
        coins: [],

        flag: {
            x: 0,
            y: 0,
            width: 50,
            height: 100
        },

        boss: null,

        father: null
    };


    /*
       شروع امن
    */

    data.platforms.push({
        x: 0,
        y: data.groundY,
        width: data.width,
        height: 100,
        type: "ground"
    });


    /*
       سکوهای مرحله
    */

    const spacing = 330;

    for (let i = 1; i < 18 + level; i++) {

        const x = i * spacing + ((level * 37) % 100);

        const heightOffset =
            50 +
            Math.sin(i * 1.7) * 35;

        const y =
            data.groundY -
            Math.max(55, heightOffset);

        data.platforms.push({
            x,
            y,
            width: 150 + ((i * 47) % 90),
            height: 24,
            type: "platform"
        });
    }


    /*
       سکه‌ها
    */

    for (let i = 0; i < 32 + level * 3; i++) {

        const x = 220 + i * 180;

        const y =
            data.groundY -
            75 -
            ((i * 31) % 100);

        data.coins.push({
            x,
            y,
            radius: 12,
            collected: false,
            spin: Math.random() * Math.PI * 2
        });
    }


    /*
       دشمن‌ها
    */

    for (let i = 0; i < 10 + level; i++) {

        const x = 550 + i * 430;

        data.enemies.push({
            x,
            y: data.groundY - 42,
            width: 44,
            height: 38,

            vx: i % 2 === 0 ? 1.1 : -1.1,

            leftLimit: x - 100,
            rightLimit: x + 100,

            alive: true,

            type: worlds[world].enemy,

            anim: Math.random() * 10
        });
    }


    /*
       پرچم
    */

    data.flag.x = data.width - 220;
    data.flag.y = data.groundY - 105;


    /*
       Boss مرحله ۱۰
    */

    if (level === 10) {

        data.boss = {

            x: data.width - 700,

            y: data.groundY - 100,

            width: 82,
            height: 90,

            vx: -1.5,

            hp: 10,
            maxHp: 10,

            active: true,

            direction: -1,

            hitFlash: 0
        };

        data.father = {

            x: data.width - 130,

            y: data.groundY - 110,

            width: 75,

            height: 100,

            rescued: false
        };
    }


    return data;
}


/* =========================================================
   START LEVEL
========================================================= */

function startLevel(world, level) {

    selectedWorld = world;
    currentLevel = level;

    levelData = createLevel(world, level);

    platforms = levelData.platforms;
    enemies = levelData.enemies;
    levelCoins = levelData.coins;

    flag = levelData.flag;
    boss = levelData.boss;
    father = levelData.father;

    player.x = 100;
    player.y = levelData.groundY - player.height - 20;

    player.vx = 0;
    player.vy = 0;

    player.onGround = false;
    player.direction = 1;

    player.invincible = 2;

    player.shootCooldown = 0;
    player.ammo = player.maxAmmo;
    player.ammoTimer = 0;

    cameraX = 0;

    bullets = [];

    gamePaused = false;
    gameOver = false;
    gameWon = false;

    pauseMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
    winMenu.classList.add("hidden");

    mainMenu.classList.add("hidden");
    worldMenu.classList.add("hidden");
    levelMenu.classList.add("hidden");

    gameScreen.classList.remove("hidden");

    resizeCanvas();

    updateHUD();

    showMessage(
        `دنیای ${world} - مرحله ${level}`,
        1800
    );

    gameRunning = true;

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


/* =========================================================
   MENU
========================================================= */

startGameButton.addEventListener("click", () => {

    startLevel(1, 1);

});

worldSelectButton.addEventListener("click", () => {

    mainMenu.classList.add("hidden");
    worldMenu.classList.remove("hidden");

});

settingsButton.addEventListener("click", () => {

    alert(
        "⚙️ تنظیمات بازی\n\n" +
        "صدا و امکانات بیشتر در نسخه بعدی اضافه می‌شوند."
    );

});


backFromWorlds.addEventListener("click", () => {

    worldMenu.classList.add("hidden");
    mainMenu.classList.remove("hidden");

});


backFromLevels.addEventListener("click", () => {

    levelMenu.classList.add("hidden");
    worldMenu.classList.remove("hidden");

});


document.querySelectorAll(".world-card").forEach(card => {

    card.addEventListener("click", () => {

        const world = Number(card.dataset.world);

        selectedWorld = world;

        openLevelMenu(world);

    });

});


/* =========================================================
   LEVEL MENU
========================================================= */

function openLevelMenu(world) {

    selectedWorld = world;

    worldMenu.classList.add("hidden");
    levelMenu.classList.remove("hidden");

    levelList.innerHTML = "";

    for (let i = 1; i <= 10; i++) {

        const button = document.createElement("button");

        button.className = "level-button";

        button.textContent = i;

        button.title =
            `دنیای ${world} - مرحله ${i}`;

        button.addEventListener("click", () => {

            startLevel(world, i);

        });

        levelList.appendChild(button);
    }
}


/* =========================================================
   PAUSE
========================================================= */

pauseButton.addEventListener("click", () => {

    if (!gameRunning || gameOver || gameWon) return;

    gamePaused = true;

    pauseMenu.classList.remove("hidden");

});


resumeButton.addEventListener("click", () => {

    gamePaused = false;

    pauseMenu.classList.add("hidden");

    lastTime = performance.now();

});


restartButton.addEventListener("click", () => {

    lives = 3;
    coins = 0;
    score = 0;

    startLevel(selectedWorld, currentLevel);

});


exitButton.addEventListener("click", () => {

    gameRunning = false;

    gamePaused = false;

    pauseMenu.classList.add("hidden");
    gameScreen.classList.add("hidden");

    mainMenu.classList.remove("hidden");

});


tryAgainButton.addEventListener("click", () => {

    lives = 3;

    startLevel(selectedWorld, currentLevel);

});


gameOverHome.addEventListener("click", () => {

    gameRunning = false;

    gameOverMenu.classList.add("hidden");
    gameScreen.classList.add("hidden");

    mainMenu.classList.remove("hidden");

});


/* =========================================================
   WIN
========================================================= */

nextLevelButton.addEventListener("click", () => {

    winMenu.classList.add("hidden");

    if (currentLevel < 10) {

        startLevel(
            selectedWorld,
            currentLevel + 1
        );

        return;
    }


    if (selectedWorld < 4) {

        startLevel(
            selectedWorld + 1,
            1
        );

        return;
    }


    showFinalVictory();
});


winHomeButton.addEventListener("click", () => {

    gameRunning = false;

    winMenu.classList.add("hidden");
    gameScreen.classList.add("hidden");

    mainMenu.classList.remove("hidden");

});


/* =========================================================
   PHYSICS
========================================================= */

const gravity = 0.65;

function updatePlayer(dt) {

    if (!player) return;


    /* حرکت */

    if (keys.left) {

        player.vx -= 0.55;

        player.direction = -1;

    }

    if (keys.right) {

        player.vx += 0.55;

        player.direction = 1;

    }


    /* اصطکاک */

    player.vx *= 0.82;


    /* محدودیت سرعت */

    if (player.vx > player.speed) {
        player.vx = player.speed;
    }

    if (player.vx < -player.speed) {
        player.vx = -player.speed;
    }


    /* پرش */

    if (keys.jump && player.onGround) {

        player.vy = -player.jumpPower;

        player.onGround = false;

    }


    /* جاذبه */

    player.vy += gravity;


    /* حرکت */

    player.x += player.vx;

    player.y += player.vy;


    /* مرز چپ */

    if (player.x < 0) {

        player.x = 0;
        player.vx = 0;

    }


    /* برخورد با زمین و سکو */

    player.onGround = false;

    for (const platform of platforms) {

        if (
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height + 18 &&
            player.vy >= 0
        ) {

            player.y =
                platform.y - player.height;

            player.vy = 0;

            player.onGround = true;

        }
    }


    /* افتادن */

    if (player.y > canvasHeight + 200) {

        loseLife();

    }


    /* انیمیشن */

    player.animTime += Math.abs(player.vx) * 0.15;


    /* آسیب‌ناپذیری */

    if (player.invincible > 0) {

        player.invincible -= dt;

    }


    /* شلیک */

    if (player.shootCooldown > 0) {

        player.shootCooldown -= dt;

    }


    if (keys.shoot) {

        shoot();

    }


    /* شارژ مهمات */

    if (player.ammo < player.maxAmmo) {

        player.ammoTimer += dt;

        if (player.ammoTimer >= 2.5) {

            player.ammo++;

            player.ammoTimer = 0;

        }
    }
}


/* =========================================================
   COLLISION HELPER
========================================================= */

function rectanglesOverlap(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


/* =========================================================
   ENEMIES
========================================================= */

function updateEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        enemy.x += enemy.vx;

        enemy.anim += 0.08;


        if (enemy.x <= enemy.leftLimit) {

            enemy.x = enemy.leftLimit;

            enemy.vx = Math.abs(enemy.vx);

        }


        if (enemy.x >= enemy.rightLimit) {

            enemy.x = enemy.rightLimit;

            enemy.vx = -Math.abs(enemy.vx);

        }


        if (rectanglesOverlap(player, enemy)) {

            if (player.vy > 0 && player.y + player.height - enemy.y < 25) {

                enemy.alive = false;

                player.vy = -8;

                score += 100;

                showMessage("+100", 500);

            }
            else {

                hurtPlayer();

            }
        }
    }
}


/* =========================================================
   SHOOTING
========================================================= */

function shoot() {

    if (player.shootCooldown > 0) return;

    if (player.ammo <= 0) {

        showMessage("گلوله تمام شد!", 700);

        return;
    }

    player.ammo--;

    player.ammoTimer = 0;

    player.shootCooldown = 0.28;

    bullets.push({

        x:
            player.direction === 1
                ? player.x + player.width
                : player.x - 12,

        y: player.y + 25,

        width: 13,
        height: 7,

        vx: player.direction * 11,

        life: 2

    });
}


function updateBullets(dt) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.x += bullet.vx;

        bullet.life -= dt;


        if (bullet.life <= 0) {

            bullets.splice(i, 1);

            continue;

        }


        /* دشمن */

        for (const enemy of enemies) {

            if (!enemy.alive) continue;

            if (rectanglesOverlap(bullet, enemy)) {

                enemy.alive = false;

                score += 100;

                bullets.splice(i, 1);

                break;
            }
        }


        /* Boss */

        if (
            boss &&
            boss.active &&
            rectanglesOverlap(bullet, boss)
        ) {

            boss.hp--;

            boss.hitFlash = 0.15;

            score += 50;

            bullets.splice(i, 1);

            if (boss.hp <= 0) {

                boss.active = false;

                score += 1000;

                showMessage(
                    "🏆 غول مرحله شکست خورد!",
                    1600
                );

            }
        }
    }
}


/* =========================================================
   BOSS
========================================================= */

function updateBoss() {

    if (!boss || !boss.active) return;

    boss.x += boss.vx;

    boss.direction =
        boss.vx >= 0 ? 1 : -1;


    if (
        boss.x < levelData.width - 950 ||
        boss.x > levelData.width - 450
    ) {

        boss.vx *= -1;

    }


    if (boss.hitFlash > 0) {

        boss.hitFlash -= 0.016;

    }


    if (rectanglesOverlap(player, boss)) {

        hurtPlayer();

    }
}


/* =========================================================
   COINS
========================================================= */

function updateCoins() {

    for (const coin of levelCoins) {

        if (coin.collected) continue;

        coin.spin += 0.08;

        const dx =
            player.x + player.width / 2 -
            coin.x;

        const dy =
            player.y + player.height / 2 -
            coin.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance < 35) {

            coin.collected = true;

            coins++;

            score += 25;

        }
    }
}


/* =========================================================
   FLAG / FINISH
========================================================= */

function checkFinish() {

    if (!flag) return;

    const flagBox = {

        x: flag.x,

        y: flag.y,

        width: flag.width,

        height: flag.height

    };


    if (rectanglesOverlap(player, flagBox)) {

        if (currentLevel === 10) {

            if (boss && boss.active) {

                showMessage(
                    "اول غول مرحله را شکست بده!",
                    1200
                );

                return;

            }


            if (father && !father.rescued) {

                father.rescued = true;

                score += 2000;

                showMessage(
                    "👨‍👧 پدرت را نجات دادی!",
                    1800
                );

                setTimeout(() => {

                    completeLevel();

                }, 1500);

                return;
            }
        }


        completeLevel();

    }
}


/* =========================================================
   COMPLETE LEVEL
========================================================= */

function completeLevel() {

    if (gameWon) return;

    gameWon = true;
    gameRunning = false;

    winScore.textContent = score;

    winMenu.classList.remove("hidden");

    if (
        selectedWorld === 4 &&
        currentLevel === 10
    ) {

        nextLevelButton.textContent =
            "🏆 پایان بازی";

    }
    else if (currentLevel === 10) {

        nextLevelButton.textContent =
            "🌍 دنیای بعد";

    }
    else {

        nextLevelButton.textContent =
            "🚩 مرحله بعد";

    }
}


/* =========================================================
   FINAL VICTORY
========================================================= */

function showFinalVictory() {

    winMenu.classList.remove("hidden");

    const title =
        winMenu.querySelector("h2");

    if (title) {

        title.textContent =
            "🏆 تو قهرمان بازی شدی!";

    }

    const paragraphs =
        winMenu.querySelectorAll("p");

    if (paragraphs[0]) {

        paragraphs[0].textContent =
            "همه دنیاها را پشت سر گذاشتی و پدرت را نجات دادی! 👨‍👧";

    }

    nextLevelButton.textContent =
        "🏠 بازگشت به خانه";

    nextLevelButton.onclick = () => {

        winMenu.classList.add("hidden");

        gameScreen.classList.add("hidden");

        mainMenu.classList.remove("hidden");

        gameRunning = false;

    };
}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function hurtPlayer() {

    if (player.invincible > 0) return;

    lives--;

    updateHUD();

    player.invincible = 2;

    player.vy = -8;

    player.vx =
        player.direction === 1
            ? -6
            : 6;


    if (lives <= 0) {

        triggerGameOver();

        return;

    }


    player.x = Math.max(
        100,
        player.x - 120
    );

    player.y =
        levelData.groundY -
        player.height -
        50;

    showMessage(
        "❤️ یک جان کم شد!",
        900
    );
}


function loseLife() {

    if (player.invincible > 0) return;

    lives--;

    updateHUD();

    if (lives <= 0) {

        triggerGameOver();

        return;

    }

    player.x = Math.max(
        100,
        player.x - 200
    );

    player.y =
        levelData.groundY -
        player.height -
        100;

    player.vy = 0;

    player.invincible = 2;

    showMessage(
        "⚠️ مراقب باش!",
        900
    );
}


/* =========================================================
   GAME OVER
========================================================= */

function triggerGameOver() {

    gameOver = true;
    gameRunning = false;

    finalScore.textContent = score;

    gameOverMenu.classList.remove("hidden");

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    const target =
        player.x -
        canvasWidth * 0.38;


    cameraX +=
        (target - cameraX) * 0.08;


    if (cameraX < 0) {

        cameraX = 0;

    }


    const maxCamera =
        Math.max(
            0,
            levelData.width -
            canvasWidth
        );


    if (cameraX > maxCamera) {

        cameraX = maxCamera;

    }
}


/* =========================================================
   HUD
========================================================= */

let ammoHud = null;

function createAmmoHud() {

    if (ammoHud) return;

    ammoHud =
        document.createElement("div");

    ammoHud.id = "ammoHud";

    ammoHud.style.position = "absolute";
    ammoHud.style.top = "68px";
    ammoHud.style.left = "50%";
    ammoHud.style.transform = "translateX(-50%)";

    ammoHud.style.padding = "7px 12px";

    ammoHud.style.borderRadius = "12px";

    ammoHud.style.background =
        "rgba(0,0,0,0.55)";

    ammoHud.style.border =
        "2px solid rgba(255,255,255,0.8)";

    ammoHud.style.color = "white";

    ammoHud.style.fontWeight = "bold";

    ammoHud.style.fontSize = "13px";

    ammoHud.style.zIndex = "120";

    gameScreen.appendChild(ammoHud);
}


function updateHUD() {

    livesText.textContent = lives;

    coinsText.textContent = coins;

    scoreText.textContent = score;

    currentWorldText.textContent =
        selectedWorld;

    currentLevelText.textContent =
        currentLevel;

    createAmmoHud();

    ammoHud.textContent =
        `🔴 گلوله: ${player.ammo} / ${player.maxAmmo}`;
}


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;

function showMessage(text, duration = 1000) {

    gameMessage.textContent = text;

    gameMessage.style.opacity = "1";

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {

        gameMessage.style.opacity = "0";

    }, duration);
}


/* =========================================================
   DRAW BACKGROUND
========================================================= */

function drawBackground() {

    const world = worlds[selectedWorld];


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvasHeight
        );

    gradient.addColorStop(
        0,
        world.skyTop
    );

    gradient.addColorStop(
        1,
        world.skyBottom
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    if (selectedWorld === 1) {

        drawForestBackground();

    }
    else if (selectedWorld === 2) {

        drawSnowBackground();

    }
    else if (selectedWorld === 3) {

        drawWaterBackground();

    }
    else {

        drawFireBackground();

    }
}


/* =========================================================
   FOREST BACKGROUND
========================================================= */

function drawForestBackground() {

    /* خورشید */

    ctx.fillStyle = "#ffe680";

    ctx.beginPath();

    ctx.arc(
        canvasWidth - 100,
        90,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* ابرها */

    for (let i = 0; i < 6; i++) {

        const x =
            ((i * 280 - cameraX * 0.18) %
                (canvasWidth + 300)) - 150;

        const y =
            60 + (i % 3) * 45;

        drawCloud(x, y, 1);

    }


    /* تپه‌ها */

    ctx.fillStyle = "#6ebc55";

    for (let i = 0; i < 8; i++) {

        const x =
            i * 230 -
            cameraX * 0.28;

        ctx.beginPath();

        ctx.arc(
            x,
            canvasHeight - 70,
            150,
            Math.PI,
            0
        );

        ctx.fill();

    }


    /* درخت‌ها */

    for (let i = 0; i < 18; i++) {

        const x =
            i * 390 -
            cameraX * 0.55;

        drawTree(
            x,
            canvasHeight - 90
        );

    }
}


/* =========================================================
   SNOW BACKGROUND
========================================================= */

function drawSnowBackground() {

    ctx.fillStyle = "#d9f4ff";

    ctx.fillRect(
        0,
        canvasHeight - 160,
        canvasWidth,
        160
    );


    for (let i = 0; i < 70; i++) {

        const x =
            (i * 91 -
                cameraX * 0.15) %
            canvasWidth;

        const y =
            (i * 57) %
            canvasHeight;

        ctx.fillStyle = "rgba(255,255,255,0.8)";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    for (let i = 0; i < 10; i++) {

        const x =
            i * 270 -
            cameraX * 0.3;

        drawPineTree(
            x,
            canvasHeight - 90
        );

    }
}


/* =========================================================
   WATER BACKGROUND
========================================================= */

function drawWaterBackground() {

    ctx.fillStyle =
        "rgba(255,255,255,0.15)";

    for (let i = 0; i < 12; i++) {

        const x =
            i * 120 -
            cameraX * 0.25;

        const y =
            90 +
            Math.sin(i) * 30;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            35,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    ctx.fillStyle =
        "rgba(0,100,150,0.18)";

    ctx.fillRect(
        0,
        canvasHeight - 190,
        canvasWidth,
        190
    );
}


/* =========================================================
   FIRE BACKGROUND
========================================================= */

function drawFireBackground() {

    for (let i = 0; i < 14; i++) {

        const x =
            i * 130 -
            cameraX * 0.2;

        const y =
            canvasHeight - 90 -
            (i % 4) * 20;

        drawLavaRock(
            x,
            y
        );
    }

    ctx.fillStyle =
        "rgba(255,120,20,0.15)";

    ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );
}


/* =========================================================
   CLOUD
========================================================= */

function drawCloud(x, y, scale) {

    ctx.fillStyle =
        "rgba(255,255,255,0.85)";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        20 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 25 * scale,
        y - 10 * scale,
        27 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 55 * scale,
        y,
        22 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================================
   TREE
========================================================= */

function drawTree(x, y) {

    ctx.fillStyle = "#75452b";

    ctx.fillRect(
        x,
        y - 90,
        28,
        90
    );


    ctx.fillStyle = "#2f8b38";

    ctx.beginPath();

    ctx.arc(
        x + 14,
        y - 105,
        48,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x - 18,
        y - 75,
        35,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 45,
        y - 75,
        38,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================================
   PINE TREE
========================================================= */

function drawPineTree(x, y) {

    ctx.fillStyle = "#795548";

    ctx.fillRect(
        x - 7,
        y - 80,
        14,
        80
    );


    ctx.fillStyle = "#3f7650";

    for (let i = 0; i < 3; i++) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            y - 145 + i * 30
        );

        ctx.lineTo(
            x - 45 + i * 10,
            y - 55 + i * 25
        );

        ctx.lineTo(
            x + 45 - i * 10,
            y - 55 + i * 25
        );

        ctx.closePath();

        ctx.fill();

    }
}


/* =========================================================
   LAVA ROCK
========================================================= */

function drawLavaRock(x, y) {

    ctx.fillStyle = "#43221e";

    ctx.beginPath();

    ctx.moveTo(x, y);

    ctx.lineTo(x + 25, y - 55);

    ctx.lineTo(x + 70, y - 65);

    ctx.lineTo(x + 100, y);

    ctx.closePath();

    ctx.fill();

}


/* =========================================================
   WORLD OBJECTS
========================================================= */

function drawWorld() {

    const world = worlds[selectedWorld];


    for (const platform of platforms) {

        const screenX =
            platform.x - cameraX;

        if (
            screenX + platform.width < 0 ||
            screenX > canvasWidth
        ) {
            continue;
        }


        if (platform.type === "ground") {

            ctx.fillStyle =
                world.ground;

            ctx.fillRect(
                screenX,
                platform.y,
                platform.width,
                platform.height
            );


            ctx.fillStyle =
                world.grass;

            ctx.fillRect(
                screenX,
                platform.y,
                platform.width,
                13
            );

        }
        else {

            ctx.fillStyle =
                world.platform;

            ctx.fillRect(
                screenX,
                platform.y,
                platform.width,
                platform.height
            );


            ctx.fillStyle =
                world.grass;

            ctx.fillRect(
                screenX,
                platform.y,
                platform.width,
                6
            );

        }
    }
}


/* =========================================================
   COIN DRAW
========================================================= */

function drawCoins() {

    for (const coin of levelCoins) {

        if (coin.collected) continue;

        const x =
            coin.x - cameraX;

        if (
            x < -30 ||
            x > canvasWidth + 30
        ) continue;


        const scale =
            Math.abs(
                Math.cos(coin.spin)
            );

        ctx.save();

        ctx.translate(
            x,
            coin.y
        );

        ctx.scale(
            Math.max(0.15, scale),
            1
        );


        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffe600";

        ctx.fillStyle = "#ffd43b";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.shadowBlur = 0;

        ctx.fillStyle = "#b77a00";

        ctx.fillRect(
            -2,
            -7,
            4,
            14
        );

        ctx.restore();
    }
}


/* =========================================================
   ENEMY DRAW
========================================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const x =
            enemy.x - cameraX;

        if (
            x < -100 ||
            x > canvasWidth + 100
        ) continue;


        if (enemy.type === "snail") {

            drawSnail(
                x,
                enemy.y
            );

        }
        else if (enemy.type === "penguin") {

            drawPenguin(
                x,
                enemy.y
            );

        }
        else if (enemy.type === "fish") {

            drawFish(
                x,
                enemy.y
            );

        }
        else {

            drawBomb(
                x,
                enemy.y
            );
        }
    }
}


/* =========================================================
   SNAIL
========================================================= */

function drawSnail(x, y) {

    ctx.fillStyle = "#6c4a2e";

    ctx.beginPath();

    ctx.ellipse(
        x + 22,
        y + 24,
        27,
        15,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#c47c3d";

    ctx.beginPath();

    ctx.arc(
        x + 20,
        y + 15,
        14,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "white";

    ctx.beginPath();

    ctx.arc(
        x + 32,
        y + 5,
        5,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 43,
        y + 5,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(
        x + 32,
        y + 5,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 43,
        y + 5,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   PENGUIN
========================================================= */

function drawPenguin(x, y) {

    ctx.fillStyle = "#26384b";

    ctx.beginPath();

    ctx.ellipse(
        x + 22,
        y + 20,
        22,
        30,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#f8fbff";

    ctx.beginPath();

    ctx.ellipse(
        x + 22,
        y + 24,
        14,
        21,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#ffb52e";

    ctx.beginPath();

    ctx.moveTo(
        x + 21,
        y + 12
    );

    ctx.lineTo(
        x + 34,
        y + 17
    );

    ctx.lineTo(
        x + 21,
        y + 22
    );

    ctx.closePath();

    ctx.fill();
}


/* =========================================================
   FISH
========================================================= */

function drawFish(x, y) {

    ctx.fillStyle = "#ff7c48";

    ctx.beginPath();

    ctx.ellipse(
        x + 22,
        y + 22,
        24,
        15,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
        x,
        y + 22
    );

    ctx.lineTo(
        x - 20,
        y + 7
    );

    ctx.lineTo(
        x - 20,
        y + 37
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle = "white";

    ctx.beginPath();

    ctx.arc(
        x + 32,
        y + 18,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(
        x + 33,
        y + 18,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   BOMB
========================================================= */

function drawBomb(x, y) {

    ctx.fillStyle = "#292929";

    ctx.beginPath();

    ctx.arc(
        x + 22,
        y + 22,
        22,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle = "#e9a31a";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        x + 30,
        y + 3
    );

    ctx.quadraticCurveTo(
        x + 45,
        y - 15,
        x + 53,
        y - 5
    );

    ctx.stroke();


    ctx.fillStyle = "#ff5a24";

    ctx.beginPath();

    ctx.arc(
        x + 54,
        y - 7,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   PLAYER DRAW
========================================================= */

function drawPlayer() {

    if (
        player.invincible > 0 &&
        Math.floor(player.invincible * 10) % 2 === 0
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
        y
    );

    ctx.scale(
        player.direction,
        1
    );


    /*
       پاها
    */

    const walk =
        player.onGround
            ? Math.sin(player.animTime) * 4
            : 0;

    ctx.fillStyle = "#333b70";

    ctx.fillRect(
        -13,
        43 + walk,
        10,
        19
    );

    ctx.fillRect(
        3,
        43 - walk,
        10,
        19
    );


    /*
       کفش
    */

    ctx.fillStyle = "#5c2c27";

    ctx.fillRect(
        -16,
        58 + walk,
        15,
        7
    );

    ctx.fillRect(
        2,
        58 - walk,
        15,
        7
    );


    /*
       بدن
    */

    ctx.fillStyle = "#e94c54";

    ctx.beginPath();

    ctx.roundRect(
        -16,
        18,
        32,
        32,
        9
    );

    ctx.fill();


    /*
       لباس
    */

    ctx.fillStyle = "#f3d35b";

    ctx.fillRect(
        -13,
        28,
        26,
        5
    );


    /*
       دست‌ها
    */

    ctx.fillStyle = "#f3bd91";

    ctx.fillRect(
        -23,
        25,
        9,
        20
    );

    ctx.fillRect(
        14,
        25,
        9,
        20
    );


    /*
       گردن
    */

    ctx.fillRect(
        -6,
        10,
        12,
        12
    );


    /*
       مو
    */

    ctx.fillStyle = "#4c2920";

    ctx.beginPath();

    ctx.arc(
        0,
        7,
        22,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       صورت
    */

    ctx.fillStyle = "#f3bd91";

    ctx.beginPath();

    ctx.arc(
        3,
        9,
        16,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       مو روی صورت
    */

    ctx.fillStyle = "#4c2920";

    ctx.beginPath();

    ctx.arc(
        -3,
        1,
        18,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    /*
       چشم
    */

    ctx.fillStyle = "#222";

    ctx.beginPath();

    ctx.arc(
        8,
        8,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       لبخند
    */

    ctx.strokeStyle = "#9b4d46";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        7,
        13,
        5,
        0,
        Math.PI
    );

    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   BULLET DRAW
========================================================= */

function drawBullets() {

    for (const bullet of bullets) {

        const x =
            bullet.x - cameraX;

        ctx.fillStyle = "#fff";

        ctx.shadowBlur = 12;

        ctx.shadowColor = "#ffdf43";

        ctx.beginPath();

        ctx.arc(
            x,
            bullet.y + 3,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}


/* =========================================================
   FLAG DRAW
========================================================= */

function drawFlag() {

    if (!flag) return;

    const x =
        flag.x - cameraX;


    ctx.fillStyle = "#eeeeee";

    ctx.fillRect(
        x,
        flag.y,
        7,
        105
    );


    ctx.fillStyle = "#e94455";

    ctx.beginPath();

    ctx.moveTo(
        x + 7,
        flag.y
    );

    ctx.lineTo(
        x + 55,
        flag.y + 20
    );

    ctx.lineTo(
        x + 7,
        flag.y + 38
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle = "#f1c84b";

    ctx.beginPath();

    ctx.arc(
        x + 3,
        flag.y - 3,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   BOSS DRAW
========================================================= */

function drawBoss() {

    if (!boss || !boss.active) return;

    const x =
        boss.x - cameraX;

    const y =
        boss.y;


    ctx.save();


    if (boss.hitFlash > 0) {

        ctx.globalAlpha = 0.55;

    }


    ctx.fillStyle = "#71356e";

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        boss.width,
        boss.height,
        18
    );

    ctx.fill();


    ctx.fillStyle = "#f4c19c";

    ctx.beginPath();

    ctx.arc(
        x + boss.width / 2,
        y + 30,
        24,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#222";

    ctx.beginPath();

    ctx.arc(
        x + 33,
        y + 27,
        4,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 50,
        y + 27,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#e23c4d";

    ctx.fillRect(
        x + 17,
        y + 57,
        48,
        22
    );


    ctx.restore();


    /* نوار جان */

    const barWidth = 100;

    const hpWidth =
        barWidth *
        (boss.hp / boss.maxHp);


    ctx.fillStyle = "#222";

    ctx.fillRect(
        x - 10,
        y - 18,
        barWidth,
        9
    );


    ctx.fillStyle = "#ef4450";

    ctx.fillRect(
        x - 10,
        y - 18,
        hpWidth,
        9
    );
}


/* =========================================================
   FATHER
========================================================= */

function drawFather() {

    if (!father || father.rescued) return;

    const x =
        father.x - cameraX;

    const y =
        father.y;


    /* قفس */

    ctx.strokeStyle = "#8b8b8b";

    ctx.lineWidth = 5;

    ctx.strokeRect(
        x,
        y,
        father.width,
        father.height
    );


    for (let i = 1; i < 4; i++) {

        ctx.beginPath();

        ctx.moveTo(
            x + i * 18,
            y
        );

        ctx.lineTo(
            x + i * 18,
            y + father.height
        );

        ctx.stroke();
    }


    /* پدر */

    ctx.fillStyle = "#355a91";

    ctx.fillRect(
        x + 20,
        y + 52,
        35,
        40
    );


    ctx.fillStyle = "#f1bd91";

    ctx.beginPath();

    ctx.arc(
        x + 38,
        y + 35,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "#4b3026";

    ctx.beginPath();

    ctx.arc(
        x + 38,
        y + 29,
        16,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   GAME DRAW
========================================================= */

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    drawBackground();

    drawWorld();

    drawCoins();

    drawEnemies();

    drawBoss();

    drawFather();

    drawFlag();

    drawBullets();

    drawPlayer();

    updateHUD();
}


/* =========================================================
   GAME UPDATE
========================================================= */

function updateGame(dt) {

    if (!gameRunning) return;

    if (gamePaused) return;

    if (gameOver || gameWon) return;


    updatePlayer(dt);

    updateEnemies();

    updateBullets(dt);

    updateCoins();

    updateBoss();

    checkFinish();

    updateCamera();

    updateHUD();
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(time) {

    if (!gameRunning) {

        drawGame();

        return;
    }


    const dt =
        Math.min(
            0.05,
            (time - lastTime) / 1000
        );


    lastTime = time;


    updateGame(dt);

    drawGame();


    requestAnimationFrame(gameLoop);
}


/* =========================================================
   INITIALIZATION
========================================================= */

resizeCanvas();

lives = 3;
coins = 0;
score = 0;

gameScreen.classList.add("hidden");

pauseMenu.classList.add("hidden");
gameOverMenu.classList.add("hidden");
winMenu.classList.add("hidden");


/* =========================================================
   END
========================================================= */
