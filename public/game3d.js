/* =========================================================
   KILLER ESCAPE 07
   GAME3D.JS
   3D HORROR GAME
   ========================================================= */

"use strict";


/* =========================================================
   THREE.JS CHECK
   ========================================================= */

if (
    typeof THREE ===
    "undefined"
) {

    console.error(
        "THREE.JS NOT LOADED"
    );

}


/* =========================================================
   GLOBAL GAME VARIABLES
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;
let clock = null;

let game3DContainer = null;

let player = null;
let killer = null;

let flashlight = null;

let flashlightOn = true;

let game3DStarted = false;

let animationFrame = null;

let keys = {};

let mobileMove = {
    up: false,
    down: false,
    left: false,
    right: false
};

let playerSpeed = 4;
let sprintSpeed = 7;

let isSprinting = false;

let collectedKeys = 0;

const totalKeys = 3;

let walls = [];

let doors = [];

let items = [];

let lamps = [];

let decorations = [];

let networkPlayers = {};

let audioContext = null;

let killerActive = false;

let attackCooldown = false;

let playerHealth = 100;

let lastTime = 0;

let gameData = {};

let cameraYaw = 0;


/* =========================================================
   START 3D GAME
   ========================================================= */

function start3DGame(data = {}) {

    if (
        typeof THREE ===
        "undefined"
    ) {

        console.error(
            "Three.js is unavailable."
        );

        showToast(
            "3D ENGINE NOT LOADED"
        );

        return;

    }


    /*
     * If game already exists,
     * don't create another renderer.
     */

    if (game3DStarted) {

        return;

    }


    gameData =
        data || {};

    game3DStarted =
        true;

    game3DContainer =
        document.getElementById(
            "game3D"
        );


    if (!game3DContainer) {

        console.error(
            "game3D container not found"
        );

        game3DStarted =
            false;

        return;

    }


    /*
     * Clear old canvas.
     */

    game3DContainer.innerHTML =
        "";


    /* =====================================================
       SCENE
       ===================================================== */

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x010101
        );

    scene.fog =
        new THREE.Fog(
            0x010101,
            8,
            42
        );


    /* =====================================================
       CAMERA
       ===================================================== */

    camera =
        new THREE.PerspectiveCamera(
            72,
            window.innerWidth /
            window.innerHeight,
            0.1,
            100
        );

    camera.position.set(
        0,
        1.7,
        7
    );


    /* =====================================================
       RENDERER
       ===================================================== */

    renderer =
        new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference:
                "high-performance"
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            1.5
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.shadowMap.enabled =
        false;


    game3DContainer.appendChild(
        renderer.domElement
    );


    /* =====================================================
       CLOCK
       ===================================================== */

    clock =
        new THREE.Clock();


    /* =====================================================
       LIGHTING
       ===================================================== */

    createLighting();


    /* =====================================================
       PLAYER
       ===================================================== */

    createPlayer();


    /* =====================================================
       MANSION
       ===================================================== */

    createMansion();


    /* =====================================================
       KEYS
       ===================================================== */

    createKeys();


    /* =====================================================
       KILLER
       ===================================================== */

    createKiller();


    /* =====================================================
       FLASHLIGHT
       ===================================================== */

    createFlashlight();


    /* =====================================================
       DECORATIONS
       ===================================================== */

    createDecorations();


    /* =====================================================
       CONTROLS
       ===================================================== */

    setupKeyboard();

    setupMobileControls();


    /* =====================================================
       WINDOW
       ===================================================== */

    window.removeEventListener(
        "resize",
        resizeGame
    );

    window.addEventListener(
        "resize",
        resizeGame
    );


    /* =====================================================
       INITIAL OBJECTIVE
       ===================================================== */

    collectedKeys =
        0;

    playerHealth =
        100;

    killerActive =
        false;

    attackCooldown =
        false;

    flashlightOn =
        true;


    updateHealth();

    updateObjective();


    showToast(
        "FIND 3 KEYS AND ESCAPE"
    );


    /* =====================================================
       LOOP
       ===================================================== */

    animate3D();

}


