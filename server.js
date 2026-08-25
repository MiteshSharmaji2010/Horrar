import express from "express";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
});

app.use(express.static("public"));

/* =========================================================
   KILLER 07 SERVER
   ========================================================= */

const PORT = process.env.PORT || 3000;

/*
   Temporary memory database.

   Later we can replace this with MySQL/MongoDB/Firebase.
*/

const users = new Map();
const rooms = new Map();

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(value, maxLength = 40) {

    return String(value ?? "")
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, "");
}


function createRoomCode() {

    return crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();
}


function getRoom(socket) {

    for (const room of rooms.values()) {

        if (room.players.has(socket.id)) {
            return room;
        }
    }

    return null;
}


function getUser(socket) {

    if (!socket.data.username) {
        return null;
    }

    return users.get(socket.data.username) || null;
}


function getOnlineUsers() {

    const online = new Set();

    for (const socket of io.sockets.sockets.values()) {

        if (socket.data.username) {
            online.add(socket.data.username);
        }
    }

    return online;
}


/* =========================================================
   ROOM PLAYER DATA
   ========================================================= */

function playerPublicData(player) {

    return {

        id: player.id,

        name: player.name,

        username: player.username,

        ready: player.ready,

        role: player.role,

        health: player.health,

        alive: player.alive,

        character: player.character,

        costume: player.costume

    };
}


/* =========================================================
   ROOM UPDATE
   ========================================================= */

function sendRoomUpdate(room) {

    if (!room) {
        return;
    }

    const players = [];

    for (const player of room.players.values()) {

        players.push(
            playerPublicData(player)
        );
    }

    io.to(room.code).emit("roomUpdate", {

        code: room.code,

        host: room.host,

        started: room.started,

        maxPlayers: 9,

        playerCount: players.length,

        players

    });
}


/* =========================================================
   LOGIN / ACCOUNT
   ========================================================= */

