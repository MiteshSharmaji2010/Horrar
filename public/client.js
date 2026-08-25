/* ============================================================
   KILLER 07
   HORRAR/public/client.js

   FULL CLIENT / LOBBY CONTROLLER

   Features:
   - Login
   - Player profile
   - Local session
   - WebSocket connection
   - Reconnect
   - Create room
   - Join room
   - Leave room
   - Room password
   - Maximum 9 players
   - Player list
   - Host system
   - Ready system
   - Friend search
   - Friend invite
   - Invite accept
   - Notifications
   - Connection status
   - Game start
   - Killer / Survivor role preparation
   - Mobile friendly
   - Error handling
   - Safe DOM access
============================================================ */

"use strict";

(() => {

    /* ========================================================
       CONFIG
    ======================================================== */

    const CONFIG = {

        GAME_NAME: "KILLER 07",

        MAX_PLAYERS: 9,

        MIN_USERNAME_LENGTH: 3,

        MAX_USERNAME_LENGTH: 16,

        MIN_PASSWORD_LENGTH: 4,

        RECONNECT_ATTEMPTS: 8,

        RECONNECT_DELAY: 2500,

        HEARTBEAT_INTERVAL: 15000,

        REQUEST_TIMEOUT: 8000

    };


    /* ========================================================
       GLOBAL STATE
    ======================================================== */

    const state = {

        username:
            localStorage.getItem(
                "killer07_username"
            ) || "",

        password:
            localStorage.getItem(
                "killer07_password"
            ) || "",

        playerId:
            localStorage.getItem(
                "killer07_player_id"
            ) || "",

        roomCode: "",

        roomPassword: "",

        host: false,

        ready: false,

        connected: false,

        connecting: false,

        reconnecting: false,

        reconnectCount: 0,

        socket: null,

        heartbeatTimer: null,

        reconnectTimer: null,

        roomPlayers: [],

        friends: [],

        pendingInvites: [],

        lastServerState: null,

        gameStarted: false,

        localRole: "SURVIVOR",

        selectedCharacter: "survivor",

        requestCounter: 0,

        pendingRequests: new Map()

    };


    /* ========================================================
       DOM HELPERS
    ======================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function query(selector) {
        return document.querySelector(selector);
    }


    function queryAll(selector) {
        return Array.from(
            document.querySelectorAll(selector)
        );
    }


    function exists(id) {
        return !!$(id);
    }


    function show(id) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.classList.remove("hidden");
        element.style.display = "";

    }


    function hide(id) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.classList.add("hidden");

    }


    function toggle(id, visible) {

        if (visible) {
            show(id);
        } else {
            hide(id);
        }

    }


    function setText(id, value) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.textContent =
            value === undefined ||
            value === null
                ? ""
                : String(value);

    }


    function setValue(id, value) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.value =
            value === undefined ||
            value === null
                ? ""
                : value;

    }


    function getValue(id) {

        const element = $(id);

        if (!element) {
            return "";
        }

        return String(
            element.value || ""
        ).trim();

    }


    /* ========================================================
       CLASS HELPERS
    ======================================================== */

    function addClass(id, className) {

        const element = $(id);

        if (element) {
            element.classList.add(className);
        }

    }


    function removeClass(id, className) {

        const element = $(id);

        if (element) {
            element.classList.remove(className);
        }

    }


    /* ========================================================
       TOAST SYSTEM
    ======================================================== */

    let toastTimer = null;


    function toast(message, type = "normal") {

        let element = $("toast");

        if (!element) {

            element =
                document.createElement("div");

            element.id = "toast";

            element.className = "toast";

            document.body.appendChild(
                element
            );

        }

        element.textContent =
            String(message || "");

        element.dataset.type = type;

        element.classList.remove(
            "hidden"
        );

        clearTimeout(toastTimer);

        toastTimer =
            setTimeout(() => {

                element.classList.add(
                    "hidden"
                );

            }, 3200);

    }


    /* ========================================================
       LOGIN ERROR
    ======================================================== */

    function loginError(message) {

        const element =
            $("loginError");

        if (!element) {

            toast(
                message,
                "error"
            );

            return;

        }

        element.textContent =
            String(message);

        element.classList.remove(
            "hidden"
        );

    }


    function clearLoginError() {

        const element =
            $("loginError");

        if (!element) {
            return;
        }

        element.textContent = "";

        element.classList.add(
            "hidden"
        );

    }


    /* ========================================================
       VALIDATION
    ======================================================== */

    function sanitizeUsername(name) {

        return String(name || "")
            .replace(/[<>]/g, "")
            .replace(/\s+/g, " ")
            .trim();

    }


    function validateUsername(name) {

        name =
            sanitizeUsername(name);

        if (!name) {

            return {
                ok: false,
                message:
                    "Player name enter karo."
            };

        }


        if (
            name.length <
            CONFIG.MIN_USERNAME_LENGTH
        ) {

            return {
                ok: false,
                message:
                    "Name minimum 3 characters ka hona chahiye."
            };

        }


        if (
            name.length >
            CONFIG.MAX_USERNAME_LENGTH
        ) {

            return {
                ok: false,
                message:
                    "Name maximum 16 characters ka ho sakta hai."
            };

        }


        if (
            !/^[a-zA-Z0-9 _-]+$/.test(name)
        ) {

            return {
                ok: false,
                message:
                    "Name mein special characters allowed nahi hain."
            };

        }


        return {
            ok: true,
            value: name
        };

    }


    function validatePassword(password) {

        password =
            String(password || "");

        if (!password) {

            return {
                ok: false,
                message:
                    "Password enter karo."
            };

        }


        if (
            password.length <
            CONFIG.MIN_PASSWORD_LENGTH
        ) {

            return {
                ok: false,
                message:
                    "Password minimum 4 characters ka hona chahiye."
            };

        }


        return {
            ok: true,
            value: password
        };

    }


    /* ========================================================
       LOGIN
    ======================================================== */

    function login() {

        clearLoginError();

        const name =
            sanitizeUsername(
                getFirstValue([
                    "playerName",
                    "username",
                    "loginName",
                    "name"
                ])
            );

        const password =
            getFirstValue([
                "playerPassword",
                "password",
                "loginPassword"
            ]);


        const nameCheck =
            validateUsername(name);

        if (!nameCheck.ok) {

            loginError(
                nameCheck.message
            );

            return;

        }


        const passwordCheck =
            validatePassword(password);

        if (!passwordCheck.ok) {

            loginError(
                passwordCheck.message
            );

            return;

        }


        state.username =
            nameCheck.value;

        state.password =
            passwordCheck.value;


        if (!state.playerId) {

            state.playerId =
                generatePlayerId();

        }


        localStorage.setItem(
            "killer07_username",
            state.username
        );

        localStorage.setItem(
            "killer07_password",
            state.password
        );

        localStorage.setItem(
            "killer07_player_id",
            state.playerId
        );


        updateProfileUI();


        hide("loginScreen");

        show("lobbyScreen");


        updateLobbyUI();

        setConnectionStatus(
            "CONNECTING"
        );


        connectSocket();


        toast(
            `Welcome ${state.username}.`,
            "success"
        );

    }


    /* ========================================================
       AUTO LOGIN
    ======================================================== */

    function tryAutoLogin() {

        if (
            !state.username ||
            !state.password
        ) {

            show("loginScreen");

            return false;

        }


        const check =
            validateUsername(
                state.username
            );


        if (!check.ok) {

            show("loginScreen");

            return false;

        }


        hide("loginScreen");

        show("lobbyScreen");


        updateProfileUI();

        updateLobbyUI();

        connectSocket();

        return true;

    }


    /* ========================================================
       LOGOUT
    ======================================================== */

    function logout() {

        stopHeartbeat();

        clearReconnectTimer();

        if (state.socket) {

            try {

                state.socket.close();

            } catch (error) {}

        }


        state.socket = null;

        state.connected = false;

        state.connecting = false;

        state.roomCode = "";

        state.roomPassword = "";

        state.roomPlayers = [];

        state.host = false;

        state.ready = false;

        state.gameStarted = false;


        localStorage.removeItem(
            "killer07_username"
        );

        localStorage.removeItem(
            "killer07_password"
        );

        localStorage.removeItem(
            "killer07_player_id"
        );


        state.username = "";

        state.password = "";

        state.playerId = "";


        hide("lobbyScreen");

        hide("gameScreen");

        show("loginScreen");


        setConnectionStatus(
            "OFFLINE"
        );

    }


    /* ========================================================
       RANDOM PLAYER ID
    ======================================================== */

    function generatePlayerId() {

        const random =
            Math.random()
                .toString(36)
                .substring(2, 10);

        return (
            "p_" +
            Date.now().toString(36) +
            "_" +
            random
        );

    }


    /* ========================================================
       GET FIRST EXISTING VALUE
    ======================================================== */

    function getFirstValue(ids) {

        for (
            const id of ids
        ) {

            const element = $(id);

            if (
                element &&
                typeof element.value !==
                    "undefined"
            ) {

                return element.value;

            }

        }

        return "";

    }


    /* ========================================================
       PROFILE UI
    ======================================================== */

    function updateProfileUI() {

        const name =
            state.username ||
            "SURVIVOR";


        const username =
            "@" +
            name
                .toLowerCase()
                .replace(/\s+/g, "_");


        setText(
            "profileName",
            name
        );

        setText(
            "playerNameDisplay",
            name
        );

        setText(
            "profileUsername",
            username
        );

        setText(
            "lobbyPlayerName",
            name
        );


        const avatar =
            $("profileAvatar");


        if (avatar) {

            const first =
                name
                    .charAt(0)
                    .toUpperCase();

            avatar.setAttribute(
                "data-letter",
                first
            );

        }

    }


    /* ========================================================
       CONNECTION STATUS
    ======================================================== */

    function setConnectionStatus(status) {

        const statusText =
            $("connectionStatus");

        const serverStatus =
            $("serverStatus");

        const dot =
            document.querySelector(
                ".online-dot"
            );


        let display =
            String(status || "")
                .toUpperCase();


        if (
            display ===
            "CONNECTED"
        ) {

            display =
                "ONLINE";

        }


        if (statusText) {

            statusText.textContent =
                display;

        }


        if (serverStatus) {

            serverStatus.textContent =
                display;

        }


        if (dot) {

            if (
                display === "ONLINE"
            ) {

                dot.style.background =
                    "#49d17d";

                dot.style.boxShadow =
                    "0 0 10px rgba(73,209,125,.8)";

            } else {

                dot.style.background =
                    "#d71932";

                dot.style.boxShadow =
                    "0 0 10px rgba(215,25,50,.7)";

            }

        }

    }


    /* ========================================================
       SOCKET URL
    ======================================================== */

    function getSocketURL() {

        if (
            window.location.protocol ===
            "https:"
        ) {

            return (
                "wss://" +
                window.location.host
            );

        }


        if (
            window.location.protocol ===
            "http:"
        ) {

            return (
                "ws://" +
                window.location.host
            );

        }


        return "";

    }


    /* ========================================================
       CONNECT SOCKET
    ======================================================== */

    function connectSocket() {

        if (
            state.connected ||
            state.connecting
        ) {

            return;

        }


        const url =
            getSocketURL();


        if (!url) {

            setConnectionStatus(
                "OFFLINE"
            );

            return;

        }


        state.connecting = true;

        setConnectionStatus(
            "CONNECTING"
        );


        let socket;


        try {

            socket =
                new WebSocket(url);

        } catch (error) {

            state.connecting = false;

            setConnectionStatus(
                "OFFLINE"
            );

            scheduleReconnect();

            return;

        }


        state.socket =
            socket;


        socket.addEventListener(
            "open",
            handleSocketOpen
        );


        socket.addEventListener(
            "message",
            handleSocketMessage
        );


        socket.addEventListener(
            "close",
            handleSocketClose
        );


        socket.addEventListener(
            "error",
            handleSocketError
        );

    }


    /* ========================================================
       SOCKET OPEN
    ======================================================== */

    function handleSocketOpen() {

        state.connected = true;

        state.connecting = false;

        state.reconnecting = false;

        state.reconnectCount = 0;


        setConnectionStatus(
            "ONLINE"
        );


        startHeartbeat();


        sendMessage(
            "login",
            {
                playerId:
                    state.playerId,

                username:
                    state.username
            }
        );


        toast(
            "Server connected.",
            "success"
        );

    }


    /* ========================================================
       SOCKET CLOSE
    ======================================================== */

    function handleSocketClose() {

        state.connected = false;

        state.connecting = false;


        stopHeartbeat();


        setConnectionStatus(
            "OFFLINE"
        );


        if (
            !state.gameStarted
        ) {

            scheduleReconnect();

        }

    }


    /* ========================================================
       SOCKET ERROR
    ======================================================== */

    function handleSocketError() {

        state.connected = false;

        state.connecting = false;

        setConnectionStatus(
            "OFFLINE"
        );

    }


    /* ========================================================
       RECONNECT
    ======================================================== */

    function scheduleReconnect() {

        if (
            state.reconnectTimer
        ) {

            return;

        }


        if (
            state.reconnectCount >=
            CONFIG.RECONNECT_ATTEMPTS
        ) {

            toast(
                "Server se connection nahi ho pa raha.",
                "error"
            );

            return;

        }


        state.reconnecting =
            true;

        state.reconnectCount++;


        setConnectionStatus(
            "RECONNECTING"
        );


        state.reconnectTimer =
            setTimeout(() => {

                state.reconnectTimer =
                    null;

                connectSocket();

            }, CONFIG.RECONNECT_DELAY);

    }


    function clearReconnectTimer() {

        if (
            state.reconnectTimer
        ) {

            clearTimeout(
                state.reconnectTimer
            );

            state.reconnectTimer =
                null;

        }

    }


    /* ========================================================
       HEARTBEAT
    ======================================================== */

    function startHeartbeat() {

        stopHeartbeat();


        state.heartbeatTimer =
            setInterval(() => {

                if (
                    state.connected
                ) {

                    sendMessage(
                        "ping",
                        {
                            time:
                                Date.now()
                        }
                    );

                }

            }, CONFIG.HEARTBEAT_INTERVAL);

    }


    function stopHeartbeat() {

        if (
            state.heartbeatTimer
        ) {

            clearInterval(
                state.heartbeatTimer
            );

            state.heartbeatTimer =
                null;

        }

    }


    /* ========================================================
       SEND MESSAGE
    ======================================================== */

    function sendMessage(
        type,
        data = {},
        requestId = null
    ) {

        if (
            !state.socket ||
            state.socket.readyState !==
                WebSocket.OPEN
        ) {

            return false;

        }


        const packet = {

            type: type,

            requestId:
                requestId ||
                null,

            timestamp:
                Date.now(),

            playerId:
                state.playerId,

            username:
                state.username,

            data: data

        };


        try {

            state.socket.send(
                JSON.stringify(packet)
            );

            return true;

        } catch (error) {

            return false;

        }

    }


    /* ========================================================
       SOCKET MESSAGE
    ======================================================== */

    function handleSocketMessage(event) {

        let message;


        try {

            message =
                JSON.parse(
                    event.data
                );

        } catch (error) {

            return;

        }


        if (!message) {
            return;
        }


        if (
            message.requestId &&
            state.pendingRequests.has(
                message.requestId
            )
        ) {

            const request =
                state.pendingRequests.get(
                    message.requestId
                );

            state.pendingRequests.delete(
                message.requestId
            );


            if (
                request &&
                typeof request.resolve ===
                    "function"
            ) {

                request.resolve(
                    message
                );

            }

        }


        const type =
            String(
                message.type || ""
            ).toLowerCase();


        switch (type) {

            case "pong":
                break;


            case "login_success":
                handleLoginSuccess(
                    message
                );
                break;


            case "login_error":
                handleLoginError(
                    message
                );
                break;


            case "room_created":
                handleRoomCreated(
                    message
                );
                break;


            case "room_joined":
                handleRoomJoined(
                    message
                );
                break;


            case "room_left":
                handleRoomLeft(
                    message
                );
                break;


            case "room_state":
                handleRoomState(
                    message
                );
                break;


            case "player_joined":
                handlePlayerJoined(
                    message
                );
                break;


            case "player_left":
                handlePlayerLeft(
                    message
                );
                break;


            case "player_ready":
                handlePlayerReady(
                    message
                );
                break;


            case "friend_results":
                handleFriendResults(
                    message
                );
                break;


            case "friend_invite":
                handleFriendInvite(
                    message
                );
                break;


            case "invite":
                handleFriendInvite(
                    message
                );
                break;


            case "game_start":
                handleGameStart(
                    message
                );
                break;


            case "role_assigned":
                handleRoleAssigned(
                    message
                );
                break;


            case "error":
                handleServerError(
                    message
                );
                break;


            default:

                handleCustomMessage(
                    message
                );

        }

    }


    /* ========================================================
       SERVER LOGIN
    ======================================================== */

    function handleLoginSuccess(message) {

        if (
            message.data &&
            message.data.playerId
        ) {

            state.playerId =
                message.data.playerId;

            localStorage.setItem(
                "killer07_player_id",
                state.playerId
            );

        }


        toast(
            "Online profile ready.",
            "success"
        );

    }


    function handleLoginError(message) {

        const reason =
            getMessageText(
                message,
                "Server login failed."
            );

        toast(
            reason,
            "error"
        );

    }


    /* ========================================================
       CREATE ROOM
    ======================================================== */

    function createRoom() {

        if (
            !ensureConnected()
        ) {

            return;

        }


        const password =
            getValue(
                "createRoomPassword"
            ) ||
            getValue(
                "roomPassword"
            );


        state.roomPassword =
            password;


        sendMessage(
            "create_room",
            {

                password:
                    password,

                maxPlayers:
                    CONFIG.MAX_PLAYERS

            }
        );


        toast(
            "Room create ho raha hai..."
        );

    }


    /* ========================================================
       CREATE ROOM RESPONSE
    ======================================================== */

    function handleRoomCreated(
        message
    ) {

        const data =
            message.data || {};


        state.roomCode =
            String(
                data.roomCode ||
                data.code ||
                ""
            );


        state.roomPassword =
            String(
                data.password ||
                state.roomPassword ||
                ""
            );


        state.host = true;

        state.ready = true;


        updateRoomCodeUI();

        toast(
            `Room ${state.roomCode} created.`,
            "success"
        );


        requestRoomState();

    }


    /* ========================================================
       JOIN ROOM
    ======================================================== */

    function joinRoom() {

        if (
            !ensureConnected()
        ) {

            return;

        }


        const code =
            getValue(
                "joinRoomCode"
            ) ||
            getValue(
                "roomCode"
            );


        const password =
            getValue(
                "joinRoomPassword"
            ) ||
            getValue(
                "roomPassword"
            );


        if (!code) {

            toast(
                "Room code enter karo.",
                "error"
            );

            return;

        }


        state.roomCode =
            code.toUpperCase();

        state.roomPassword =
            password;


        sendMessage(
            "join_room",
            {

                roomCode:
                    state.roomCode,

                password:
                    state.roomPassword

            }
        );


        toast(
            "Room join ho raha hai..."
        );

    }


    /* ========================================================
       JOIN RESPONSE
    ======================================================== */

    function handleRoomJoined(
        message
    ) {

        const data =
            message.data || {};


        state.roomCode =
            String(
                data.roomCode ||
                data.code ||
                state.roomCode
            );


        state.roomPlayers =
            normalizePlayers(
                data.players ||
                []
            );


        state.host =
            Boolean(
                data.host ||
                data.isHost
            );


        state.ready =
            Boolean(
                data.ready
            );


        updateRoomCodeUI();

        updatePlayerList();

        updateLobbyUI();


        toast(
            `Room ${state.roomCode} joined.`,
            "success"
        );

    }


    /* ========================================================
       LEAVE ROOM
    ======================================================== */

    function leaveRoom() {

        if (
            state.connected &&
            state.roomCode
        ) {

            sendMessage(
                "leave_room",
                {
                    roomCode:
                        state.roomCode
                }
            );

        }


        state.roomCode = "";

        state.roomPassword = "";

        state.roomPlayers = [];

        state.host = false;

        state.ready = false;


        updateRoomCodeUI();

        updatePlayerList();

        updateLobbyUI();


        toast(
            "Room left."
        );

    }


    /* ========================================================
       ROOM LEFT RESPONSE
    ======================================================== */

    function handleRoomLeft() {

        state.roomCode = "";

        state.roomPassword = "";

        state.roomPlayers = [];

        state.host = false;

        state.ready = false;


        updateRoomCodeUI();

        updatePlayerList();

        updateLobbyUI();

    }


    /* ========================================================
       ROOM STATE
    ======================================================== */

    function requestRoomState() {

        if (
            !state.roomCode ||
            !state.connected
        ) {

            return;

        }


        sendMessage(
            "room_state_request",
            {
                roomCode:
                    state.roomCode
            }
        );

    }


    function handleRoomState(
        message
    ) {

        const data =
            message.data || {};


        state.lastServerState =
            data;


        if (
            data.roomCode
        ) {

            state.roomCode =
                String(
                    data.roomCode
                );

        }


        if (
            Array.isArray(
                data.players
            )
        ) {

            state.roomPlayers =
                normalizePlayers(
                    data.players
                );

        }


        if (
            typeof data.host !==
            "undefined"
        ) {

            state.host =
                Boolean(
                    data.host
                );

        }


        updateRoomCodeUI();

        updatePlayerList();

        updateLobbyUI();

    }


    /* ========================================================
       PLAYER JOINED
    ======================================================== */

    function handlePlayerJoined(
        message
    ) {

        const player =
            message.data &&
            message.data.player;


        if (!player) {

            requestRoomState();

            return;

        }


        const exists =
            state.roomPlayers.some(
                p =>
                    p.id ===
                    player.id
            );


        if (!exists) {

            state.roomPlayers.push(
                normalizePlayer(
                    player
                )
            );

        }


        updatePlayerList();

        updateLobbyUI();


        toast(
            `${player.username || "Player"} joined the lobby.`
        );

    }


    /* ========================================================
       PLAYER LEFT
    ======================================================== */

    function handlePlayerLeft(
        message
    ) {

        const data =
            message.data || {};


        const playerId =
            data.playerId ||
            data.id;


        if (playerId) {

            state.roomPlayers =
                state.roomPlayers.filter(
                    player =>
                        player.id !==
                        playerId
                );

        } else {

            requestRoomState();

        }


        updatePlayerList();

        updateLobbyUI();

    }


    /* ========================================================
       READY
    ======================================================== */

    function toggleReady() {

        if (
            !state.roomCode
        ) {

            toast(
                "Pehle room join/create karo.",
                "error"
            );

            return;

        }


        state.ready =
            !state.ready;


        sendMessage(
            "ready",
            {

                roomCode:
                    state.roomCode,

                ready:
                    state.ready

            }
        );


        updateReadyButton();

    }


    /* ========================================================
       PLAYER READY
    ======================================================== */

    function handlePlayerReady(
        message
    ) {

        const data =
            message.data || {};


        const playerId =
            data.playerId ||
            data.id;


        const ready =
            Boolean(
                data.ready
            );


        const player =
            state.roomPlayers.find(
                p =>
                    p.id ===
                    playerId
            );


        if (player) {

            player.ready =
                ready;

        }


        if (
            playerId ===
            state.playerId
        ) {

            state.ready =
                ready;

        }


        updatePlayerList();

        updateReadyButton();

    }


    /* ========================================================
       START GAME
    ======================================================== */

    function startGame() {

        if (
            !state.roomCode
        ) {

            toast(
                "Room ke bina game start nahi ho sakta.",
                "error"
            );

            return;

        }


        if (
            !state.host
        ) {

            toast(
                "Sirf host game start kar sakta hai.",
                "error"
            );

            return;

        }


        const players =
            state.roomPlayers;


        if (
            players.length < 1
        ) {

            toast(
                "Lobby empty hai.",
                "error"
            );

            return;

        }


        const notReady =
            players.filter(
                player =>
                    !player.ready
            );


        if (
            notReady.length > 0
        ) {

            toast(
                "Sabhi players ko Ready hona hoga.",
                "error"
            );

            return;

        }


        sendMessage(
            "start_game",
            {

                roomCode:
                    state.roomCode,

                players:
                    players.map(
                        player => ({
                            id:
                                player.id,

                            username:
                                player.username
                        })
                    )

            }
        );


        toast(
            "KILLER 07 starting..."
        );

    }


    /* ========================================================
       GAME START
    ======================================================== */

    function handleGameStart(
        message
    ) {

        const data =
            message.data || {};


        state.gameStarted =
            true;


        if (
            data.role
        ) {

            state.localRole =
                String(
                    data.role
                ).toUpperCase();

        }


        hide("lobbyScreen");

        show("gameScreen");


        if (
            window.Killer07Game &&
            typeof
                window.Killer07Game.start ===
                "function"
        ) {

            window.Killer07Game.start({

                username:
                    state.username,

                playerId:
                    state.playerId,

                roomCode:
                    state.roomCode,

                role:
                    state.localRole,

                players:
                    state.roomPlayers

            });

        } else {

            window.dispatchEvent(
                new CustomEvent(
                    "killer07gamestart",
                    {
                        detail: {

                            username:
                                state.username,

                            playerId:
                                state.playerId,

                            roomCode:
                                state.roomCode,

                            role:
                                state.localRole,

                            players:
                                state.roomPlayers

                        }
                    }
                )
            );

        }


        toast(
            state.localRole ===
                "KILLER"
                ? "You are the KILLER."
                : "You are a SURVIVOR.",
            state.localRole ===
                "KILLER"
                ? "error"
                : "success"
        );

    }


    /* ========================================================
       ROLE ASSIGNED
    ======================================================== */

    function handleRoleAssigned(
        message
    ) {

        const data =
            message.data || {};


        if (
            data.role
        ) {

            state.localRole =
                String(
                    data.role
                ).toUpperCase();

        }


        if (
            window.Killer07Game &&
            typeof
                window.Killer07Game.setRole ===
                "function"
        ) {

            window.Killer07Game.setRole(
                state.localRole
            );

        }

    }


    /* ========================================================
       FRIEND SEARCH
    ======================================================== */

    function searchFriends() {

        const input =
            getValue(
                "friendSearch"
            ) ||
            getValue(
                "friendSearchInput"
            );


        if (!input) {

            toast(
                "Player name search karo."
            );

            return;

        }


        if (
            state.connected
        ) {

            sendMessage(
                "search_friend",
                {
                    query:
                        input
                }
            );

            return;

        }


        /* Offline fallback */

        const results =
            state.friends.filter(
                friend =>
                    friend.username
                        .toLowerCase()
                        .includes(
                            input.toLowerCase()
                        )
            );


        renderFriendResults(
            results
        );

    }


    /* ========================================================
       FRIEND RESULTS
    ======================================================== */

    function handleFriendResults(
        message
    ) {

        const data =
            message.data || {};


        const results =
            Array.isArray(
                data.players
            )
                ? data.players
                : Array.isArray(
                    data.results
                )
                    ? data.results
                    : [];


        state.friends =
            results.map(
                normalizePlayer
            );


        renderFriendResults(
            state.friends
        );

    }


    /* ========================================================
       RENDER FRIEND RESULTS
    ======================================================== */

    function renderFriendResults(
        friends
    ) {

        const container =
            $("friendResults");


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        if (
            !friends.length
        ) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "empty-player";

            empty.textContent =
                "No players found.";

            container.appendChild(
                empty
            );

            return;

        }


        friends.forEach(
            friend => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "friend-result";


                const user =
                    document.createElement(
                        "div"
                    );

                user.className =
                    "friend-user";


                const name =
                    document.createElement(
                        "strong"
                    );

                name.textContent =
                    friend.username ||
                    "Unknown";


                const status =
                    document.createElement(
                        "span"
                    );

                status.textContent =
                    friend.online
                        ? "ONLINE"
                        : "OFFLINE";


                if (
                    friend.online
                ) {

                    status.classList.add(
                        "friend-online"
                    );

                }


                user.appendChild(
                    name
                );

                user.appendChild(
                    status
                );


                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "friend-invite";

                button.textContent =
                    "INVITE";


                button.addEventListener(
                    "click",
                    () => {

                        inviteFriend(
                            friend
                        );

                    }
                );


                row.appendChild(
                    user
                );

                row.appendChild(
                    button
                );


                container.appendChild(
                    row
                );

            }
        );

    }


    /* ========================================================
       INVITE FRIEND
    ======================================================== */

    function inviteFriend(
        friend
    ) {

        if (
            !friend ||
            !friend.id
        ) {

            toast(
                "Player information unavailable.",
                "error"
            );

            return;

        }


        if (
            !state.roomCode
        ) {

            toast(
                "Pehle room create/join karo.",
                "error"
            );

            return;

        }


        sendMessage(
            "friend_invite",
            {

                friendId:
                    friend.id,

                username:
                    friend.username,

                roomCode:
                    state.roomCode

            }
        );


        toast(
            `${friend.username} ko invite bhej diya.`,
            "success"
        );

    }


    /* ========================================================
       INCOMING INVITE
    ======================================================== */

    function handleFriendInvite(
        message
    ) {

        const data =
            message.data || {};


        const invite = {

            fromId:
                data.fromId ||
                data.playerId ||
                "",

            fromName:
                data.fromName ||
                data.username ||
                "Player",

            roomCode:
                data.roomCode ||
                "",

            roomPassword:
                data.roomPassword ||
                ""

        };


        state.pendingInvites.push(
            invite
        );


        showInviteNotification(
            invite
        );

    }


    /* ========================================================
       SHOW INVITE
    ======================================================== */

    function showInviteNotification(
        invite
    ) {

        const box =
            $("inviteNotification");


        if (!box) {

            toast(
                `${invite.fromName} ne room invite bheja hai.`,
                "normal"
            );

            return;

        }


        const name =
            box.querySelector(
                ".invite-name"
            );


        const room =
            box.querySelector(
                ".invite-room"
            );


        if (name) {

            name.textContent =
                invite.fromName;

        }


        if (room) {

            room.textContent =
                invite.roomCode
                    ? `ROOM ${invite.roomCode}`
                    : "PRIVATE ROOM";

        }


        box.dataset.roomCode =
            invite.roomCode;

        box.dataset.password =
            invite.roomPassword;


        box.classList.remove(
            "hidden"
        );


        clearTimeout(
            box._timer
        );


        box._timer =
            setTimeout(() => {

                box.classList.add(
                    "hidden"
                );

            }, 15000);

    }


    /* ========================================================
       ACCEPT INVITE
    ======================================================== */

    function acceptInvite() {

        const box =
            $("inviteNotification");


        if (!box) {
            return;
        }


        const roomCode =
            box.dataset.roomCode ||
            "";


        const password =
            box.dataset.password ||
            "";


        if (!roomCode) {

            box.classList.add(
                "hidden"
            );

            toast(
                "Invite expire ho gaya.",
                "error"
            );

            return;

        }


        setValue(
            "joinRoomCode",
            roomCode
        );


        setValue(
            "joinRoomPassword",
            password
        );


        box.classList.add(
            "hidden"
        );


        joinRoom();

    }


    /* ========================================================
       UPDATE ROOM CODE
    ======================================================== */

    function updateRoomCodeUI() {

        setText(
            "roomCodeDisplay",
            state.roomCode ||
            "NO ROOM"
        );


        setText(
            "roomCode",
            state.roomCode ||
            ""
        );


        setText(
            "currentRoomCode",
            state.roomCode ||
            "—"
        );


        const hostText =
            state.host
                ? "HOST"
                : "PLAYER";


        setText(
            "roomRole",
            hostText
        );

    }


    /* ========================================================
       UPDATE LOBBY
    ======================================================== */

    function updateLobbyUI() {

        updateProfileUI();

        updateRoomCodeUI();

        updateReadyButton();

        updateStartButton();

        updatePlayerCount();

    }


    /* ========================================================
       READY BUTTON
    ======================================================== */

    function updateReadyButton() {

        const buttons =
            queryAll(
                "#readyButton, .ready-button"
            );


        buttons.forEach(
            button => {

                button.textContent =
                    state.ready
                        ? "UNREADY"
                        : "READY";


                button.classList.toggle(
                    "ready-active",
                    state.ready
                );

            }
        );

    }


    /* ========================================================
       START BUTTON
    ======================================================== */

    function updateStartButton() {

        const buttons =
            queryAll(
                "#startGame, #startGameButton, .start-game"
            );


        buttons.forEach(
            button => {

                button.disabled =
                    !state.host ||
                    !state.roomCode;


                button.title =
                    !state.host
                        ? "Only host can start"
                        : "";

            }
        );

    }


    /* ========================================================
       PLAYER COUNT
    ======================================================== */

    function updatePlayerCount() {

        const count =
            state.roomPlayers.length;


        setText(
            "playerCount",
            count
        );


        setText(
            "currentPlayerCount",
            count
        );


        setText(
            "maxPlayers",
            CONFIG.MAX_PLAYERS
        );

    }


    /* ========================================================
       NORMALIZE PLAYER
    ======================================================== */

    function normalizePlayer(
        player
    ) {

        if (
            typeof player ===
            "string"
        ) {

            return {

                id:
                    player,

                username:
                    player,

                ready:
                    false,

                online:
                    true,

                host:
                    false

            };

        }


        player =
            player || {};


        return {

            id:
                String(
                    player.id ||
                    player.playerId ||
                    generatePlayerId()
                ),

            username:
                String(
                    player.username ||
                    player.name ||
                    "Player"
                ),

            ready:
                Boolean(
                    player.ready
                ),

            online:
                player.online !== false,

            host:
                Boolean(
                    player.host ||
                    player.isHost
                )

        };

    }


    function normalizePlayers(
        players
    ) {

        return Array.isArray(
            players
        )
            ? players.map(
                normalizePlayer
            )
            : [];

    }


    /* ========================================================
       PLAYER LIST
    ======================================================== */

    function updatePlayerList() {

        const container =
            $("playerList");


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        if (
            state.roomPlayers.length ===
            0
        ) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "empty-player";

            empty.textContent =
                state.roomCode
                    ? "Waiting for players..."
                    : "Create or join a room.";

            container.appendChild(
                empty
            );

            updatePlayerCount();

            return;

        }


        state.roomPlayers.forEach(
            (player, index) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "player-card";


                const avatar =
                    document.createElement(
                        "div"
                    );

                avatar.className =
                    "player-avatar-small";

                avatar.textContent =
                    (
                        player.username ||
                        "P"
                    )
                    .charAt(0)
                    .toUpperCase();


                const info =
                    document.createElement(
                        "div"
                    );

                info.className =
                    "player-card-info";


                const name =
                    document.createElement(
                        "strong"
                    );

                name.textContent =
                    player.username ||
                    "Player";


                const status =
                    document.createElement(
                        "span"
                    );


                if (
                    player.host
                ) {

                    status.textContent =
                        "HOST";

                    status.classList.add(
                        "player-host"
                    );

                } else if (
                    player.ready
                ) {

                    status.textContent =
                        "READY";

                    status.classList.add(
                        "player-ready"
                    );

                } else {

                    status.textContent =
                        player.online
                            ? "NOT READY"
                            : "OFFLINE";

                }


                info.appendChild(
                    name
                );

                info.appendChild(
                    status
                );


                card.appendChild(
                    avatar
                );

                card.appendChild(
                    info
                );


                if (
                    player.id ===
                    state.playerId
                ) {

                    const you =
                        document.createElement(
                            "span"
                        );

                    you.textContent =
                        "YOU";

                    you.style.color =
                        "#777";

                    you.style.fontSize =
                        "7px";

                    card.appendChild(
                        you
                    );

                }


                container.appendChild(
                    card
                );

            }
        );


        updatePlayerCount();

    }


    /* ========================================================
       CUSTOM SERVER ERROR
    ======================================================== */

    function handleServerError(
        message
    ) {

        const error =
            getMessageText(
                message,
                "Server error."
            );


        toast(
            error,
            "error"
        );


        const code =
            message.data &&
            message.data.code;


        if (
            code ===
            "ROOM_FULL"
        ) {

            state.roomCode = "";

            updateRoomCodeUI();

        }


        if (
            code ===
            "INVALID_ROOM"
        ) {

            state.roomCode = "";

            updateRoomCodeUI();

        }

    }


    /* ========================================================
       CUSTOM MESSAGE
    ======================================================== */

    function handleCustomMessage(
        message
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "killer07servermessage",
                {
                    detail:
                        message
                }
            )
        );

    }


    /* ========================================================
       MESSAGE TEXT
    ======================================================== */

    function getMessageText(
        message,
        fallback
    ) {

        if (
            message &&
            message.message
        ) {

            return String(
                message.message
            );

        }


        if (
            message &&
            message.error
        ) {

            return String(
                message.error
            );

        }


        if (
            message &&
            message.data &&
            message.data.message
        ) {

            return String(
                message.data.message
            );

        }


        return fallback;

    }


    /* ========================================================
       CONNECTION CHECK
    ======================================================== */

    function ensureConnected() {

        if (
            state.connected
        ) {

            return true;

        }


        toast(
            "Server se connection nahi hai.",
            "error"
        );


        connectSocket();

        return false;

    }


    /* ========================================================
       CHARACTER SELECTION
    ======================================================== */

    function selectCharacter(
        character
    ) {

        if (!character) {
            return;
        }


        state.selectedCharacter =
            String(
                character
            );


        queryAll(
            "[data-character]"
        ).forEach(
            element => {

                element.classList.toggle(
                    "selected",
                    element.dataset.character ===
                        state.selectedCharacter
                );

            }
        );


        sendMessage(
            "character_select",
            {

                character:
                    state.selectedCharacter

            }
        );


        toast(
            `Character: ${state.selectedCharacter}`
        );

    }


    /* ========================================================
       ESCAPE GAME / RETURN LOBBY
    ======================================================== */

    function returnToLobby() {

        state.gameStarted =
            false;


        if (
            window.Killer07Game &&
            typeof
                window.Killer07Game.stop ===
                "function"
        ) {

            try {

                window.Killer07Game.stop();

            } catch (error) {}

        }


        hide("gameScreen");

        show("lobbyScreen");


        updateLobbyUI();


        toast(
            "Returned to lobby."
        );

    }


    /* ========================================================
       DISPATCH GAME EVENT
    ======================================================== */

    function sendGameEvent(
        type,
        data = {}
    ) {

        sendMessage(
            "game_event",
            {

                event:
                    type,

                ...data

            }
        );

    }


    /* ========================================================
       KEYBOARD SHORTCUTS
    ======================================================== */

    function handleKeyboard(
        event
    ) {

        if (
            event.key ===
            "Escape"
        ) {

            const invite =
                $("inviteNotification");


            if (
                invite &&
                !invite.classList.contains(
                    "hidden"
                )
            ) {

                invite.classList.add(
                    "hidden"
                );

                return;

            }

        }


        if (
            event.key ===
            "Enter"
        ) {

            const loginScreen =
                $("loginScreen");


            if (
                loginScreen &&
                !loginScreen.classList.contains(
                    "hidden"
                )
            ) {

                login();

            }

        }

    }


    /* ========================================================
       BIND BUTTON
    ======================================================== */

    function bindButton(
        ids,
        handler
    ) {

        ids.forEach(
            id => {

                const element =
                    $(id);


                if (!element) {
                    return;
                }


                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        handler(
                            event
                        );

                    }
                );

            }
        );

    }


    /* ========================================================
       BIND INPUT ENTER
    ======================================================== */

    function bindEnter(
        ids,
        handler
    ) {

        ids.forEach(
            id => {

                const element =
                    $(id);


                if (!element) {
                    return;
                }


                element.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            event.preventDefault();

                            handler(
                                event
                            );

                        }

                    }
                );

            }
        );

    }


    /* ========================================================
       DOM READY
    ======================================================== */

    function init() {

        /* Login */

        bindButton(
            [
                "loginButton",
                "loginBtn",
                "loginSubmit"
            ],
            login
        );


        bindEnter(
            [
                "playerName",
                "username",
                "loginName",
                "name",
                "playerPassword",
                "password",
                "loginPassword"
            ],
            login
        );


        /* Logout */

        bindButton(
            [
                "logoutButton",
                "logoutBtn"
            ],
            logout
        );


        /* Room */

        bindButton(
            [
                "createRoom",
                "createRoomButton"
            ],
            createRoom
        );


        bindButton(
            [
                "joinRoom",
                "joinRoomButton"
            ],
            joinRoom
        );


        bindButton(
            [
                "leaveRoom",
                "leaveRoomButton"
            ],
            leaveRoom
        );


        bindButton(
            [
                "readyButton",
                "readyBtn"
            ],
            toggleReady
        );


        bindButton(
            [
                "startGame",
                "startGameButton"
            ],
            startGame
        );


        /* Friends */

        bindButton(
            [
                "searchFriend",
                "searchFriendButton"
            ],
            searchFriends
        );


        bindEnter(
            [
                "friendSearch",
                "friendSearchInput"
            ],
            searchFriends
        );


        /* Invite */

        bindButton(
            [
                "acceptInvite"
            ],
            acceptInvite
        );


        /* Return */

        bindButton(
            [
                "returnLobby",
                "returnToLobby",
                "backToLobby"
            ],
            returnToLobby
        );


        /* Character selection */

        queryAll(
            "[data-character]"
        ).forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        selectCharacter(
                            element.dataset.character
                        );

                    }
                );

            }
        );


        document.addEventListener(
            "keydown",
            handleKeyboard
        );


        /* ====================================================
           CUSTOM EVENTS FROM GAME
        ==================================================== */

        window.addEventListener(
            "killer07returnlobby",
            returnToLobby
        );


        window.addEventListener(
            "killer07gameevent",
            event => {

                if (
                    !event.detail
                ) {
                    return;
                }


                sendGameEvent(
                    event.detail.type ||
                    "unknown",
                    event.detail.data ||
                    {}
                );

            }
        );


        /* ====================================================
           INITIAL UI
        ==================================================== */

        updateProfileUI();

        updateLobbyUI();


        /* ====================================================
           AUTO LOGIN
        ==================================================== */

        setTimeout(
            () => {

                tryAutoLogin();

            },
            300
        );

    }


    /* ========================================================
       PUBLIC API
    ======================================================== */

    window.Killer07Client = {

        state,

        login,

        logout,

        connectSocket,

        createRoom,

        joinRoom,

        leaveRoom,

        startGame,

        toggleReady,

        searchFriends,

        inviteFriend,

        acceptInvite,

        returnToLobby,

        sendMessage,

        sendGameEvent,

        toast,

        getPlayerId() {

            return state.playerId;

        },

        getUsername() {

            return state.username;

        },

        getRoomCode() {

            return state.roomCode;

        },

        getRole() {

            return state.localRole;

        },

        isConnected() {

            return state.connected;

        }

    };


    /* ========================================================
       START
    ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();