/* =========================================================
   LAUNCH GAME
   ========================================================= */

function launch3DGame(data = {}) {

    showScreen(
        "gameScreen"
    );


    setTimeout(
        () => {

            start3DGame(
                data
            );

        },
        50
    );

}


/* =========================================================
   LIGHTING
   ========================================================= */

function createLighting() {

    const ambient =
        new THREE.HemisphereLight(
            0x444444,
            0x050505,
            0.3
        );

    scene.add(
        ambient
    );


    const moon =
        new THREE.DirectionalLight(
            0x555555,
            0.15
        );

    moon.position.set(
        0,
        15,
        -10
    );

    scene.add(
        moon
    );


    /*
     * Red horror lamps
     */

    createLamp(
        -14,
        3.2,
        -12
    );

    createLamp(
        14,
        3.2,
        -12
    );

    createLamp(
        -14,
        3.2,
        12
    );

    createLamp(
        14,
        3.2,
        12
    );

}


/* =========================================================
   RED LAMP
   ========================================================= */

function createLamp(
    x,
    y,
    z
) {

    const light =
        new THREE.PointLight(
            0x8b1111,
            1.1,
            8
        );

    light.position.set(
        x,
        y,
        z
    );

    scene.add(
        light
    );

    lamps.push(
        light
    );

}


/* =========================================================
   PLAYER
   ========================================================= */

function createPlayer() {

    /*
     * Invisible player body.
     * Camera represents the player.
     */

    const geometry =
        new THREE.CapsuleGeometry(
            0.35,
            1,
            4,
            8
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x315b75
        });

    player =
        new THREE.Mesh(
            geometry,
            material
        );

    player.position.set(
        0,
        1.1,
        7
    );

    /*
     * Hide body in first person.
     */

    player.visible =
        false;

    scene.add(
        player
    );

}


/* =========================================================
   MANSION
   ========================================================= */

function createMansion() {

    walls = [];

    doors = [];


    /* =====================================================
       FLOOR
       ===================================================== */

    const floor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                40,
                0.3,
                40
            ),
            new THREE.MeshStandardMaterial({
                color: 0x181818,
                roughness: 1
            })
        );

    floor.position.y =
        -0.15;

    scene.add(
        floor
    );


    /* =====================================================
       CEILING
       ===================================================== */

    const ceiling =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                40,
                0.2,
                40
            ),
            new THREE.MeshStandardMaterial({
                color: 0x080808
            })
        );

    ceiling.position.y =
        5.1;

    scene.add(
        ceiling
    );


    /* =====================================================
       OUTER WALLS
       ===================================================== */

    createWall(
        0,
        2.5,
        -20,
        40,
        5,
        0.5
    );

    createWall(
        0,
        2.5,
        20,
        40,
        5,
        0.5
    );

    createWall(
        -20,
        2.5,
        0,
        0.5,
        5,
        40
    );

    createWall(
        20,
        2.5,
        0,
        0.5,
        5,
        40
    );


    /* =====================================================
       INNER WALLS
       ===================================================== */

    createWall(
        -8,
        2.5,
        -11,
        0.5,
        5,
        18
    );

    createWall(
        8,
        2.5,
        -11,
        0.5,
        5,
        18
    );


    createWall(
        -8,
        2.5,
        10,
        0.5,
        5,
        16
    );

    createWall(
        8,
        2.5,
        10,
        0.5,
        5,
        16
    );


    /*
     * Horizontal walls
     */

    createWall(
        -14,
        2.5,
        0,
        12,
        5,
        0.5
    );

    createWall(
        14,
        2.5,
        0,
        12,
        5,
        0.5
    );


    /* =====================================================
       EXIT DOOR
       ===================================================== */

    createExitDoor();


    /* =====================================================
       WINDOWS
       ===================================================== */

    createWindow(
        -19.7,
        2.8,
        -8
    );

    createWindow(
        19.7,
        2.8,
        8
    );

    createWindow(
        -19.7,
        2.8,
        8
    );

    createWindow(
        19.7,
        2.8,
        -8
    );

}


