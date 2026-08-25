```javascript
/* =========================================================
   KILLER ESCAPE 07
   CLIENT.JS
   Multiplayer Lobby + Game Connection
   ========================================================= */

"use strict";

/* =========================================================
   SOCKET
   ========================================================= */

const socket = io();

/* =========================================================
   GLOBAL GAME DATA
   ========================================================= */

let roomCode = null;
let roomData = null;
let myPlayer = null;

let killerMode = "random";
let ready = false;

let gameStarted = false;


/* =========================================================
   SAFE DOM
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SCREEN SYSTEM
   ========================================================= */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const screen = $(id);

    if (screen) {
        screen.classList.add("active");
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =========================================================
   PLAYER NAME
   ========================================================= */

function getPlayerName() {

    const input = $("playerName");

    if (!input) {
        return "Player";
    }

    const name = input.value.trim();

    return name || "Player";
}


/* =========================================================
   HOME
   ========================================================= */

function openCreate() {

    showScreen("createScreen");

    const password = $("createPassword");

    if (password) {
        setTimeout(() => password.focus(), 100);
    }
}


function openJoin() {

    showScreen("joinScreen");

    const code = $("joinCode");

    if (code) {
        setTimeout(() => code.focus(), 100);
    }
}


/* =========================================================
   KILLER MODE
   ========================================================= */

function selectKillerMode(mode) {

    killerMode = mode;

    const randomButton =
        $("randomKillerButton");

    const chooseButton =
        $("chooseKillerButton");

    if (randomButton) {

        randomButton.classList.toggle(
            "selected",
            mode === "random"
        );
    }

    if (chooseButton) {

        chooseButton.classList.toggle(
            "selected",
            mode === "choose"
        );
    }
}


/* =========================================================
   CREATE ROOM
   ========================================================= */

function createRoom() {

    const passwordInput =
        $("createPassword");

    const password =
        passwordInput
            ? passwordInput.value.trim()
            : "";

    if (!getPlayerName()) {

        showToast(
            "ENTER YOUR NAME FIRST"
        );

        return;
    }

    if (!password) {

        showToast(
            "ENTER ROOM PASSWORD"
        );

        if (passwordInput) {
            passwordInput.focus();
        }

        return;
    }

    socket.emit(
        "createRoom",
        {
            name: getPlayerName(),
            password: password,
            killerMode: killerMode
        }
    );
}


/* =========================================================
   JOIN ROOM
   ========================================================= */

function joinRoom() {

    const codeInput = $("joinCode");
    const passwordInput = $("joinPassword");

    const code =
        codeInput
            ? codeInput.value
                .trim()
                .toUpperCase()
            : "";

    const password =
        passwordInput
            ? passwordInput.value.trim()
            : "";

    if (!code) {

        showToast(
            "ENTER ROOM CODE"
        );

        return;
    }

    if (!password) {

        showToast(
            "ENTER ROOM PASSWORD"
        );

        return;
    }

    socket.emit(
        "joinRoom",
        {
            code: code,
            password: password,
            name: getPlayerName()
        }
    );
}


/* =========================================================
   ROOM CREATED
   ========================================================= */

socket.on(
    "roomCreated",
    data => {

        if (!data) return;

        roomCode = data.code;

        showScreen(
            "lobbyScreen"
        );

        showToast(
            "ROOM CREATED: " +
            roomCode
        );
    }
);


/* =========================================================
   ROOM JOINED
   ========================================================= */

socket.on(
    "joinedRoom",
    data => {

        if (!data) return;

        roomCode = data.code;

        showScreen(
            "lobbyScreen"
        );

        showToast(
            "JOINED ROOM"
        );
    }
);


/* =========================================================
   ROOM UPDATE
   ========================================================= */

socket.on(
    "room:update",
    room => {

        if (!room) return;

        roomData = room;
        roomCode = room.code;

        updateLobby(room);
    }
);


/* =========================================================
   UPDATE LOBBY
   ========================================================= */

function updateLobby(room) {

    const roomCodeText =
        $("roomCodeText");

    const playerCountText =
        $("playerCountText");

    const playersList =
        $("playersList");

    const killerModeText =
        $("killerModeText");

    if (roomCodeText) {

        roomCodeText.textContent =
            room.code || "------";
    }

    if (playerCountText) {

        const count =
            Array.isArray(room.players)
                ? room.players.length
                : 0;

        playerCountText.textContent =
            `${count}/9`;
    }

    if (!playersList) return;

    playersList.innerHTML = "";

    if (!Array.isArray(room.players)) {
        return;
    }

    room.players.forEach(
        playerInfo => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "playerCard";

            if (
                playerInfo.role ===
                "killer"
            ) {

                card.classList.add(
                    "killer"
                );
            }

            if (playerInfo.ready) {

                card.classList.add(
                    "ready"
                );
            }


            const avatar =
                playerInfo.role ===
                "killer"
                    ? "🔪"
                    : "👤";

            const status =
                playerInfo.role ===
                "killer"
                    ? "KILLER"
                    : playerInfo.ready
                        ? "READY"
                        : "WAITING";


            card.innerHTML = `

                <div class="playerAvatar">
                    ${avatar}
                </div>

                <div>

                    <div class="playerName">
                        ${escapeHTML(
                            playerInfo.name ||
                            "Player"
                        )}
                    </div>

                    <div class="playerDetails">
                        ${escapeHTML(
                            playerInfo.character ||
                            "Alex"
                        )}
                        •
                        ${escapeHTML(
                            playerInfo.costume ||
                            "Casual"
                        )}
                    </div>

                </div>

                <div class="playerStatus">
                    ${status}
                </div>
            `;


            playersList.appendChild(
                card
            );


            if (
                playerInfo.id ===
                socket.id
            ) {

                myPlayer =
                    playerInfo;

                ready =
                    !!playerInfo.ready;

                updateReadyButton();
            }

        }
    );


    if (killerModeText) {

        killerModeText.textContent =
            room.killerMode ===
            "choose"
                ? "CHOOSE KILLER"
                : "RANDOM KILLER";
    }


    updateGamePlayerCount(
        room.players.length
    );
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(text) {

    return String(text)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   CHARACTER
   ========================================================= */

function changeCharacter() {

    const select =
        $("characterSelect");

    if (!select) return;

    socket.emit(
        "changeCharacter",
        select.value
    );

    showToast(
        "CHARACTER UPDATED"
    );
}


/* =========================================================
   COSTUME
   ========================================================= */

function changeCostume() {

    const select =
        $("costumeSelect");

    if (!select) return;

    socket.emit(
        "changeCostume",
        select.value
    );

    showToast(
        "COSTUME UPDATED"
    );
}


/* =========================================================
   READY
   ========================================================= */

function toggleReady() {

    ready = !ready;

    socket.emit(
        "ready",
        ready
    );

    updateReadyButton();
}


function updateReadyButton() {

    const button =
        $("readyButton");

    if (!button) return;

    button.textContent =
        ready
            ? "READY ✓"
            : "READY";

    button.classList.toggle(
        "active",
        ready
    );
}


/* =========================================================
   REQUEST KILLER
   ========================================================= */

function requestKiller() {

    socket.emit(
        "chooseKiller"
    );

    showToast(
        "KILLER REQUEST SENT"
    );
}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    socket.emit(
        "startGame"
    );
}


/* =========================================================
   GAME START EVENT
   ========================================================= */

socket.on(
    "gameStarted",
    data => {

        gameStarted = true;

        if (data) {

            if (
                Array.isArray(
                    data.players
                )
            ) {

                updateGamePlayerCount(
                    data.players.length
                );
            }

            const me =
                data.players
                    ? data.players.find(
                        p =>
                            p.id ===
                            socket.id
                    )
                    : null;

            if (me) {

                myPlayer = me;

                updateGameRole(
                    me.role
                );
            }
        }


        showScreen(
            "gameScreen"
        );


        /*
         * game3d.js will automatically
         * start when this function is
         * called.
         */

        if (
            typeof launch3DGame ===
            "function"
        ) {

            launch3DGame(
                data || {}
            );

        } else {

            showToast(
                "GAME ENGINE NOT LOADED"
            );
        }

    }
);


/* =========================================================
   SERVER ERROR
   ========================================================= */

socket.on(
    "errorMessage",
    message => {

        showToast(
            message ||
            "Something went wrong"
        );

        const joinMessage =
            $("joinMessage");

        if (joinMessage) {

            joinMessage.textContent =
                message || "";
        }
    }
);


/* =========================================================
   SOCKET CONNECTION
   ========================================================= */

socket.on(
    "connect",
    () => {

        const status =
            $("connectionStatus");

        if (status) {

            status.textContent =
                "● ONLINE";

            status.style.color =
                "#2ecc71";
        }
    }
);


socket.on(
    "disconnect",
    () => {

        const status =
            $("connectionStatus");

        if (status) {

            status.textContent =
                "● DISCONNECTED";

            status.style.color =
                "#e74c3c";
        }

        showToast(
            "CONNECTION LOST"
        );
    }
);


/* =========================================================
   PLAYER COUNT
   ========================================================= */

function updateGamePlayerCount(
    count
) {

    const element =
        $("gamePlayerCount");

    if (element) {

        element.textContent =
            count || 0;
    }
}


/* =========================================================
   GAME ROLE
   ========================================================= */

function updateGameRole(role) {

    const element =
        $("gameRole");

    if (!element) return;

    element.textContent =
        role === "killer"
            ? "KILLER"
            : "SURVIVOR";
}


/* =========================================================
   SERVER GAME STATE
   ========================================================= */

socket.on(
    "game:update",
    data => {

        if (!data) return;

        /*
         * This is intentionally
         * lightweight so the 3D
         * engine remains smooth.
         */

        if (
            typeof receiveGameUpdate ===
            "function"
        ) {

            receiveGameUpdate(
                data
            );
        }
    }
);


/* =========================================================
   PLAYER DISCONNECTED
   ========================================================= */

socket.on(
    "playerLeft",
    data => {

        if (!data) return;

        showToast(
            (
                data.name ||
                "A player"
            ) +
            " LEFT THE GAME"
        );
    }
);


/* =========================================================
   GAME ENDED
   ========================================================= */

socket.on(
    "gameOver",
    data => {

        gameStarted = false;

        showToast(
            data &&
            data.message
                ? data.message
                : "GAME OVER"
        );

        setTimeout(
            () => {

                showScreen(
                    "lobbyScreen"
                );

            },
            1500
        );
    }
);


/* =========================================================
   ESCAPE SUCCESS
   ========================================================= */

socket.on(
    "escaped",
    data => {

        showToast(
            "ESCAPE SUCCESSFUL!"
        );

        if (
            typeof stop3DGame ===
            "function"
        ) {

            stop3DGame();
        }
    }
);


/* =========================================================
   LEAVE ROOM
   ========================================================= */

function leaveRoom() {

    try {

        socket.emit(
            "leaveRoom"
        );

    } catch (error) {

        console.log(error);
    }

    gameStarted = false;

    if (
        typeof stop3DGame ===
        "function"
    ) {

        stop3DGame();
    }

    roomCode = null;
    roomData = null;
    myPlayer = null;

    ready = false;

    updateReadyButton();

    showScreen(
        "homeScreen"
    );
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

window.addEventListener(
    "popstate",
    () => {

        if (gameStarted) {
            return;
        }

        showScreen(
            "homeScreen"
        );
    }
);


/* =========================================================
   ENTER KEY HELP
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Enter"
        ) {
            return;
        }


        const activeScreen =
            document.querySelector(
                ".screen.active"
            );


        if (!activeScreen) {
            return;
        }


        if (
            activeScreen.id ===
            "createScreen"
        ) {

            createRoom();

        }


        if (
            activeScreen.id ===
            "joinScreen"
        ) {

            joinRoom();

        }

    }
);


/* =========================================================
   MOBILE VIEWPORT FIX
   ========================================================= */

function fixMobileViewport() {

    document.documentElement
        .style
        .setProperty(
            "--vh",
            `${window.innerHeight * 0.01}px`
        );
}


window.addEventListener(
    "resize",
    fixMobileViewport
);

fixMobileViewport();


/* =========================================================
   PREVENT MOBILE LONG PRESS
   ========================================================= */

document.addEventListener(
    "contextmenu",
    event => {

        if (
            event.target.tagName ===
            "BUTTON"
        ) {

            event.preventDefault();
        }
    }
);


/* =========================================================
   INITIAL UI
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        showScreen(
            "homeScreen"
        );

        selectKillerMode(
            "random"
        );

    }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.openCreate =
    openCreate;

window.openJoin =
    openJoin;

window.selectKillerMode =
    selectKillerMode;

window.createRoom =
    createRoom;

window.joinRoom =
    joinRoom;

window.changeCharacter =
    changeCharacter;

window.changeCostume =
    changeCostume;

window.toggleReady =
    toggleReady;

window.requestKiller =
    requestKiller;

window.startGame =
    startGame;

window.leaveRoom =
    leaveRoom;

window.showScreen =
    showScreen;

window.showToast =
    showToast;


/* =========================================================
   END CLIENT.JS
   ========================================================= */
```
