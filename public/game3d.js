/* ============================================================
   KILLER 07
   game3d.js - PART 1/2

   3D HORROR ESCAPE ENGINE

   PART 1 FEATURES:
   - Three.js scene
   - 3D mansion
   - Rooms
   - Hallways
   - Basement entrance
   - Library
   - Bedroom
   - Dining room
   - Storage
   - Game room
   - Secret room
   - Exit hall
   - Walls
   - Floor
   - Ceiling
   - Furniture
   - Horror lighting
   - Fog
   - Player
   - First-person camera
   - Collision system
   - Gravity
   - PC movement
   - Mouse look
   - Flashlight base
   - Performance optimization

   PART 2 WILL ADD:
   - Mobile joystick
   - Mobile camera
   - Sprint
   - Stamina
   - Crouch
   - Jump button
   - Health
   - 10 required items
   - Item interaction
   - Objective HUD
   - Exit system
   - Horror effects
   - Game API
============================================================ */

"use strict";

(() => {

    /* ========================================================
       THREE CHECK
    ======================================================== */

    if (!window.THREE) {

        console.error(
            "KILLER 07 ERROR: Three.js not loaded."
        );

        return;

    }

    const THREE = window.THREE;


    /* ========================================================
       CONFIG
    ======================================================== */

    const CONFIG = {

        playerHeight: 1.72,

        crouchHeight: 1.05,

        playerRadius: 0.30,

        walkSpeed: 3.0,

        runSpeed: 5.7,

        crouchSpeed: 1.45,

        jumpPower: 5.8,

        gravity: 17.0,

        mansionWidth: 42,

        mansionDepth: 34,

        wallHeight: 4.4,

        wallThickness: 0.35,

        maxHealth: 100,

        maxStamina: 100,

        staminaDrain: 27,

        staminaRecover: 20,

        interactDistance: 2.3,

        flashlightDistance: 18,

        maxPixelRatio: 1.5,

        itemCount: 10

    };


    /* ========================================================
       GAME STATE
    ======================================================== */

    const GAME = {

        initialized: false,

        running: false,

        paused: false,

        scene: null,

        camera: null,

        renderer: null,

        clock: null,

        player: null,

        playerVelocity:
            new THREE.Vector3(),

        playerOnGround: false,

        playerCrouching: false,

        playerRunning: false,

        stamina:
            CONFIG.maxStamina,

        health:
            CONFIG.maxHealth,

        flashlightOn: true,

        flashlight: null,

        flashlightTarget: null,

        ambientLight: null,

        objects: [],

        colliders: [],

        interactables: [],

        items: [],

        collectedItems: [],

        exitDoor: null,

        exitCollider: null,

        keys: {

            forward: false,

            backward: false,

            left: false,

            right: false,

            sprint: false,

            crouch: false,

            jump: false

        },

        mouse: {

            active: false,

            sensitivity: 0.0022,

            yaw: 0,

            pitch: 0

        },

        mobile: {

            active: false,

            joystickActive: false,

            joystickX: 0,

            joystickY: 0,

            lookActive: false,

            lookX: 0,

            lookY: 0

        },

        lastFrame: 0,

        fps: 60

    };


    /* ========================================================
       DOM
    ======================================================== */

    let gameContainer = null;


    function getGameContainer() {

        let container =
            document.getElementById(
                "gameContainer"
            );

        if (!container) {

            container =
                document.getElementById(
                    "gameScreen"
                );

        }

        if (!container) {

            container =
                document.body;

        }

        return container;

    }


    /* ========================================================
       UTILITY
    ======================================================== */

    function clamp(
        value,
        min,
        max
    ) {

        return Math.max(
            min,
            Math.min(max, value)
        );

    }


    function lerp(
        a,
        b,
        t
    ) {

        return a +
            (b - a) * t;

    }


    function randomRange(
        min,
        max
    ) {

        return min +
            Math.random() *
            (max - min);

    }


    /* ========================================================
       MATERIALS
    ======================================================== */

    const MATERIALS = {

        floor:
            new THREE.MeshStandardMaterial({

                color: 0x242323,

                roughness: 0.88,

                metalness: 0.05

            }),

        floorWood:
            new THREE.MeshStandardMaterial({

                color: 0x3a2822,

                roughness: 0.92,

                metalness: 0.02

            }),

        wall:
            new THREE.MeshStandardMaterial({

                color: 0x282828,

                roughness: 0.95,

                metalness: 0.0

            }),

        wallDark:
            new THREE.MeshStandardMaterial({

                color: 0x171717,

                roughness: 1.0,

                metalness: 0

            }),

        ceiling:
            new THREE.MeshStandardMaterial({

                color: 0x111111,

                roughness: 1

            }),

        wood:
            new THREE.MeshStandardMaterial({

                color: 0x3a2119,

                roughness: 0.82

            }),

        woodDark:
            new THREE.MeshStandardMaterial({

                color: 0x1b100c,

                roughness: 0.9

            }),

        metal:
            new THREE.MeshStandardMaterial({

                color: 0x282828,

                roughness: 0.55,

                metalness: 0.65

            }),

        red:
            new THREE.MeshStandardMaterial({

                color: 0x370808,

                roughness: 0.8

            }),

        cloth:
            new THREE.MeshStandardMaterial({

                color: 0x292929,

                roughness: 1

            }),

        glass:
            new THREE.MeshStandardMaterial({

                color: 0x111820,

                roughness: 0.2,

                metalness: 0.15,

                transparent: true,

                opacity: 0.32

            })

    };


    /* ========================================================
       CREATE SCENE
    ======================================================== */

    function createScene() {

        GAME.scene =
            new THREE.Scene();


        GAME.scene.background =
            new THREE.Color(
                0x020203
            );


        GAME.scene.fog =
            new THREE.FogExp2(
                0x050506,
                0.045
            );

    }


    /* ========================================================
       CAMERA
    ======================================================== */

    function createCamera() {

        GAME.camera =
            new THREE.PerspectiveCamera(
                70,
                window.innerWidth /
                window.innerHeight,
                0.05,
                100
            );


        GAME.camera.position.set(
            0,
            CONFIG.playerHeight,
            12
        );


        GAME.camera.rotation.order =
            "YXZ";

    }


    /* ========================================================
       RENDERER
    ======================================================== */

    function createRenderer() {

        GAME.renderer =
            new THREE.WebGLRenderer({

                antialias: false,

                powerPreference:
                    "high-performance",

                alpha: false

            });


        GAME.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                CONFIG.maxPixelRatio
            )
        );


        GAME.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        GAME.renderer.shadowMap.enabled =
            false;


        GAME.renderer.outputColorSpace =
            THREE.SRGBColorSpace;


        GAME.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;


        GAME.renderer.toneMappingExposure =
            0.72;


        GAME.renderer.domElement.style.width =
            "100%";


        GAME.renderer.domElement.style.height =
            "100%";


        GAME.renderer.domElement.style.display =
            "block";


        gameContainer.appendChild(
            GAME.renderer.domElement
        );

    }


    /* ========================================================
       LIGHTING
    ======================================================== */

    function createLighting() {

        GAME.ambientLight =
            new THREE.AmbientLight(
                0x6b6b7d,
                0.16
            );


        GAME.scene.add(
            GAME.ambientLight
        );


        const moon =
            new THREE.DirectionalLight(
                0x8a91b8,
                0.22
            );


        moon.position.set(
            -10,
            18,
            8
        );


        GAME.scene.add(
            moon
        );


        /* Red horror lights */

        createPointLight(
            -12,
            2.7,
            -8,
            0x9b1010,
            1.5,
            7
        );


        createPointLight(
            13,
            2.5,
            8,
            0x661010,
            1.3,
            6
        );


        createPointLight(
            0,
            2.7,
            -12,
            0x202a42,
            1.0,
            7
        );


        createPointLight(
            15,
            2.6,
            -12,
            0x421010,
            1.1,
            6
        );

    }


    function createPointLight(
        x,
        y,
        z,
        color,
        intensity,
        distance
    ) {

        const light =
            new THREE.PointLight(
                color,
                intensity,
                distance
            );


        light.position.set(
            x,
            y,
            z
        );


        GAME.scene.add(
            light
        );


        return light;

    }


    /* ========================================================
       FLASHLIGHT
    ======================================================== */

    function createFlashlight() {

        GAME.flashlight =
            new THREE.SpotLight(
                0xfff5dc,
                5.0,
                CONFIG.flashlightDistance,
                Math.PI / 8,
                0.55,
                1.2
            );


        GAME.flashlight.position.set(
            0.18,
            -0.12,
            -0.35
        );


        GAME.flashlightTarget =
            new THREE.Object3D();


        GAME.flashlightTarget.position.set(
            0,
            0,
            -10
        );


        GAME.camera.add(
            GAME.flashlight
        );


        GAME.camera.add(
            GAME.flashlightTarget
        );


        GAME.flashlight.target =
            GAME.flashlightTarget;


        GAME.scene.add(
            GAME.camera
        );

    }


    /* ========================================================
       GEOMETRY HELPER
    ======================================================== */

    function box(
        width,
        height,
        depth,
        material,
        x,
        y,
        z,
        collider = false
    ) {

        const geometry =
            new THREE.BoxGeometry(
                width,
                height,
                depth
            );


        const mesh =
            new THREE.Mesh(
                geometry,
                material
            );


        mesh.position.set(
            x,
            y,
            z
        );


        GAME.scene.add(
            mesh
        );


        GAME.objects.push(
            mesh
        );


        if (collider) {

            GAME.colliders.push({

                minX:
                    x -
                    width / 2,

                maxX:
                    x +
                    width / 2,

                minY:
                    y -
                    height / 2,

                maxY:
                    y +
                    height / 2,

                minZ:
                    z -
                    depth / 2,

                maxZ:
                    z +
                    depth / 2

            });

        }


        return mesh;

    }


    /* ========================================================
       FLOOR
    ======================================================== */

    function createFloor() {

        box(

            CONFIG.mansionWidth,

            0.25,

            CONFIG.mansionDepth,

            MATERIALS.floorWood,

            0,

            -0.125,

            0,

            true

        );

    }


    /* ========================================================
       CEILING
    ======================================================== */

    function createCeiling() {

        box(

            CONFIG.mansionWidth,

            0.25,

            CONFIG.mansionDepth,

            MATERIALS.ceiling,

            0,

            CONFIG.wallHeight,

            0,

            false

        );

    }


    /* ========================================================
       OUTER WALLS
    ======================================================== */

    function createOuterWalls() {

        const w =
            CONFIG.mansionWidth;

        const d =
            CONFIG.mansionDepth;

        const h =
            CONFIG.wallHeight;

        const t =
            CONFIG.wallThickness;


        /* North */

        box(
            w,
            h,
            t,
            MATERIALS.wallDark,
            0,
            h / 2,
            -d / 2,
            true
        );


        /* South with entrance gap */

        box(
            17,
            h,
            t,
            MATERIALS.wall,
            -12.5,
            h / 2,
            d / 2,
            true
        );


        box(
            17,
            h,
            t,
            MATERIALS.wall,
            12.5,
            h / 2,
            d / 2,
            true
        );


        /* East */

        box(
            t,
            h,
            d,
            MATERIALS.wallDark,
            w / 2,
            h / 2,
            0,
            true
        );


        /* West */

        box(
            t,
            h,
            d,
            MATERIALS.wallDark,
            -w / 2,
            h / 2,
            0,
            true
        );

    }


    /* ========================================================
       INTERIOR WALL
    ======================================================== */

    function wall(
        x,
        z,
        width,
        depth = 0.35,
        height = CONFIG.wallHeight
    ) {

        return box(

            width,

            height,

            depth,

            MATERIALS.wall,

            x,

            height / 2,

            z,

            true

        );

    }


    /* ========================================================
       MANSION FLOOR PLAN
    ======================================================== */

    function createInteriorWalls() {

        /*
            MANSION MAP

             NORTH
        ┌───────────────┐
        │ LIB │ SECRET  │
        │─────┼─────────│
        │ BED │ HALL    │
        │─────┼────┬────│
        │GAME │ DIN│STOR│
        │─────┴────┴────│
        │     ENTRY     │
        └───────────────┘
             SOUTH
        */


        /* Main horizontal divider */

        wall(
            0,
            -5,
            42,
            0.35
        );


        /* Left bedroom/library section */

        wall(
            -8,
            -5,
            0.35,
            15
        );


        /* Right secret section */

        wall(
            9,
            -5,
            0.35,
            15
        );


        /* Bottom game room */

        wall(
            -10,
            6,
            0.35,
            10
        );


        /* Dining room divider */

        wall(
            3,
            6,
            0.35,
            10
        );


        /* Storage divider */

        wall(
            10,
            6,
            0.35,
            7
        );


        /* Library divider */

        wall(
            -9,
            -13,
            18,
            0.35
        );


        /* Bedroom divider */

        wall(
            -9,
            -7,
            18,
            0.35
        );


        /* Secret room */

        wall(
            9,
            -13,
            15,
            0.35
        );


        /* Small hallway walls */

        wall(
            -15,
            -5,
            0.35,
            8
        );


        wall(
            15,
            -5,
            0.35,
            8
        );

    }


    /* ========================================================
       TABLE
    ======================================================== */

    function createTable(
        x,
        y,
        z,
        scale = 1
    ) {

        box(
            2.4 * scale,
            0.18 * scale,
            1.3 * scale,
            MATERIALS.wood,
            x,
            y + 0.8 * scale,
            z,
            true
        );


        const legPositions = [

            [-0.9, -0.45],

            [0.9, -0.45],

            [-0.9, 0.45],

            [0.9, 0.45]

        ];


        legPositions.forEach(
            position => {

                box(

                    0.15 * scale,

                    0.8 * scale,

                    0.15 * scale,

                    MATERIALS.woodDark,

                    x +
                    position[0] *
                    scale,

                    y +
                    0.4 * scale,

                    z +
                    position[1] *
                    scale,

                    true

                );

            }
        );

    }


    /* ========================================================
       CHAIR
    ======================================================== */

    function createChair(
        x,
        z,
        rotation = 0
    ) {

        const group =
            new THREE.Group();


        const seat =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.65,
                    0.12,
                    0.65
                ),
                MATERIALS.wood
            );


        seat.position.y =
            0.55;


        group.add(
            seat
        );


        const back =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.65,
                    0.9,
                    0.12
                ),
                MATERIALS.woodDark
            );


        back.position.set(
            0,
            1.0,
            0.28
        );


        group.add(
            back
        );


        group.position.set(
            x,
            0,
            z
        );


        group.rotation.y =
            rotation;


        GAME.scene.add(
            group
        );


        GAME.objects.push(
            group
        );

    }


    /* ========================================================
       BED
    ======================================================== */

    function createBed(
        x,
        z
    ) {

        box(
            3.0,
            0.55,
            5.0,
            MATERIALS.woodDark,
            x,
            0.3,
            z,
            true
        );


        box(
            2.75,
            0.35,
            4.7,
            MATERIALS.cloth,
            x,
            0.72,
            z,
            false
        );


        box(
            2.8,
            1.2,
            0.3,
            MATERIALS.wood,
            x,
            1.0,
            z - 2.25,
            true
        );


        box(
            2.5,
            0.32,
            1.0,
            MATERIALS.cloth,
            x,
            0.95,
            z + 1.45,
            false
        );

    }


    /* ========================================================
       BOOKCASE
    ======================================================== */

    function createBookcase(
        x,
        z
    ) {

        box(
            2.8,
            3.1,
            0.45,
            MATERIALS.woodDark,
            x,
            1.55,
            z,
            true
        );


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const colors = [

                0x512121,

                0x242d3c,

                0x4a3b22,

                0x31234d

            ];


            for (
                let j = 0;
                j < 5;
                j++
            ) {

                const material =
                    new THREE.MeshStandardMaterial({

                        color:
                            colors[
                                (
                                    i +
                                    j
                                ) %
                                colors.length
                            ],

                        roughness:
                            0.9

                    });


                const book =
                    new THREE.Mesh(

                        new THREE.BoxGeometry(
                            0.25,
                            0.65,
                            0.28
                        ),

                        material

                    );


                book.position.set(

                    x -
                    1.05 +
                    j * 0.5,

                    0.55 +
                    i * 0.65,

                    z -
                    0.27

                );


                GAME.scene.add(
                    book
                );

            }

        }

    }


    /* ========================================================
       SOFA
    ======================================================== */

    function createSofa(
        x,
        z,
        rotation = 0
    ) {

        const group =
            new THREE.Group();


        const seat =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3.2,
                    0.65,
                    1.15
                ),
                MATERIALS.cloth
            );


        seat.position.y =
            0.65;


        group.add(
            seat
        );


        const back =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3.2,
                    1.45,
                    0.35
                ),
                MATERIALS.cloth
            );


        back.position.set(
            0,
            1.25,
            0.4
        );


        group.add(
            back
        );


        group.position.set(
            x,
            0,
            z
        );


        group.rotation.y =
            rotation;


        GAME.scene.add(
            group
        );


        GAME.objects.push(
            group
        );

    }


    /* ========================================================
       CABINET
    ======================================================== */

    function createCabinet(
        x,
        z
    ) {

        box(
            1.8,
            2.4,
            0.7,
            MATERIALS.woodDark,
            x,
            1.2,
            z,
            true
        );


        for (
            let i = 0;
            i < 2;
            i++
        ) {

            box(

                0.08,

                0.35,

                0.08,

                MATERIALS.metal,

                x -
                0.15,

                1.55 -
                i * 0.8,

                z -
                0.38,

                false

            );

        }

    }


    /* ========================================================
       DECORATION
    ======================================================== */

    function createMansionFurniture() {

        /* Dining */

        createTable(
            0,
            0,
            8,
            1.15
        );


        createChair(
            -2.2,
            8,
            Math.PI / 2
        );


        createChair(
            2.2,
            8,
            -Math.PI / 2
        );


        createChair(
            0,
            6.2,
            0
        );


        createChair(
            0,
            9.8,
            Math.PI
        );


        /* Bedroom */

        createBed(
            -14,
            -10
        );


        createCabinet(
            -17,
            -14
        );


        /* Library */

        createBookcase(
            -15,
            -16
        );


        createBookcase(
            -10,
            -16
        );


        createBookcase(
            -5,
            -16
        );


        createTable(
            -10,
            0,
            -10,
            0.8
        );


        /* Game room */

        createSofa(
            -15,
            9,
            0
        );


        createSofa(
            -12,
            12,
            Math.PI / 2
        );


        /* Storage */

        createCabinet(
            15,
            8
        );


        createCabinet(
            15,
            13
        );


        /* Secret room */

        createTable(
            14,
            0,
            -10,
            0.7
        );


        createCabinet(
            17,
            -14
        );

    }


    /* ========================================================
       WINDOWS
    ======================================================== */

    function createWindow(
        x,
        y,
        z,
        rotation = 0
    ) {

        const frameMaterial =
            MATERIALS.woodDark;


        const glass =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.2,
                    1.8,
                    0.06
                ),
                MATERIALS.glass
            );


        glass.position.set(
            x,
            y,
            z
        );


        glass.rotation.y =
            rotation;


        GAME.scene.add(
            glass
        );


        const frameTop =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.4,
                    0.12,
                    0.12
                ),
                frameMaterial
            );


        frameTop.position.set(
            x,
            y + 0.95,
            z
        );


        frameTop.rotation.y =
            rotation;


        GAME.scene.add(
            frameTop
        );


        const frameBottom =
            frameTop.clone();


        frameBottom.position.y =
            y - 0.95;


        GAME.scene.add(
            frameBottom
        );

    }


    /* ========================================================
       WINDOWS SET
    ======================================================== */

    function createWindows() {

        createWindow(
            -18,
            2.2,
            -17,
            0
        );


        createWindow(
            -7,
            2.2,
            -17,
            0
        );


        createWindow(
            7,
            2.2,
            -17,
            0
        );


        createWindow(
            18,
            2.2,
            -8,
            Math.PI / 2
        );


        createWindow(
            18,
            2.2,
            8,
            Math.PI / 2
        );


        createWindow(
            -18,
            2.2,
            8,
            Math.PI / 2
        );

    }


    /* ========================================================
       WALL TORCH
    ======================================================== */

    function createWallTorch(
        x,
        y,
        z,
        color
    ) {

        const holder =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.06,
                    0.08,
                    0.45,
                    8
                ),

                MATERIALS.metal

            );


        holder.rotation.z =
            Math.PI / 2;


        holder.position.set(
            x,
            y,
            z
        );


        GAME.scene.add(
            holder
        );


        const light =
            new THREE.PointLight(
                color,
                0.65,
                4.2
            );


        light.position.set(
            x,
            y + 0.25,
            z
        );


        GAME.scene.add(
            light
        );

    }


    /* ========================================================
       WALL TORCHES
    ======================================================== */

    function createTorches() {

        createWallTorch(
            -20,
            2.5,
            -6,
            0xff521c
        );


        createWallTorch(
            -20,
            2.5,
            7,
            0xff4217
        );


        createWallTorch(
            20,
            2.5,
            -6,
            0xff4217
        );


        createWallTorch(
            20,
            2.5,
            7,
            0xff4217
        );


        createWallTorch(
            0,
            2.5,
            -16,
            0xff2c1b
        );

    }


    /* ========================================================
       EXIT DOOR
    ======================================================== */

    function createExitDoor() {

        const group =
            new THREE.Group();


        const frame =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    4.2,
                    4.1,
                    0.4
                ),

                MATERIALS.woodDark

            );


        group.add(
            frame
        );


        const door =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    2.7,
                    3.5,
                    0.22
                ),

                MATERIALS.red

            );


        door.position.z =
            -0.25;


        door.position.y =
            1.75;


        group.add(
            door
        );


        const handle =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.08,
                    8,
                    8
                ),

                MATERIALS.metal

            );


        handle.position.set(
            0.9,
            1.7,
            -0.42
        );


        group.add(
            handle
        );


        group.position.set(
            0,
            0,
            16.65
        );


        GAME.scene.add(
            group
        );


        GAME.exitDoor =
            group;


        GAME.exitCollider = {

            minX: -2.2,

            maxX: 2.2,

            minY: 0,

            maxY: 4.2,

            minZ: 16.1,

            maxZ: 17.2

        };


        GAME.interactables.push({

            type: "exit",

            object: group,

            radius: 3.0,

            unlocked: false

        });

    }


    /* ========================================================
       MANSION
    ======================================================== */

    function createMansion() {

        createFloor();

        createCeiling();

        createOuterWalls();

        createInteriorWalls();

        createMansionFurniture();

        createWindows();

        createTorches();

        createExitDoor();

    }


    /* ========================================================
       PLAYER
    ======================================================== */

    function createPlayer() {

        GAME.player =
            new THREE.Object3D();


        GAME.player.position.set(
            0,
            CONFIG.playerHeight,
            13
        );


        GAME.player.rotation.order =
            "YXZ";


        GAME.scene.add(
            GAME.player
        );


        GAME.camera.position.set(
            0,
            0,
            0
        );


        GAME.player.add(
            GAME.camera
        );


        GAME.mouse.yaw =
            Math.PI;


        GAME.player.rotation.y =
            GAME.mouse.yaw;

    }


    /* ========================================================
       PLAYER COLLISION
    ======================================================== */

    function collidesAt(
        x,
        z,
        radius
    ) {

        const playerMinX =
            x - radius;

        const playerMaxX =
            x + radius;

        const playerMinZ =
            z - radius;

        const playerMaxZ =
            z + radius;


        for (
            const collider
            of GAME.colliders
        ) {

            if (

                playerMaxX >
                    collider.minX &&

                playerMinX <
                    collider.maxX &&

                playerMaxZ >
                    collider.minZ &&

                playerMinZ <
                    collider.maxZ

            ) {

                return true;

            }

        }


        return false;

    }


    /* ========================================================
       MOVE WITH COLLISION
    ======================================================== */

    function movePlayer(
        dx,
        dz
    ) {

        if (!GAME.player) {
            return;
        }


        const current =
            GAME.player.position;


        const radius =
            CONFIG.playerRadius;


        /* X */

        const nextX =
            current.x + dx;


        if (
            !collidesAt(
                nextX,
                current.z,
                radius
            )
        ) {

            current.x =
                nextX;

        }


        /* Z */

        const nextZ =
            current.z + dz;


        if (
            !collidesAt(
                current.x,
                nextZ,
                radius
            )
        ) {

            current.z =
                nextZ;

        }


        /* Mansion boundary */

        current.x =
            clamp(
                current.x,
                -20.2,
                20.2
            );


        current.z =
            clamp(
                current.z,
                -16.2,
                16.0
            );

    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    function onKeyDown(
        event
    ) {

        switch (
            event.code
        ) {

            case "KeyW":
            case "ArrowUp":

                GAME.keys.forward =
                    true;

                break;


            case "KeyS":
            case "ArrowDown":

                GAME.keys.backward =
                    true;

                break;


            case "KeyA":
            case "ArrowLeft":

                GAME.keys.left =
                    true;

                break;


            case "KeyD":
            case "ArrowRight":

                GAME.keys.right =
                    true;

                break;


            case "ShiftLeft":
            case "ShiftRight":

                GAME.keys.sprint =
                    true;

                break;


            case "ControlLeft":
            case "ControlRight":

                GAME.keys.crouch =
                    true;

                break;


            case "Space":

                GAME.keys.jump =
                    true;

                break;


            case "KeyF":

                toggleFlashlight();

                break;


            case "KeyE":

                interact();

                break;

        }

    }


    function onKeyUp(
        event
    ) {

        switch (
            event.code
        ) {

            case "KeyW":
            case "ArrowUp":

                GAME.keys.forward =
                    false;

                break;


            case "KeyS":
            case "ArrowDown":

                GAME.keys.backward =
                    false;

                break;


            case "KeyA":
            case "ArrowLeft":

                GAME.keys.left =
                    false;

                break;


            case "KeyD":
            case "ArrowRight":

                GAME.keys.right =
                    false;

                break;


            case "ShiftLeft":
            case "ShiftRight":

                GAME.keys.sprint =
                    false;

                break;


            case "ControlLeft":
            case "ControlRight":

                GAME.keys.crouch =
                    false;

                break;


            case "Space":

                GAME.keys.jump =
                    false;

                break;

        }

    }


    /* ========================================================
       MOUSE LOOK
    ======================================================== */

    function onMouseMove(
        event
    ) {

        if (
            !GAME.mouse.active ||
            GAME.paused
        ) {

            return;

        }


        GAME.mouse.yaw -=
            event.movementX *
            GAME.mouse.sensitivity;


        GAME.mouse.pitch -=
            event.movementY *
            GAME.mouse.sensitivity;


        GAME.mouse.pitch =
            clamp(
                GAME.mouse.pitch,
                -1.42,
                1.42
            );


        applyCameraRotation();

    }


    function applyCameraRotation() {

        if (!GAME.player) {
            return;
        }


        GAME.player.rotation.y =
            GAME.mouse.yaw;


        GAME.camera.rotation.x =
            GAME.mouse.pitch;

    }


    /* ========================================================
       POINTER LOCK
    ======================================================== */

    function requestPointerLock() {

        if (
            GAME.renderer &&
            GAME.renderer.domElement
        ) {

            if (
                GAME.renderer.domElement
                    .requestPointerLock
            ) {

                GAME.renderer.domElement
                    .requestPointerLock();

            }

        }

    }


    function onPointerLockChange() {

        GAME.mouse.active =
            document.pointerLockElement ===
            GAME.renderer.domElement;

    }


    /* ========================================================
       FLASHLIGHT
    ======================================================== */

    function toggleFlashlight() {

        GAME.flashlightOn =
            !GAME.flashlightOn;


        if (
            GAME.flashlight
        ) {

            GAME.flashlight.visible =
                GAME.flashlightOn;

        }


        updateHUD();

    }


    /* ========================================================
       PLAYER UPDATE
    ======================================================== */

    function updatePlayer(
        delta
    ) {

        if (
            !GAME.player ||
            GAME.paused
        ) {

            return;

        }


        /* ====================================================
           INPUT
        ==================================================== */

        let forward =
            0;

        let strafe =
            0;


        if (
            GAME.keys.forward
        ) {

            forward += 1;

        }


        if (
            GAME.keys.backward
        ) {

            forward -= 1;

        }


        if (
            GAME.keys.right
        ) {

            strafe += 1;

        }


        if (
            GAME.keys.left
        ) {

            strafe -= 1;

        }


        /* Mobile joystick */

        if (
            GAME.mobile.active
        ) {

            strafe +=
                GAME.mobile.joystickX;

            forward -=
                GAME.mobile.joystickY;

        }


        const length =
            Math.sqrt(
                forward * forward +
                strafe * strafe
            );


        if (
            length > 1
        ) {

            forward /=
                length;

            strafe /=
                length;

        }


        /* ====================================================
           CROUCH
        ==================================================== */

        GAME.playerCrouching =
            GAME.keys.crouch;


        const targetHeight =
            GAME.playerCrouching
                ? CONFIG.crouchHeight
                : CONFIG.playerHeight;


        GAME.camera.position.y =
            lerp(
                GAME.camera.position.y,
                targetHeight -
                CONFIG.playerHeight,
                Math.min(
                    delta * 12,
                    1
                )
            );


        /* ====================================================
           RUN
        ==================================================== */

        const wantsRun =
            GAME.keys.sprint &&
            !GAME.playerCrouching &&
            length > 0;


        if (
            wantsRun &&
            GAME.stamina > 1
        ) {

            GAME.playerRunning =
                true;

            GAME.stamina -=
                CONFIG.staminaDrain *
                delta;

        } else {

            GAME.playerRunning =
                false;

            GAME.stamina +=
                CONFIG.staminaRecover *
                delta;

        }


        GAME.stamina =
            clamp(
                GAME.stamina,
                0,
                CONFIG.maxStamina
            );


        let speed;


        if (
            GAME.playerCrouching
        ) {

            speed =
                CONFIG.crouchSpeed;

        } else if (
            GAME.playerRunning
        ) {

            speed =
                CONFIG.runSpeed;

        } else {

            speed =
                CONFIG.walkSpeed;

        }


        /* ====================================================
           MOVEMENT DIRECTION
        ==================================================== */

        if (
            length > 0
        ) {

            const direction =
                new THREE.Vector3(
                    strafe,
                    0,
                    -forward
                );


            direction.applyAxisAngle(
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),
                GAME.player.rotation.y
            );


            direction.normalize();


            movePlayer(

                direction.x *
                speed *
                delta,

                direction.z *
                speed *
                delta

            );

        }


        /* ====================================================
           GRAVITY
        ==================================================== */

        GAME.playerVelocity.y -=
            CONFIG.gravity *
            delta;


        GAME.player.position.y +=
            GAME.playerVelocity.y *
            delta;


        const standingHeight =
            CONFIG.playerHeight;


        const crouchFloor =
            CONFIG.crouchHeight;


        const floorHeight =
            GAME.playerCrouching
                ? crouchFloor
                : standingHeight;


        if (
            GAME.player.position.y <=
            floorHeight
        ) {

            GAME.player.position.y =
                floorHeight;

            GAME.playerVelocity.y =
                0;

            GAME.playerOnGround =
                true;

        } else {

            GAME.playerOnGround =
                false;

        }


        /* ====================================================
           JUMP
        ==================================================== */

        if (
            GAME.keys.jump &&
            GAME.playerOnGround &&
            !GAME.playerCrouching
        ) {

            GAME.playerVelocity.y =
                CONFIG.jumpPower;

            GAME.playerOnGround =
                false;

            GAME.keys.jump =
                false;

        }


        updateHUD();

    }


    /* ========================================================
       INTERACTION
    ======================================================== */

    function interact() {

        if (
            !GAME.player ||
            GAME.paused
        ) {

            return;

        }


        const playerPosition =
            GAME.player.position;


        let closest =
            null;

        let closestDistance =
            Infinity;


        for (
            const object
            of GAME.interactables
        ) {

            if (
                !object.object
            ) {

                continue;

            }


            const distance =
                playerPosition.distanceTo(
                    object.object.position
                );


            if (
                distance <
                    object.radius &&
                distance <
                    closestDistance
            ) {

                closest =
                    object;

                closestDistance =
                    distance;

            }

        }


        if (!closest) {

            showMessage(
                "Nothing to interact with."
            );

            return;

        }


        if (
            closest.type ===
            "item"
        ) {

            collectItem(
                closest
            );

            return;

        }


        if (
            closest.type ===
            "exit"
        ) {

            attemptExit();

            return;

        }

    }


    /* ========================================================
       MESSAGE PLACEHOLDER
    ======================================================== */

    function showMessage(
        message
    ) {

        let element =
            document.getElementById(
                "gameMessage"
            );


        if (!element) {

            element =
                document.createElement(
                    "div"
                );

            element.id =
                "gameMessage";

            element.style.position =
                "fixed";

            element.style.left =
                "50%";

            element.style.bottom =
                "22%";

            element.style.transform =
                "translateX(-50%)";

            element.style.padding =
                "10px 18px";

            element.style.background =
                "rgba(0,0,0,.75)";

            element.style.color =
                "#fff";

            element.style.border =
                "1px solid rgba(255,255,255,.18)";

            element.style.borderRadius =
                "6px";

            element.style.fontFamily =
                "Arial,sans-serif";

            element.style.fontSize =
                "13px";

            element.style.zIndex =
                "9999";

            document.body.appendChild(
                element
            );

        }


        element.textContent =
            message;


        element.style.display =
            "block";


        clearTimeout(
            element._timer
        );


        element._timer =
            setTimeout(() => {

                element.style.display =
                    "none";

            }, 2400);

    }


    /* ========================================================
       RESIZE
    ======================================================== */

    function resize() {

        if (
            !GAME.camera ||
            !GAME.renderer
        ) {

            return;

        }


        GAME.camera.aspect =
            window.innerWidth /
            window.innerHeight;


        GAME.camera.updateProjectionMatrix();


        GAME.renderer.setPixelRatio(

            Math.min(
                window.devicePixelRatio || 1,
                CONFIG.maxPixelRatio
            )

        );


        GAME.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }


    /* ========================================================
       UPDATE HUD
    ======================================================== */

    function updateHUD() {

        const health =
            document.getElementById(
                "healthFill"
            );


        if (health) {

            health.style.width =
                clamp(
                    GAME.health,
                    0,
                    100
                ) +
                "%";

        }


        const stamina =
            document.getElementById(
                "staminaFill"
            );


        if (stamina) {

            stamina.style.width =
                clamp(
                    GAME.stamina,
                    0,
                    100
                ) +
                "%";

        }


        const healthText =
            document.getElementById(
                "healthText"
            );


        if (healthText) {

            healthText.textContent =
                Math.round(
                    GAME.health
                );

        }


        const staminaText =
            document.getElementById(
                "staminaText"
            );


        if (staminaText) {

            staminaText.textContent =
                Math.round(
                    GAME.stamina
                );

        }


        const flashlight =
            document.getElementById(
                "flashlightStatus"
            );


        if (flashlight) {

            flashlight.textContent =
                GAME.flashlightOn
                    ? "ON"
                    : "OFF";

        }


        const objective =
            document.getElementById(
                "objectiveText"
            );


        if (objective) {

            objective.textContent =
                `Find items: ${
                    GAME.collectedItems.length
                } / ${
                    CONFIG.itemCount
                }`;

        }

    }


    /* ========================================================
       ANIMATION LOOP
    ======================================================== */

    function animate() {

        if (
            !GAME.renderer ||
            !GAME.scene ||
            !GAME.camera
        ) {

            return;

        }


        requestAnimationFrame(
            animate
        );


        const delta =
            Math.min(
                GAME.clock.getDelta(),
                0.05
            );


        if (
            GAME.running &&
            !GAME.paused
        ) {

            updatePlayer(
                delta
            );

        }


        GAME.renderer.render(
            GAME.scene,
            GAME.camera
        );

    }


    /* ========================================================
       INITIALIZATION
    ======================================================== */

    function init() {

        if (
            GAME.initialized
        ) {

            return;

        }


        gameContainer =
            getGameContainer();


        createScene();

        createCamera();

        createRenderer();

        createLighting();

        createFlashlight();

        createMansion();

        createPlayer();


        GAME.clock =
            new THREE.Clock();


        window.addEventListener(
            "resize",
            resize
        );


        window.addEventListener(
            "keydown",
            onKeyDown
        );


        window.addEventListener(
            "keyup",
            onKeyUp
        );


        document.addEventListener(
            "mousemove",
            onMouseMove
        );


        document.addEventListener(
            "pointerlockchange",
            onPointerLockChange
        );


        GAME.renderer.domElement.addEventListener(
            "click",
            requestPointerLock
        );


        GAME.initialized =
            true;


        updateHUD();

        animate();

    }


    /* ========================================================
       START GAME
    ======================================================== */

    function start(options = {}) {

        init();


        GAME.running =
            true;

        GAME.paused =
            false;


        GAME.health =
            CONFIG.maxHealth;


        GAME.stamina =
            CONFIG.maxStamina;


        GAME.collectedItems =
            [];


        GAME.exitUnlocked =
            false;


        GAME.exitOpened =
            false;


        if (
            options.role
        ) {

            GAME.role =
                String(
                    options.role
                ).toUpperCase();

        }


        if (
            options.username
        ) {

            GAME.username =
                options.username;

        }


        GAME.player.position.set(
            0,
            CONFIG.playerHeight,
            13
        );


        GAME.playerVelocity.set(
            0,
            0,
            0
        );


        updateHUD();


        showMessage(
            "KILLER 07 — Find the required items and escape."
        );

    }


    /* ========================================================
       STOP
    ======================================================== */

    function stop() {

        GAME.running =
            false;

        GAME.paused =
            false;

    }


    /* ========================================================
       PAUSE
    ======================================================== */

    function pause() {

        GAME.paused =
            true;

    }


    function resume() {

        GAME.paused =
            false;

    }


    /* ========================================================
       PUBLIC API
    ======================================================== */

    window.Killer07Game = {

        start,

        stop,

        pause,

        resume,

        init,

        toggleFlashlight,

        interact,

        getState() {

            return {

                running:
                    GAME.running,

                health:
                    GAME.health,

                stamina:
                    GAME.stamina,

                items:
                    GAME.collectedItems.length,

                totalItems:
                    CONFIG.itemCount,

                exitUnlocked:
                    GAME.exitUnlocked,

                flashlightOn:
                    GAME.flashlightOn,

                role:
                    GAME.role ||
                    "SURVIVOR"

            };

        },

        setRole(role) {

            GAME.role =
                String(
                    role ||
                    "SURVIVOR"
                ).toUpperCase();

        },

        damage(amount) {

            GAME.health =
                clamp(
                    GAME.health -
                    Number(amount || 0),
                    0,
                    CONFIG.maxHealth
                );


            updateHUD();


            if (
                GAME.health <= 0
            ) {

                showMessage(
                    "YOU DIED"
                );

                GAME.paused =
                    true;

            }

        }

    };


    /* ========================================================
       BOOT
    ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                /*
                   We initialize the 3D engine
                   but don't automatically start
                   the actual match.
                */

                init();

            }
        );

    } else {

        init();

    }

})();/* ============================================================
   KILLER 07
   game3d.js - PART 2/2

   MOBILE + GAMEPLAY SYSTEM
   - Mobile joystick
   - Mobile look
   - Run
   - Stamina
   - Crouch
   - Jump
   - Flashlight
   - Health
   - 10 required items
   - Item collection
   - Objective
   - Exit unlock
   - Exit interaction
   - Horror HUD
   - Touch controls
============================================================ */


