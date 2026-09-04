"use strict";

/* =========================================================
   ELINA MUSHROOM ADVENTURE
   Professional Mobile Canvas Engine
   World 1 Visual Upgrade
   ========================================================= */


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

    canvasWidth =
        gameScreen.clientWidth ||
        window.innerWidth ||
        800;

    canvasHeight =
        gameScreen.clientHeight ||
        window.innerHeight ||
        450;

    dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        Math.floor(canvasWidth * dpr);

    canvas.height =
        Math.floor(canvasHeight * dpr);

    canvas.style.width =
        canvasWidth + "px";

    canvas.style.height =
        canvasHeight + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    if (levelData) {
        rebuildResponsiveLevel();
    }
}


/* =========================================================
   ORIENTATION
========================================================= */

let isLandscape =
    window.innerWidth >
    window.innerHeight;

function updateOrientation() {

    const newOrientation =
        window.innerWidth >
        window.innerHeight;

    if (
        newOrientation !==
        isLandscape
    ) {

        isLandscape =
            newOrientation;

        resizeCanvas();

        setTimeout(() => {
            resizeCanvas();
        }, 100);

    }
}

window.addEventListener(
    "resize",
    updateOrientation
);

window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(() => {

            updateOrientation();
            resizeCanvas();

        }, 150);

    }
);


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

let animationFrameId = null;
let gameSessionId = 0;


/* =========================================================
   INPUT
========================================================= */

const keys = {

    left: false,
    right: false,
    jump: false,
    shoot: false

};


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    (e) => {

        const key =
            e.key;

        if (
            [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                " ",
                "a",
                "A",
                "d",
                "D",
                "w",
                "W",
                "f",
                "F"
            ].includes(key)
        ) {

            e.preventDefault();

        }

        if (
            key === "ArrowLeft" ||
            key === "a" ||
            key === "A"
        ) {

            keys.left = true;

        }

        if (
            key === "ArrowRight" ||
            key === "d" ||
            key === "D"
        ) {

            keys.right = true;

        }

        if (
            key === "ArrowUp" ||
            key === " " ||
            key === "w" ||
            key === "W"
        ) {

            keys.jump = true;

        }

        if (
            key === "f" ||
            key === "F"
        ) {

            keys.shoot = true;

        }

    }
);


window.addEventListener(
    "keyup",
    (e) => {

        const key =
            e.key;

        if (
            key === "ArrowLeft" ||
            key === "a" ||
            key === "A"
        ) {

            keys.left = false;

        }

        if (
            key === "ArrowRight" ||
            key === "d" ||
            key === "D"
        ) {

            keys.right = false;

        }

        if (
            key === "ArrowUp" ||
            key === " " ||
            key === "w" ||
            key === "W"
        ) {

            keys.jump = false;

        }

        if (
            key === "f" ||
            key === "F"
        ) {

            keys.shoot = false;

        }

    }
);


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function holdButton(
    button,
    onDown,
    onUp
) {

    if (!button) return;

    const release = (e) => {

        if (e) {
            e.preventDefault();
        }

        onUp();

    };

    button.addEventListener(
        "pointerdown",
        (e) => {

            e.preventDefault();

            try {

                button.setPointerCapture(
                    e.pointerId
                );

            } catch (_) {}

            onDown();

        },
        {
            passive: false
        }
    );

    button.addEventListener(
        "pointerup",
        release,
        {
            passive: false
        }
    );

    button.addEventListener(
        "pointercancel",
        release,
        {
            passive: false
        }
    );

    button.addEventListener(
        "lostpointercapture",
        release
    );

    button.addEventListener(
        "contextmenu",
        (e) => {

            e.preventDefault();

        }
    );

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
    y: 100,

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
   PARTICLES
========================================================= */

let particles = [];

function createParticles(
    x,
    y,
    type = "coin"
) {

    const count =
        type === "coin"
            ? 12
            : type === "enemy"
                ? 18
                : 8;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        particles.push({

            x,
            y,

            vx:
                (Math.random() - 0.5) *
                (
                    type === "enemy"
                        ? 7
                        : 5
                ),

            vy:
                -Math.random() *
                (
                    type === "enemy"
                        ? 6
                        : 4
                ),

            life:
                0.6 +
                Math.random() * 0.5,

            maxLife: 1,

            size:
                3 +
                Math.random() * 5,

            type

        });

    }

}


function updateParticles(dt) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vy += 0.18;

        p.life -= dt;

        if (
            p.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }

}


function drawParticles() {

    for (
        const p of particles
    ) {

        const alpha =
            Math.max(
                0,
                p.life /
                p.maxLife
            );

        ctx.save();

        ctx.globalAlpha =
            alpha;

        ctx.fillStyle =
            p.type === "coin"
                ? "#ffd83d"
                : p.type === "enemy"
                    ? "#ff6b55"
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

        ctx.restore();

    }

}


/* =========================================================
   WORLD DATA
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
   CREATE LEVEL
========================================================= */