/* =========================================================
   WALL
   ========================================================= */

function createWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x292424,
            roughness: 1
        });


    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),
            material
        );


    mesh.position.set(
        x,
        y,
        z
    );


    scene.add(
        mesh
    );


    walls.push(
        mesh
    );


    return mesh;

}


/* =========================================================
   WINDOWS
   ========================================================= */

function createWindow(
    x,
    y,
    z
) {

    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                2,
                3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x061015,
                emissive: 0x010406
            })
        );

    mesh.position.set(
        x,
        y,
        z
    );

    scene.add(
        mesh
    );

}


/* =========================================================
   EXIT DOOR
   ========================================================= */

function createExitDoor() {

    const frameMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x3b0808
        });


    const door =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4,
                4,
                0.45
            ),
            frameMaterial
        );


    door.position.set(
        0,
        2,
        -19.65
    );


    scene.add(
        door
    );


    doors.push(
        door
    );


    /*
     * EXIT sign
     */

    const sign =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.2,
                0.45,
                0.12
            ),
            new THREE.MeshBasicMaterial({
                color: 0x770000
            })
        );

    sign.position.set(
        0,
        4.3,
        -19.35
    );

    scene.add(
        sign
    );

}


/* =========================================================
   KEYS
   ========================================================= */

function createKeys() {

    items = [];


    createKey(
        -14,
        1.1,
        -12
    );

    createKey(
        14,
        1.1,
        -12
    );

    createKey(
        14,
        1.1,
        12
    );

}


/* =========================================================
   KEY
   ========================================================= */

function createKey(
    x,
    y,
    z
) {

    const group =
        new THREE.Group();


    const ring =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.22,
                0.055,
                8,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffcc33,
                emissive: 0x442200,
                metalness: 0.7
            })
        );


    const stick =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.09,
                0.55,
                0.09
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffcc33,
                metalness: 0.7
            })
        );


    stick.position.y =
        -0.28;


    const tooth =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.18,
                0.08,
                0.09
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffcc33
            })
        );


    tooth.position.set(
        0.07,
        -0.5,
        0
    );


    group.add(
        ring
    );

    group.add(
        stick
    );

    group.add(
        tooth
    );


    group.position.set(
        x,
        y,
        z
    );


    scene.add(
        group
    );


    items.push({
        mesh: group,
        collected: false
    });

}


/* =========================================================
   KILLER
   ========================================================= */

function createKiller() {

    const group =
        new THREE.Group();


    /* BODY */

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.55,
                1.5,
                4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x130000
            })
        );


    body.position.y =
        1.1;


    group.add(
        body
    );


    /* HEAD */

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.4,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x080808
            })
        );


    head.position.y =
        2.25;


    group.add(
        head
    );


    /* EYES */

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xff0000
        });


    const eye1 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                6,
                6
            ),
            eyeMaterial
        );


    const eye2 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                6,
                6
            ),
            eyeMaterial
        );


    eye1.position.set(
        -0.14,
        2.3,
        -0.35
    );


    eye2.position.set(
        0.14,
        2.3,
        -0.35
    );


    group.add(
        eye1
    );

    group.add(
        eye2
    );


    killer =
        group;


    killer.position.set(
        0,
        0,
        -12
    );


    killer.visible =
        false;


    scene.add(
        killer
    );

}


/* =========================================================
   FLASHLIGHT
   ========================================================= */

function createFlashlight() {

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            5,
            24,
            Math.PI / 7,
            0.55,
            1
        );


    flashlight.position.set(
        0,
        0,
        0
    );


    camera.add(
        flashlight
    );


    const target =
        new THREE.Object3D();


    target.position.set(
        0,
        0,
        -15
    );


    camera.add(
        target
    );


    flashlight.target =
        target;


    scene.add(
        camera
    );

}


/* =========================================================
   DECORATIONS
   ========================================================= */