/* ============================================================
   MOBILE SYSTEM
============================================================ */

(function setupMobileSystem() {

    const mobile =
        GAME.mobile;

    const isMobile =
        /Android|iPhone|iPad|iPod|Windows Phone/i
            .test(navigator.userAgent) ||
        window.innerWidth <=
            CONFIG.mobileBreakpoint;

    mobile.active =
        isMobile;


    /* --------------------------------------------------------
       CREATE MOBILE HUD
    -------------------------------------------------------- */

    function createMobileHUD() {

        if (
            document.getElementById(
                "killer07MobileHUD"
            )
        ) {

            return;

        }


        const hud =
            document.createElement(
                "div"
            );


        hud.id =
            "killer07MobileHUD";


        hud.style.position =
            "fixed";

        hud.style.inset =
            "0";

        hud.style.pointerEvents =
            "none";

        hud.style.zIndex =
            "5000";

        hud.style.fontFamily =
            "Arial,sans-serif";


        /* ====================================================
           HEALTH
        ==================================================== */

        const healthBox =
            document.createElement(
                "div"
            );


        healthBox.style.position =
            "absolute";

        healthBox.style.left =
            "18px";

        healthBox.style.top =
            "18px";

        healthBox.style.width =
            "170px";

        healthBox.style.height =
            "18px";

        healthBox.style.background =
            "rgba(0,0,0,.65)";

        healthBox.style.border =
            "1px solid rgba(255,255,255,.15)";

        healthBox.style.borderRadius =
            "10px";

        healthBox.style.overflow =
            "hidden";


        const healthFill =
            document.createElement(
                "div"
            );


        healthFill.id =
            "healthFill";


        healthFill.style.width =
            "100%";

        healthFill.style.height =
            "100%";

        healthFill.style.background =
            "linear-gradient(90deg,#8d0000,#e32626)";


        healthBox.appendChild(
            healthFill
        );


        hud.appendChild(
            healthBox
        );


        /* ====================================================
           STAMINA
        ==================================================== */

        const staminaBox =
            document.createElement(
                "div"
            );


        staminaBox.style.position =
            "absolute";

        staminaBox.style.left =
            "18px";

        staminaBox.style.top =
            "42px";

        staminaBox.style.width =
            "150px";

        staminaBox.style.height =
            "10px";

        staminaBox.style.background =
            "rgba(0,0,0,.65)";

        staminaBox.style.borderRadius =
            "8px";

        staminaBox.style.overflow =
            "hidden";


        const staminaFill =
            document.createElement(
                "div"
            );


        staminaFill.id =
            "staminaFill";


        staminaFill.style.width =
            "100%";

        staminaFill.style.height =
            "100%";

        staminaFill.style.background =
            "#c5c5c5";


        staminaBox.appendChild(
            staminaFill
        );


        hud.appendChild(
            staminaBox
        );


        /* ====================================================
           OBJECTIVE
        ==================================================== */

        const objective =
            document.createElement(
                "div"
            );


        objective.id =
            "objectiveText";


        objective.textContent =
            "Find items: 0 / 10";


        objective.style.position =
            "absolute";

        objective.style.top =
            "22px";

        objective.style.left =
            "50%";

        objective.style.transform =
            "translateX(-50%)";

        objective.style.color =
            "#fff";

        objective.style.fontSize =
            "14px";

        objective.style.fontWeight =
            "bold";

        objective.style.textShadow =
            "0 2px 5px #000";


        hud.appendChild(
            objective
        );


        /* ====================================================
           FLASHLIGHT STATUS
        ==================================================== */

        const flashlightStatus =
            document.createElement(
                "div"
            );


        flashlightStatus.id =
            "flashlightStatus";


        flashlightStatus.textContent =
            "ON";


        flashlightStatus.style.position =
            "absolute";

        flashlightStatus.style.right =
            "20px";

        flashlightStatus.style.top =
            "22px";

        flashlightStatus.style.color =
            "#ddd";

        flashlightStatus.style.fontSize =
            "12px";


        hud.appendChild(
            flashlightStatus
        );


        /* ====================================================
           CROSSHAIR
        ==================================================== */

        const crosshair =
            document.createElement(
                "div"
            );


        crosshair.style.position =
            "absolute";

        crosshair.style.left =
            "50%";

        crosshair.style.top =
            "50%";

        crosshair.style.width =
            "5px";

        crosshair.style.height =
            "5px";

        crosshair.style.marginLeft =
            "-2.5px";

        crosshair.style.marginTop =
            "-2.5px";

        crosshair.style.border =
            "1px solid rgba(255,255,255,.8)";

        crosshair.style.borderRadius =
            "50%";


        hud.appendChild(
            crosshair
        );


        document.body.appendChild(
            hud
        );

    }


    /* ========================================================
       JOYSTICK
    ======================================================== */

    function createJoystick() {

        const base =
            document.createElement(
                "div"
            );


        base.id =
            "killer07Joystick";


        base.style.position =
            "fixed";

        base.style.left =
            "25px";

        base.style.bottom =
            "30px";

        base.style.width =
            "125px";

        base.style.height =
            "125px";

        base.style.borderRadius =
            "50%";

        base.style.background =
            "rgba(255,255,255,.08)";

        base.style.border =
            "1px solid rgba(255,255,255,.20)";

        base.style.pointerEvents =
            "auto";

        base.style.touchAction =
            "none";

        base.style.zIndex =
            "6000";


        const stick =
            document.createElement(
                "div"
            );


        stick.style.position =
            "absolute";

        stick.style.left =
            "50%";

        stick.style.top =
            "50%";

        stick.style.width =
            "52px";

        stick.style.height =
            "52px";

        stick.style.marginLeft =
            "-26px";

        stick.style.marginTop =
            "-26px";

        stick.style.borderRadius =
            "50%";

        stick.style.background =
            "rgba(255,255,255,.22)";

        stick.style.border =
            "1px solid rgba(255,255,255,.35)";


        base.appendChild(
            stick
        );


        document.body.appendChild(
            base
        );


        let active =
            false;


        let pointerId =
            null;


        function updateJoystick(
            event
        ) {

            const rect =
                base.getBoundingClientRect();


            const centerX =
                rect.left +
                rect.width / 2;


            const centerY =
                rect.top +
                rect.height / 2;


            let dx =
                event.clientX -
                centerX;


            let dy =
                event.clientY -
                centerY;


            const radius =
                48;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance >
                radius
            ) {

                const ratio =
                    radius /
                    distance;

                dx *= ratio;
                dy *= ratio;

            }


            stick.style.transform =
                `translate(${dx}px,${dy}px)`;


            mobile.joystickX =
                clamp(
                    dx / radius,
                    -1,
                    1
                );


            mobile.joystickY =
                clamp(
                    dy / radius,
                    -1,
                    1
                );

        }


        base.addEventListener(
            "pointerdown",
            event => {

                active =
                    true;

                pointerId =
                    event.pointerId;


                base.setPointerCapture(
                    pointerId
                );


                updateJoystick(
                    event
                );

            }
        );


        base.addEventListener(
            "pointermove",
            event => {

                if (
                    !active ||
                    event.pointerId !==
                    pointerId
                ) {

                    return;

                }


                updateJoystick(
                    event
                );

            }
        );


        function resetJoystick() {

            active =
                false;

            pointerId =
                null;

            mobile.joystickX =
                0;

            mobile.joystickY =
                0;


            stick.style.transform =
                "translate(0,0)";

        }


        base.addEventListener(
            "pointerup",
            resetJoystick
        );


        base.addEventListener(
            "pointercancel",
            resetJoystick
        );

    }


    /* ========================================================
       MOBILE LOOK
    ======================================================== */

    function createLookArea() {

        const area =
            document.createElement(
                "div"
            );


        area.id =
            "killer07LookArea";


        area.style.position =
            "fixed";

        area.style.right =
            "0";

        area.style.top =
            "0";

        area.style.width =
            "58%";

        area.style.height =
            "100%";

        area.style.pointerEvents =
            "auto";

        area.style.touchAction =
            "none";

        area.style.zIndex =
            "4500";


        document.body.appendChild(
            area
        );


        let lastX =
            0;

        let lastY =
            0;

        let looking =
            false;


        area.addEventListener(
            "pointerdown",
            event => {

                looking =
                    true;

                lastX =
                    event.clientX;

                lastY =
                    event.clientY;


                area.setPointerCapture(
                    event.pointerId
                );

            }
        );


        area.addEventListener(
            "pointermove",
            event => {

                if (!looking) {
                    return;
                }


                const dx =
                    event.clientX -
                    lastX;


                const dy =
                    event.clientY -
                    lastY;


                lastX =
                    event.clientX;

                lastY =
                    event.clientY;


                GAME.mouse.yaw -=
                    dx * 0.006;


                GAME.mouse.pitch -=
                    dy * 0.006;


                GAME.mouse.pitch =
                    clamp(
                        GAME.mouse.pitch,
                        -1.42,
                        1.42
                    );


                applyCameraRotation();

            }
        );


        function stopLook() {

            looking =
                false;

        }


        area.addEventListener(
            "pointerup",
            stopLook
        );


        area.addEventListener(
            "pointercancel",
            stopLook
        );

    }


    /* ========================================================
       MOBILE BUTTON
    ======================================================== */

    function mobileButton(
        text,
        className,
        right,
        bottom
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            text;


        button.className =
            className;


        button.style.position =
            "fixed";

        button.style.right =
            right;

        button.style.bottom =
            bottom;

        button.style.width =
            "62px";

        button.style.height =
            "62px";

        button.style.borderRadius =
            "50%";

        button.style.border =
            "1px solid rgba(255,255,255,.25)";

        button.style.background =
            "rgba(10,10,10,.72)";

        button.style.color =
            "#fff";

        button.style.fontSize =
            "12px";

        button.style.fontWeight =
            "bold";

        button.style.pointerEvents =
            "auto";

        button.style.touchAction =
            "none";

        button.style.zIndex =
            "6500";


        document.body.appendChild(
            button
        );


        return button;

    }


    /* ========================================================
       BUTTONS
    ======================================================== */

    function createButtons() {

        /* Jump */

        const jump =
            mobileButton(
                "JUMP",
                "k07Jump",
                "28px",
                "160px"
            );


        jump.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                GAME.keys.jump =
                    true;

            }
        );


        jump.addEventListener(
            "pointerup",
            () => {

                GAME.keys.jump =
                    false;

            }
        );


        /* Run */

        const run =
            mobileButton(
                "RUN",
                "k07Run",
                "105px",
                "95px"
            );


        run.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                GAME.keys.sprint =
                    true;

            }
        );


        run.addEventListener(
            "pointerup",
            () => {

                GAME.keys.sprint =
                    false;

            }
        );


        run.addEventListener(
            "pointercancel",
            () => {

                GAME.keys.sprint =
                    false;

            }
        );


        /* Crouch */

        const crouch =
            mobileButton(
                "CROUCH",
                "k07Crouch",
                "28px",
                "85px"
            );


        crouch.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                GAME.keys.crouch =
                    true;

            }
        );


        crouch.addEventListener(
            "pointerup",
            () => {

                GAME.keys.crouch =
                    false;

            }
        );


        crouch.addEventListener(
            "pointercancel",
            () => {

                GAME.keys.crouch =
                    false;

            }
        );


        /* Flashlight */

        const light =
            mobileButton(
                "LIGHT",
                "k07Light",
                "105px",
                "170px"
            );


        light.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                toggleFlashlight();

            }
        );


        /* Interact */

        const interactButton =
            mobileButton(
                "USE",
                "k07Use",
                "105px",
                "245px"
            );


        interactButton.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                interact();

            }
        );

    }


    /* ========================================================
       MOBILE INITIALIZATION
    ======================================================== */

    if (mobile.active) {

        createMobileHUD();

        createJoystick();

        createLookArea();

        createButtons();

    }


})();