function createLevel(
    world,
    level
) {

    const groundHeight =
        isLandscape
            ? 75
            : 90;

    const groundY =
        Math.max(
            260,
            canvasHeight -
            groundHeight
        );

    const data = {

        width:
            6500 +
            level * 250,

        groundY,

        platforms: [],

        enemies: [],

        coins: [],

        flag: {

            x: 0,
            y: 0,
            width: 55,
            height: 105

        },

        boss: null,

        father: null

    };


    /* =====================================================
       GROUND
    ===================================================== */

    data.platforms.push({

        x: 0,

        y: data.groundY,

        width: data.width,

        height: 120,

        type: "ground"

    });


    /* =====================================================
       PLATFORMS
    ===================================================== */

    const spacing =
        isLandscape
            ? 360
            : 330;

    for (
        let i = 1;
        i < 18 + level;
        i++
    ) {

        const x =
            i * spacing +
            ((level * 37) % 100);

        const heightOffset =
            50 +
            Math.sin(i * 1.7) * 35;

        const y =
            data.groundY -
            Math.max(
                55,
                heightOffset
            );

        data.platforms.push({

            x,

            y,

            width:
                150 +
                ((i * 47) % 90),

            height: 24,

            type: "platform"

        });

    }


    /* =====================================================
       COINS
    ===================================================== */

    for (
        let i = 0;
        i < 32 + level * 3;
        i++
    ) {

        const x =
            220 +
            i * 180;

        const y =
            data.groundY -
            75 -
            ((i * 31) % 100);

        data.coins.push({

            x,

            y,

            radius: 12,

            collected: false,

            spin:
                Math.random() *
                Math.PI *
                2

        });

    }


    /* =====================================================
       ENEMIES
    ===================================================== */

    for (
        let i = 0;
        i < 10 + level;
        i++
    ) {

        const x =
            550 +
            i * 430;

        let enemyType =
            worlds[world].enemy;

        if (
            world === 1
        ) {

            enemyType =
                [
                    "snail",
                    "bee",
                    "turtle"
                ][i % 3];

        }

        const isBee =
            enemyType === "bee";

        data.enemies.push({

            x,

            y:
                isBee
                    ? data.groundY -
                      145 -
                      (i % 2) * 35
                    : data.groundY -
                      42,

            width: 44,

            height: 38,

            vx:
                isBee
                    ? (
                        i % 2 === 0
                            ? 1.4
                            : -1.4
                    )
                    : (
                        i % 2 === 0
                            ? 1.1
                            : -1.1
                    ),

            leftLimit:
                x - 100,

            rightLimit:
                x + 100,

            alive: true,

            type:
                enemyType,

            anim:
                Math.random() * 10,

            baseY:
                isBee
                    ? data.groundY -
                      145 -
                      (i % 2) * 35
                    : data.groundY -
                      42

        });

    }


    /* =====================================================
       FLAG
    ===================================================== */

    data.flag.x =
        data.width - 220;

    data.flag.y =
        data.groundY - 105;


    /* =====================================================
       BOSS
    ===================================================== */

    if (
        level === 10
    ) {

        data.boss = {

            x:
                data.width - 700,

            y:
                data.groundY - 100,

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

            x:
                data.width - 130,

            y:
                data.groundY - 110,

            width: 75,

            height: 100,

            rescued: false

        };

    }


    return data;

}


/* =========================================================
   RESPONSIVE LEVEL REBUILD
========================================================= */

function rebuildResponsiveLevel() {

    if (!levelData) return;

    const oldGround =
        levelData.groundY;

    const newGround =
        Math.max(
            260,
            canvasHeight -
            (
                isLandscape
                    ? 75
                    : 90
            )
        );

    const difference =
        newGround -
        oldGround;

    if (
        Math.abs(difference) < 1
    ) {
        return;
    }

    levelData.groundY =
        newGround;


    for (
        const platform of
        levelData.platforms
    ) {

        if (
            platform.type ===
            "ground"
        ) {

            platform.y =
                newGround;

        }

    }


    for (
        const platform of
        levelData.platforms
    ) {

        if (
            platform.type !==
            "ground"
        ) {

            platform.y +=
                difference;

        }

    }


    for (
        const enemy of
        enemies
    ) {

        enemy.y +=
            difference;

        if (
            enemy.type ===
            "bee"
        ) {

            enemy.baseY +=
                difference;

        }

    }


    for (
        const coin of
        levelCoins
    ) {

        coin.y +=
            difference;

    }


    if (flag) {

        flag.y =
            newGround - 105;

    }


    if (boss) {

        boss.y =
            newGround - 100;

    }


    if (father) {

        father.y =
            newGround - 110;

    }


    if (
        player.y >
        newGround + 100
    ) {

        player.y =
            newGround -
            player.height;

        player.vy = 0;

    }

}


/* =========================================================
   START LEVEL
========================================================= */

function startLevel(
    world,
    level
) {

    gameSessionId++;


    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId =
            null;

    }


    selectedWorld =
        world;

    currentLevel =
        level;


    levelData =
        createLevel(
            world,
            level
        );


    platforms =
        levelData.platforms;

    enemies =
        levelData.enemies;

    levelCoins =
        levelData.coins;

    flag =
        levelData.flag;

    boss =
        levelData.boss;

    father =
        levelData.father;


    player.x = 100;

    player.y =
        levelData.groundY -
        player.height -
        5;

    player.vx = 0;
    player.vy = 0;

    player.onGround = false;

    player.direction = 1;

    player.animTime = 0;

    player.invincible = 2;

    player.shootCooldown = 0;

    player.ammo =
        player.maxAmmo;

    player.ammoTimer = 0;


    cameraX = 0;

    bullets = [];

    particles = [];


    gamePaused = false;
    gameOver = false;
    gameWon = false;


    pauseMenu.classList.add(
        "hidden"
    );

    gameOverMenu.classList.add(
        "hidden"
    );

    winMenu.classList.add(
        "hidden"
    );


    mainMenu.classList.add(
        "hidden"
    );

    worldMenu.classList.add(
        "hidden"
    );

    levelMenu.classList.add(
        "hidden"
    );

    gameScreen.classList.remove(
        "hidden"
    );


    resizeCanvas();

    updateHUD();


    showMessage(
        `دنیای ${world} - مرحله ${level}`,
        1800
    );


    gameRunning = true;

    lastTime =
        performance.now();


    const session =
        gameSessionId;


    animationFrameId =
        requestAnimationFrame(
            (time) =>
                gameLoop(
                    time,
                    session
                )
        );

}


/* =========================================================
   MENU
========================================================= */

startGameButton.addEventListener(
    "click",
    () => {

        lives = 3;
        coins = 0;
        score = 0;

        startLevel(
            1,
            1
        );

    }
);


worldSelectButton.addEventListener(
    "click",
    () => {

        mainMenu.classList.add(
            "hidden"
        );

        worldMenu.classList.remove(
            "hidden"
        );

    }
);


settingsButton.addEventListener(
    "click",
    () => {

        alert(
            "⚙️ تنظیمات بازی\n\n" +
            "نسخه صوتی و امکانات بیشتر " +
            "به‌زودی اضافه می‌شوند."
        );

    }
);


backFromWorlds.addEventListener(
    "click",
    () => {

        worldMenu.classList.add(
            "hidden"
        );

        mainMenu.classList.remove(
            "hidden"
        );

    }
);


