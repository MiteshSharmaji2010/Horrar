const socket = io();

let currentRoom = null;
let currentPlayer = null;
let killerMode = "random";
let isReady = false;


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
// TOAST
// =====================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


// =====================================================
// PLAYER NAME
// =====================================================

function getPlayerName() {

    const input =
        document.getElementById("playerName");

    let name =
        input.value.trim();

    if (!name) {

        name = "Player";

    }

    return name.substring(0, 20);
}


// =====================================================
// CREATE SCREEN
// =====================================================

function openCreate() {

    const name =
        getPlayerName();

    if (!name) {

        showToast(
            "Enter your name first."
        );

        return;

    }

    showScreen(
        "createScreen"
    );
}


// =====================================================
// JOIN SCREEN
// =====================================================

function openJoin() {

    const name =
        getPlayerName();

    if (!name) {

        showToast(
            "Enter your name first."
        );

        return;

    }

    showScreen(
        "joinScreen"
    );
}


// =====================================================
// KILLER MODE
// =====================================================

function selectKillerMode(mode) {

    killerMode = mode;

    const randomButton =
        document.getElementById(
            "randomKillerButton"
        );

    const chooseButton =
        document.getElementById(
            "chooseKillerButton"
        );

    randomButton.classList.remove(
        "selected"
    );

    chooseButton.classList.remove(
        "selected"
    );


    if (mode === "random") {

        randomButton.classList.add(
            "selected"
        );

    } else {

        chooseButton.classList.add(
            "selected"
        );

    }

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
            "Enter a room password."
        );

        return;

    }


    const name =
        getPlayerName();


    socket.emit(
        "createRoom",
        {

            name: name,

            password: password,

            killerMode:
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
        .value
        .trim();


    if (!code) {

        showToast(
            "Enter room code."
        );

        return;

    }


    if (!password) {

        showToast(
            "Enter room password."
        );

        return;

    }


    socket.emit(
        "joinRoom",
        {

            code: code,

            password: password,

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

        currentRoom =
            data.code;

        showToast(
            "Room created: " +
            data.code
        );

        showScreen(
            "lobbyScreen"
        );

    }
);


// =====================================================
// JOINED ROOM
// =====================================================

socket.on(
    "joinedRoom",
    data => {

        currentRoom =
            data.code;

        showToast(
            "Joined room " +
            data.code
        );

        showScreen(
            "lobbyScreen"
        );

    }
);


// =====================================================
// ROOM UPDATE
// =====================================================

socket.on(
    "room:update",
    room => {

        currentRoom =
            room.code;

        updateLobby(room);

    }
);


// =====================================================
// UPDATE LOBBY
// =====================================================

function updateLobby(room) {

    const players =
        room.players || [];


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
        players.length +
        "/9";


    const list =
        document.getElementById(
            "playersList"
        );


    list.innerHTML = "";


    players.forEach(
        player => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "playerCard";


            if (
                player.id ===
                room.host
            ) {

                card.classList.add(
                    "host"
                );

            }


            if (
                player.role ===
                "killer"
            ) {

                card.classList.add(
                    "killer"
                );

            }


            if (player.ready) {

                card.classList.add(
                    "ready"
                );

            }


            let avatar = "👤";

            if (
                player.role ===
                "killer"
            ) {

                avatar = "🔪";

            } else {

                avatar = "🧍";

            }


            let status =
                "NOT READY";

            let statusClass =
                "";


            if (player.ready) {

                status =
                    "READY";

                statusClass =
                    "readyText";

            }


            if (
                player.role ===
                "killer"
            ) {

                status =
                    "KILLER";

                statusClass =
                    "killerText";

            }


            const hostText =
                player.id === room.host
                    ? " • HOST"
                    : "";


            card.innerHTML = `

                <div class="playerAvatar">
                    ${avatar}
                </div>

                <div>

                    <div class="playerName">
                        ${escapeHTML(player.name)}
                    </div>

                    <div class="playerDetails">
                        ${escapeHTML(player.character)}
                        ${hostText}
                    </div>

                </div>

                <div class="playerStatus ${statusClass}">
                    ${status}
                </div>

            `;


            list.appendChild(card);

        }
    );


    const me =
        players.find(
            player =>
                player.id === socket.id
        );


    currentPlayer = me || null;


    if (me) {

        isReady =
            me.ready;

        updateReadyButton();

    }


    document
        .getElementById(
            "killerModeText"
        )
        .textContent =
        room.killerMode === "random"
            ? "RANDOM KILLER"
            : "CHOOSE KILLER";


    const killerButton =
        document.getElementById(
            "killerRequestButton"
        );


    if (
        room.killerMode ===
        "random"
    ) {

        killerButton.style.display =
            "none";

    } else {

        killerButton.style.display =
            "block";

    }


    const startButton =
        document.getElementById(
            "startButton"
        );


    if (
        room.host === socket.id
    ) {

        startButton.style.display =
            "block";

    } else {

        startButton.style.display =
            "none";

    }


    if (
        me &&
        me.role === "killer"
    ) {

        killerButton.textContent =
            "YOU ARE KILLER";

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// CHARACTER
// =====================================================

function changeCharacter() {

    const select =
        document.getElementById(
            "characterSelect"
        );


    socket.emit(
        "changeCharacter",
        select.value
    );


    updateCharacterDescription(
        select.value
    );

}


document
    .getElementById(
        "characterSelect"
    )
    .addEventListener(
        "change",
        event => {

            updateCharacterDescription(
                event.target.value
            );

        }
    );


function updateCharacterDescription(
    character
) {

    const descriptions = {

        Scout:
            "Fast survivor with improved sprint.",

        Medic:
            "Can recover health faster.",

        Engineer:
            "Better at repairing objectives.",

        Tracker:
            "Better at finding clues and footprints."

    };


    document
        .getElementById(
            "characterDescription"
        )
        .textContent =
        descriptions[character] ||
        "";

}


// =====================================================
// READY
// =====================================================

function toggleReady() {

    isReady =
        !isReady;

    socket.emit(
        "ready",
        isReady
    );


    updateReadyButton();

}


function updateReadyButton() {

    const button =
        document.getElementById(
            "readyButton"
        );


    if (isReady) {

        button.textContent =
            "READY ✓";

        button.classList.add(
            "active"
        );

    } else {

        button.textContent =
            "READY";

        button.classList.remove(
            "active"
        );

    }

}


// =====================================================
// REQUEST KILLER
// =====================================================

function requestKiller() {

    socket.emit(
        "chooseKiller"
    );

}


// =====================================================
// START GAME
// =====================================================

function startGame() {

    socket.emit(
        "startGame"
    );

}


// =====================================================
// GAME STARTED
// =====================================================

socket.on(
    "gameStarted",
    data => {

        showToast(
            "GAME STARTED"
        );


        showScreen(
            "gameScreen"
        );


        startGameWorld(
            data
        );

    }
);


// =====================================================
// SERVER ERROR
// =====================================================

socket.on(
    "errorMessage",
    message => {

        showToast(
            message
        );

        const joinMessage =
            document.getElementById(
                "joinMessage"
            );


        if (
            joinMessage &&
            document
                .getElementById(
                    "joinScreen"
                )
                .classList.contains(
                    "active"
                )
        ) {

            joinMessage.textContent =
                message;

        }

    }
);


// =====================================================
// CONNECTION
// =====================================================

socket.on(
    "connect",
    () => {

        document
            .getElementById(
                "connectionStatus"
            )
            .textContent =
            "SERVER ONLINE";

    }
);


socket.on(
    "disconnect",
    () => {

        document
            .getElementById(
                "connectionStatus"
            )
            .textContent =
            "SERVER OFFLINE";

        showToast(
            "Connection lost."
        );

    }
);


// =====================================================
// LEAVE ROOM
// =====================================================

function leaveRoom() {

    location.reload();

}


// =====================================================
// SIMPLE GAME WORLD
// =====================================================

let gameCanvas = null;
let gameContext = null;

let gameRunning = false;

let playerX = 0;
let playerY = 0;

let gameKeys = {};


// =====================================================
// START GAME WORLD
// =====================================================

function startGameWorld(data) {

    gameCanvas =
        document.getElementById(
            "gameCanvas"
        );


    gameContext =
        gameCanvas.getContext(
            "2d"
        );


    resizeGameCanvas();


    window.addEventListener(
        "resize",
        resizeGameCanvas
    );


    gameRunning = true;


    const me =
        (data.players || [])
        .find(
            player =>
                player.id ===
                socket.id
        );


    if (me) {

        document
            .getElementById(
                "gameRole"
            )
            .textContent =
            me.role === "killer"
                ? "KILLER"
                : "SURVIVOR";

    }


    document
        .getElementById(
            "gamePlayerCount"
        )
        .textContent =
        (data.players || []).length;


    playerX =
        gameCanvas.width / 2;

    playerY =
        gameCanvas.height / 2;


    setupGameControls();

    requestAnimationFrame(
        gameLoop
    );

}


// =====================================================
// RESIZE
// =====================================================

function resizeGameCanvas() {

    if (!gameCanvas)
        return;


    const ratio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    gameCanvas.width =
        window.innerWidth *
        ratio;


    gameCanvas.height =
        window.innerHeight *
        ratio;


    gameCanvas.style.width =
        window.innerWidth + "px";


    gameCanvas.style.height =
        window.innerHeight + "px";


    if (gameContext) {

        gameContext.setTransform(
            ratio,
            0,
            0,
            ratio,
            0,
            0
        );

    }

}


// =====================================================
// KEYBOARD
// =====================================================

window.addEventListener(
    "keydown",
    event => {

        gameKeys[event.key.toLowerCase()] =
            true;

    }
);


window.addEventListener(
    "keyup",
    event => {

        gameKeys[event.key.toLowerCase()] =
            false;

    }
);


// =====================================================
// MOBILE CONTROL
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
        event => {

            event.preventDefault();

            gameKeys[key] =
                true;

        }
    );


    button.addEventListener(
        "pointerup",
        event => {

            event.preventDefault();

            gameKeys[key] =
                false;

        }
    );


    button.addEventListener(
        "pointercancel",
        () => {

            gameKeys[key] =
                false;

        }
    );


    button.addEventListener(
        "pointerleave",
        () => {

            gameKeys[key] =
                false;

        }
    );

}


// =====================================================
// GAME CONTROLS
// =====================================================

function setupGameControls() {

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


    const flashlight =
        document.getElementById(
            "flashlightButton"
        );


    flashlight.onclick =
        () => {

            showToast(
                "Flashlight toggled"
            );

        };


    const interact =
        document.getElementById(
            "interactButton"
        );


    interact.onclick =
        () => {

            showToast(
                "Searching..."
            );

        };

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
// UPDATE GAME
// =====================================================

function updateGame() {

    let speed = 2.5;


    if (
        gameKeys["shift"]
    ) {

        speed =
            4.5;

    }


    if (
        gameKeys["w"] ||
        gameKeys["arrowup"]
    ) {

        playerY -= speed;

    }


    if (
        gameKeys["s"] ||
        gameKeys["arrowdown"]
    ) {

        playerY += speed;

    }


    if (
        gameKeys["a"] ||
        gameKeys["arrowleft"]
    ) {

        playerX -= speed;

    }


    if (
        gameKeys["d"] ||
        gameKeys["arrowright"]
    ) {

        playerX += speed;

    }


    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    playerX =
        Math.max(
            20,
            Math.min(
                width - 20,
                playerX
            )
        );


    playerY =
        Math.max(
            20,
            Math.min(
                height - 20,
                playerY
            )
        );

}


// =====================================================
// DRAW GAME
// =====================================================

function drawGame() {

    const ctx =
        gameContext;


    if (!ctx)
        return;


    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // DARK WORLD

    const gradient =
        ctx.createRadialGradient(
            playerX,
            playerY,
            40,
            playerX,
            playerY,
            500
        );


    gradient.addColorStop(
        0,
        "#26302a"
    );

    gradient.addColorStop(
        0.4,
        "#101714"
    );

    gradient.addColorStop(
        1,
        "#020303"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // GROUND GRID

    ctx.strokeStyle =
        "rgba(80,90,80,0.08)";

    ctx.lineWidth = 1;


    const grid = 50;


    for (
        let x = 0;
        x < width;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < height;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();

    }


    // TREES / OBJECTS

    for (
        let x = 80;
        x < width;
        x += 180
    ) {

        for (
            let y = 140;
            y < height;
            y += 190
        ) {

            drawTree(
                ctx,
                x,
                y
            );

        }

    }


    // PLAYER

    ctx.beginPath();

    ctx.arc(
        playerX,
        playerY,
        14,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#c9c9c9";

    ctx.fill();


    ctx.strokeStyle =
        "#ffffff";

    ctx.stroke();


    // PLAYER LIGHT

    const light =
        ctx.createRadialGradient(
            playerX,
            playerY,
            20,
            playerX,
            playerY,
            180
        );


    light.addColorStop(
        0,
        "rgba(255,255,220,0.12)"
    );

    light.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
        light;


    ctx.beginPath();

    ctx.arc(
        playerX,
        playerY,
        180,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// =====================================================
// TREE
// =====================================================

function drawTree(
    ctx,
    x,
    y
) {

    ctx.fillStyle =
        "#17110c";

    ctx.fillRect(
        x - 5,
        y,
        10,
        35
    );


    ctx.beginPath();

    ctx.arc(
        x,
        y - 5,
        25,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#111a14";

    ctx.fill();

}


// =====================================================
// INITIAL DESCRIPTION
// =====================================================

updateCharacterDescription(
    "Scout"
);