function createDecorations() {

    decorations = [];


    createTable(
        -14,
        -7
    );

    createTable(
        14,
        -7
    );

    createTable(
        -14,
        7
    );

    createTable(
        14,
        7
    );


    createChair(
        -12,
        -7
    );

    createChair(
        12,
        -7
    );

    createChair(
        -12,
        7
    );

    createChair(
        12,
        7
    );


    createRug(
        0,
        0
    );

}


/* =========================================================
   TABLE
   ========================================================= */

function createTable(
    x,
    z
) {

    const table =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                0.6,
                1.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x17100e
            })
        );


    table.position.set(
        x,
        0.45,
        z
    );


    scene.add(
        table
    );


    decorations.push(
        table
    );

}


/* =========================================================
   CHAIR
   ========================================================= */

function createChair(
    x,
    z
) {

    const chair =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                0.8,
                0.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x201515
            })
        );


    chair.position.set(
        x,
        0.4,
        z
    );


    scene.add(
        chair
    );

    decorations.push(
        chair
    );

}


/* =========================================================
   RUG
   ========================================================= */

function createRug(
    x,
    z
) {

    const rug =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                8,
                0.03,
                5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x170707
            })
        );


    rug.position.set(
        x,
        0.02,
        z
    );


    scene.add(
        rug
    );

}


/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        event => {

            keys[event.code] =
                true;


            if (
                event.code ===
                "ShiftLeft" ||
                event.code ===
                "ShiftRight"
            ) {

                isSprinting =
                    true;

            }


            if (
                event.code ===
                "KeyF"
            ) {

                toggleFlashlight();

            }


            if (
                event.code ===
                "KeyE"
            ) {

                interact();

            }


            /*
             * Prevent browser scrolling.
             */

            if (
                [
                    "KeyW",
                    "KeyA",
                    "KeyS",
                    "KeyD",
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight",
                    "Space"
                ].includes(
                    event.code
                )
            ) {

                event.preventDefault();

            }

        },
        {
            passive: false
        }
    );


    window.addEventListener(
        "keyup",
        event => {

            keys[event.code] =
                false;


            if (
                event.code ===
                "ShiftLeft" ||
                event.code ===
                "ShiftRight"
            ) {

                isSprinting =
                    false;

            }

        }
    );

}


/* =========================================================
   MOBILE
   ========================================================= */

function setupMobileControls() {

    setupHold(
        "moveUp",
        "up"
    );

    setupHold(
        "moveDown",
        "down"
    );

    setupHold(
        "moveLeft",
        "left"
    );

    setupHold(
        "moveRight",
        "right"
    );


    const sprint =
        document.getElementById(
            "sprintButton"
        );


    if (sprint) {

        sprint.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                isSprinting =
                    true;

            }
        );


        sprint.addEventListener(
            "pointerup",
            event => {

                event.preventDefault();

                isSprinting =
                    false;

            }
        );


        sprint.addEventListener(
            "pointercancel",
            () => {

                isSprinting =
                    false;

            }
        );

    }


    const flashlightButton =
        document.getElementById(
            "flashlightButton"
        );


    if (flashlightButton) {

        flashlightButton.onclick =
            toggleFlashlight;

    }


    const interactButton =
        document.getElementById(
            "interactButton"
        );


    if (interactButton) {

        interactButton.onclick =
            interact;

    }

}


/* =========================================================
   MOBILE HOLD
   ========================================================= */

