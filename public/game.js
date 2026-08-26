/* ============================================================
   KILLER 07
   game3d.js - COMPLETE OPTIMIZED VERSION
   PART 1/4

   FEATURES:
   - Three.js 3D horror mansion
   - Multiple rooms
   - Hallways
   - Basement
   - Library
   - Bedroom
   - Dining room
   - Storage room
   - Game room
   - Secret room
   - Exit hall
   - Furniture
   - Horror atmosphere
   - Fog
   - Optimized lighting
   - First person camera
   - Player movement
   - Collision
   - Gravity
   - Jump
   - Crouch
   - Sprint
   - Stamina
   - Flashlight
   - Health
   - 10 item objective
   - Exit system
   - Mobile controls
   - PC controls

   PERFORMANCE:
   - No renderer shadow maps
   - Limited dynamic lights
   - Capped pixel ratio
   - Lightweight materials
   - Throttled DOM updates
   - No blocking light initialization
============================================================ */

"use strict";

(() => {

    /* ========================================================
       SAFE THREE.JS CHECK
    ======================================================== */

    function getThree() {

        if (
            typeof window !== "undefined" &&
            window.THREE
        ) {

            return window.THREE;

        }

        return null;

    }


    const THREE =
        getThree();


    if (!THREE) {

        console.error(
            "KILLER 07: Three.js is not loaded."
        );

        return;

    }


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

        maxPixelRatio: 1.35,

        mobileBreakpoint: 800,

        itemCount: 10,

        exitRequiredItems: 10,

        fixedUpdateRate: 60,

        maxDelta: 0.05

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

        exitUnlocked: false,

        exitOpened: false,

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

        fps: 60,

        lastHUDUpdate: 0,

        lastInteractionUpdate: 0,

        loading: false

    };


    /* ========================================================
       EXPOSE SAFELY
    ======================================================== */

    window.KILLER07 =
        window.KILLER07 || {};

    window.KILLER07.GAME =
        GAME;

    window.KILLER07.CONFIG =
        CONFIG;


    /* ========================================================
       GAME CONTAINER
    ======================================================== */

    let gameContainer =
        null;


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
                document.querySelector(
                    ".game-container"
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
            Math.min(
                max,
                value
            )
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


    function distance2D(
        a,
        b
    ) {

        const dx =
            a.x - b.x;

        const dz =
            a.z - b.z;

        return Math.sqrt(
            dx * dx +
            dz * dz
        );

    }


    /* ========================================================
       MATERIALS
    ======================================================== */

    const MATERIALS = {

        floor:
            new THREE.MeshStandardMaterial({

                color:
                    0x242323,

                roughness:
                    0.88,

                metalness:
                    0.05

            }),


        floorWood:
            new THREE.MeshStandardMaterial({

                color:
                    0x3a2822,

                roughness:
                    0.92,

                metalness:
                    0.02

            }),


        wall:
            new THREE.MeshStandardMaterial({

                color:
                    0x282828,

                roughness:
                    0.95,

                metalness:
                    0.0

            }),


        wallDark:
            new THREE.MeshStandardMaterial({

                color:
                    0x171717,

                roughness:
                    1.0,

                metalness:
                    0

            }),


        ceiling:
            new THREE.MeshStandardMaterial({

                color:
                    0x111111,

                roughness:
                    1

            }),


        wood:
            new THREE.MeshStandardMaterial({

                color:
                    0x3a2119,

                roughness:
                    0.82

            }),


        woodDark:
            new THREE.MeshStandardMaterial({

                color:
                    0x1b100c,

                roughness:
                    0.9

            }),


        metal:
            new THREE.MeshStandardMaterial({

                color:
                    0x282828,

                roughness:
                    0.55,

                metalness:
                    0.65

            }),


        red:
            new THREE.MeshStandardMaterial({

                color:
                    0x370808,

                roughness:
                    0.8

            }),


        cloth:
            new THREE.MeshStandardMaterial({

                color:
                    0x292929,

                roughness:
                    1

            }),


        glass:
            new THREE.MeshStandardMaterial({

                color:
                    0x111820,

                roughness:
                    0.2,

                metalness:
                    0.15,

                transparent:
                    true,

                opacity:
                    0.32

            })

    };


    /* ========================================================
       SCENE
    ======================================================== */

    function createScene() {

        GAME.scene =
            new THREE.Scene();


        GAME.scene.background =
            new THREE.Color(
                0x020203
            );


        /*
         * Lightweight fog.
         * Important:
         * This does NOT block startup.
         */

        GAME.scene.fog =
            new THREE.FogExp2(
                0x050506,
                0.035
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
                Math.max(
                    window.innerHeight,
                    1
                ),

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

                antialias:
                    false,

                powerPreference:
                    "high-performance",

                alpha:
                    false

            });


        const pixelRatio =
            Math.min(
                window.devicePixelRatio || 1,
                CONFIG.maxPixelRatio
            );


        GAME.renderer.setPixelRatio(
            pixelRatio
        );


        GAME.renderer.setSize(
            window.innerWidth,
            window.innerHeight,
            false
        );


        /*
         * Shadows deliberately disabled.
         * This gives much better mobile FPS.
         */

        GAME.renderer.shadowMap.enabled =
            false;


        if (
            "outputColorSpace" in
            GAME.renderer
        ) {

            GAME.renderer.outputColorSpace =
                THREE.SRGBColorSpace;

        }


        if (
            "toneMapping" in
            GAME.renderer
        ) {

            GAME.renderer.toneMapping =
                THREE.ACESFilmicToneMapping;

            GAME.renderer.toneMappingExposure =
                0.72;

        }


        GAME.renderer.domElement.style.width =
            "100%";


        GAME.renderer.domElement.style.height =
            "100%";


        GAME.renderer.domElement.style.display =
            "block";


        GAME.renderer.domElement.style.touchAction =
            "none";


        gameContainer.appendChild(
            GAME.renderer.domElement
        );

    }


    /* ========================================================
       OPTIMIZED LIGHTING
    ======================================================== */

    function createLighting() {

        /*
         * IMPORTANT:
         * Lighting is intentionally lightweight.
         * Nothing here waits for textures/assets.
         */

        GAME.ambientLight =
            new THREE.AmbientLight(
                0x6b6b7d,
                0.20
            );


        GAME.scene.add(
            GAME.ambientLight
        );


        /*
         * One directional moon light.
         * Shadows are OFF.
         */

        const moon =
            new THREE.DirectionalLight(
                0x8a91b8,
                0.18
            );


        moon.position.set(
            -10,
            18,
            8
        );


        GAME.scene.add(
            moon
        );


        /*
         * Only FOUR small horror lights.
         */

        createPointLight(
            -12,
            2.7,
            -8,
            0x9b1010,
            1.05,
            6
        );


        createPointLight(
            13,
            2.5,
            8,
            0x661010,
            0.85,
            5
        );


        createPointLight(
            0,
            2.7,
            -12,
            0x202a42,
            0.75,
            6
        );


        createPointLight(
            15,
            2.6,
            -12,
            0x421010,
            0.80,
            5
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

                4.5,

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
       BOX CREATION
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
                    x - width / 2,

                maxX:
                    x + width / 2,

                minY:
                    y - height / 2,

                maxY:
                    y + height / 2,

                minZ:
                    z - depth / 2,

                maxZ:
                    z + depth / 2

            });

        }


        return mesh;

    }


    /* ========================================================
       CYLINDER CREATION
    ======================================================== */

    function cylinder(
        radiusTop,
        radiusBottom,
        height,
        material,
        x,
        y,
        z,
        segments = 12,
        collider = false
    ) {

        const geometry =
            new THREE.CylinderGeometry(
                radiusTop,
                radiusBottom,
                height,
                segments
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
                    x - radiusBottom,

                maxX:
                    x + radiusBottom,

                minY:
                    y - height / 2,

                maxY:
                    y + height / 2,

                minZ:
                    z - radiusBottom,

                maxZ:
                    z + radiusBottom

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


        /*
         * North
         */

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


        /*
         * South
         */

        box(

            w,
            h,
            t,

            MATERIALS.wallDark,

            0,
            h / 2,
            d / 2,

            true

        );


        /*
         * West
         */

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


        /*
         * East
         */

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

    }


    /* ========================================================
       ROOM WALL HELPERS
    ======================================================== */

    function wallX(
        x,
        z,
        length,
        doorGap = 0
    ) {

        const h =
            CONFIG.wallHeight;


        const t =
            CONFIG.wallThickness;


        if (
            doorGap <= 0
        ) {

            box(

                length,
                h,
                t,

                MATERIALS.wall,

                x,
                h / 2,
                z,

                true

            );

            return;

        }


        const side =
            (length -
             doorGap) / 2;


        if (
            side > 0
        ) {

            box(

                side,
                h,
                t,

                MATERIALS.wall,

                x -
                    (doorGap / 2 +
                     side / 2),

                h / 2,
                z,

                true

            );


            box(

                side,
                h,
                t,

                MATERIALS.wall,

                x +
                    (doorGap / 2 +
                     side / 2),

                h / 2,
                z,

                true

            );

        }

    }


    function wallZ(
        x,
        z,
        length,
        doorGap = 0
    ) {

        const h =
            CONFIG.wallHeight;


        const t =
            CONFIG.wallThickness;


        if (
            doorGap <= 0
        ) {

            box(

                t,
                h,
                length,

                MATERIALS.wall,

                x,
                h / 2,
                z,

                true

            );

            return;

        }


        const side =
            (length -
             doorGap) / 2;


        if (
            side > 0
        ) {

            box(

                t,
                h,
                side,

                MATERIALS.wall,

                x,
                h / 2,

                z -
                    (doorGap / 2 +
                     side / 2),

                true

            );


            box(

                t,
                h,
                side,

                MATERIALS.wall,

                x,
                h / 2,

                z +
                    (doorGap / 2 +
                     side / 2),

                true

            );

        }

    }


    /* ========================================================
       MAIN HALL
    ======================================================== */

    function createMainHall() {

        /*
         * Central mansion layout.
         */

        wallX(
            0,
            -4,
            18,
            3
        );


        wallX(
            0,
            4,
            18,
            3
        );


        wallZ(
            -9,
            0,
            8,
            3
        );


        wallZ(
            9,
            0,
            8,
            3
        );

    }


    /* ========================================================
       BEDROOM
    ======================================================== */

    function createBedroom() {

        wallX(
            -14,
            -10,
            12,
            3
        );


        wallZ(
            -20,
            -5,
            10,
            3
        );


        wallZ(
            -8,
            -5,
            10,
            3
        );


        createBed(
            -14,
            1.0,
            -12
        );


        createTable(
            -17,
            0.7,
            -8
        );

    }


    /* ========================================================
       LIBRARY
    ======================================================== */

    function createLibrary() {

        wallX(
            14,
            -10,
            12,
            3
        );


        wallZ(
            8,
            -5,
            10,
            3
        );


        wallZ(
            20,
            -5,
            10,
            3
        );


        createBookshelf(
            11,
            1.6,
            -14
        );


        createBookshelf(
            17,
            1.6,
            -14
        );


        createTable(
            14,
            0.7,
            -8
        );

    }


    /* ========================================================
       DINING ROOM
    ======================================================== */

    function createDiningRoom() {

        wallX(
            -14,
            10,
            12,
            3
        );


        wallZ(
            -20,
            5,
            10,
            3
        );


        wallZ(
            -8,
            5,
            10,
            3
        );


        createDiningTable(
            -14,
            0.9,
            12
        );

    }


    /* ========================================================
       STORAGE ROOM
    ======================================================== */

    function createStorageRoom() {

        wallX(
            14,
            10,
            12,
            3
        );


        wallZ(
            8,
            5,
            10,
            3
        );


        wallZ(
            20,
            5,
            10,
            3
        );


        createCrates(
            10,
            0.6,
            10
        );


        createCrates(
            17,
            0.6,
            12
        );

    }


    /* ========================================================
       BED
    ======================================================== */

    function createBed(
        x,
        y,
        z
    ) {

        box(

            2.4,
            0.35,
            4.2,

            MATERIALS.woodDark,

            x,
            y,
            z,

            true

        );


        box(

            2.25,
            0.28,
            3.9,

            MATERIALS.cloth,

            x,
            y + 0.30,
            z,

            false

        );


        box(

            2.25,
            0.55,
            0.35,

            MATERIALS.wood,

            x,
            y + 0.65,
            z - 1.9,

            true

        );

    }


    /* ========================================================
       TABLE
    ======================================================== */

    function createTable(
        x,
        y,
        z
    ) {

        box(

            1.8,
            0.18,
            1.2,

            MATERIALS.wood,

            x,
            y,
            z,

            true

        );


        const legs = [

            [-0.7, -0.4],
            [0.7, -0.4],
            [-0.7, 0.4],
            [0.7, 0.4]

        ];


        legs.forEach(
            pair => {

                box(

                    0.14,
                    0.75,
                    0.14,

                    MATERIALS.woodDark,

                    x + pair[0],
                    y - 0.43,
                    z + pair[1],

                    true

                );

            }
        );

    }


    /* ========================================================
       DINING TABLE
    ======================================================== */

    function createDiningTable(
        x,
        y,
        z
    ) {

        box(

            4.2,
            0.22,
            1.7,

            MATERIALS.wood,

            x,
            y,
            z,

            true

        );


        const legs = [

            [-1.7, -0.55],
            [1.7, -0.55],
            [-1.7, 0.55],
            [1.7, 0.55]

        ];


        legs.forEach(
            pair => {

                box(

                    0.18,
                    0.85,
                    0.18,

                    MATERIALS.woodDark,

                    x + pair[0],
                    y - 0.5,
                    z + pair[1],

                    true

                );

            }
        );


        /*
         * Chairs
         */

        [-2.5, 2.5].forEach(
            offset => {

                box(

                    0.8,
                    0.15,
                    0.8,

                    MATERIALS.wood,

                    x + offset,
                    y - 0.1,
                    z,

                    true

                );

            }
        );

    }


    /* ========================================================
       BOOKSHELF
    ======================================================== */

    function createBookshelf(
        x,
        y,
        z
    ) {

        box(

            0.45,
            3.1,
            3.4,

            MATERIALS.woodDark,

            x,
            y,
            z,

            true

        );


        for (
            let i = 0;
            i < 5;
            i++
        ) {

            box(

                0.5,
                0.05,
                3.1,

                MATERIALS.wood,

                x,
                0.35 +
                    i * 0.62,
                z,

                false

            );

        }

    }


    /* ========================================================
       CRATES
    ======================================================== */

    function createCrates(
        x,
        y,
        z
    ) {

        box(

            1.1,
            1.1,
            1.1,

            MATERIALS.wood,

            x,
            y,
            z,

            true

        );


        box(

            1.0,
            1.0,
            1.0,

            MATERIALS.woodDark,

            x + 1.0,
            y,
            z + 0.4,

            true

        );


        box(

            0.9,
            0.9,
            0.9,

            MATERIALS.wood,

            x - 0.8,
            y + 0.8,
            z + 0.2,

            true

        );

    }


    /* ========================================================
       BUILD MANSION
    ======================================================== */

    function buildMansion() {

        createFloor();

        createCeiling();

        createOuterWalls();

        createMainHall();

        createBedroom();

        createLibrary();

        createDiningRoom();

        createStorageRoom();

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


        GAME.scene.add(
            GAME.player
        );


        /*
         * Camera is child of player.
         */

        GAME.player.add(
            GAME.camera
        );


        GAME.camera.position.set(
            0,
            0,
            0
        );


        GAME.camera.rotation.set(
            0,
            0,
            0
        );

    }


    /* ========================================================
       CAMERA ROTATION
    ======================================================== */

    function applyCameraRotation() {

        if (
            !GAME.player ||
            !GAME.camera
        ) {

            return;

        }


        GAME.player.rotation.y =
            GAME.mouse.yaw;


        GAME.camera.rotation.x =
            GAME.mouse.pitch;

    }


    window.applyCameraRotation =
        applyCameraRotation;


    /* ========================================================
       PLAYER COLLISION
    ======================================================== */

    function collidesAt(
        x,
        z,
        radius
    ) {

        for (
            let i = 0;
            i < GAME.colliders.length;
            i++
        ) {

            const c =
                GAME.colliders[i];


            if (
                x + radius >
                    c.minX &&

                x - radius <
                    c.maxX &&

                z + radius >
                    c.minZ &&

                z - radius <
                    c.maxZ
            ) {

                return true;

            }

        }


        return false;

    }


    /* ========================================================
       MOVE PLAYER
    ======================================================== */

    function movePlayer(
        dx,
        dz
    ) {

        if (
            !GAME.player
        ) {

            return;

        }


        const radius =
            GAME.playerCrouching
                ? CONFIG.playerRadius * 0.8
                : CONFIG.playerRadius;


        const nextX =
            GAME.player.position.x +
            dx;


        const nextZ =
            GAME.player.position.z +
            dz;


        /*
         * Axis-separated collision.
         * Much cheaper than physics engine.
         */

        if (
            !collidesAt(
                nextX,
                GAME.player.position.z,
                radius
            )
        ) {

            GAME.player.position.x =
                nextX;

        }


        if (
            !collidesAt(
                GAME.player.position.x,
                nextZ,
                radius
            )
        ) {

            GAME.player.position.z =
                nextZ;

        }

    }


    /* ========================================================
       INPUT
    ======================================================== */

    function setupKeyboard() {

        window.addEventListener(
            "keydown",
            event => {

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
        );


        window.addEventListener(
            "keyup",
            event => {

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
        );

    }


    /* ========================================================
       MOUSE LOOK
    ======================================================== */

    function setupMouse() {

        const canvas =
            GAME.renderer
                .domElement;


        canvas.addEventListener(
            "click",
            () => {

                if (
                    GAME.mobile.active
                ) {

                    return;

                }


                if (
                    document.pointerLockElement !==
                    canvas
                ) {

                    canvas.requestPointerLock();

                }

            }
        );


        document.addEventListener(
            "pointerlockchange",
            () => {

                GAME.mouse.active =
                    document.pointerLockElement ===
                    canvas;

            }
        );


        document.addEventListener(
            "mousemove",
            event => {

                if (
                    !GAME.mouse.active
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
        );

    }


    /* ========================================================
       FLASHLIGHT
    ======================================================== */

    function toggleFlashlight() {

        if (
            !GAME.flashlight
        ) {

            return;

        }


        GAME.flashlightOn =
            !GAME.flashlightOn;


        GAME.flashlight.visible =
            GAME.flashlightOn;


        const status =
            document.getElementById(
                "flashlightStatus"
            );


        if (status) {

            status.textContent =
                GAME.flashlightOn
                    ? "LIGHT ON"
                    : "LIGHT OFF";

        }

    }


    window.toggleFlashlight =
        toggleFlashlight;


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


        /*
         * Input vector
         */

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


        /*
         * Mobile joystick
         */

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


        /*
         * Crouch
         */

        GAME.playerCrouching =
            GAME.keys.crouch;


        /*
         * Sprint
         */

        const wantsRun =
            GAME.keys.sprint &&
            forward > 0 &&
            !GAME.playerCrouching &&
            GAME.stamina > 0 &&
            length > 0.05;


        GAME.playerRunning =
            wantsRun;


        let speed =
            CONFIG.walkSpeed;


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

        }


        /*
         * Stamina
         */

        if (
            GAME.playerRunning
        ) {

            GAME.stamina -=
                CONFIG.staminaDrain *
                delta;

        } else {

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


        /*
         * Movement relative to player yaw.
         */

        const yaw =
            GAME.player.rotation.y;


        const sin =
            Math.sin(yaw);


        const cos =
            Math.cos(yaw);


        const moveX =
            (
                strafe * cos +
                forward * sin
            ) * speed * delta;


        const moveZ =
            (
                -strafe * sin +
                forward * cos
            ) * speed * delta;


        movePlayer(
            moveX,
            moveZ
        );


        /*
         * Gravity
         */

        GAME.playerVelocity.y -=
            CONFIG.gravity *
            delta;


        GAME.player.position.y +=
            GAME.playerVelocity.y *
            delta;


        const targetHeight =
            GAME.playerCrouching
                ? CONFIG.crouchHeight
                : CONFIG.playerHeight;


        if (
            GAME.player.position.y <=
            targetHeight
        ) {

            GAME.player.position.y =
                targetHeight;


            GAME.playerVelocity.y =
                0;


            GAME.playerOnGround =
                true;

        } else {

            GAME.playerOnGround =
                false;

        }


        /*
         * Jump
         */

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

    }


    /* ========================================================
       HUD
    ======================================================== */

    function updateHUD(
        force = false
    ) {

        const now =
            performance.now();


        if (
            !force &&
            now -
            GAME.lastHUDUpdate <
            80
        ) {

            return;

        }


        GAME.lastHUDUpdate =
            now;


        const health =
            document.getElementById(
                "healthFill"
            );


        if (health) {

            health.style.width =
                `${GAME.health}%`;

        }


        const stamina =
            document.getElementById(
                "staminaFill"
            );


        if (stamina) {

            stamina.style.width =
                `${GAME.stamina}%`;

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


    window.updateHUD =
        updateHUD;


    /* ========================================================
       MESSAGE
    ======================================================== */

    function showMessage(
        message,
        duration = 1800
    ) {

        let element =
            document.getElementById(
                "k07Message"
            );


        if (!element) {

            element =
                document.createElement(
                    "div"
                );


            element.id =
                "k07Message";


            element.style.position =
                "fixed";

            element.style.left =
                "50%";

            element.style.bottom =
                "18%";

            element.style.transform =
                "translateX(-50%)";

            element.style.padding =
                "10px 18px";

            element.style.background =
                "rgba(0,0,0,.75)";

            element.style.border =
                "1px solid rgba(255,255,255,.15)";

            element.style.borderRadius =
                "5px";

            element.style.color =
                "#fff";

            element.style.fontFamily =
                "Arial,sans-serif";

            element.style.fontSize =
                "13px";

            element.style.zIndex =
                "9000";

            element.style.pointerEvents =
                "none";

            element.style.transition =
                "opacity .25s";


            document.body.appendChild(
                element
            );

        }


        element.textContent =
            message;


        element.style.opacity =
            "1";


        clearTimeout(
            element._timer
        );


        element._timer =
            setTimeout(
                () => {

                    element.style.opacity =
                        "0";

                },
                duration
            );

    }


    window.showMessage =
        showMessage;


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


        const width =
            Math.max(
                window.innerWidth,
                1
            );


        const height =
            Math.max(
                window.innerHeight,
                1
            );


        GAME.camera.aspect =
            width / height;


        GAME.camera.updateProjectionMatrix();


        GAME.renderer.setSize(
            width,
            height,
            false
        );


        const mobile =
            width <=
            CONFIG.mobileBreakpoint;


        if (
            mobile
        ) {

            GAME.renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    1.15
                )
            );

        } else {

            GAME.renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    CONFIG.maxPixelRatio
                )
            );

        }

    }


    window.resize =
        resize;


    window.addEventListener(
        "resize",
        resize,
        {
            passive: true
        }
    );


    /* ========================================================
       INITIALIZATION - NON BLOCKING
    ======================================================== */

    function initializeCore() {

        if (
            GAME.initialized
        ) {

            return true;

        }


        gameContainer =
            getGameContainer();


        createScene();

        createCamera();

        createRenderer();

        createLighting();

        createFlashlight();

        buildMansion();

        createPlayer();

        setupKeyboard();

        setupMouse();

        resize();


        GAME.initialized =
            true;


        GAME.running =
            true;


        GAME.paused =
            false;


        updateHUD(
            true
        );


        console.log(
            "KILLER 07: Core initialized."
        );


        return true;

    }


    /* ========================================================
       START
    ======================================================== */

    function startGame() {

        if (
            GAME.running
        ) {

            return;

        }


        if (
            !GAME.initialized
        ) {

            initializeCore();

        }


        GAME.running =
            true;

        GAME.paused =
            false;


        if (
            !GAME.clock
        ) {

            GAME.clock =
                new THREE.Clock();

        }


        GAME.clock.start();


        requestAnimationFrame(
            gameLoop
        );

    }


    window.startKiller07 =
        startGame;


    /* ========================================================
       GAME LOOP
    ======================================================== */

    function gameLoop(
        timestamp
    ) {

        if (
            !GAME.running
        ) {

            return;

        }


        requestAnimationFrame(
            gameLoop
        );


        let delta =
            GAME.clock
                ? GAME.clock.getDelta()
                : 0.016;


        delta =
            Math.min(
                delta,
                CONFIG.maxDelta
            );


        updatePlayer(
            delta
        );


        /*
         * Item animation,
         * interaction,
         * mobile systems,
         * and remaining gameplay
         * continue in PART 2-4.
         */

        if (
            GAME.renderer &&
            GAME.scene &&
            GAME.camera
        ) {

            GAME.renderer.render(
                GAME.scene,
                GAME.camera
            );

        }


        updateHUD();

    }


    /* ========================================================
       AUTO START
    ======================================================== */

    function boot() {

        if (
            GAME.loading
        ) {

            return;

        }


        GAME.loading =
            true;


        try {

            initializeCore();

        } catch (
            error
        ) {

            console.error(
                "KILLER 07 initialization error:",
                error
            );

            GAME.loading =
                false;

            return;

        }


        GAME.loading =
            false;


        /*
         * Start only after the first frame.
         * This prevents the light initialization
         * from blocking the browser UI.
         */

        requestAnimationFrame(
            () => {

                startGame();

            }
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once: true
            }
        );

    } else {

        boot();

    }


    /* ========================================================
       GLOBAL GAME API
    ======================================================== */

    window.KILLER07.start =
        startGame;


    window.KILLER07.stop =
        function() {

            GAME.running =
                false;

        };


    window.KILLER07.pause =
        function() {

            GAME.paused =
                true;

        };


    window.KILLER07.resume =
        function() {

            GAME.paused =
                false;

        };


})();
