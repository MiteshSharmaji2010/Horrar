/* =========================================================
   KILLER ESCAPE 07
   CLIENT.JS
   Multiplayer / Lobby / Game Controller
   ========================================================= */

"use strict";

/* =========================================================
   SOCKET
   ========================================================= */

const socket = io();

let roomCode = "";
let roomData = null;
let myPlayer = null;

let killerMode = "random";
let ready = false;

let gameStartedFromServer = false;


/* =========================================================
   CONNECTION
   ========================================================= */

socket.on("connect", () => {

    const status =
        document.getElementById("connectionStatus");

    if (status) {
        status.textContent =
            "CONNECTED";
        status.style.color =
            "#2ecc71";
    }

});


socket.on("disconnect", () => {

    const status =
        document.getElementById("connectionStatus");

    if (status) {
        status.textContent =
            "DISCONNECTED";
        status.style.color =
            "#e74c3c";
    }

});


/* =========================================================
   SCREEN SYSTEM
   ========================================================= */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const target =
        document.getElementById(id);

    if (target) {
        target.classList.add("active");
    }

}


/* =========================================================
   PLAYER NAME
   ========================================================= */

function getPlayerName() {

    const input =
        document.getElementById("playerName");

    if (!input) {
        return "Player";
    }

    const name =
        input.value.trim();

    return name || "Player";

}


/* =========================================================
   HOME
   ========================================================= */

function openCreate() {

    showScreen("createScreen");

}


function openJoin() {

    showScreen("joinScreen");

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(
        window.__toastTimer
    );

    window.__toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);

}


/* =========================================================
   KILLER MODE
   ========================================================= */

function selectKillerMode(mode) {

    killerMode =
        mode === "choose"
            ? "choose"
            : "random";

    const randomButton =
        document.getElementById(
            "randomKillerButton"
        );

    const chooseButton =
        document.getElementById(
            "chooseKillerButton"
        );

    if (randomButton) {

        randomButton.classList.toggle(
            "selected",
            killerMode === "random"
        );

    }

    if (chooseButton) {

        chooseButton.classList.toggle(
            "selected",
            killerMode === "choose"
        );

    }

}


/* =========================================================
   CREATE ROOM
   ========================================================= */

function createRoom() {

    const passwordInput =
        document.getElementById(
            "createPassword"
        );

    const password =
        passwordInput
            ? passwordInput.value.trim()
            : "";

    if (!password) {

        showToast(
            "ENTER ROOM PASSWORD"
        );

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

    const codeInput =
        document.getElementById(
            "joinCode"
        );

    const passwordInput =
        document.getElementById(
            "joinPassword"
        );

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
            "ENTER PASSWORD"
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

        roomCode =
            data.code || "";

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

        roomCode =
            data.code || "";

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

        roomData =
            room;

        roomCode =
            room.code || roomCode;

        updateLobby(
            room
        );

    }
);


/* =========================================================
   UPDATE LOBBY
   ========================================================= */

function updateLobby(room) {

    const roomCodeText =
        document.getElementById(
            "roomCodeText"
        );

    const playerCountText =
        document.getElementById(
            "playerCountText"
        );

    if (roomCodeText) {

        roomCodeText.textContent =
            room.code || "------";

    }

    const players =
        Array.isArray(room.players)
            ? room.players
            : [];

    if (playerCountText) {

        playerCountText.textContent =
            players.length + "/9";

    }

    const list =
        document.getElementById(
            "playersList"
        );

    if (list) {

        list.innerHTML = "";

        players.forEach(
            playerData => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "playerCard";

                if (
                    playerData.role ===
                    "killer"
                ) {

                    card.classList.add(
                        "killer"
                    );

                }

                if (
                    playerData.ready
                ) {

                    card.classList.add(
                        "ready"
                    );

                }

                const avatar =
                    playerData.role ===
                    "killer"
                        ? "🔪"
                        : "👤";

                const status =
                    playerData.role ===
                    "killer"
                        ? "KILLER"
                        : playerData.ready
                            ? "READY"
                            : "WAITING";

                card.innerHTML = `

                    <div class="playerAvatar">
                        ${avatar}
                    </div>

                    <div>

                        <div class="playerName">
                            ${escapeHTML(
                                playerData.name ||
                                "Player"
                            )}
                        </div>

                        <div class="playerDetails">
                            ${escapeHTML(
                                playerData.character ||
                                "Survivor"
                            )}
                            •
                            ${escapeHTML(
                                playerData.costume ||
                                "Casual"
                            )}
                        </div>

                    </div>

                    <div class="playerStatus">
                        ${status}
                    </div>

                `;

                list.appendChild(
                    card
                );

                if (
                    playerData.id ===
                    socket.id
                ) {

                    myPlayer =
                        playerData;

                    ready =
                        !!playerData.ready;

                    updateReadyButton();

                }

            }
        );

    }


    const modeText =
        document.getElementById(
            "killerModeText"
        );

    if (modeText) {

        modeText.textContent =
            room.killerMode === "choose"
                ? "CHOOSE KILLER"
                : "RANDOM KILLER";

    }


    const gamePlayerCount =
        document.getElementById(
            "gamePlayerCount"
        );

    if (gamePlayerCount) {

        gamePlayerCount.textContent =
            players.length;

    }

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
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
        document.getElementById(
            "characterSelect"
        );

    if (!select) return;

    socket.emit(
        "changeCharacter",
        select.value
    );

    showToast(
        "CHARACTER SELECTED"
    );

}


