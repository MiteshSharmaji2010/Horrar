const socket = io();

let roomCode = null;
let myPlayer = null;
let roomData = null;

let killerMode = "random";
let ready = false;

let canvas;
let ctx;

let gameRunning = false;

const keys = {};

let player = {
    x: 900,
    y: 650,
    speed: 2.4,
    health: 100,
    lives: 3
};

let otherPlayers = {};

let collectedItems = [];

let mansionItems = [
    {
        id: "key_red",
        type: "key",
        name: "RED KEY",
        x: 330,
        y: 250,
        collected: false
    },
    {
        id: "key_blue",
        type: "key",
        name: "BLUE KEY",
        x: 1450,
        y: 320,
        collected: false
    },
    {
        id: "fuse",
        type: "fuse",
        name: "FUSE",
        x: 1150,
        y: 900,
        collected: false
    },
    {
        id: "fuel",
        type: "fuel",
        name: "HELICOPTER FUEL",
        x: 1700,
        y: 1050,
        collected: false
    }
];

let escapeDoor = {
    x: 1800,
    y: 650,
    unlocked: false
};

let killer = {
    x: 1400,
    y: 650,
    speed: 1.5,
    active: true
};

let flashlight = true;

let jumpscareCooldown = 0;

let messageTimer = 0;
let messageText = "";


// =====================================================
// SCREEN
// =====================================================

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const screen =
        document.getElementById(id);

    if (screen) {
        screen.classList.add("active");
    }
}


// =====================================================
// MESSAGE
// =====================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// =====================================================
// NAME
// =====================================================

function getPlayerName() {

    const input =
        document.getElementById("playerName");

    return (
        input.value.trim() ||
        "Player"
    );
}


// =====================================================
// CREATE
// =====================================================

function openCreate() {

    showScreen("createScreen");
}


// =====================================================
// JOIN
// =====================================================

function openJoin() {

    showScreen("joinScreen");
}


// =====================================================
// KILLER MODE
// =====================================================

function selectKillerMode(mode) {

    killerMode = mode;

    document
        .getElementById(
            "randomKillerButton"
        )
        .classList.toggle(
            "selected",
            mode === "random"
        );

    document
        .getElementById(
            "chooseKillerButton"
        )
        .classList.toggle(
            "selected",
            mode === "choose"
        );
}


// =====================================================
// CREATE ROOM
// =====================================================

function createRoom() {

    const password =
        document
            .getElementById(
                "createPassword"
            )
            .value.trim();

    if (!password) {

        showToast(
            "Enter room password"
        );

        return;
    }

    socket.emit(
        "createRoom",
        {
            name:
                getPlayerName(),

            password,

            killerMode
        }
    );
}


// =====================================================
// JOIN ROOM
// =====================================================

function joinRoom() {

    const code =
        document
            .getElementById(
                "joinCode"
            )
            .value
            .trim()
            .toUpperCase();

    const password =
        document
            .getElementById(
                "joinPassword"
            )
            .value.trim();

    socket.emit(
        "joinRoom",
        {
            code,
            password,
            name:
                getPlayerName()
        }
    );
}


// =====================================================
// ROOM CREATED
// =====================================================

socket.on(
    "roomCreated",
    data => {

        roomCode =
            data.code;

        showScreen(
            "lobbyScreen"
        );

        showToast(
            "Room created: " +
            data.code
        );
    }
);


// =====================================================
// ROOM JOINED
// =====================================================

socket.on(
    "joinedRoom",
    data => {

        roomCode =
            data.code;

        showScreen(
            "lobbyScreen"
        );

        showToast(
            "Joined room"
        );
    }
);


// =====================================================
// ROOM UPDATE
// =====================================================

socket.on(
    "room:update",
    room => {

        roomData =
            room;

        roomCode =
            room.code;

        updateLobby(room);
    }
);


// =====================================================
// LOBBY
// =====================================================