function setupHold(
    id,
    direction
) {

    const button =
        document.getElementById(
            id
        );


    if (!button) return;


    const start =
        event => {

            event.preventDefault();

            mobileMove[
                direction
            ] =
                true;

        };


    const stop =
        event => {

            if (event) {
                event.preventDefault();
            }

            mobileMove[
                direction
            ] =
                false;

        };


    button.addEventListener(
        "pointerdown",
        start
    );


    button.addEventListener(
        "pointerup",
        stop
    );


    button.addEventListener(
        "pointercancel",
        stop
    );


    button.addEventListener(
        "pointerleave",
        stop
    );


    button.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

        }
    );

}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updatePlayer(
    delta
) {

    if (!player) return;


    let forward =
        0;

    let sideways =
        0;


    if (
        keys["KeyW"] ||
        keys["ArrowUp"] ||
        mobileMove.up
    ) {

        forward -= 1;

    }


    if (
        keys["KeyS"] ||
        keys["ArrowDown"] ||
        mobileMove.down
    ) {

        forward += 1;

    }


    if (
        keys["KeyA"] ||
        keys["ArrowLeft"] ||
        mobileMove.left
    ) {

        sideways -= 1;

    }


    if (
        keys["KeyD"] ||
        keys["ArrowRight"] ||
        mobileMove.right
    ) {

        sideways += 1;

    }


    const length =
        Math.hypot(
            forward,
            sideways
        );


    if (length > 0) {

        forward /=
            length;

        sideways /=
            length;

    }


    const speed =
        isSprinting
            ? sprintSpeed
            : playerSpeed;


    const oldX =
        player.position.x;

    const oldZ =
        player.position.z;


    player.position.z +=
        forward *
        speed *
        delta;


    player.position.x +=
        sideways *
        speed *
        delta;


    /* =====================================================
       WORLD BOUNDARY
       ===================================================== */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -18.2,
            18.2
        );


    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -18.2,
            18.2
        );


    /*
     * Basic wall collision.
     */

    if (
        isInsideWall(
            player.position.x,
            player.position.z
        )
    ) {

        player.position.x =
            oldX;

        player.position.z =
            oldZ;

    }


    /* =====================================================
       CAMERA
       ===================================================== */

    camera.position.x =
        player.position.x;

    camera.position.y =
        1.7;

    camera.position.z =
        player.position.z;


    camera.rotation.order =
        "YXZ";


    camera.rotation.y =
        0;

    camera.rotation.x =
        0;

}


/* =========================================================
   WALL COLLISION
   ========================================================= */

function isInsideWall(
    x,
    z
) {

    const padding =
        0.55;


    for (
        const wall of walls
    ) {

        if (!wall)
            continue;


        const box =
            new THREE.Box3()
                .setFromObject(
                    wall
                );


        if (
            x >
            box.min.x -
            padding &&

            x <
            box.max.x +
            padding &&

            z >
            box.min.z -
            padding &&

            z <
            box.max.z +
            padding
        ) {

            return true;

        }

    }


    return false;

}


/* =========================================================
   ITEM CHECK
   ========================================================= */

function checkItems() {

    if (!player)
        return;


    for (
        const item of items
    ) {

        if (
            item.collected
        ) {

            continue;

        }


        const distance =
            player.position.distanceTo(
                item.mesh.position
            );


        if (
            distance <
            1.6
        ) {

            item.collected =
                true;

            item.mesh.visible =
                false;

            collectedKeys++;


            playSound(
                720,
                0.18
            );


            showToast(
                "KEY FOUND! " +
                collectedKeys +
                "/" +
                totalKeys
            );


            updateObjective();


            /*
             * Killer activates after
             * first key.
             */

            if (
                collectedKeys ===
                1
            ) {

                activateKiller();

            }

        }

    }

}


/* =========================================================
   KILLER ACTIVATION
   ========================================================= */

function activateKiller() {

    if (
        killerActive
    ) {

        return;

    }


    killerActive =
        true;


    if (killer) {

        killer.visible =
            true;

    }


    showToast(
        "SOMETHING IS HUNTING YOU..."
    );


    playSound(
        75,
        0.8
    );

}


/* =========================================================
   KILLER AI
   ========================================================= */

function updateKiller(
    delta
) {

    if (
        !killer ||
        !killerActive ||
        !player
    ) {

        return;

    }


    const distance =
        killer.position.distanceTo(
            player.position
        );


    /*
     * Killer only follows within
     * reasonable distance.
     */

    if (
        distance <
        25
    ) {

        const direction =
            new THREE.Vector3()
                .subVectors(
                    player.position,
                    killer.position
                );


        direction.y =
            0;


        if (
            direction.length() >
            0.01
        ) {

            direction.normalize();


            const killerSpeed =
                1.5;


            killer.position.add(
                direction.multiplyScalar(
                    killerSpeed *
                    delta
                )
            );


            killer.lookAt(
                player.position.x,
                killer.position.y,
                player.position.z
            );

        }

    }


    /*
     * Attack.
     */

    if (
        distance <
        1.5
    ) {

        killerAttack();

    }

}


