import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));


// ================================
// ROOMS
// ================================

const rooms = new Map();


// ================================
// ROOM CODE
// ================================

function createRoomCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code += chars[
            Math.floor(
                Math.random() * chars.length
            )
        ];

    }

    return code;
}


// ================================
// PLAYER DATA
// ================================

function getRoom(socket) {

    for (const room of rooms.values()) {

        if (room.players.has(socket.id)) {

            return room;

        }

    }

    return null;

}


// ================================
// SEND ROOM DATA
// ================================

function sendRoom(room) {

    const players =
        [...room.players.values()]
        .map(player => {

            return {
                id: player.id,
                name: player.name,
                character: player.character,
                role: player.role,
                ready: player.ready
            };

        });


    io.to(room.code).emit(
        "room:update",
        {
            code: room.code,
            host: room.host,
            killerMode: room.killerMode,
            players: players
        }
    );

}


// ================================
// CONNECTION
// ================================

io.on(
    "connection",
    socket => {

        console.log(
            "Player connected:",
            socket.id
        );


        // ==========================
        // CREATE ROOM
        // ==========================

        socket.on(
            "createRoom",
            data => {

                let code;

                do {

                    code =
                        createRoomCode();

                } while (
                    rooms.has(code)
                );


                const room = {

                    code: code,

                    password:
                        data.password,

                    host:
                        socket.id,

                    killerMode:
                        data.killerMode ||
                        "random",

                    players:
                        new Map(),

                    started: false

                };


                room.players.set(
                    socket.id,
                    {

                        id:
                            socket.id,

                        name:
                            data.name ||
                            "Player",

                        character:
                            "Scout",

                        role:
                            "survivor",

                        ready:
                            false

                    }
                );


                rooms.set(
                    code,
                    room
                );


                socket.join(code);


                socket.emit(
                    "roomCreated",
                    {
                        code: code
                    }
                );


                sendRoom(room);


                console.log(
                    "Room created:",
                    code
                );

            }
        );


        // ==========================
        // JOIN ROOM
        // ==========================

        socket.on(
            "joinRoom",
            data => {

                const code =
                    String(
                        data.code ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                const room =
                    rooms.get(code);


                if (!room) {

                    socket.emit(
                        "errorMessage",
                        "Room not found."
                    );

                    return;

                }


                if (
                    room.password !==
                    data.password
                ) {

                    socket.emit(
                        "errorMessage",
                        "Wrong password."
                    );

                    return;

                }


                if (
                    room.players.size >= 9
                ) {

                    socket.emit(
                        "errorMessage",
                        "Room is full. Maximum 9 players."
                    );

                    return;

                }


                if (room.started) {

                    socket.emit(
                        "errorMessage",
                        "Game already started."
                    );

                    return;

                }


                room.players.set(
                    socket.id,
                    {

                        id:
                            socket.id,

                        name:
                            data.name ||
                            "Player",

                        character:
                            "Scout",

                        role:
                            "survivor",

                        ready:
                            false

                    }
                );


                socket.join(code);


                socket.emit(
                    "joinedRoom",
                    {
                        code: code
                    }
                );


                sendRoom(room);

            }
        );


        // ==========================
        // CHANGE CHARACTER
        // ==========================

        socket.on(
            "changeCharacter",
            character => {

                const room =
                    getRoom(socket);

                if (!room)
                    return;


                const player =
                    room.players.get(
                        socket.id
                    );

                if (!player)
                    return;


                const characters = [

                    "Scout",

                    "Medic",

                    "Engineer",

                    "Tracker"

                ];


                if (
                    characters.includes(
                        character
                    )
                ) {

                    player.character =
                        character;

                }


                sendRoom(room);

            }
        );


        // ==========================
        // READY
        // ==========================

        socket.on(
            "ready",
            value => {

                const room =
                    getRoom(socket);

                if (!room)
                    return;


                const player =
                    room.players.get(
                        socket.id
                    );

                if (!player)
                    return;


                player.ready =
                    Boolean(value);


                sendRoom(room);

            }
        );


        // ==========================
        // KILLER REQUEST
        // ==========================

        socket.on(
            "chooseKiller",
            () => {

                const room =
                    getRoom(socket);

                if (!room)
                    return;


                if (
                    room.killerMode !==
                    "choose"
                ) {

                    socket.emit(
                        "errorMessage",
                        "Killer mode is Random."
                    );

                    return;

                }


                for (
                    const player
                    of room.players.values()
                ) {

                    player.role =
                        "survivor";

                }


                const player =
                    room.players.get(
                        socket.id
                    );


                if (player) {

                    player.role =
                        "killer";

                }


                sendRoom(room);

            }
        );


        // ==========================
        // START GAME
        // ==========================

        socket.on(
            "startGame",
            () => {

                const room =
                    getRoom(socket);

                if (!room)
                    return;


                if (
                    room.host !==
                    socket.id
                ) {

                    socket.emit(
                        "errorMessage",
                        "Only host can start."
                    );

                    return;

                }


                if (
                    room.players.size < 1 ||
                    room.players.size > 9
                ) {

                    return;

                }


                const players =
                    [...room.players.values()];


                let killer = null;


                // RANDOM KILLER
                if (
                    room.killerMode ===
                    "random"
                ) {

                    const index =
                        Math.floor(
                            Math.random() *
                            players.length
                        );


                    killer =
                        players[index];

                }


                // MANUAL KILLER
                else {

                    killer =
                        players.find(
                            player =>
                                player.role ===
                                "killer"
                        );

                }


                // No killer
                if (!killer) {

                    socket.emit(
                        "errorMessage",
                        "Select a killer first."
                    );

                    return;

                }


                for (
                    const player
                    of players
                ) {

                    if (
                        player.id ===
                        killer.id
                    ) {

                        player.role =
                            "killer";

                    }

                    else {

                        player.role =
                            "survivor";

                    }

                }


                room.started =
                    true;


                io.to(room.code).emit(
                    "gameStarted",
                    {
                        players:
                            players
                    }
                );


                console.log(
                    "Game started:",
                    room.code
                );

            }
        );


        // ==========================
        // DISCONNECT
        // ==========================

        socket.on(
            "disconnect",
            () => {

                const room =
                    getRoom(socket);

                if (!room)
                    return;


                room.players.delete(
                    socket.id
                );


                if (
                    room.players.size ===
                    0
                ) {

                    rooms.delete(
                        room.code
                    );

                    return;

                }


                if (
                    room.host ===
                    socket.id
                ) {

                    const firstPlayer =
                        room.players
                        .values()
                        .next()
                        .value;


                    if (firstPlayer) {

                        room.host =
                            firstPlayer.id;

                    }

                }


                sendRoom(room);

            }
        );

    }
);


// ================================
// HEALTH CHECK
// ================================

app.get(
    "/health",
    (req, res) => {

        res.json({

            game:
                "Killer Escape 07",

            online:
                true,

            rooms:
                rooms.size

        });

    }
);


// ================================
// START SERVER
// ================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Killer Escape 07 server running on port ${PORT}`
        );

    }
);