function updateLobby(room) {

    document
        .getElementById(
            "roomCodeText"
        )
        .textContent =
        room.code;

    document
        .getElementById(
            "playerCountText"
        )
        .textContent =
        `${room.players.length}/9`;

    const list =
        document.getElementById(
            "playersList"
        );

    list.innerHTML = "";

    room.players.forEach(p => {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "playerCard";

        if (p.role === "killer") {
            card.classList.add(
                "killer"
            );
        }

        if (p.ready) {
            card.classList.add(
                "ready"
            );
        }

        card.innerHTML = `

            <div class="playerAvatar">
                ${p.role === "killer" ? "🔪" : "👤"}
            </div>

            <div>

                <div class="playerName">
                    ${escapeHTML(p.name)}
                </div>

                <div class="playerDetails">
                    ${escapeHTML(p.character)}
                    •
                    ${escapeHTML(p.costume)}
                </div>

            </div>

            <div class="playerStatus">
                ${
                    p.role === "killer"
                        ? "KILLER"
                        : p.ready
                            ? "READY"
                            : "WAITING"
                }
            </div>

        `;

        list.appendChild(card);

        if (
            p.id === socket.id
        ) {

            myPlayer = p;
        }
    });

    document
        .getElementById(
            "killerModeText"
        )
        .textContent =
        room.killerMode === "random"
            ? "RANDOM KILLER"
            : "CHOOSE KILLER";
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// CHARACTER
// =====================================================

function changeCharacter() {

    const character =
        document
            .getElementById(
                "characterSelect"
            )
            .value;

    socket.emit(
        "changeCharacter",
        character
    );
}


// =====================================================
// READY
// =====================================================

function toggleReady() {

    ready = !ready;

    socket.emit(
        "ready",
        ready
    );

    const button =
        document.getElementById(
            "readyButton"
        );

    button.textContent =
        ready
            ? "READY ✓"
            : "READY";

    button.classList.toggle(
        "active",
        ready
    );
}


// =====================================================
// KILLER REQUEST
// =====================================================

function requestKiller() {

    socket.emit(
        "chooseKiller"
    );

    showToast(
        "Killer request changed"
    );
}


// =====================================================
// START
// =====================================================

function startGame() {

    socket.emit(
        "startGame"
    );
}


// =====================================================
// GAME START
// =====================================================

socket.on(
    "gameStarted",
    data => {

        showScreen(
            "gameScreen"
        );

        startHorrorGame(
            data
        );
    }
);


// =====================================================
// ERROR
// =====================================================

socket.on(
    "errorMessage",
    message => {

        showToast(message);

        const msg =
            document.getElementById(
                "joinMessage"
            );

        if (msg) {
            msg.textContent =
                message;
        }
    }
);


// =====================================================
// GAME START
// =====================================================

function startHorrorGame(data) {

    canvas =
        document.getElementById(
            "gameCanvas"
        );

    ctx =
        canvas.getContext(
            "2d"
        );

    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    gameRunning = true;

    player.x = 900;
    player.y = 650;

    player.health = 100;

    collectedItems = [];

    otherPlayers = {};

    data.players.forEach(p => {

        otherPlayers[p.id] = {
            x:
                900 +
                Math.random() *
                300,

            y:
                500 +
                Math.random() *
                300,

            role:
                p.role,

            name:
                p.name
        };

    });

    const me =
        data.players.find(
            p =>
                p.id ===
                socket.id
        );

    if (me) {

        myPlayer = me;

        player.lives =
            me.lives || 3;

        document
            .getElementById(
                "gameRole"
            )
            .textContent =
            me.role === "killer"
                ? "KILLER"
                : "SURVIVOR";
    }

    showGameMessage(
        "FIND THE ITEMS AND ESCAPE THE MANSION"
    );

    requestAnimationFrame(
        gameLoop
    );
}


// =====================================================
// RESIZE
// =====================================================

function resizeCanvas() {

    if (!canvas)
        return;

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;
}


// =====================================================
// KEYBOARD
// =====================================================

window.addEventListener(
    "keydown",
    e => {

        keys[
            e.key.toLowerCase()
        ] = true;

        if (
            e.key.toLowerCase() ===
            "f"
        ) {

            toggleFlashlight();
        }

        if (
            e.key.toLowerCase() ===
            "e"
        ) {

            interact();
        }
    }
);


window.addEventListener(
    "keyup",
    e => {

        keys[
            e.key.toLowerCase()
        ] = false;
    }
);


// =====================================================
// MOBILE CONTROLS
// =====================================================

function holdButton(
    id,
    key
) {

    const button =
        document.getElementById(id);

    if (!button)
        return;

    button.addEventListener(
        "pointerdown",
        e => {

            e.preventDefault();

            keys[key] = true;
        }
    );

    button.addEventListener(
        "pointerup",
        () => {

            keys[key] = false;
        }
    );

    button.addEventListener(
        "pointercancel",
        () => {

            keys[key] = false;
        }
    );
}

holdButton(
    "moveUp",
    "w"
);

holdButton(
    "moveDown",
    "s"
);

holdButton(
    "moveLeft",
    "a"
);

holdButton(
    "moveRight",
    "d"
);

holdButton(
    "sprintButton",
    "shift"
);

const flashlightButton =
    document.getElementById(
        "flashlightButton"
    );

if (flashlightButton) {

    flashlightButton.onclick =
        toggleFlashlight;
}

const interactButton =
    document.getElementById(
        "interactButton"
    );

if (interactButton) {

    interactButton.onclick =
        interact;
}


// =====================================================
// FLASHLIGHT
// =====================================================

function toggleFlashlight() {

    flashlight =
        !flashlight;

    showGameMessage(
        flashlight
            ? "FLASHLIGHT ON"
            : "FLASHLIGHT OFF"
    );
}


// =====================================================
// INTERACTION
// =====================================================

function interact() {

    mansionItems.forEach(
        item => {

            if (
                item.collected
            )
                return;

            const distance =
                Math.hypot(
                    player.x - item.x,
                    player.y - item.y
                );

            if (
                distance < 80
            ) {

                item.collected =
                    true;

                collectedItems.push(
                    item.id
                );

                showGameMessage(
                    "COLLECTED: " +
                    item.name
                );

                checkEscape();
            }
        }
    );

    const doorDistance =
        Math.hypot(
            player.x -
            escapeDoor.x,

            player.y -
            escapeDoor.y
        );

    if (
        doorDistance < 100
    ) {

        if (
            collectedItems.includes(
                "key_red"
            ) &&
            collectedItems.includes(
                "key_blue"
            ) &&
            collectedItems.includes(
                "fuse"
            )
        ) {

            escapeDoor.unlocked =
                true;

            showGameMessage(
                "🚪 MAIN DOOR UNLOCKED!"
            );

            winGame();

        } else {

            showGameMessage(
                "THE DOOR IS LOCKED"
            );
        }
    }
}


// =====================================================
// ESCAPE CHECK
// =====================================================

function checkEscape() {

    if (
        collectedItems.includes(
            "key_red"
        ) &&
        collectedItems.includes(
            "key_blue"
        ) &&
        collectedItems.includes(
            "fuse"
        )
    ) {

        document
            .getElementById(
                "objectiveHUD"
            )
            .textContent =
            "OBJECTIVE: ESCAPE THROUGH THE MAIN DOOR";

    } else {

        document
            .getElementById(
                "objectiveHUD"
            )
            .textContent =
            "OBJECTIVE: FIND KEYS AND ITEMS";

    }
}


// =====================================================
// WIN
// =====================================================

function winGame() {

    gameRunning = false;

    showGameMessage(
        "YOU ESCAPED! 🎉"
    );

    setTimeout(
        () => {

            alert(
                "YOU ESCAPED THE MANSION!"
            );

        },
        1000
    );
}


// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    if (!gameRunning)
        return;

    updateGame();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );
}