/* =========================================================
   KILLER ATTACK
   ========================================================= */

function killerAttack() {

    if (
        attackCooldown
    ) {

        return;

    }


    attackCooldown =
        true;


    playerHealth -=
        35;


    updateHealth();


    showJumpscare();


    if (
        playerHealth <=
        0
    ) {

        setTimeout(
            () => {

                gameOver();

            },
            900
        );

    }
    else {

        setTimeout(
            () => {

                attackCooldown =
                    false;

            },
            2000
        );

    }

}


/* =========================================================
   JUMPSCARE
   ========================================================= */

function showJumpscare() {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "jumpscareOverlay";


    overlay.style.position =
        "fixed";

    overlay.style.inset =
        "0";

    overlay.style.zIndex =
        "999999";

    overlay.style.background =
        "radial-gradient(circle,#880000,#000 70%)";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.fontSize =
        "100px";

    overlay.style.color =
        "white";

    overlay.style.textShadow =
        "0 0 40px red";


    overlay.innerHTML =
        "👹";


    document.body.appendChild(
        overlay
    );


    playSound(
        65,
        0.9
    );


    setTimeout(
        () => {

            if (
                overlay.parentNode
            ) {

                overlay.remove();

            }

        },
        700
    );

}


/* =========================================================
   FLASHLIGHT
   ========================================================= */

function toggleFlashlight() {

    flashlightOn =
        !flashlightOn;


    if (flashlight) {

        flashlight.visible =
            flashlightOn;

    }


    showToast(
        flashlightOn
            ? "FLASHLIGHT ON"
            : "FLASHLIGHT OFF"
    );

}


/* =========================================================
   INTERACT
   ========================================================= */

function interact() {

    checkItems();

    checkEscape();

    playSound(
        220,
        0.08
    );

}


/* =========================================================
   ESCAPE
   ========================================================= */

function checkEscape() {

    if (!player)
        return;


    if (
        collectedKeys <
        totalKeys
    ) {

        return;

    }


    if (
        player.position.z <
        -17
    ) {

        showToast(
            "ESCAPE SUCCESSFUL!"
        );


        const objective =
            document.getElementById(
                "objectiveHUD"
            );


        if (objective) {

            objective.textContent =
                "ESCAPED THE MANSION";

        }


        game3DStarted =
            false;


        setTimeout(
            () => {

                alert(
                    "YOU ESCAPED THE MANSION!"
                );

            },
            300
        );

    }

}


/* =========================================================
   OBJECTIVE
   ========================================================= */

function updateObjective() {

    const objective =
        document.getElementById(
            "objectiveHUD"
        );


    if (!objective)
        return;


    if (
        collectedKeys ===
        0
    ) {

        objective.textContent =
            "OBJECTIVE: FIND THE FIRST KEY";

    }
    else if (
        collectedKeys <
        totalKeys
    ) {

        objective.textContent =
            "OBJECTIVE: FIND KEYS " +
            collectedKeys +
            "/" +
            totalKeys;

    }
    else {

        objective.textContent =
            "OBJECTIVE: ESCAPE THROUGH THE MAIN DOOR";

    }

}


/* =========================================================
   HEALTH
   ========================================================= */

function updateHealth() {

    const healthBar =
        document.getElementById(
            "healthBar"
        );


    if (!healthBar)
        return;


    healthBar.style.width =
        Math.max(
            0,
            playerHealth
        ) +
        "%";

}


/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    game3DStarted =
        false;


    showToast(
        "YOU DIED"
    );


    setTimeout(
        () => {

            alert(
                "YOU DIED — THE KILLER CAUGHT YOU."
            );


            stop3DGame();


            showScreen(
                "lobbyScreen"
            );

        },
        300
    );

}