io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);


    socket.emit("serverInfo", {

        name: "KILLER 07",

        version: "1.0.0",

        status: "online"

    });


    /* =====================================================
       LOGIN
       ===================================================== */

    socket.on("login", (data, callback) => {

        try {

            const name = cleanText(data?.name, 24);

            const username = cleanText(
                data?.username,
                24
            ).toLowerCase();

            const password = String(
                data?.password ?? ""
            ).slice(0, 64);


            if (!name) {

                callback?.({
                    ok: false,
                    error: "Please enter your name."
                });

                return;
            }


            if (!username) {

                callback?.({
                    ok: false,
                    error: "Please enter a username."
                });

                return;
            }


            if (username.length < 3) {

                callback?.({
                    ok: false,
                    error: "Username must contain at least 3 characters."
                });

                return;
            }


            if (!password) {

                callback?.({
                    ok: false,
                    error: "Please enter your password."
                });

                return;
            }


            const existingUser = users.get(username);


            if (existingUser) {

                if (existingUser.password !== password) {

                    callback?.({
                        ok: false,
                        error: "Incorrect password."
                    });

                    return;
                }


                existingUser.name = name;

            } else {

                users.set(username, {

                    username,

                    name,

                    password,

                    friends: new Set(),

                    createdAt: Date.now()

                });

            }


            socket.data.username = username;

            socket.data.name = name;


            callback?.({

                ok: true,

                user: {

                    username,

                    name

                }

            });


            io.emit(
                "onlineCount",
                getOnlineUsers().size
            );


            console.log(
                `${name} logged in as @${username}`
            );

        } catch (error) {

            console.error("Login error:", error);

            callback?.({

                ok: false,

                error: "Server error during login."

            });

        }

    });


    /* =====================================================
       FRIEND SEARCH
       ===================================================== */

    socket.on("searchFriends", (query, callback) => {

        const search = cleanText(
            query,
            30
        ).toLowerCase();


        if (!search) {

            callback?.([]);

            return;
        }


        const onlineUsers = getOnlineUsers();

        const results = [];


        for (const user of users.values()) {

            if (

                user.username.includes(search) ||

                user.name
                    .toLowerCase()
                    .includes(search)

            ) {

                results.push({

                    name: user.name,

                    username: user.username,

                    online: onlineUsers.has(
                        user.username
                    )

                });

            }


            if (results.length >= 15) {
                break;
            }

        }


        callback?.(results);

    });


    /* =====================================================
       FRIEND INVITE
       ===================================================== */

    socket.on("inviteFriend", (data) => {

        const targetUsername = cleanText(
            data?.username,
            30
        ).toLowerCase();


        const roomCode = cleanText(
            data?.roomCode,
            10
        ).toUpperCase();


        if (!targetUsername || !roomCode) {
            return;
        }


        const targetSocket = [
            ...io.sockets.sockets.values()
        ].find(
            s =>
                s.data.username ===
                targetUsername
        );


        if (!targetSocket) {

            socket.emit("systemMessage", {

                type: "error",

                message:
                    "That friend is currently offline."

            });

            return;
        }


        targetSocket.emit(
            "friendInvite",
            {

                from: socket.data.username,

                roomCode

            }
        );

    });


    /* =====================================================
       CREATE ROOM
       ===================================================== */

    socket.on("createRoom", (data, callback) => {

        const user = getUser(socket);

        if (!user) {

            callback?.({

                ok: false,

                error: "Please login first."

            });

            return;
        }


        if (getRoom(socket)) {

            callback?.({

                ok: false,

                error:
                    "You are already inside a room."

            });

            return;
        }


        let roomCode;


        do {

            roomCode = createRoomCode();

        } while (rooms.has(roomCode));


        const password = String(
            data?.password ?? ""
        ).slice(0, 32);


        const room = {

            code: roomCode,

            password,

            host: socket.id,

            players: new Map(),

            started: false,

            createdAt: Date.now(),

            gameSeed:
                Math.floor(
                    Math.random() * 999999999
                ),

            killerId: null,

            collectedItems: new Set()

        };


        rooms.set(roomCode, room);


        addPlayerToRoom(
            socket,
            room
        );


        callback?.({

            ok: true,

            roomCode

        });


        sendRoomUpdate(room);

    });


    /* =====================================================
       JOIN ROOM
       ===================================================== */

    socket.on("joinRoom", (data, callback) => {

        const user = getUser(socket);

        if (!user) {

            callback?.({

                ok: false,

                error: "Please login first."

            });

            return;
        }


        if (getRoom(socket)) {

            callback?.({

                ok: false,

                error:
                    "You are already inside a room."

            });

            return;
        }


        const roomCode = cleanText(
            data?.roomCode,
            10
        ).toUpperCase();


        const password = String(
            data?.password ?? ""
        ).slice(0, 32);


        const room = rooms.get(roomCode);


        if (!room) {

            callback?.({

                ok: false,

                error: "Room not found."

            });

            return;
        }


        if (room.started) {

            callback?.({

                ok: false,

                error:
                    "This game has already started."

            });

            return;
        }


        if (room.players.size >= 9) {

            callback?.({

                ok: false,

                error:
                    "Room is full. Maximum 9 players."

            });

            return;
        }


        if (room.password !== password) {

            callback?.({

                ok: false,

                error:
                    "Incorrect room password."

            });

            return;
        }


        addPlayerToRoom(
            socket,
            room
        );


        callback?.({

            ok: true,

            roomCode

        });


        sendRoomUpdate(room);

    });


    /* =====================================================
       READY
       ===================================================== */

    socket.on("setReady", (data) => {

        const room = getRoom(socket);

        if (!room) {
            return;
        }


        const player =
            room.players.get(socket.id);


        if (!player) {
            return;
        }


        player.ready =
            Boolean(data?.ready);


        sendRoomUpdate(room);

    });


    /* =====================================================
       CHARACTER SELECTION
       ===================================================== */

    socket.on("selectCharacter", (data) => {

        const room = getRoom(socket);

        if (!room || room.started) {
            return;
        }


        const player =
            room.players.get(socket.id);


        if (!player) {
            return;
        }


        const character =
            cleanText(
                data?.character,
                30
            );


        const costume =
            cleanText(
                data?.costume,
                30
            );


        if (character) {
            player.character = character;
        }


        if (costume) {
            player.costume = costume;
        }


        sendRoomUpdate(room);

    });


    /* =====================================================
       START GAME
       ===================================================== */

    socket.on("startGame", () => {

        const room = getRoom(socket);

        if (!room) {
            return;
        }


        if (room.host !== socket.id) {

            socket.emit(
                "systemMessage",
                {

                    type: "error",

                    message:
                        "Only the room host can start the game."

                }
            );

            return;
        }


        if (room.started) {
            return;
        }


        if (room.players.size < 1) {
            return;
        }


        room.started = true;


        const playerIds =
            [...room.players.keys()];


        /*
          Random Killer
        */

        const killerIndex =
            Math.floor(
                Math.random() *
                playerIds.length
            );


        room.killerId =
            playerIds[killerIndex];


        for (
            const [
                playerId,
                player
            ] of room.players
        ) {

            player.role =
                playerId === room.killerId
                    ? "killer"
                    : "survivor";


            player.health = 100;

            player.alive = true;

            player.ready = true;

        }


        sendRoomUpdate(room);


        io.to(room.code).emit(
            "gameStarted",
            {

                seed: room.gameSeed,

                killerId:
                    room.killerId,

                roomCode:
                    room.code

            }
        );


        console.log(
            `Game started: ${room.code}`
        );

    });


    /* =====================================================
       PLAYER MOVEMENT
       ===================================================== */

    socket.on("playerState", (data) => {

        const room = getRoom(socket);

        if (!room || !room.started) {
            return;
        }


        const player =
            room.players.get(socket.id);


        if (!player || !player.alive) {
            return;
        }


        const state = {

            x: Number(data?.x) || 0,

            y: Number(data?.y) || 0,

            z: Number(data?.z) || 0,

            rotationY:
                Number(
                    data?.rotationY
                ) || 0,

            health:
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(data?.health) || 100
                    )
                ),

            stamina:
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(data?.stamina) || 100
                    )
                ),

            crouching:
                Boolean(
                    data?.crouching
                ),

            running:
                Boolean(
                    data?.running
                )

        };


        player.state = state;

        player.health =
            state.health;


        socket
            .to(room.code)
            .emit(
                "remotePlayerState",
                {

                    id: socket.id,

                    name: player.name,

                    role: player.role,

                    state

                }
            );

    });


    /* =====================================================
       ITEM COLLECT
       ===================================================== */

    socket.on("collectItem", (data) => {

        const room = getRoom(socket);

        if (!room || !room.started) {
            return;
        }


        const itemId =
            cleanText(
                data?.itemId,
                50
            );


        if (!itemId) {
            return;
        }


        room.collectedItems.add(
            itemId
        );


        io.to(room.code).emit(
            "itemCollected",
            {

                itemId,

                total:
                    room.collectedItems.size

            }
        );


        /*
          10 items collected
        */

        if (
            room.collectedItems.size >= 10
        ) {

            io.to(room.code).emit(
                "escapeUnlocked"
            );

        }

    });


    /* =====================================================
       DAMAGE
       ===================================================== */

    socket.on("damagePlayer", (data) => {

        const room = getRoom(socket);

        if (!room || !room.started) {
            return;
        }


        const targetId =
            cleanText(
                data?.targetId,
                100
            );


        const target =
            room.players.get(targetId);


        if (!target || !target.alive) {
            return;
        }


        /*
          Only killer can damage survivor.
        */

        const attacker =
            room.players.get(
                socket.id
            );


        if (
            !attacker ||
            attacker.role !== "killer"
        ) {

            return;

        }


        const amount =
            Math.max(
                1,
                Math.min(
                    100,
                    Number(data?.amount) || 10
                )
            );


        target.health =
            Math.max(
                0,
                target.health - amount
            );


        if (
            target.health <= 0
        ) {

            target.alive = false;

            io.to(target.id).emit(
                "playerDead"
            );

            io.to(room.code).emit(
                "playerEliminated",
                {

                    playerId:
                        target.id,

                    name:
                        target.name

                }
            );

        }


        io.to(target.id).emit(
            "healthUpdate",
            {

                health:
                    target.health

            }
        );

    });


    /* =====================================================
       ESCAPE
       ===================================================== */

    socket.on("escape", () => {

        const room = getRoom(socket);

        if (!room || !room.started) {
            return;
        }


        if (
            room.collectedItems.size < 10
        ) {

            socket.emit(
                "systemMessage",
                {

                    type: "error",

                    message:
                        "You need all 10 items before escaping."

                }
            );

            return;
        }


        const player =
            room.players.get(socket.id);


        if (!player || !player.alive) {
            return;
        }


        io.to(room.code).emit(
            "playerEscaped",
            {

                id: socket.id,

                name:
                    player.name,

                username:
                    player.username

            }
        );

    });


    /* =====================================================
       LEAVE ROOM
       ===================================================== */

    socket.on("leaveRoom", () => {

        removePlayerFromRoom(
            socket
        );

    });


    /* =====================================================
       DISCONNECT
       ===================================================== */

    socket.on("disconnect", () => {

        console.log(
            "Player disconnected:",
            socket.id
        );


        removePlayerFromRoom(
            socket
        );


        io.emit(
            "onlineCount",
            getOnlineUsers().size
        );

    });


    /* =====================================================
       ONLINE COUNT
       ===================================================== */

    io.emit(
        "onlineCount",
        getOnlineUsers().size
    );

});