/* ============================================================
   ITEM SYSTEM
============================================================ */

(function setupItemSystem() {

    const ITEM_DATA = [

        {
            id: "rust_key",
            name: "Rusty Key",
            description:
                "An old key covered with rust.",
            position:
                new THREE.Vector3(
                    -15,
                    0.9,
                    -13
                ),
            color:
                0x8b7355
        },

        {
            id: "basement_key",
            name: "Basement Key",
            description:
                "A heavy iron key.",
            position:
                new THREE.Vector3(
                    -14,
                    0.9,
                    10
                ),
            color:
                0x444444
        },

        {
            id: "library_key",
            name: "Library Key",
            description:
                "A tiny golden key.",
            position:
                new THREE.Vector3(
                    -10,
                    1.05,
                    -12
                ),
            color:
                0xc5a447
        },

        {
            id: "red_gem",
            name: "Red Gem",
            description:
                "A strange red crystal.",
            position:
                new THREE.Vector3(
                    -6,
                    1.0,
                    -14
                ),
            color:
                0xb00000
        },

        {
            id: "silver_coin",
            name: "Silver Coin",
            description:
                "An old mansion coin.",
            position:
                new THREE.Vector3(
                    0,
                    1.05,
                    8
                ),
            color:
                0xbfc3ca
        },

        {
            id: "old_note",
            name: "Old Note",
            description:
                "Someone left a warning.",
            position:
                new THREE.Vector3(
                    -15,
                    1.05,
                    7
                ),
            color:
                0xd4c7a1
        },

        {
            id: "clock_part",
            name: "Clock Part",
            description:
                "A mechanical clock component.",
            position:
                new THREE.Vector3(
                    15,
                    1.0,
                    8
                ),
            color:
                0x706060
        },

        {
            id: "black_key",
            name: "Black Key",
            description:
                "A key that feels unusually cold.",
            position:
                new THREE.Vector3(
                    15,
                    1.0,
                    -10
                ),
            color:
                0x161616
        },

        {
            id: "strange_medallion",
            name: "Strange Medallion",
            description:
                "A symbol is engraved on it.",
            position:
                new THREE.Vector3(
                    10,
                    1.0,
                    -13
                ),
            color:
                0x72613a
        },

        {
            id: "master_key",
            name: "Master Key",
            description:
                "The final key to the exit.",
            position:
                new THREE.Vector3(
                    4,
                    1.0,
                    -10
                ),
            color:
                0xa58a4b
        }

    ];


    /* ========================================================
       ITEM MATERIAL
    ======================================================== */

    function createItemMaterial(
        color
    ) {

        return new THREE.MeshStandardMaterial({

            color,

            emissive:
                color,

            emissiveIntensity:
                0.18,

            roughness:
                0.35,

            metalness:
                0.5

        });

    }


    /* ========================================================
       CREATE ITEM
    ======================================================== */

    function createItem(
        data,
        index
    ) {

        const group =
            new THREE.Group();


        let geometry;


        if (
            data.id.includes(
                "key"
            )
        ) {

            geometry =
                new THREE.TorusGeometry(
                    0.22,
                    0.055,
                    8,
                    16
                );

        } else if (
            data.id ===
            "red_gem"
        ) {

            geometry =
                new THREE.OctahedronGeometry(
                    0.22,
                    0
                );

        } else if (
            data.id ===
            "silver_coin"
        ) {

            geometry =
                new THREE.CylinderGeometry(
                    0.22,
                    0.22,
                    0.07,
                    16
                );

        } else if (
            data.id ===
            "old_note"
        ) {

            geometry =
                new THREE.BoxGeometry(
                    0.38,
                    0.03,
                    0.28
                );

        } else if (
            data.id ===
            "clock_part"
        ) {

            geometry =
                new THREE.TorusGeometry(
                    0.19,
                    0.06,
                    8,
                    16
                );

        } else {

            geometry =
                new THREE.SphereGeometry(
                    0.20,
                    10,
                    10
                );

        }


        const mesh =
            new THREE.Mesh(

                geometry,

                createItemMaterial(
                    data.color
                )

            );


        group.add(
            mesh
        );


        group.position.copy(
            data.position
        );


        GAME.scene.add(
            group
        );


        const item =
            {

                id:
                    data.id,

                name:
                    data.name,

                description:
                    data.description,

                object:
                    group,

                index,

                collected:
                    false

            };


        GAME.items.push(
            item
        );


        GAME.interactables.push({

            type:
                "item",

            item,

            object:
                group,

            radius:
                CONFIG.interactDistance

        });


        /* Glow */

        const glow =
            new THREE.PointLight(
                data.color,
                0.35,
                2.0
            );


        glow.position.copy(
            data.position
        );


        GAME.scene.add(
            glow
        );


        /* Animation metadata */

        group.userData.item =
            item;

        group.userData.baseY =
            data.position.y;

        group.userData.phase =
            index * 0.8;

    }


    /* ========================================================
       CREATE ALL ITEMS
    ======================================================== */

    function createAllItems() {

        ITEM_DATA.forEach(
            (data, index) => {

                createItem(
                    data,
                    index
                );

            }
        );

    }


    /* ========================================================
       COLLECT ITEM
    ======================================================== */

    window.collectItem =
        function collectItem(
            interactable
        ) {

            if (
                !interactable ||
                !interactable.item
            ) {

                return;

            }


            const item =
                interactable.item;


            if (
                item.collected
            ) {

                return;

            }


            item.collected =
                true;


            GAME.collectedItems.push(
                item.id
            );


            if (
                item.object
            ) {

                GAME.scene.remove(
                    item.object
                );

            }


            const index =
                GAME.interactables.indexOf(
                    interactable
                );


            if (
                index >= 0
            ) {

                GAME.interactables.splice(
                    index,
                    1
                );

            }


            showMessage(
                `${item.name} collected`
            );


            if (
                GAME.collectedItems.length >=
                CONFIG.itemCount
            ) {

                GAME.exitUnlocked =
                    true;


                showMessage(
                    "All 10 items found. The exit is unlocked."
                );

            }


            updateHUD();

        };


    /* ========================================================
       ITEM ANIMATION
    ======================================================== */

    window.animateKiller07Items =
        function animateKiller07Items(
            time
        ) {

            if (
                !GAME.items
            ) {

                return;

            }


            GAME.items.forEach(
                item => {

                    if (
                        item.collected ||
                        !item.object
                    ) {

                        return;

                    }


                    item.object.rotation.y +=
                        0.015;


                    item.object.position.y =
                        item.object.userData.baseY +
                        Math.sin(
                            time *
                            0.002 +
                            item.object.userData.phase
                        ) *
                        0.07;

                }
            );

        };


    createAllItems();

})();