/* =========================================================
   COSTUME
   ========================================================= */

function changeCostume() {

    const select =
        document.getElementById(
            "costumeSelect"
        );

    if (!select) return;

    socket.emit(
        "changeCostume",
        select.value
    );

    showToast(
        "COSTUME SELECTED"
    );

}


/* =========================================================
   READY
   ========================================================= */

function toggleReady() {

    ready =
        !ready;

    socket.emit(
        "ready",
        ready
    );

    updateReadyButton();

}


function updateReadyButton() {

    const button =
        document.getElementById(
            "readyButton"
        );

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

    if (!roomCode) {

        showToast(
            "CREATE OR JOIN A ROOM FIRST"
        );

        return;
    }

    socket.emit(
        "startGame"
    );

}


/* =========================================================
   SERVER GAME START
   ========================================================= */

socket.on(
    "gameStarted",
    data => {

        gameStartedFromServer =
            true;

        showScreen(
            "gameScreen"
        );

        const count =
            data &&
            Array.isArray(data.players)
                ? data.players.length
                : (
                    roomData &&
                    Array.isArray(
                        roomData.players
                    )
                        ? roomData.players.length
                        : 1
                );

        const countElement =
            document.getElementById(
                "gamePlayerCount"
            );

        if (countElement) {

            countElement.textContent =
                count;

        }


        const me =
            data &&
            Array.isArray(data.players)
                ? data.players.find(
                    p =>
                        p.id ===
                        socket.id
                )
                : null;

        if (me) {

            myPlayer =
                me;

            const role =
                document.getElementById(
                    "gameRole"
                );

            if (role) {

                role.textContent =
                    me.role === "killer"
                        ? "KILLER"
                        : "SURVIVOR";

            }

        }


        /*
         * IMPORTANT:
         * Start 3D only after the game screen
         * becomes visible.
         */

        setTimeout(
            () => {

                if (
                    typeof launch3DGame ===
                    "function"
                ) {

                    launch3DGame(
                        data || {}
                    );

                }
                else if (
                    typeof start3DGame ===
                    "function"
                ) {

                    start3DGame(
                        data || {}
                    );

                }
                else {

                    console.error(
                        "game3d.js not loaded"
                    );

                    showToast(
                        "3D GAME FILE NOT LOADED"
                    );

                }

            },
            100
        );

    }
);


/* =========================================================
   OPTIONAL SERVER GAME UPDATE
   ========================================================= */

socket.on(
    "game:update",
    data => {

        if (
            typeof updateNetworkPlayers ===
            "function"
        ) {

            updateNetworkPlayers(
                data
            );

        }

    }
);


/* =========================================================
   GAME ERROR
   ========================================================= */

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

        if (joinMessage) {

            joinMessage.textContent =
                message;

        }

    }
);


/* =========================================================
   SERVER ERROR
   ========================================================= */

socket.on(
    "connect_error",
    error => {

        console.error(
            "Socket connection error:",
            error
        );

        const status =
            document.getElementById(
                "connectionStatus"
            );

        if (status) {

            status.textContent =
                "SERVER ERROR";

            status.style.color =
                "#e74c3c";

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

    }
    catch (error) {

        console.log(
            "Leave error",
            error
        );

    }

    roomCode =
        "";

    roomData =
        null;

    myPlayer =
        null;

    ready =
        false;

    if (
        typeof stop3DGame ===
        "function"
    ) {

        stop3DGame();

    }

    showScreen(
        "homeScreen"
    );

}


/* =========================================================
   BACK BUTTON SUPPORT
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        try {

            socket.disconnect();

        }
        catch (e) {}

    }
);


/* =========================================================
   EXPORT GLOBAL FUNCTIONS
   ========================================================= */

window.showScreen =
    showScreen;

window.openCreate =
    openCreate;

window.openJoin =
    openJoin;

window.createRoom =
    createRoom;

window.joinRoom =
    joinRoom;

window.selectKillerMode =
    selectKillerMode;

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

window.getPlayerName =
    getPlayerName;

window.showToast =
    showToast;


/* =========================================================
   INITIAL UI
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        showScreen(
            "homeScreen"
        );

    }
);