// =====================================================
// UPDATE
// =====================================================

function updateGame() {

    let speed =
        player.speed;

    if (
        keys["shift"]
    ) {

        speed =
            4;
    }

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        player.y -= speed;
    }

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        player.y += speed;
    }

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        player.x -= speed;
    }

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        player.x += speed;
    }

    player.x =
        Math.max(
            80,
            Math.min(
                1720,
                player.x
            )
        );

    player.y =
        Math.max(
            100,
            Math.min(
                1150,
                player.y
            )
        );


    // killer

    if (
        myPlayer &&
        myPlayer.role !==
        "killer"
    ) {

        const dx =
            player.x -
            killer.x;

        const dy =
            player.y -
            killer.y;

        const distance =
            Math.hypot(
                dx,
                dy
            );

        if (
            distance < 650
        ) {

            killer.x +=
                (dx / distance) *
                killer.speed;

            killer.y +=
                (dy / distance) *
                killer.speed;
        }

        if (
            distance < 55
        ) {

            player.health -=
                0.35;

            if (
                player.health <= 0
            ) {

                player.health = 0;

                triggerJumpscare();

                player.lives--;

                if (
                    player.lives <= 0
                ) {

                    gameOver();

                } else {

                    player.health =
                        100;

                    player.x = 900;
                    player.y = 650;

                    showGameMessage(
                        "YOU WERE CAUGHT! LIVES LEFT: " +
                        player.lives
                    );
                }
            }
        }
    }

    updateHUD();
}


// =====================================================
// HUD
// =====================================================

function updateHUD() {

    const healthBar =
        document.getElementById(
            "healthBar"
        );

    if (healthBar) {

        healthBar.style.width =
            Math.max(
                0,
                player.health
            ) + "%";
    }
}


// =====================================================
// DRAW
// =====================================================