/* ============================================================
   EXIT SYSTEM
============================================================ */

(function setupExitSystem() {

    window.attemptExit =
        function attemptExit() {

            if (
                !GAME.exitDoor
            ) {

                return;

            }


            if (
                GAME.collectedItems.length <
                CONFIG.exitRequiredItems
            ) {

                const remaining =
                    CONFIG.exitRequiredItems -
                    GAME.collectedItems.length;


                showMessage(
                    `${remaining} item(s) still required.`
                );


                return;

            }


            if (
                GAME.exitOpened
            ) {

                winGame();

                return;

            }


            GAME.exitUnlocked =
                true;


            GAME.exitOpened =
                true;


            showMessage(
                "EXIT UNLOCKED"
            );


            openExitDoor();

        };


    function openExitDoor() {

        if (
            !GAME.exitDoor
        ) {

            return;

        }


        const startRotation =
            GAME.exitDoor.rotation.y;


        let progress =
            0;


        function animateDoor() {

            progress +=
                0.025;


            GAME.exitDoor.rotation.y =
                lerp(
                    startRotation,
                    -Math.PI / 2,
                    Math.min(
                        progress,
                        1
                    )
                );


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    animateDoor
                );

            }

        }


        animateDoor();

    }


    function winGame() {

        GAME.running =
            false;


        GAME.paused =
            true;


        const screen =
            document.createElement(
                "div"
            );


        screen.style.position =
            "fixed";

        screen.style.inset =
            "0";

        screen.style.background =
            "rgba(0,0,0,.90)";

        screen.style.display =
            "flex";

        screen.style.flexDirection =
            "column";

        screen.style.alignItems =
            "center";

        screen.style.justifyContent =
            "center";

        screen.style.zIndex =
            "10000";

        screen.style.color =
            "#fff";

        screen.style.fontFamily =
            "Arial,sans-serif";


        screen.innerHTML = `

            <div style="
                font-size:12px;
                letter-spacing:6px;
                opacity:.65;
                margin-bottom:15px;
            ">
                KILLER 07
            </div>

            <div style="
                font-size:42px;
                font-weight:900;
                letter-spacing:4px;
                color:#e8e8e8;
            ">
                ESCAPED
            </div>

            <div style="
                margin-top:15px;
                font-size:14px;
                color:#aaa;
            ">
                You escaped the mansion.
            </div>

            <button id="k07ReturnLobby"
                style="
                    margin-top:30px;
                    padding:13px 28px;
                    background:#760b0b;
                    border:1px solid #a92828;
                    color:white;
                    border-radius:5px;
                    cursor:pointer;
                ">
                RETURN TO LOBBY
            </button>

        `;


        document.body.appendChild(
            screen
        );


        const button =
            document.getElementById(
                "k07ReturnLobby"
            );


        if (button) {

            button.onclick =
                function() {

                    screen.remove();

                    GAME.paused =
                        false;

                    GAME.running =
                        true;

                    GAME.collectedItems =
                        [];

                    GAME.exitUnlocked =
                        false;

                    GAME.exitOpened =
                        false;

                    GAME.player.position.set(
                        0,
                        CONFIG.playerHeight,
                        13
                    );

                };

        }

    }

})();