/* =========================================================
   SOUND
   ========================================================= */

function playSound(
    frequency,
    duration
) {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();

        }


        const oscillator =
            audioContext.createOscillator();


        const gain =
            audioContext.createGain();


        oscillator.type =
            "sawtooth";


        oscillator.frequency.value =
            frequency;


        gain.gain.setValueAtTime(
            0.08,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime +
            duration
        );


        oscillator.connect(
            gain
        );


        gain.connect(
            audioContext.destination
        );


        oscillator.start();


        oscillator.stop(
            audioContext.currentTime +
            duration
        );

    }
    catch (error) {

        console.log(
            "Audio unavailable"
        );

    }

}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeGame() {

    if (
        !camera ||
        !renderer
    ) {

        return;

    }


    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            1.5
        )
    );

}


/* =========================================================
   NETWORK PLAYERS
   ========================================================= */

function updateNetworkPlayers(
    data
) {

    if (!data)
        return;


    /*
     * This function is intentionally
     * lightweight so the game doesn't lag.
     */

    if (
        Array.isArray(
            data.players
        )
    ) {

        data.players.forEach(
            remote => {

                if (
                    remote.id ===
                    socket.id
                ) {

                    return;

                }


                if (
                    !networkPlayers[
                        remote.id
                    ]
                ) {

                    const mesh =
                        createRemotePlayer(
                            remote
                        );


                    networkPlayers[
                        remote.id
                    ] =
                        mesh;

                }

            }
        );

    }

}


/* =========================================================
   REMOTE PLAYER
   ========================================================= */

function createRemotePlayer(
    data
) {

    const material =
        new THREE.MeshStandardMaterial({
            color:
                data.role ===
                "killer"
                    ? 0x8b0000
                    : 0x315b75
        });


    const mesh =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.3,
                0.9,
                4,
                8
            ),
            material
        );


    mesh.position.set(
        0,
        1,
        0
    );


    scene.add(
        mesh
    );


    return mesh;

}


/* =========================================================
   ANIMATION
   ========================================================= */

function animate3D() {

    animationFrame =
        requestAnimationFrame(
            animate3D
        );


    if (
        !game3DStarted ||
        !renderer ||
        !scene ||
        !camera
    ) {

        return;

    }


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    updatePlayer(
        delta
    );


    checkItems();


    updateKiller(
        delta
    );


    checkEscape();


    /*
     * Animate keys.
     */

    for (
        const item of items
    ) {

        if (
            !item.collected &&
            item.mesh.visible
        ) {

            item.mesh.rotation.y +=
                delta * 2;


            item.mesh.position.y =
                1.1 +
                Math.sin(
                    performance.now() *
                    0.003
                ) *
                0.12;

        }

    }


    /*
     * Slight flashlight movement.
     */

    if (
        flashlight &&
        flashlightOn
    ) {

        flashlight.intensity =
            4.5 +
            Math.sin(
                performance.now() *
                0.01
            ) *
            0.15;

    }


    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   STOP GAME
   ========================================================= */

function stop3DGame() {

    game3DStarted =
        false;


    if (
        animationFrame
    ) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame =
            null;

    }


    if (
        renderer
    ) {

        renderer.dispose();

        if (
            renderer.domElement &&
            renderer.domElement.parentNode
        ) {

            renderer.domElement.parentNode
                .removeChild(
                    renderer.domElement
                );

        }

    }


    scene =
        null;

    camera =
        null;

    renderer =
        null;

    clock =
        null;

    player =
        null;

    killer =
        null;

    flashlight =
        null;

    walls =
        [];

    doors =
        [];

    items =
        [];

    lamps =
        [];

    decorations =
        [];

    networkPlayers =
        {};

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.start3DGame =
    start3DGame;

window.launch3DGame =
    launch3DGame;

window.stop3DGame =
    stop3DGame;

window.toggleFlashlight =
    toggleFlashlight;

window.interact =
    interact;

window.updateNetworkPlayers =
    updateNetworkPlayers;
