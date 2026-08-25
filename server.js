Haan. Main **6 files poore**, bina code chhota kiye, **2-2 files karke** dunga.

**Part 1/3:** `package.json` + `server.js`
**Part 2/3:** `public/index.html` + `public/style.css`
**Part 3/3:** `public/client.js` + `public/game3d.js`

Is version mein **3D horror mansion, multiplayer lobby, room create/join, keys, killer AI, flashlight, health, jumpscare, escape, keyboard + mobile controls** rahenge.

### Part 1 — `package.json`

```json
{
  "name": "killer-escape-07",
  "version": "1.0.0",
  "description": "Killer Escape 07 - Multiplayer 3D Horror Game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "socket.io": "^4.8.1"
  }
}
```

### Part 1 — `server.js`

```javascript
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


/* =========================================================
   GAME DATA
   ========================================================= */

const rooms = new Map();

const characters = [
    "Alex",
    "Maya",
    "Ryan",
    "Emma",
    "Noah",
    "Liam",
    "Sofia",
    "Daniel",
    "Ava"
];

const costumes = [
    "Casual",
    "Detective",
    "Engineer",
    "Medic",
    "Night Survivor",
    "Police",
    "Explorer",
    "Hunter",
    "Masked",
    "Dark"
];


/* =========================================================
   ROOM CODE
   ========================================================= */

function generateRoomCode() {

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    do {

        code = "";

        for (let i = 0; i < 6; i++) {
            code += chars[
                Math.floor(Math.random() * chars.length)
            ];
        }

    } while (rooms.has(code));

    return code;
}


/* =========================================================
   PLAYER DATA
   ========================================================= */

function createPlayer(socket, name) {

    return {

        id: socket.id,

        name:
            String(name || "Player")
                .substring(0, 20),

        character:
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ],

        costume:
            costumes[
                Math.floor(
                    Math.random() *
                    costumes.length
                )
            ],

        role: "survivor",

        ready: false,

        lives: 3,

        health: 100,

        x: 0,

        y: 1,

        z: 8

    };
}


/* =========================================================
   PUBLIC ROOM DATA
   ========================================================= */

function publicRoom(room) {

    return {

        code: room.code,

        killerMode:
            room.killerMode,

        started:
            room.started,

        hostId:
            room.hostId,

        players:
            room.players.map(player => ({

                id:
                    player.id,

                name:
                    player.name,

                character:
                    player.character,

                costume:
                    player.costume,

                role:
                    player.role,

                ready:
                    player.ready,

                lives:
                    player.lives

            }))

    };
}


/* =========================================================
   SEND ROOM UPDATE
   ========================================================= */

function sendRoomUpdate(room) {

    io.to(room.code).emit(
        "room:update",
        publicRoom(room)
    );

}


/* =========================================================
   CREATE ROOM
   ========================================================= */

io.on("connection", socket => {

    console.log(
        "Connected:",
        socket.id
    );


    socket.on(
        "createRoom",
        data => {

            const name =
                data &&
                data.name
                    ? data.name
                    : "Player";

            const password =
                data &&
                data.password
                    ? String(data.password)
                    : "";

            if (!password) {

                socket.emit(
                    "errorMessage",
                    "Room password required"
                );

                return;
            }


            const code =
                generateRoomCode();


            const player =
                createPlayer(
                    socket,
                    name
                );


            const room = {

                code,

                password,

                hostId:
                    socket.id,

                killerMode:
                    data.killerMode === "choose"
                        ? "choose"
                        : "random",

                started: false,

                players: [
                    player
                ]

            };


            rooms.set(
                code,
                room
            );


            socket.join(code);

            socket.data.roomCode =
                code;


            socket.emit(
                "roomCreated",
                {
                    code
                }
            );


            sendRoomUpdate(room);

        }
    );


    /* =====================================================
       JOIN ROOM
       ===================================================== */

    socket.on(
        "joinRoom",
        data => {

            const code =
                String(
                    data &&
                    data.code
                        ? data.code
                        : ""
                )
                    .trim()
                    .toUpperCase();


            const password =
                data &&
                data.password
                    ? String(data.password)
                    : "";


            const room =
                rooms.get(code);


            if (!room) {

                socket.emit(
                    "errorMessage",
                    "Room not found"
                );

                return;
            }


            if (room.started) {

                socket.emit(
                    "errorMessage",
                    "Game already started"
                );

                return;
            }


            if (room.password !== password) {

                socket.emit(
                    "errorMessage",
                    "Wrong password"
                );

                return;
            }


            if (room.players.length >= 9) {

                socket.emit(
                    "errorMessage",
                    "Room is full"
                );

                return;
            }


            const player =
                createPlayer(
                    socket,
                    data.name
                );


            room.players.push(
                player
            );


            socket.join(code);

            socket.data.roomCode =
                code;


            socket.emit(
                "joinedRoom",
                {
                    code
                }
            );


            sendRoomUpdate(room);

        }
    );


    /* =====================================================
       CHARACTER
       ===================================================== */

    socket.on(
        "changeCharacter",
        character => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            const player =
                room.players.find(
                    p =>
                        p.id ===
                        socket.id
                );

            if (!player)
                return;


            if (
                characters.includes(
                    character
                )
            ) {

                player.character =
                    character;

            }


            sendRoomUpdate(room);

        }
    );


    /* =====================================================
       COSTUME
       ===================================================== */

    socket.on(
        "changeCostume",
        costume => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            const player =
                room.players.find(
                    p =>
                        p.id ===
                        socket.id
                );

            if (!player)
                return;


            if (
                costumes.includes(
                    costume
                )
            ) {

                player.costume =
                    costume;

            }


            sendRoomUpdate(room);

        }
    );


    /* =====================================================
       READY
       ===================================================== */

    socket.on(
        "ready",
        value => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            const player =
                room.players.find(
                    p =>
                        p.id ===
                        socket.id
                );

            if (!player)
                return;


            player.ready =
                Boolean(value);


            sendRoomUpdate(room);

        }
    );


    /* =====================================================
       CHOOSE KILLER
       ===================================================== */

    socket.on(
        "chooseKiller",
        () => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            if (
                room.killerMode !==
                "choose"
            ) {

                socket.emit(
                    "errorMessage",
                    "Killer mode is RANDOM"
                );

                return;
            }


            room.players.forEach(
                player => {

                    player.role =
                        player.id ===
                        socket.id
                            ? "killer"
                            : "survivor";

                }
            );


            sendRoomUpdate(room);

        }
    );


    /* =====================================================
       START GAME
       ===================================================== */

    socket.on(
        "startGame",
        () => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            if (
                room.hostId !==
                socket.id
            ) {

                socket.emit(
                    "errorMessage",
                    "Only the room host can start"
                );

                return;
            }


            if (room.started) {
                return;
            }


            if (
                room.players.length === 0
            ) {

                socket.emit(
                    "errorMessage",
                    "No players"
                );

                return;
            }


            /* RANDOM KILLER */

            if (
                room.killerMode ===
                "random"
            ) {

                const randomIndex =
                    Math.floor(
                        Math.random() *
                        room.players.length
                    );


                room.players.forEach(
                    (player, index) => {

                        player.role =
                            index ===
                            randomIndex
                                ? "killer"
                                : "survivor";

                    }
                );

            }


            room.started =
                true;


            room.players.forEach(
                player => {

                    player.health =
                        100;

                    player.lives =
                        3;

                    player.x =
                        player.role === "killer"
                            ? 0
                            : 0;

                    player.y = 1;

                    player.z =
                        player.role === "killer"
                            ? -12
                            : 8;

                }
            );


            io.to(room.code).emit(
                "gameStarted",
                {
                    code:
                        room.code,

                    players:
                        room.players.map(
                            player => ({
                                id:
                                    player.id,

                                name:
                                    player.name,

                                character:
                                    player.character,

                                costume:
                                    player.costume,

                                role:
                                    player.role,

                                lives:
                                    player.lives,

                                x:
                                    player.x,

                                y:
                                    player.y,

                                z:
                                    player.z

                            })
                        )
                }
            );

        }
    );


    /* =====================================================
       PLAYER POSITION
       ===================================================== */

    socket.on(
        "playerMove",
        data => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;

            if (!room.started)
                return;


            const player =
                room.players.find(
                    p =>
                        p.id ===
                        socket.id
                );

            if (!player)
                return;


            if (
                typeof data.x ===
                "number"
            ) {

                player.x =
                    data.x;

            }


            if (
                typeof data.y ===
                "number"
            ) {

                player.y =
                    data.y;

            }


            if (
                typeof data.z ===
                "number"
            ) {

                player.z =
                    data.z;

            }


            socket.to(room.code).emit(
                "playerMove",
                {
                    id:
                        socket.id,

                    x:
                        player.x,

                    y:
                        player.y,

                    z:
                        player.z
                }
            );

        }
    );


    /* =====================================================
       ESCAPE
       ===================================================== */

    socket.on(
        "playerEscaped",
        () => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            const player =
                room.players.find(
                    p =>
                        p.id ===
                        socket.id
                );

            if (!player)
                return;


            io.to(room.code).emit(
                "playerEscaped",
                {
                    id:
                        player.id,

                    name:
                        player.name
                }
            );

        }
    );


    /* =====================================================
       DISCONNECT
       ===================================================== */

    socket.on(
        "disconnect",
        () => {

            const room =
                getPlayerRoom(socket);

            if (!room)
                return;


            room.players =
                room.players.filter(
                    player =>
                        player.id !==
                        socket.id
                );


            if (
                room.players.length ===
                0
            ) {

                rooms.delete(
                    room.code
                );

                return;
            }


            if (
                room.hostId ===
                socket.id
            ) {

                room.hostId =
                    room.players[0].id;

            }


            sendRoomUpdate(room);

        }
    );

});


/* =========================================================
   GET PLAYER ROOM
   ========================================================= */

function getPlayerRoom(socket) {

    const code =
        socket.data.roomCode;

    if (!code)
        return null;


    return rooms.get(code) || null;

}


/* =========================================================
   SERVER
   ========================================================= */

server.listen(
    PORT,
    () => {

        console.log(
            `Killer Escape 07 running on port ${PORT}`
        );

    }
);
```