/* ============================================================
   DAMAGE / HEALTH
============================================================ */

(function setupHealthSystem() {

    window.damagePlayer =
        function damagePlayer(
            amount
        ) {

            amount =
                Number(amount) || 0;


            if (
                amount <= 0 ||
                GAME.health <= 0
            ) {

                return;

            }


            GAME.health =
                clamp(
                    GAME.health -
                    amount,
                    0,
                    CONFIG.maxHealth
                );


            createDamageEffect();


            if (
                GAME.health <= 0
            ) {

                playerDeath();

            }


            updateHUD();

        };


    function createDamageEffect() {

        let effect =
            document.getElementById(
                "k07DamageEffect"
            );


        if (!effect) {

            effect =
                document.createElement(
                    "div"
                );


            effect.id =
                "k07DamageEffect";


            effect.style.position =
                "fixed";

            effect.style.inset =
                "0";

            effect.style.pointerEvents =
                "none";

            effect.style.background =
                "rgba(160,0,0,.35)";

            effect.style.zIndex =
                "8000";


            document.body.appendChild(
                effect
            );

        }


        effect.style.opacity =
            "1";


        effect.style.transition =
            "opacity .45s";


        requestAnimationFrame(
            () => {

                effect.style.opacity =
                    "0";

            }
        );

    }


    function playerDeath() {

        GAME.health =
            0;

        GAME.running =
            false;

        GAME.paused =
            true;


        const death =
            document.createElement(
                "div"
            );


        death.id =
            "k07DeathScreen";


        death.style.position =
            "fixed";

        death.style.inset =
            "0";

        death.style.background =
            "rgba(0,0,0,.94)";

        death.style.display =
            "flex";

        death.style.flexDirection =
            "column";

        death.style.alignItems =
            "center";

        death.style.justifyContent =
            "center";

        death.style.zIndex =
            "10001";

        death.style.color =
            "#fff";

        death.style.fontFamily =
            "Arial,sans-serif";


        death.innerHTML = `

            <div style="
                font-size:48px;
                font-weight:900;
                letter-spacing:5px;
                color:#b20d0d;
            ">
                YOU DIED
            </div>

            <div style="
                margin-top:12px;
                color:#777;
                font-size:13px;
            ">
                The mansion claimed another victim.
            </div>

            <button id="k07Retry"
                style="
                    margin-top:28px;
                    padding:12px 26px;
                    background:#6f0808;
                    color:#fff;
                    border:1px solid #a52a2a;
                    border-radius:5px;
                    cursor:pointer;
                ">
                TRY AGAIN
            </button>

        `;


        document.body.appendChild(
            death
        );


        const retry =
            document.getElementById(
                "k07Retry"
            );


        if (retry) {

            retry.onclick =
                function() {

                    death.remove();

                    GAME.health =
                        CONFIG.maxHealth;

                    GAME.stamina =
                        CONFIG.maxStamina;

                    GAME.collectedItems =
                        [];

                    GAME.exitUnlocked =
                        false;

                    GAME.exitOpened =
                        false;

                    GAME.player.position.set(
                        0,
                        CONFIG.playerHeight,
                        13
                    );

                    GAME.playerVelocity.set(
                        0,
                        0,
                        0
                    );


                    rebuildItems();


                    GAME.paused =
                        false;

                    GAME.running =
                        true;


                    updateHUD();

                };

        }

    }


    function rebuildItems() {

        if (
            !GAME.items
        ) {

            return;

        }


        GAME.items.forEach(
            item => {

                item.collected =
                    false;

                if (
                    item.object &&
                    !GAME.scene.children.includes(
                        item.object
                    )
                ) {

                    GAME.scene.add(
                        item.object
                    );

                }

            }
        );


        GAME.interactables =
            GAME.interactables.filter(
                object =>
                    object.type !==
                    "item"
            );


        GAME.items.forEach(
            item => {

                GAME.interactables.push({

                    type:
                        "item",

                    item,

                    object:
                        item.object,

                    radius:
                        CONFIG.interactDistance

                });

            }
        );

    }

})();