function drawGame() {

    if (!ctx)
        return;

    const w =
        canvas.width;

    const h =
        canvas.height;

    ctx.clearRect(
        0,
        0,
        w,
        h
    );


    // WORLD

    ctx.fillStyle =
        "#050807";

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    // Mansion floor

    ctx.fillStyle =
        "#161512";

    ctx.fillRect(
        70,
        90,
        1660,
        1080
    );


    // Rooms

    drawRoom(
        100,
        120,
        450,
        300,
        "BEDROOM"
    );

    drawRoom(
        580,
        120,
        500,
        300,
        "LIBRARY"
    );

    drawRoom(
        1110,
        120,
        560,
        300,
        "DINING ROOM"
    );

    drawRoom(
        100,
        470,
        500,
        330,
        "HALL"
    );

    drawRoom(
        630,
        470,
        450,
        330,
        "BASEMENT"
    );

    drawRoom(
        1110,
        470,
        560,
        330,
        "GAME ROOM"
    );

    drawRoom(
        100,
        850,
        500,
        280,
        "STORAGE"
    );

    drawRoom(
        630,
        850,
        450,
        280,
        "SECRET ROOM"
    );

    drawRoom(
        1110,
        850,
        560,
        280,
        "EXIT HALL"
    );


    // ITEMS

    mansionItems.forEach(
        item => {

            if (
                item.collected
            )
                return;

            drawItem(
                item
            );
        }
    );


    // EXIT

    ctx.fillStyle =
        "#542222";

    ctx.fillRect(
        escapeDoor.x - 35,
        escapeDoor.y - 60,
        70,
        120
    );

    ctx.fillStyle =
        "#dddddd";

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "MAIN EXIT",
        escapeDoor.x,
        escapeDoor.y + 85
    );


    // KILLER

    if (
        myPlayer &&
        myPlayer.role !==
        "killer"
    ) {

        drawKiller();

    }


    // PLAYER

    drawPlayer();


    // DARKNESS

    drawDarkness();

}


// =====================================================
// ROOM
// =====================================================

function drawRoom(
    x,
    y,
    width,
    height,
    name
) {

    ctx.fillStyle =
        "#1c1a16";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeStyle =
        "#3c352b";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );

    ctx.fillStyle =
        "#4b453b";

    ctx.font =
        "11px Arial";

    ctx.textAlign =
        "left";

    ctx.fillText(
        name,
        x + 15,
        y + 22
    );
}


// =====================================================
// ITEM
// =====================================================

function drawItem(item) {

    ctx.beginPath();

    ctx.arc(
        item.x,
        item.y,
        13,
        0,
        Math.PI * 2
    );

    if (
        item.type === "key"
    ) {

        ctx.fillStyle =
            "#d5a82c";

    } else {

        ctx.fillStyle =
            "#888888";
    }

    ctx.fill();

    ctx.strokeStyle =
        "#ffffff";

    ctx.stroke();
}


// =====================================================
// PLAYER
// =====================================================

function drawPlayer() {

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        15,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#d8d8d8";

    ctx.fill();

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;

    ctx.stroke();
}


// =====================================================
// KILLER
// =====================================================

function drawKiller() {

    ctx.beginPath();

    ctx.arc(
        killer.x,
        killer.y,
        21,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#8b1515";

    ctx.fill();

    ctx.strokeStyle =
        "#ff4444";

    ctx.stroke();
}


// =====================================================
// DARKNESS + FLASHLIGHT
// =====================================================

function drawDarkness() {

    const darkness =
        ctx.createRadialGradient(
            player.x,
            player.y,
            flashlight
                ? 70
                : 25,

            player.x,
            player.y,
            flashlight
                ? 300
                : 100
        );

    darkness.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    darkness.addColorStop(
        1,
        "rgba(0,0,0,0.94)"
    );

    ctx.fillStyle =
        darkness;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// =====================================================
// JUMPSCARE
// =====================================================

function triggerJumpscare() {

    if (
        jumpscareCooldown > 0
    )
        return;

    jumpscareCooldown =
        500;

    const overlay =
        document.createElement(
            "div"
        );

    overlay.style.position =
        "fixed";

    overlay.style.inset =
        "0";

    overlay.style.zIndex =
        "99999";

    overlay.style.background =
        "#050000";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.innerHTML = `
        <div style="
            font-size:100px;
            filter:drop-shadow(0 0 30px red);
        ">
            👹
        </div>
    `;

    document.body.appendChild(
        overlay
    );

    setTimeout(
        () => {

            overlay.remove();

        },
        1000
    );

    showGameMessage(
        "THE KILLER FOUND YOU"
    );
}


// =====================================================
// GAME OVER
// =====================================================

function gameOver() {

    gameRunning = false;

    triggerJumpscare();

    setTimeout(
        () => {

            alert(
                "YOU DIED"
            );

            showScreen(
                "lobbyScreen"
            );

        },
        1200
    );
}


// =====================================================
// MESSAGE
// =====================================================

function showGameMessage(
    text
) {

    messageText =
        text;

    messageTimer =
        180;

    const objective =
        document.getElementById(
            "objectiveHUD"
        );

    if (objective) {

        objective.textContent =
            text;
    }
}


// =====================================================
// ANIMATION MESSAGE
// =====================================================

setInterval(
    () => {

        if (
            jumpscareCooldown > 0
        ) {

            jumpscareCooldown--;
        }

    },
    1
);