/* =========================================================
   ADD PLAYER
   ========================================================= */

function addPlayerToRoom(
    socket,
    room
) {

    const user =
        getUser(socket);


    if (!user) {
        return;
    }


    const player = {

        id: socket.id,

        name: user.name,

        username: user.username,

        ready: false,

        role: "survivor",

        health: 100,

        alive: true,

        character: "default",

        costume: "survivor",

        state: {

            x: 0,

            y: 1.7,

            z: 0,

            rotationY: 0,

            health: 100,

            stamina: 100,

            crouching: false,

            running: false

        }

    };


    room.players.set(
        socket.id,
        player
    );


    socket.join(
        room.code
    );


    socket.data.roomCode =
        room.code;

}


/* =========================================================
   REMOVE PLAYER
   ========================================================= */

function removePlayerFromRoom(
    socket
) {

    const room =
        getRoom(socket);


    if (!room) {
        return;
    }


    room.players.delete(
        socket.id
    );


    socket.leave(
        room.code
    );


    socket.data.roomCode =
        null;


    /*
      If host leaves,
      next player becomes host.
    */

    if (
        room.host === socket.id &&
        room.players.size > 0
    ) {

        room.host =
            [...room.players.keys()][0];

    }


    /*
      Empty room gets deleted.
    */

    if (
        room.players.size === 0
    ) {

        rooms.delete(
            room.code
        );

        return;

    }


    /*
      If game is running and killer leaves,
      end game safely.
    */

    if (
        room.started &&
        room.killerId === socket.id
    ) {

        io.to(room.code).emit(
            "killerLeft"
        );

    }


    sendRoomUpdate(
        room
    );

}


/* =========================================================
   SERVER STATUS
   ========================================================= */

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            game:
                "KILLER 07",

            status:
                "online",

            rooms:
                rooms.size,

            online:
                getOnlineUsers().size,

            maxPlayers:
                9

        });

    }
);


/* =========================================================
   START SERVER
   ========================================================= */

server.listen(
    PORT,
    () => {

        console.log(
            "======================================"
        );

        console.log(
            "       KILLER 07 SERVER ONLINE"
        );

        console.log(
            `       PORT: ${PORT}`
        );

        console.log(
            "       MAX PLAYERS: 9"
        );

        console.log(
            "======================================"

        );

    }
);