/* ============================================================
   INTERACTION PROMPT
============================================================ */

(function setupInteractionPrompt() {

    const prompt =
        document.createElement(
            "div"
        );


    prompt.id =
        "k07InteractionPrompt";


    prompt.style.position =
        "fixed";

    prompt.style.left =
        "50%";

    prompt.style.bottom =
        "28%";

    prompt.style.transform =
        "translateX(-50%)";

    prompt.style.padding =
        "8px 14px";

    prompt.style.background =
        "rgba(0,0,0,.65)";

    prompt.style.border =
        "1px solid rgba(255,255,255,.15)";

    prompt.style.borderRadius =
        "5px";

    prompt.style.color =
        "#fff";

    prompt.style.fontSize =
        "12px";

    prompt.style.fontFamily =
        "Arial,sans-serif";

    prompt.style.zIndex =
        "7000";

    prompt.style.pointerEvents =
        "none";

    prompt.style.display =
        "none";


    document.body.appendChild(
        prompt
    );


    window.updateInteractionPrompt =
        function() {

            if (
                !GAME.player
            ) {

                prompt.style.display =
                    "none";

                return;

            }


            let closest =
                null;

            let distance =
                Infinity;


            GAME.interactables.forEach(
                object => {

                    if (
                        !object.object
                    ) {

                        return;

                    }


                    const d =
                        GAME.player.position.distanceTo(
                            object.object.position
                        );


                    if (
                        d <
                            object.radius &&
                        d <
                            distance
                    ) {

                        closest =
                            object;

                        distance =
                            d;

                    }

                }
            );


            if (!closest) {

                prompt.style.display =
                    "none";

                return;

            }


            if (
                closest.type ===
                "item"
            ) {

                prompt.textContent =
                    "E / USE  •  " +
                    closest.item.name;

            } else if (
                closest.type ===
                "exit"
            ) {

                if (
                    GAME.exitUnlocked
                ) {

                    prompt.textContent =
                        "E / USE  •  OPEN EXIT";

                } else {

                    prompt.textContent =
                        "EXIT LOCKED  •  FIND 10 ITEMS";

                }

            }


            prompt.style.display =
                "block";

        };

})();


