const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

const rooms = {};

const characters = {
    survivors: [
        "Alex",
        "Maya",
        "Ryan",
        "Emma",
        "Noah",
        "Liam",
        "Sofia",
        "Daniel",
        "Ava",
        "Ethan"
    ],

    killers: [
        "The Butcher",
        "The Stalker",
        "The Hunter",
        "The Shadow",
        "The Beast",
        "The Warden",
        "The Phantom",
        "The Watcher"
    ]
};

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

function createCode() {

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

    return rooms[code]
        ? createCode()
        : code;
}

function cleanPlayer(player) {

    return {
        id: player.id,
        name: player.name,
        character: player.character,
        costume: player.costume,
        role: player.role,
        ready: player.ready,
        lives: player.lives,
        downed: player.downed
    };
}

function sendRoom(room) {

    io.to(room.code).emit(
        "room:update",
        {
            code: room.code,
            host: room.host,
            killerMode: room.killerMode,
            killerCount: room.killerCount,
            gameStarted: room.gameStarted,
            players:
                room.players.map(cleanPlayer)
        }
    );
}

function chooseKillers(room) {

    const players =
        room.players;

    players.forEach(player => {

        player.role = "survivor";
        player.lives =
            players.length >= 4 ? 1 : 3;
        player.downed = false;

    });

    let count =
        Math.max(
            1,
            Math.min(
                room.killerCount,
                Math.floor(
                    players.length / 2
                )
            )
        );

    if (
        room.killerMode ===
        "random"
    ) {

        const shuffled =
            [...players]
            .sort(
                () =>
                    Math.random() - 0.5
            );

        for (
            let i = 0;
            i < count;
            i++
        ) {

            shuffled[i].role =
                "killer";

            shuffled[i].character =
                characters.killers[
                    Math.floor(
                        Math.random() *
                        characters.killers.length
                    )
                ];

        }

    } else {

        const selected =
            players
            .filter(
                player =>
                    player.wantsKiller
            );

        for (
            let i = 0;
            i < Math.min(
                count,
                selected.length
            );
            i++
        ) {

            selected[i].role =
                "killer";

        }

    }

    players.forEach(player => {

        if (
            player.role ===
            "survivor"
        ) {

            player.character =
                characters.survivors[
                    Math.floor(
                        Math.random() *
                        characters.survivors.length
                    )
                ];

        }

    });
}

io.on(
    "connection",
    socket => {

        console.log(
            "Player connected:",
            socket.id
        );

        socket.on(
            "createRoom",
            data => {

                const code =
                    createCode();

                const room = {

                    code,

                    host:
                        socket.id,

                    password:
                        String(
                            data.password || ""
                        ),

                    killerMode:
                        data.killerMode ===
                        "choose"
                            ? "choose"
                            : "random",

                    killerCount: 1,

                    gameStarted: false,

                    players: []

                };

                room.players.push({

                    id: socket.id,

                    name:
                        String(
                            data.name ||
                            "Player"
                        )
                        .substring(
                            0,
                            20
                        ),

                    character:
                        "Alex",

                    costume:
                        "Casual",

                    role:
                        "survivor",

                    ready: false,

                    lives: 3,

                    downed: false,

                    wantsKiller: false

                });

                rooms[code] =
                    room;

                socket.join(code);

                socket.data.room =
                    code;

                socket.emit(
                    "roomCreated",
                    {
                        code
                    }
                );

                sendRoom(room);

            }
        );


        socket.on(
            "joinRoom",
            data => {

                const code =
                    String(
                        data.code || ""
                    )
                    .trim()
                    .toUpperCase();

                const password =
                    String(
                        data.password || ""
                    );


                const room =
                    rooms[code];


                if (!room) {

                    socket.emit(
                        "errorMessage",
                        "Room not found."
                    );

                    return;

                }


                if (
                    room.password !==
                    password
                ) {

                    socket.emit(
                        "errorMessage",
                        "Wrong password."
                    );

                    return;

                }


                if (
                    room.players.length >= 9
                ) {

                    socket.emit(
                        "errorMessage",
                        "Room is full."
                    );

                    return;

                }


                room.players.push({

                    id: socket.id,

                    name:
                        String(
                            data.name ||
                            "Player"
                        )
                        .substring(
                            0,
                            20
                        ),

                    character:
                        "Maya",

                    costume:
                        "Detective",

                    role:
                        "survivor",

                    ready: false,

                    lives:
                        room.players.length >= 3
                            ? 1
                            : 3,

                    downed: false,

                    wantsKiller: false

                });


                socket.join(code);

                socket.data.room =
                    code;


                socket.emit(
                    "joinedRoom",
                    {
                        code
                    }
                );


                sendRoom(room);

            }
        );


        socket.on(
            "changeCharacter",
            character => {

                const code =
                    socket.data.room;

                const room =
                    rooms[code];

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
                    player.role ===
                    "killer"
                ) {

                    if (
                        characters.killers
                        .includes(
                            character
                        )
                    ) {

                        player.character =
                            character;

                    }

                } else {

                    if (
                        characters.survivors
                        .includes(
                            character
                        )
                    ) {

                        player.character =
                            character;

                    }

                }

                sendRoom(room);

            }
        );


        socket.on(
            "changeCostume",
            costume => {

                const code =
                    socket.data.room;

                const room =
                    rooms[code];

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

                sendRoom(room);

            }
        );


        socket.on(
            "setKillerCount",
            count => {

                const code =
                    socket.data.room;

                const room =
                    rooms[code];

                if (!room)
                    return;


                if (
                    room.host !==
                    socket.id
                )
                    return;


                count =
                    Number(count);


                if (
                    ![1, 2, 3]
                    .includes(count)
                ) {

                    count = 1;

                }


                room.killerCount =
                    count;

                sendRoom(room);

            }
        );


        socket.on(
            "chooseKiller",
            () => {

                const code =
                    socket.data.room;

                const room =
                    rooms[code];

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


                player.wantsKiller =
                    !player.wantsKiller;


                sendRoom(room);

            }
        );


        socket.on(
            "ready",
            value => {

                const code =
                    socket.data.room;

                const room =
                    rooms[code];

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


                sendRoom(room);

            }
        );


        socket.on(
            "startGame",
            () => {

                const code =
                    socket.data.room;

                const room =
                    rooms[code];

                if (!room)
                    return;


                if (
                    room.host !==
                    socket.id
                )
                    return;


                if (
                    room.players.length < 1
                ) {

                    socket.emit(
                        "errorMessage",
                        "Need at least 1 player."
                    );

                    return;

                }


                chooseKillers(room);

                room.gameStarted =
                    true;


                io.to(code).emit(
                    "gameStarted",
                    {
                        code,
                        players:
                            room.players.map(
                                cleanPlayer
                            )
                    }
                );


                sendRoom(room);

            }
        );


        socket.on(
            "disconnect",
            () => {

                const code =
                    socket.data.room;

                if (!code)
                    return;


                const room =
                    rooms[code];

                if (!room)
                    return;


                room.players =
                    room.players.filter(
                        p =>
                            p.id !==
                            socket.id
                    );


                if (
                    room.players.length === 0
                ) {

                    delete rooms[code];

                    return;

                }


                if (
                    room.host ===
                    socket.id
                ) {

                    room.host =
                        room.players[0].id;

                }


                sendRoom(room);

            }
        );

    }
);


server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Killer Escape 07 server running on port ${PORT}`
        );

    }
);