backFromLevels.addEventListener(
    "click",
    () => {

        levelMenu.classList.add(
            "hidden"
        );

        worldMenu.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   WORLD SELECT
========================================================= */

document
    .querySelectorAll(".world-card")
    .forEach(
        (card) => {

            card.addEventListener(
                "click",
                () => {

                    const world =
                        Number(
                            card.dataset.world
                        );

                    selectedWorld =
                        world;

                    openLevelMenu(
                        world
                    );

                }
            );

        }
    );


/* =========================================================
   LEVEL MENU
========================================================= */

function openLevelMenu(
    world
) {

    selectedWorld =
        world;

    worldMenu.classList.add(
        "hidden"
    );

    levelMenu.classList.remove(
        "hidden"
    );


    levelList.innerHTML =
        "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "level-button";


        button.textContent =
            i;


        button.title =
            `دنیای ${world} - مرحله ${i}`;


        button.addEventListener(
            "click",
            () => {

                lives = 3;

                startLevel(
                    world,
                    i
                );

            }
        );


        levelList.appendChild(
            button
        );

    }

}


/* =========================================================
   PAUSE
========================================================= */

pauseButton.addEventListener(
    "click",
    () => {

        if (
            !gameRunning ||
            gameOver ||
            gameWon
        ) {
            return;
        }


        gamePaused = true;

        pauseMenu.classList.remove(
            "hidden"
        );

    }
);


resumeButton.addEventListener(
    "click",
    () => {

        gamePaused = false;

        pauseMenu.classList.add(
            "hidden"
        );

        lastTime =
            performance.now();

    }
);


restartButton.addEventListener(
    "click",
    () => {

        lives = 3;
        coins = 0;
        score = 0;

        startLevel(
            selectedWorld,
            currentLevel
        );

    }
);


exitButton.addEventListener(
    "click",
    () => {

        stopGame();

        pauseMenu.classList.add(
            "hidden"
        );

        gameScreen.classList.add(
            "hidden"
        );

        mainMenu.classList.remove(
            "hidden"
        );

    }
);


tryAgainButton.addEventListener(
    "click",
    () => {

        lives = 3;

        startLevel(
            selectedWorld,
            currentLevel
        );

    }
);


gameOverHome.addEventListener(
    "click",
    () => {

        stopGame();

        gameOverMenu.classList.add(
            "hidden"
        );

        gameScreen.classList.add(
            "hidden"
        );

        mainMenu.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   WIN
========================================================= */

nextLevelButton.addEventListener(
    "click",
    () => {

        if (
            nextLevelButton.dataset.final ===
            "true"
        ) {

            nextLevelButton.dataset.final =
                "false";

            winMenu.classList.add(
                "hidden"
            );

            gameScreen.classList.add(
                "hidden"
            );

            mainMenu.classList.remove(
                "hidden"
            );

            stopGame();

            return;

        }


        winMenu.classList.add(
            "hidden"
        );


        if (
            currentLevel < 10
        ) {

            startLevel(
                selectedWorld,
                currentLevel + 1
            );

            return;

        }


        if (
            selectedWorld < 4
        ) {

            startLevel(
                selectedWorld + 1,
                1
            );

            return;

        }


        showFinalVictory();

    }
);


winHomeButton.addEventListener(
    "click",
    () => {

        stopGame();

        winMenu.classList.add(
            "hidden"
        );

        gameScreen.classList.add(
            "hidden"
        );

        mainMenu.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   STOP GAME
========================================================= */

function stopGame() {

    gameRunning = false;

    gamePaused = false;

    gameOver = false;

    gameWon = false;

    gameSessionId++;


    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId =
            null;

    }


    keys.left = false;
    keys.right = false;
    keys.jump = false;
    keys.shoot = false;

}


/* =========================================================
   PHYSICS
========================================================= */

const gravity = 0.65;


function updatePlayer(dt) {

    if (!player) return;


    if (keys.left) {

        player.vx -=
            0.55;

        player.direction =
            -1;

    }


    if (keys.right) {

        player.vx +=
            0.55;

        player.direction =
            1;

    }


    player.vx *=
        0.82;


    if (
        player.vx >
        player.speed
    ) {

        player.vx =
            player.speed;

    }


    if (
        player.vx <
        -player.speed
    ) {

        player.vx =
            -player.speed;

    }


    if (
        keys.jump &&
        player.onGround
    ) {

        player.vy =
            -player.jumpPower;

        player.onGround =
            false;

        keys.jump = false;

    }


    player.vy +=
        gravity;


    player.x +=
        player.vx;

    player.y +=
        player.vy;


    if (
        player.x < 0
    ) {

        player.x = 0;

        player.vx = 0;

    }


    if (
        levelData &&
        player.x >
        levelData.width -
        player.width
    ) {

        player.x =
            levelData.width -
            player.width;

    }


    player.onGround =
        false;


    for (
        const platform of platforms
    ) {

        if (

            player.x +
                player.width >
                platform.x &&

            player.x <
                platform.x +
                platform.width &&

            player.y +
                player.height >=
                platform.y &&

            player.y +
                player.height <=
                platform.y +
                platform.height +
                18 &&

            player.vy >= 0

        ) {

            player.y =
                platform.y -
                player.height;

            player.vy = 0;

            player.onGround =
                true;

        }

    }


    if (
        player.y >
        canvasHeight + 200
    ) {

        loseLife();

    }


    player.animTime +=
        Math.abs(
            player.vx
        ) * 0.15;


    if (
        player.invincible > 0
    ) {

        player.invincible -=
            dt;

    }


    if (
        player.shootCooldown > 0
    ) {

        player.shootCooldown -=
            dt;

    }


    if (keys.shoot) {

        shoot();

    }


    if (
        player.ammo <
        player.maxAmmo
    ) {

        player.ammoTimer +=
            dt;


        if (
            player.ammoTimer >=
            2.5
        ) {

            player.ammo++;

            player.ammoTimer =
                0;

        }

    }

}


/* =========================================================
   COLLISION
========================================================= */

function rectanglesOverlap(
    a,
    b
) {

    return (

        a.x <
            b.x +
            b.width &&

        a.x +
            a.width >
            b.x &&

        a.y <
            b.y +
            b.height &&

        a.y +
            a.height >
            b.y

    );

}


/* =========================================================
   ENEMIES
========================================================= */

function updateEnemies() {

    for (
        const enemy of enemies
    ) {

        if (
            !enemy.alive
        ) continue;


        enemy.x +=
            enemy.vx;


        enemy.anim +=
            0.08;


        if (
            enemy.type ===
            "bee"
        ) {

            enemy.y =
                enemy.baseY +
                Math.sin(
                    enemy.anim * 2
                ) * 18;

        }


        if (
            enemy.x <=
            enemy.leftLimit
        ) {

            enemy.x =
                enemy.leftLimit;

            enemy.vx =
                Math.abs(
                    enemy.vx
                );

        }


        if (
            enemy.x >=
            enemy.rightLimit
        ) {

            enemy.x =
                enemy.rightLimit;

            enemy.vx =
                -Math.abs(
                    enemy.vx
                );

        }


        if (
            rectanglesOverlap(
                player,
                enemy
            )
        ) {

            if (
                player.vy > 0 &&
                player.y +
                    player.height -
                    enemy.y <
                    25
            ) {

                enemy.alive =
                    false;

                player.vy =
                    -8;

                score +=
                    100;


                createParticles(
                    enemy.x +
                        enemy.width / 2,
                    enemy.y +
                        enemy.height / 2,
                    "enemy"
                );


                showMessage(
                    "+100",
                    500
                );

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

    if (
        player.shootCooldown > 0
    ) {
        return;
    }


    if (
        player.ammo <= 0
    ) {

        showMessage(
            "گلوله تمام شد!",
            700
        );

        return;

    }


    player.ammo--;

    player.ammoTimer = 0;

    player.shootCooldown =
        0.28;


    bullets.push({

        x:
            player.direction === 1
                ? player.x +
                  player.width
                : player.x - 12,

        y:
            player.y + 25,

        width: 13,

        height: 7,

        vx:
            player.direction *
            11,

        life: 2

    });

}


/* =========================================================
   BULLETS
========================================================= */

function updateBullets(dt) {

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.vx;


        bullet.life -=
            dt;


        if (
            bullet.life <= 0
        ) {

            bullets.splice(
                i,
                1
            );

            continue;

        }


        let destroyed =
            false;


        for (
            const enemy of enemies
        ) {

            if (
                !enemy.alive
            ) continue;


            if (
                rectanglesOverlap(
                    bullet,
                    enemy
                )
            ) {

                enemy.alive =
                    false;

                score +=
                    100;


                createParticles(
                    enemy.x +
                        enemy.width / 2,
                    enemy.y +
                        enemy.height / 2,
                    "enemy"
                );


                destroyed =
                    true;

                break;

            }

        }


        if (destroyed) {

            bullets.splice(
                i,
                1
            );

            continue;

        }


        if (
            boss &&
            boss.active &&
            rectanglesOverlap(
                bullet,
                boss
            )
        ) {

            boss.hp--;

            boss.hitFlash =
                0.15;

            score +=
                50;


            createParticles(
                bullet.x,
                bullet.y,
                "hit"
            );


            bullets.splice(
                i,
                1
            );


            if (
                boss.hp <= 0
            ) {

                boss.active =
                    false;

                score +=
                    1000;


                createParticles(
                    boss.x +
                        boss.width / 2,
                    boss.y +
                        boss.height / 2,
                    "enemy"
                );


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

function updateBoss(dt) {

    if (
        !boss ||
        !boss.active
    ) {
        return;
    }


    boss.x +=
        boss.vx;


    boss.direction =
        boss.vx >= 0
            ? 1
            : -1;


    if (
        boss.x <
            levelData.width -
            950 ||

        boss.x >
            levelData.width -
            450
    ) {

        boss.vx *=
            -1;

    }


    if (
        boss.hitFlash > 0
    ) {

        boss.hitFlash -=
            dt;

    }


    if (
        rectanglesOverlap(
            player,
            boss
        )
    ) {

        hurtPlayer();

    }

}


/* =========================================================
   COINS
========================================================= */

function updateCoins() {

    for (
        const coin of levelCoins
    ) {

        if (
            coin.collected
        ) {
            continue;
        }


        coin.spin +=
            0.08;


        const dx =
            player.x +
            player.width / 2 -
            coin.x;


        const dy =
            player.y +
            player.height / 2 -
            coin.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance < 35
        ) {

            coin.collected =
                true;

            coins++;

            score +=
                25;


            createParticles(
                coin.x,
                coin.y,
                "coin"
            );

        }

    }

}


/* =========================================================
   FINISH
========================================================= */

function checkFinish() {

    if (!flag) return;


    const flagBox = {

        x: flag.x,

        y: flag.y,

        width: flag.width,

        height: flag.height

    };


    if (
        rectanglesOverlap(
            player,
            flagBox
        )
    ) {

        if (
            currentLevel === 10
        ) {

            if (
                boss &&
                boss.active
            ) {

                showMessage(
                    "اول غول مرحله را شکست بده!",
                    1200
                );

                return;

            }


            if (
                father &&
                !father.rescued
            ) {

                father.rescued =
                    true;

                score +=
                    2000;


                createParticles(
                    father.x +
                        father.width / 2,
                    father.y +
                        father.height / 2,
                    "coin"
                );


                showMessage(
                    "👨‍👧 پدرت را نجات دادی!",
                    1800
                );


                setTimeout(
                    () => {

                        if (
                            gameRunning &&
                            !gameWon
                        ) {

                            completeLevel();

                        }

                    },
                    1500
                );


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

    if (
        gameWon
    ) {
        return;
    }


    gameWon =
        true;

    gameRunning =
        false;


    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId =
            null;

    }


    winScore.textContent =
        score;


    winMenu.classList.remove(
        "hidden"
    );


    if (
        selectedWorld === 4 &&
        currentLevel === 10
    ) {

        nextLevelButton.textContent =
            "🏆 پایان بازی";

    }
    else if (
        currentLevel === 10
    ) {

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

    winMenu.classList.remove(
        "hidden"
    );


    const title =
        winMenu.querySelector(
            "h2"
        );


    if (title) {

        title.textContent =
            "🏆 تو قهرمان بازی شدی!";

    }


    const paragraphs =
        winMenu.querySelectorAll(
            "p"
        );


    if (
        paragraphs[0]
    ) {

        paragraphs[0].textContent =
            "همه دنیاها را پشت سر گذاشتی و پدرت را نجات دادی! 👨‍👧";

    }


    nextLevelButton.textContent =
        "🏠 بازگشت به خانه";


    nextLevelButton.dataset.final =
        "true";

}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function hurtPlayer() {

    if (
        player.invincible > 0
    ) {
        return;
    }


    lives--;

    updateHUD();


    player.invincible =
        2;


    player.vy =
        -8;


    player.vx =
        player.direction === 1
            ? -6
            : 6;


    createParticles(
        player.x +
            player.width / 2,
        player.y +
            player.height / 2,
        "hit"
    );


    if (
        lives <= 0
    ) {

        triggerGameOver();

        return;

    }


    player.x =
        Math.max(
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


/* =========================================================
   LOSE LIFE
========================================================= */

function loseLife() {

    if (
        player.invincible > 0
    ) {
        return;
    }


    lives--;

    updateHUD();


    if (
        lives <= 0
    ) {

        triggerGameOver();

        return;

    }


    player.x =
        Math.max(
            100,
            player.x - 200
        );


    player.y =
        levelData.groundY -
        player.height -
        100;


    player.vy = 0;

    player.invincible =
        2;


    showMessage(
        "⚠️ مراقب باش!",
        900
    );

}


/* =========================================================
   GAME OVER
========================================================= */

function triggerGameOver() {

    gameOver =
        true;

    gameRunning =
        false;


    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId =
            null;

    }


    finalScore.textContent =
        score;


    gameOverMenu.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    if (!levelData) return;


    const target =
        player.x -
        canvasWidth *
        (
            isLandscape
                ? 0.42
                : 0.38
        );


    cameraX +=
        (
            target -
            cameraX
        ) * 0.08;


    if (
        cameraX < 0
    ) {

        cameraX = 0;

    }


    const maxCamera =
        Math.max(
            0,
            levelData.width -
            canvasWidth
        );


    if (
        cameraX >
        maxCamera
    ) {

        cameraX =
            maxCamera;

    }

}


/* =========================================================
   HUD
========================================================= */

let ammoHud = null;


function createAmmoHud() {

    if (ammoHud) {
        return;
    }


    ammoHud =
        document.createElement(
            "div"
        );


    ammoHud.id =
        "ammoHud";


    ammoHud.style.position =
        "absolute";


    ammoHud.style.top =
        "68px";


    ammoHud.style.left =
        "50%";


    ammoHud.style.transform =
        "translateX(-50%)";


    ammoHud.style.padding =
        "7px 12px";


    ammoHud.style.borderRadius =
        "12px";


    ammoHud.style.background =
        "rgba(0,0,0,0.55)";


    ammoHud.style.border =
        "2px solid rgba(255,255,255,0.8)";


    ammoHud.style.color =
        "white";


    ammoHud.style.fontWeight =
        "bold";


    ammoHud.style.fontSize =
        "13px";


    ammoHud.style.zIndex =
        "120";


    ammoHud.style.pointerEvents =
        "none";


    gameScreen.appendChild(
        ammoHud
    );

}


function updateHUD() {

    livesText.textContent =
        lives;

    coinsText.textContent =
        coins;

    scoreText.textContent =
        score;

    currentWorldText.textContent =
        selectedWorld;

    currentLevelText.textContent =
        currentLevel;


    createAmmoHud();


    ammoHud.textContent =
        `🔴 گلوله: ${player.ammo} / ${player.maxAmmo}`;


    ammoHud.style.top =
        isLandscape
            ? "55px"
            : "68px";

}


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer =
    null;


function showMessage(
    text,
    duration = 1000
) {

    gameMessage.textContent =
        text;


    gameMessage.style.opacity =
        "1";


    clearTimeout(
        messageTimer
    );


    messageTimer =
        setTimeout(
            () => {

                gameMessage.style.opacity =
                    "0";

            },
            duration
        );

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

    const world =
        worlds[selectedWorld];


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


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    if (
        selectedWorld === 1
    ) {

        drawForestBackground();

    }
    else if (
        selectedWorld === 2
    ) {

        drawSnowBackground();

    }
    else if (
        selectedWorld === 3
    ) {

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

    ctx.save();

    ctx.shadowBlur =
        25;

    ctx.shadowColor =
        "#ffe680";

    ctx.fillStyle =
        "#ffe680";


    ctx.beginPath();

    ctx.arc(
        canvasWidth - 100,
        90,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();


    /* ابرها */

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const x =
            (
                i * 280 -
                cameraX * 0.18
            ) %
            (
                canvasWidth +
                300
            ) -
            150;


        const y =
            60 +
            (i % 3) * 45;


        drawCloud(
            x,
            y,
            1
        );

    }


    /* تپه‌های دور */

    ctx.fillStyle =
        "#8ed06d";


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        const x =
            i * 230 -
            cameraX * 0.20;


        ctx.beginPath();

        ctx.arc(
            x,
            canvasHeight - 75,
            155,
            Math.PI,
            0
        );

        ctx.fill();

    }


    /* تپه‌های نزدیک */

    ctx.fillStyle =
        "#5cae4a";


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const x =
            i * 280 -
            cameraX * 0.38;


        ctx.beginPath();

        ctx.arc(
            x,
            canvasHeight - 55,
            125,
            Math.PI,
            0
        );

        ctx.fill();

    }


    /* درخت‌ها */

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        const x =
            i * 390 -
            cameraX * 0.55;


        drawTree(
            x,
            canvasHeight - 90
        );

    }


    /* بوته‌ها */

    for (
        let i = 0;
        i < 25;
        i++
    ) {

        const x =
            i * 270 -
            cameraX * 0.70;


        drawBush(
            x,
            canvasHeight - 78
        );

    }

}


/* =========================================================
   SNOW BACKGROUND
========================================================= */

function drawSnowBackground() {

    ctx.fillStyle =
        "#d9f4ff";


    ctx.fillRect(
        0,
        canvasHeight - 160,
        canvasWidth,
        160
    );


    for (
        let i = 0;
        i < 70;
        i++
    ) {

        const x =
            (
                i * 91 -
                cameraX * 0.15
            ) %
            canvasWidth;


        const y =
            (
                i * 57
            ) %
            canvasHeight;


        ctx.fillStyle =
            "rgba(255,255,255,0.8)";


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


    for (
        let i = 0;
        i < 10;
        i++
    ) {

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


    for (
        let i = 0;
        i < 12;
        i++
    ) {

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

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const x =
            i * 130 -
            cameraX * 0.2;


        const y =
            canvasHeight -
            90 -
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

function drawCloud(
    x,
    y,
    scale
) {

    ctx.fillStyle =
        "rgba(255,255,255,0.88)";


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

function drawTree(
    x,
    y
) {

    /* تنه */

    ctx.fillStyle =
        "#70442b";


    ctx.fillRect(
        x,
        y - 95,
        30,
        95
    );


    /* سایه تنه */

    ctx.fillStyle =
        "#56331f";


    ctx.fillRect(
        x + 20,
        y - 95,
        10,
        95
    );


    /* تاج درخت */

    ctx.fillStyle =
        "#2f8b38";


    ctx.beginPath();


    ctx.arc(
        x + 15,
        y - 110,
        50,
        0,
        Math.PI * 2
    );


    ctx.arc(
        x - 20,
        y - 80,
        36,
        0,
        Math.PI * 2
    );


    ctx.arc(
        x + 48,
        y - 80,
        40,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* برگ روشن */

    ctx.fillStyle =
        "#4eaa43";


    ctx.beginPath();


    ctx.arc(
        x + 5,
        y - 120,
        20,
        0,
        Math.PI * 2
    );


    ctx.arc(
        x + 34,
        y - 100,
        17,
        0,
        Math.PI * 2
    );


    ctx.fill();

}


/* =========================================================
   BUSH
========================================================= */

function drawBush(
    x,
    y
) {

    ctx.fillStyle =
        "#3b963c";


    ctx.beginPath();


    ctx.arc(
        x,
        y,
        20,
        Math.PI,
        0
    );


    ctx.arc(
        x + 22,
        y - 8,
        25,
        Math.PI,
        0
    );


    ctx.arc(
        x + 48,
        y,
        21,
        Math.PI,
        0
    );


    ctx.fill();

}


/* =========================================================
   PINE
========================================================= */

function drawPineTree(
    x,
    y
) {

    ctx.fillStyle =
        "#795548";


    ctx.fillRect(
        x - 7,
        y - 80,
        14,
        80
    );


    ctx.fillStyle =
        "#3f7650";


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        ctx.beginPath();


        ctx.moveTo(
            x,
            y - 145 +
            i * 30
        );


        ctx.lineTo(
            x - 45 +
            i * 10,
            y - 55 +
            i * 25
        );


        ctx.lineTo(
            x + 45 -
            i * 10,
            y - 55 +
            i * 25
        );


        ctx.closePath();


        ctx.fill();

    }

}


/* =========================================================
   LAVA ROCK
========================================================= */

function drawLavaRock(
    x,
    y
) {

    ctx.fillStyle =
        "#43221e";


    ctx.beginPath();


    ctx.moveTo(
        x,
        y
    );


    ctx.lineTo(
        x + 25,
        y - 55
    );


    ctx.lineTo(
        x + 70,
        y - 65
    );


    ctx.lineTo(
        x + 100,
        y
    );


    ctx.closePath();


    ctx.fill();

}


/* =========================================================
   WORLD
========================================================= */

function drawWorld() {

    const world =
        worlds[selectedWorld];


    for (
        const platform of platforms
    ) {

        const screenX =
            platform.x -
            cameraX;


        if (
            screenX +
                platform.width <
                0 ||
            screenX >
                canvasWidth
        ) {

            continue;

        }


        if (
            platform.type ===
            "ground"
        ) {

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


            /* چمن کوچک */

            if (
                selectedWorld === 1
            ) {

                ctx.fillStyle =
                    "#3e8d31";

                for (
                    let gx =
                        screenX;
                    gx <
                        screenX +
                        platform.width;
                    gx += 24
                ) {

                    ctx.fillRect(
                        gx,
                        platform.y - 4,
                        4,
                        5
                    );

                }

            }

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
   COINS
========================================================= */

function drawCoins() {

    for (
        const coin of levelCoins
    ) {

        if (
            coin.collected
        ) {
            continue;
        }


        const x =
            coin.x -
            cameraX;


        if (
            x < -30 ||
            x >
                canvasWidth + 30
        ) {

            continue;

        }


        const scale =
            Math.abs(
                Math.cos(
                    coin.spin
                )
            );


        ctx.save();


        ctx.translate(
            x,
            coin.y
        );


        ctx.scale(
            Math.max(
                0.15,
                scale
            ),
            1
        );


        /* درخشش */

        ctx.shadowBlur =
            18;

        ctx.shadowColor =
            "#ffe600";


        ctx.fillStyle =
            "#ffd43b";


        ctx.beginPath();


        ctx.arc(
            0,
            0,
            coin.radius,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.shadowBlur =
            0;


        /* لبه */

        ctx.strokeStyle =
            "#e0a900";

        ctx.lineWidth =
            2;

        ctx.stroke();


        /* علامت */

        ctx.fillStyle =
            "#b77a00";


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
   ENEMIES DRAW
========================================================= */

function drawEnemies() {

    for (
        const enemy of enemies
    ) {

        if (
            !enemy.alive
        ) {
            continue;
        }


        const x =
            enemy.x -
            cameraX;


        if (
            x < -100 ||
            x >
                canvasWidth + 100
        ) {

            continue;

        }


        if (
            enemy.type ===
            "snail"
        ) {

            drawSnail(
                x,
                enemy.y
            );

        }
        else if (
            enemy.type ===
            "bee"
        ) {

            drawBee(
                x,
                enemy.y
            );

        }
        else if (
            enemy.type ===
            "turtle"
        ) {

            drawTurtle(
                x,
                enemy.y
            );

        }
        else if (
            enemy.type ===
            "penguin"
        ) {

            drawPenguin(
                x,
                enemy.y
            );

        }
        else if (
            enemy.type ===
            "fish"
        ) {

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

function drawSnail(
    x,
    y
) {

    const bounce =
        Math.sin(
            performance.now() * 0.006
        ) * 1.5;


    ctx.save();


    /* بدن */

    ctx.fillStyle =
        "#6c4a2e";


    ctx.beginPath();


    ctx.ellipse(
        x + 22,
        y + 25 + bounce,
        27,
        15,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* لاک */

    ctx.fillStyle =
        "#c47c3d";


    ctx.beginPath();


    ctx.arc(
        x + 20,
        y + 15 + bounce,
        15,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.strokeStyle =
        "#8b522d";

    ctx.lineWidth =
        3;

    ctx.stroke();


    /* چشم‌ها */

    ctx.fillStyle =
        "white";


    ctx.beginPath();


    ctx.arc(
        x + 32,
        y + 5 + bounce,
        5,
        0,
        Math.PI * 2
    );


    ctx.arc(
        x + 43,
        y + 5 + bounce,
        5,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle =
        "#111";


    ctx.beginPath();


    ctx.arc(
        x + 32,
        y + 5 + bounce,
        2,
        0,
        Math.PI * 2
    );


    ctx.arc(
        x + 43,
        y + 5 + bounce,
        2,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.restore();

}


/* =========================================================
   BEE
========================================================= */

function drawBee(
    x,
    y
) {

    const flap =
        Math.sin(
            performance.now() * 0.02
        ) * 5;


    ctx.save();


    /* بال‌ها */

    ctx.fillStyle =
        "rgba(255,255,255,0.72)";


    ctx.beginPath();


    ctx.ellipse(
        x + 11,
        y + 9 + flap,
        14,
        7,
        -0.4,
        0,
        Math.PI * 2
    );


    ctx.ellipse(
        x + 35,
        y + 9 - flap,
        14,
        7,
        0.4,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* بدن */

    ctx.fillStyle =
        "#f4c52f";


    ctx.beginPath();


    ctx.ellipse(
        x + 23,
        y + 22,
        21,
        15,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* نوارها */

    ctx.strokeStyle =
        "#282828";


    ctx.lineWidth =
        5;


    ctx.beginPath();


    ctx.moveTo(
        x + 15,
        y + 9
    );


    ctx.lineTo(
        x + 15,
        y + 35
    );


    ctx.moveTo(
        x + 29,
        y + 8
    );


    ctx.lineTo(
        x + 29,
        y + 36
    );


    ctx.stroke();


    /* چشم */

    ctx.fillStyle =
        "#ffffff";


    ctx.beginPath();


    ctx.arc(
        x + 38,
        y + 17,
        5,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle =
        "#111";


    ctx.beginPath();


    ctx.arc(
        x + 40,
        y + 17,
        2,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.restore();

}


/* =========================================================
   TURTLE
========================================================= */

function drawTurtle(
    x,
    y
) {

    const step =
        Math.sin(
            performance.now() * 0.012
        ) * 3;


    ctx.save();


    /* پاها */

    ctx.fillStyle =
        "#4d873e";


    ctx.fillRect(
        x + 2,
        y + 27 + step,
        12,
        10
    );


    ctx.fillRect(
        x + 31,
        y + 27 - step,
        12,
        10
    );


    /* لاک */

    ctx.fillStyle =
        "#3f7739";


    ctx.beginPath();


    ctx.ellipse(
        x + 22,
        y + 20,
        23,
        17,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.strokeStyle =
        "#244d2c";

    ctx.lineWidth =
        3;

    ctx.stroke();


    /* طرح لاک */

    ctx.strokeStyle =
        "#69a64b";

    ctx.lineWidth =
        2;


    ctx.beginPath();

    ctx.moveTo(
        x + 8,
        y + 20
    );

    ctx.lineTo(
        x + 36,
        y + 20
    );

    ctx.moveTo(
        x + 22,
        y + 4
    );

    ctx.lineTo(
        x + 22,
        y + 36
    );

    ctx.stroke();


    /* سر */

    ctx.fillStyle =
        "#63a84e";


    ctx.beginPath();


    ctx.arc(
        x + 45,
        y + 18,
        10,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* چشم */

    ctx.fillStyle =
        "#ffffff";


    ctx.beginPath();


    ctx.arc(
        x + 48,
        y + 15,
        3,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle =
        "#111";


    ctx.beginPath();


    ctx.arc(
        x + 49,
        y + 15,
        1.5,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.restore();

}


/* =========================================================
   PENGUIN
========================================================= */

function drawPenguin(
    x,
    y
) {

    ctx.fillStyle =
        "#26384b";


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


    ctx.fillStyle =
        "#f8fbff";


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


    ctx.fillStyle =
        "#ffb52e";


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

function drawFish(
    x,
    y
) {

    ctx.fillStyle =
        "#ff7c48";


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


    ctx.fillStyle =
        "white";


    ctx.beginPath();


    ctx.arc(
        x + 32,
        y + 18,
        5,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle =
        "#111";


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

function drawBomb(
    x,
    y
) {

    ctx.fillStyle =
        "#292929";


    ctx.beginPath();


    ctx.arc(
        x + 22,
        y + 22,
        22,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.strokeStyle =
        "#e9a31a";


    ctx.lineWidth =
        4;


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


    ctx.fillStyle =
        "#ff5a24";


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
        Math.floor(
            player.invincible * 12
        ) % 2 === 0
    ) {

        return;

    }


    const x =
        player.x -
        cameraX;


    const y =
        player.y;


    ctx.save();


    ctx.translate(
        x +
            player.width / 2,
        y
    );


    ctx.scale(
        player.direction,
        1
    );


    const moving =
        Math.abs(
            player.vx
        ) > 0.4;


    const walk =
        moving &&
        player.onGround
            ? Math.sin(
                player.animTime * 1.8
            )
            : 0;


    const bob =
        moving &&
        player.onGround
            ? Math.abs(
                Math.sin(
                    player.animTime * 1.8
                )
            ) * 2
            : 0;


    /* سایه */

    if (
        player.onGround
    ) {

        ctx.fillStyle =
            "rgba(0,0,0,0.22)";


        ctx.beginPath();


        ctx.ellipse(
            0,
            65,
            23,
            6,
            0,
            0,
            Math.PI * 2
        );


        ctx.fill();

    }


    /* پاها */

    ctx.fillStyle =
        "#394b86";


    ctx.save();


    ctx.translate(
        -7,
        43 + bob
    );


    ctx.rotate(
        walk * 0.22
    );


    ctx.fillRect(
        -5,
        0,
        10,
        20
    );


    ctx.restore();


    ctx.save();


    ctx.translate(
        7,
        43 + bob
    );


    ctx.rotate(
        -walk * 0.22
    );


    ctx.fillRect(
        -5,
        0,
        10,
        20
    );


    ctx.restore();


    /* کفش */

    ctx.fillStyle =
        "#55382e";


    ctx.fillRect(
        -15,
        59,
        14,
        7
    );


    ctx.fillRect(
        1,
        59,
        14,
        7
    );


    /* بدن */

    ctx.fillStyle =
        "#e84d5b";


    ctx.beginPath();


    ctx.roundRect(
        -16,
        18 + bob,
        32,
        30,
        9
    );


    ctx.fill();


    /* نوار لباس */

    ctx.fillStyle =
        "#f4d45c";


    ctx.fillRect(
        -14,
        29 + bob,
        28,
        5
    );


    /* دست چپ */

    ctx.fillStyle =
        "#f2bd91";


    ctx.save();


    ctx.translate(
        -18,
        25 + bob
    );


    ctx.rotate(
        moving
            ? -walk * 0.18
            : 0
    );


    ctx.fillRect(
        -4,
        0,
        9,
        21
    );


    ctx.restore();


    /* دست راست */

    ctx.save();


    ctx.translate(
        18,
        25 + bob
    );


    ctx.rotate(
        moving
            ? walk * 0.18
            : 0
    );


    ctx.fillRect(
        -4,
        0,
        9,
        21
    );


    ctx.restore();


    /* گردن */

    ctx.fillRect(
        -6,
        9 + bob,
        12,
        13
    );


    /* مو */

    ctx.fillStyle =
        "#4b2923";


    ctx.beginPath();


    ctx.arc(
        0,
        7 + bob,
        23,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* صورت */

    ctx.fillStyle =
        "#f3bd91";


    ctx.beginPath();


    ctx.arc(
        3,
        9 + bob,
        17,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* موهای جلویی */

    ctx.fillStyle =
        "#4b2923";


    ctx.beginPath();


    ctx.arc(
        -4,
        1 + bob,
        19,
        Math.PI,
        Math.PI * 2
    );


    ctx.fill();


    /* چشم */

    ctx.fillStyle =
        "#202020";


    ctx.beginPath();


    ctx.arc(
        9,
        8 + bob,
        2.7,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* لبخند */

    ctx.strokeStyle =
        "#9d5048";


    ctx.lineWidth =
        2;


    ctx.beginPath();


    ctx.arc(
        8,
        13 + bob,
        5,
        0,
        Math.PI
    );


    ctx.stroke();


    /* افکت پرش */

    if (
        !player.onGround
    ) {

        ctx.strokeStyle =
            "#ffffff";


        ctx.lineWidth =
            3;


        ctx.beginPath();


        ctx.moveTo(
            -21,
            58
        );


        ctx.lineTo(
            -28,
            63
        );


        ctx.moveTo(
            21,
            58
        );


        ctx.lineTo(
            28,
            63
        );


        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   BULLET DRAW
========================================================= */

function drawBullets() {

    for (
        const bullet of bullets
    ) {

        const x =
            bullet.x -
            cameraX;


        ctx.fillStyle =
            "#fff";


        ctx.shadowBlur =
            12;


        ctx.shadowColor =
            "#ffdf43";


        ctx.beginPath();


        ctx.arc(
            x,
            bullet.y + 3,
            6,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.shadowBlur =
            0;

    }

}


/* =========================================================
   FLAG
========================================================= */

function drawFlag() {

    if (!flag) {
        return;
    }


    const x =
        flag.x -
        cameraX;


    ctx.fillStyle =
        "#eeeeee";


    ctx.fillRect(
        x,
        flag.y,
        7,
        105
    );


    ctx.fillStyle =
        "#e94455";


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


    ctx.fillStyle =
        "#f1c84b";


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

    if (
        !boss ||
        !boss.active
    ) {
        return;
    }


    const x =
        boss.x -
        cameraX;


    const y =
        boss.y;


    ctx.save();


    if (
        boss.hitFlash > 0
    ) {

        ctx.globalAlpha =
            0.55;

    }


    ctx.fillStyle =
        "#71356e";


    ctx.beginPath();


    ctx.roundRect(
        x,
        y,
        boss.width,
        boss.height,
        18
    );


    ctx.fill();


    ctx.fillStyle =
        "#f4c19c";


    ctx.beginPath();


    ctx.arc(
        x +
            boss.width / 2,
        y + 30,
        24,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle =
        "#222";


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


    ctx.fillStyle =
        "#e23c4d";


    ctx.fillRect(
        x + 17,
        y + 57,
        48,
        22
    );


    ctx.restore();


    const barWidth =
        100;


    const hpWidth =
        barWidth *
        (
            boss.hp /
            boss.maxHp
        );


    ctx.fillStyle =
        "#222";


    ctx.fillRect(
        x - 10,
        y - 18,
        barWidth,
        9
    );


    ctx.fillStyle =
        "#ef4450";


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

    if (
        !father ||
        father.rescued
    ) {
        return;
    }


    const x =
        father.x -
        cameraX;


    const y =
        father.y;


    /* قفس */

    ctx.strokeStyle =
        "#8b8b8b";


    ctx.lineWidth =
        5;


    ctx.strokeRect(
        x,
        y,
        father.width,
        father.height
    );


    for (
        let i = 1;
        i < 4;
        i++
    ) {

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

    ctx.fillStyle =
        "#355a91";


    ctx.fillRect(
        x + 20,
        y + 52,
        35,
        40
    );


    ctx.fillStyle =
        "#f1bd91";


    ctx.beginPath();


    ctx.arc(
        x + 38,
        y + 35,
        15,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.fillStyle =
        "#4b3026";


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

    drawParticles();

    drawPlayer();

    updateHUD();

}


/* =========================================================
   GAME UPDATE
========================================================= */

function updateGame(dt) {

    if (
        !gameRunning ||
        gamePaused ||
        gameOver ||
        gameWon
    ) {
        return;
    }


    updatePlayer(dt);

    updateEnemies();

    updateBullets(dt);

    updateCoins();

    updateParticles(dt);

    updateBoss(dt);

    checkFinish();

    updateCamera();

    updateHUD();

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(
    time,
    session
) {

    if (
        session !==
        gameSessionId
    ) {

        return;

    }


    if (
        !gameRunning
    ) {

        drawGame();

        animationFrameId =
            null;

        return;

    }


    const dt =
        Math.min(
            0.05,
            (
                time -
                lastTime
            ) / 1000
        );


    lastTime =
        time;


    updateGame(dt);

    drawGame();


    animationFrameId =
        requestAnimationFrame(
            (nextTime) =>
                gameLoop(
                    nextTime,
                    session
                )
        );

}


/* =========================================================
   INITIALIZATION
========================================================= */

resizeCanvas();


lives = 3;
coins = 0;
score = 0;


gameScreen.classList.add(
    "hidden"
);


pauseMenu.classList.add(
    "hidden"
);


gameOverMenu.classList.add(
    "hidden"
);


winMenu.classList.add(
    "hidden"
);


/* =========================================================
   END
========================================================= */