/* ============================================================
   EXTRA HUD UPDATE
============================================================ */

(function setupHUDLoop() {

    let last =
        0;


    function loop(
        timestamp
    ) {

        requestAnimationFrame(
            loop
        );


        if (
            timestamp -
            last <
            100
        ) {

            return;

        }


        last =
            timestamp;


        if (
            typeof updateInteractionPrompt ===
            "function"
        ) {

            updateInteractionPrompt();

        }


        if (
            typeof animateKiller07Items ===
            "function"
        ) {

            animateKiller07Items(
                timestamp
            );

        }

    }


    requestAnimationFrame(
        loop
    );

})();


/* ============================================================
   MOBILE EXIT BUTTON SAFETY
============================================================ */

window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            resize,
            250
        );

    }
);


/* ============================================================
   TOUCH PREVENT DEFAULT
============================================================ */

document.addEventListener(
    "touchmove",
    event => {

        if (
            GAME.mobile.active
        ) {

            event.preventDefault();

        }

    },
    {
        passive: false
    }
);


/* ============================================================
   FINAL GAME READY EVENT
============================================================ */

window.dispatchEvent(
    new CustomEvent(
        "killer07GameReady"
    )
);


/* ============================================================
   FINAL STATUS
============================================================ */

console.log(
    "%c KILLER 07 ",
    "background:#650000;color:#fff;font-size:20px;font-weight:bold;padding:5px 10px"
);

console.log(
    "3D Horror Escape Engine loaded."
);

console.log(
    "10 items required for escape."
);

console.log(
    "PC + Mobile controls enabled."
);
