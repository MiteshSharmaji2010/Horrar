/* =========================================================
   KILLER ESCAPE 07
   CLIENT.JS
   ========================================================= */

"use strict";

const socket = io();

let roomCode = "";
let roomData = null;
let myPlayer = null;
let ready = false;
let killerMode = "random";

let gameStarted = false;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function showScreen(id) {

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = $(id);

    if (screen) {
        screen.classList.add("active");
    }
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getPlayerName() {

    const input = $("playerName");

    if (!input) {
        return "Player";
    }

    return input.value.trim() || "Player";
}


function showToast(message) {

    const toast = $("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
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
   KILLER MODE
   ========================================================= */

function selectKillerMode(mode) {

    killerMode = mode;

    const randomButton = $("randomKillerButton");
    const chooseButton = $("chooseKillerButton");

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

    const passwordInput = $("createPassword");

    const password =
        passwordInput
            ? passwordInput.value.trim()
            : "";

    if (!password) {

        showToast("ENTER ROOM PASSWORD");

        if (passwordInput) {
            passwordInput.focus();
        }

        return;
    }

    socket.emit("createRoom", {
        name: getPlayerName(),
        password: password,
        killerMode: killerMode
    });
}


/* =========================================================
   JOIN ROOM
   ========================================================= */

function joinRoom() {

    const codeInput = $("joinCode");
    const passwordInput = $("joinPassword");

    const code =
        codeInput
            ? codeInput.value.trim().toUpperCase()
            : "";

    const password =
        passwordInput
            ? passwordInput.value.trim()
            : "";

    if (!code) {
        showToast("ENTER ROOM CODE");
        return;
    }

    if (!password) {
        showToast("ENTER ROOM PASSWORD");
        return;
    }

    socket.emit("joinRoom", {
        code: code,
        password: password,
        name: getPlayerName()
    });
}


/* =========================================================
   ROOM CREATED
   ========================================================= */

socket.on("roomCreated", data => {

    roomCode = data.code || "";

    showScreen("lobbyScreen");

    showToast(
        "ROOM CREATED: " + roomCode
    );
});


/* =========================================================
   ROOM JOINED
   ========================================================= */

socket.on("joinedRoom", data => {

    roomCode = data.code || "";

    showScreen("lobbyScreen");

    showToast("JOINED ROOM");
});


/* =========================================================
   ROOM UPDATE
   ========================================================= */

socket.on("room:update", room => {

    if (!room) {
        return;
    }

    roomData = room;
    roomCode = room.code || roomCode;

    updateLobby(room);
});


/* =========================================================
   LOBBY UPDATE
   ========================================================= */

function updateLobby(room) {

    const roomCodeText = $("roomCodeText");

    if (roomCodeText) {
        roomCodeText.textContent =
            room.code || "------";
    }


    const playerCountText =
        $("playerCountText");

    if (playerCountText) {

        const count =
            Array.isArray(room.players)
                ? room.players.length
                : 0;

        playerCountText.textContent =
            count + "/9";
    }


    const gamePlayerCount =
        $("gamePlayerCount");

    if (gamePlayerCount) {

        const count =
            Array.isArray(room.players)
                ? room.players.length
                : 0;

        gamePlayerCount.textContent =
            count;
    }


    const killerModeText =
        $("killerModeText");

    if (killerModeText) {

        killerModeText.textContent =
            room.killerMode === "choose"
                ? "CHOOSE KILLER"
                : "RANDOM KILLER";
    }


    const list =
        $("playersList");

    if (!list) {
        return;
    }

    list.innerHTML = "";


    if (!Array.isArray(room.players)) {
        return;
    }


    room.players.forEach(p => {

        const card =
            document.createElement("div");

        card.className = "playerCard";


        if (p.role === "killer") {
            card.classList.add("killer");
        }


        if (p.ready) {
            card.classList.add("ready");
        }


        const avatar =
            p.role === "killer"
                ? "🔪"
                : "👤";


        const status =
            p.role === "killer"
                ? "KILLER"
                : p.ready
                    ? "READY"
                    : "WAITING";


        card.innerHTML = `
            <div class="playerAvatar">
                ${avatar}
            </div>

            <div>
                <div class="playerName">
                    ${escapeHTML(p.name || "Player")}
                </div>

                <div class="playerDetails">
                    ${escapeHTML(p.character || "Alex")}
                    •
                    ${escapeHTML(p.costume || "Casual")}
                </div>
            </div>

            <div class="playerStatus">
                ${status}
            </div>
        `;


        list.appendChild(card);


        if (p.id === socket.id) {

            myPlayer = p;

            ready =
                Boolean(p.ready);
        }

    });


    const readyButton =
        $("readyButton");

    if (readyButton) {

        readyButton.textContent =
            ready
                ? "READY ✓"
                : "READY";

        readyButton.classList.toggle(
            "active",
            ready
        );
    }
}


/* =========================================================
   CHARACTER
   ========================================================= */

function changeCharacter() {

    const select =
        $("characterSelect");

    if (!select) {
        return;
    }

    socket.emit(
        "changeCharacter",
        select.value
    );

    showToast(
        "CHARACTER: " + select.value
    );
}


/* =========================================================
   COSTUME
   ========================================================= */

function changeCostume() {

    const select =
        $("costumeSelect");

    if (!select) {
        return;
    }

    socket.emit(
        "changeCostume",
        select.value
    );

    showToast(
        "COSTUME: " + select.value
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


    const button =
        $("readyButton");

    if (button) {

        button.textContent =
            ready
                ? "READY ✓"
                : "READY";

        button.classList.toggle(
            "active",
            ready
        );
    }
}


/* =========================================================
   KILLER REQUEST
   ========================================================= */

function requestKiller() {

    socket.emit("chooseKiller");

    showToast(
        "KILLER REQUEST SENT"
    );
}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    socket.emit("startGame");
}


/* =========================================================
   SERVER GAME START
   ========================================================= */

socket.on("gameStarted", data => {

    gameStarted = true;

    showScreen("gameScreen");

    setTimeout(() => {

        if (
            typeof launch3DGame ===
            "function"
        ) {

            launch3DGame(data);

        } else {

            console.error(
                "launch3DGame() not found"
            );

            showToast(
                "GAME ENGINE NOT LOADED"
            );
        }

    }, 100);
});


/* =========================================================
   ERROR
   ========================================================= */

socket.on("errorMessage", message => {

    showToast(
        message || "Something went wrong"
    );


    const joinMessage =
        $("joinMessage");

    if (joinMessage) {

        joinMessage.textContent =
            message || "";
    }
});


/* =========================================================
   CONNECTION
   ========================================================= */

socket.on("connect", () => {

    const status =
        $("connectionStatus");

    if (status) {

        status.textContent =
            "● ONLINE";

        status.style.color =
            "#36d16b";
    }
});


socket.on("disconnect", () => {

    const status =
        $("connectionStatus");

    if (status) {

        status.textContent =
            "● DISCONNECTED";

        status.style.color =
            "#d33";
    }

    showToast(
        "SERVER DISCONNECTED"
    );
});


/* =========================================================
   LEAVE ROOM
   ========================================================= */

function leaveRoom() {

    try {
        socket.emit("leaveRoom");
    }
    catch (error) {
        console.log(error);
    }

    roomCode = "";
    roomData = null;
    myPlayer = null;
    ready = false;

    showScreen("homeScreen");
}


/* =========================================================
   OVERRIDE LEAVE BUTTON
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .querySelectorAll(".leaveButton")
            .forEach(button => {

                button.onclick =
                    leaveRoom;

            });

    }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.openCreate = openCreate;
window.openJoin = openJoin;

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

window.showScreen =
    showScreen;

window.showToast =
    showToast;

window.getPlayerName =
    getPlayerName;

window.leaveRoom =
    leaveRoom;
