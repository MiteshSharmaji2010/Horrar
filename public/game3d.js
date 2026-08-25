// =========================================================
// KILLER ESCAPE 07
// game3d.js
// FULL 3D HORROR GAME
// =========================================================

let scene = null;
let camera = null;
let renderer = null;
let clock = null;

let player = null;
let killer = null;

let flashlight = null;
let flashlightTarget = null;

let gameStarted3D = false;
let killerActive = false;
let flashlightOn = true;

let keys = {};
let mobileMove = {
    up: false,
    down: false,
    left: false,
    right: false
};

let walls = [];
let doors = [];
let items = [];

let collectedKeys = 0;
const totalKeys = 3;

let playerHealth = 100;
let playerLives = 3;

let playerSpeed = 3.5;
let sprintSpeed = 6;

let isSprinting = false;
let attackCooldown = false;
let exitUnlocked = false;

let audioContext = null;

let lastDamageTime = 0;
let lastToastTime = 0;


// =========================================================
// START 3D GAME
// =========================================================

function start3DGame() {

    if (gameStarted3D) {
        return;
    }

    const container =
        document.getElementById("game3D");

    if (!container) {
        console.error("ERROR: #game3D not found");
        return;
    }

    if (typeof THREE === "undefined") {

        console.error(
            "ERROR: Three.js is not loaded."
        );

        showToast(
            "3D ENGINE LOAD ERROR"
        );

        return;
    }

    gameStarted3D = true;

    container.innerHTML = "";

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x010101);

    scene.fog =
        new THREE.Fog(
            0x010101,
            4,
            45
        );


    // =====================================================
    // CAMERA
    // =====================================================

    camera =
        new THREE.PerspectiveCamera(
            75,
            window.innerWidth /
            window.innerHeight,
            0.1,
            100
        );

    camera.position.set(
        0,
        1.7,
        8
    );


    // =====================================================
    // RENDERER
    // =====================================================

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
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

    renderer.shadowMap.enabled = false;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    container.appendChild(
        renderer.domElement
    );


    // =====================================================
    // CLOCK
    // =====================================================

    clock =
        new THREE.Clock();


    // =====================================================
    // LIGHTING
    // =====================================================

    createLighting();


    // =====================================================
    // PLAYER
    // =====================================================

    createPlayer();


    // =====================================================
    // MANSION
    // =====================================================

    createMansion();


    // =====================================================
    // ITEMS
    // =====================================================

    createKeys();


    // =====================================================
    // KILLER
    // =====================================================

    createKiller();


    // =====================================================
    // FLASHLIGHT
    // =====================================================

    createFlashlight();


    // =====================================================
    // CONTROLS
    // =====================================================

    setupKeyboard();

    setupMobileControls();


    // =====================================================
    // RESIZE
    // =====================================================

    window.addEventListener(
        "resize",
        resizeGame
    );


    // =====================================================
    // RESET GAME
    // =====================================================

    resetGameState();


    // =====================================================
    // START MESSAGE
    // =====================================================

    showToast(
        "YOU ARE TRAPPED INSIDE THE MANSION"
    );


    updateObjective();


    // =====================================================
    // LOOP
    // =====================================================

    animate();
}


// =========================================================
// RESET
// =========================================================

function resetGameState() {

    collectedKeys = 0;

    playerHealth = 100;

    playerLives = 3;

    killerActive = false;

    flashlightOn = true;

    exitUnlocked = false;

    attackCooldown = false;

    lastDamageTime = 0;

    if (player) {

        player.position.set(
            0,
            1.1,
            8
        );
    }

    if (killer) {

        killer.position.set(
            0,
            0,
            -12
        );

        killer.visible = false;
    }

    items.forEach(
        item => {

            item.collected = false;

            item.mesh.visible = true;

        }
    );

    if (flashlight) {

        flashlight.visible = true;
    }

    updateHealthHUD();

    updateObjective();
}


// =========================================================
// LIGHTING
// =========================================================

function createLighting() {

    const ambient =
        new THREE.HemisphereLight(
            0x555555,
            0x050505,
            0.28
        );

    scene.add(
        ambient
    );


    const moon =
        new THREE.DirectionalLight(
            0x8888aa,
            0.15
        );

    moon.position.set(
        0,
        10,
        0
    );

    scene.add(
        moon
    );
}


// =========================================================
// PLAYER
// =========================================================

function createPlayer() {

    const geometry =
        new THREE.CapsuleGeometry(
            0.35,
            1.0,
            4,
            8
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x315b75,
            roughness: 1
        });

    player =
        new THREE.Mesh(
            geometry,
            material
        );

    player.position.set(
        0,
        1.1,
        8
    );

    player.visible = false;

    scene.add(
        player
    );
}


// =========================================================
// MANSION
// =========================================================

function createMansion() {

    walls = [];
    doors = [];


    const floorMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x191919,
            roughness: 1
        });


    const floor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                40,
                0.3,
                40
            ),
            floorMaterial
        );

    floor.position.y = -0.15;

    scene.add(
        floor
    );


    // =====================================================
    // OUTER WALLS
    // =====================================================

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


    // =====================================================
    // INNER WALLS
    // =====================================================

    createWall(
        -8,
        2.5,
        -10,
        0.5,
        5,
        15
    );

    createWall(
        8,
        2.5,
        -10,
        0.5,
        5,
        15
    );

    createWall(
        -8,
        2.5,
        7,
        0.5,
        5,
        10
    );

    createWall(
        8,
        2.5,
        7,
        0.5,
        5,
        10
    );


    // =====================================================
    // HALL
    // =====================================================

    createWall(
        -13,
        2.5,
        0,
        10,
        5,
        0.5
    );

    createWall(
        13,
        2.5,
        0,
        10,
        5,
        0.5
    );


    // =====================================================
    // ROOMS
    // =====================================================

    createRoom(
        -14,
        -12,
        "BEDROOM"
    );

    createRoom(
        14,
        -12,
        "LIBRARY"
    );

    createRoom(
        -14,
        12,
        "STORAGE"
    );

    createRoom(
        14,
        12,
        "SECRET ROOM"
    );


    // =====================================================
    // EXIT
    // =====================================================

    createExitDoor();


    // =====================================================
    // WINDOWS
    // =====================================================

    createWindow(
        -19.7,
        3,
        -7
    );

    createWindow(
        19.7,
        3,
        7
    );
}


// =========================================================
// WALL
// =========================================================

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
            color: 0x302a2a,
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


// =========================================================
// ROOM
// =========================================================

function createRoom(
    x,
    z,
    name
) {

    const lamp =
        new THREE.PointLight(
            0x8b2020,
            0.7,
            7
        );

    lamp.position.set(
        x,
        3.5,
        z
    );

    scene.add(
        lamp
    );


    const table =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2,
                0.7,
                1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x211616
            })
        );

    table.position.set(
        x,
        0.5,
        z
    );

    scene.add(
        table
    );


    // Room carpet

    const carpet =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4,
                0.03,
                3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x241010
            })
        );

    carpet.position.set(
        x,
        0.02,
        z
    );

    scene.add(
        carpet
    );
}


// =========================================================
// WINDOW
// =========================================================

function createWindow(
    x,
    y,
    z
) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x061016,
            emissive: 0x02080c
        });

    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                2,
                3
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
}


// =========================================================
// EXIT DOOR
// =========================================================

function createExitDoor() {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x451010,
            roughness: 0.9
        });

    const door =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3,
                4,
                0.4
            ),
            material
        );

    door.position.set(
        0,
        2,
        -19.6
    );

    scene.add(
        door
    );

    doors.push(
        door
    );


    // Door light

    const light =
        new THREE.PointLight(
            0xff0000,
            0.5,
            5
        );

    light.position.set(
        0,
        3,
        -18.8
    );

    scene.add(
        light
    );
}


// =========================================================
// KEYS
// =========================================================

function createKeys() {

    items = [];

    createKey(
        -14,
        1,
        -12
    );

    createKey(
        14,
        1,
        -12
    );

    createKey(
        14,
        1,
        12
    );
}


// =========================================================
// CREATE KEY
// =========================================================

function createKey(
    x,
    y,
    z
) {

    const group =
        new THREE.Group();


    const goldMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffcc33,
            emissive: 0x553300,
            metalness: 0.8,
            roughness: 0.3
        });


    const ring =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.22,
                0.055,
                8,
                16
            ),
            goldMaterial
        );

    group.add(
        ring
    );


    const stick =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.08,
                0.5,
                0.08
            ),
            goldMaterial
        );

    stick.position.y =
        -0.25;

    group.add(
        stick
    );


    const tooth =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.18,
                0.08,
                0.08
            ),
            goldMaterial
        );

    tooth.position.set(
        0.07,
        -0.43,
        0
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


// =========================================================
// KILLER
// =========================================================

function createKiller() {

    const group =
        new THREE.Group();


    // BODY

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.5,
                1.4,
                4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x120000,
                roughness: 1
            })
        );

    body.position.y =
        1.2;

    group.add(
        body
    );


    // HEAD

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.38,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x080808,
                roughness: 1
            })
        );

    head.position.y =
        2.25;

    group.add(
        head
    );


    // EYES

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xff0000
        });


    const eye1 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),
            eyeMaterial
        );

    eye1.position.set(
        -0.13,
        2.29,
        -0.34
    );

    group.add(
        eye1
    );


    const eye2 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),
            eyeMaterial
        );

    eye2.position.set(
        0.13,
        2.29,
        -0.34
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


// =========================================================
// FLASHLIGHT
// =========================================================

function createFlashlight() {

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            5,
            25,
            Math.PI / 7,
            0.45,
            1
        );

    flashlight.position.set(
        0,
        1.6,
        0
    );


    flashlightTarget =
        new THREE.Object3D();

    flashlightTarget.position.set(
        0,
        1.4,
        -10
    );


    camera.add(
        flashlight
    );

    camera.add(
        flashlightTarget
    );


    flashlight.target =
        flashlightTarget;


    scene.add(
        camera
    );
}


// =========================================================
// KEYBOARD
// =========================================================

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        function(event) {

            keys[event.code] =
                true;


            if (
                event.code === "ShiftLeft" ||
                event.code === "ShiftRight"
            ) {

                isSprinting =
                    true;
            }


            if (
                event.code === "KeyF"
            ) {

                toggleFlashlight();
            }


            if (
                event.code === "KeyE"
            ) {

                interact();
            }


            if (
                event.code === "Escape"
            ) {

                toggleFlashlight();
            }

        }
    );


    window.addEventListener(
        "keyup",
        function(event) {

            keys[event.code] =
                false;


            if (
                event.code === "ShiftLeft" ||
                event.code === "ShiftRight"
            ) {

                isSprinting =
                    false;
            }

        }
    );
}


// =========================================================
// MOBILE CONTROLS
// =========================================================

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
            function(event) {

                event.preventDefault();

                isSprinting = true;

            }
        );


        sprint.addEventListener(
            "pointerup",
            function(event) {

                event.preventDefault();

                isSprinting = false;

            }
        );


        sprint.addEventListener(
            "pointercancel",
            function() {

                isSprinting = false;

            }
        );

    }


    const flashlightButton =
        document.getElementById(
            "flashlightButton"
        );

    if (flashlightButton) {

        flashlightButton.addEventListener(
            "click",
            toggleFlashlight
        );

    }


    const interactButton =
        document.getElementById(
            "interactButton"
        );

    if (interactButton) {

        interactButton.addEventListener(
            "click",
            interact
        );

    }
}


// =========================================================
// HOLD CONTROL
// =========================================================

function setupHold(
    id,
    direction
) {

    const button =
        document.getElementById(
            id
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            mobileMove[direction] =
                true;

        }
    );


    button.addEventListener(
        "pointerup",
        function(event) {

            event.preventDefault();

            mobileMove[direction] =
                false;

        }
    );


    button.addEventListener(
        "pointercancel",
        function() {

            mobileMove[direction] =
                false;

        }
    );


    button.addEventListener(
        "pointerleave",
        function() {

            mobileMove[direction] =
                false;

        }
    );
}


// =========================================================
// PLAYER MOVEMENT
// =========================================================

function updatePlayer(delta) {

    if (!player) {
        return;
    }


    let forward = 0;

    let sideways = 0;


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
        Math.sqrt(
            forward * forward +
            sideways * sideways
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


    // =====================================================
    // WORLD BOUNDARY
    // =====================================================

    player.position.x =
        Math.max(
            -18,
            Math.min(
                18,
                player.position.x
            )
        );


    player.position.z =
        Math.max(
            -18,
            Math.min(
                18,
                player.position.z
            )
        );


    // =====================================================
    // WALL COLLISION
    // =====================================================

    if (
        checkWallCollision()
    ) {

        player.position.x =
            oldX;

        player.position.z =
            oldZ;
    }


    // =====================================================
    // CAMERA
    // =====================================================

    camera.position.x =
        player.position.x;

    camera.position.z =
        player.position.z + 5;

    camera.position.y =
        1.7;


    camera.lookAt(
        player.position.x,
        1.5,
        player.position.z - 10
    );
}


// =========================================================
// WALL COLLISION
// =========================================================

function checkWallCollision() {

    const radius = 0.45;


    const px =
        player.position.x;

    const pz =
        player.position.z;


    for (
        const wall of walls
    ) {

        const box =
            new THREE.Box3()
                .setFromObject(wall);


        if (
            px > box.min.x - radius &&
            px < box.max.x + radius &&
            pz > box.min.z - radius &&
            pz < box.max.z + radius
        ) {

            return true;
        }
    }


    return false;
}


// =========================================================
// ITEM CHECK
// =========================================================

function checkItems() {

    if (!player) {
        return;
    }


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
            distance < 1.5
        ) {

            collectItem(
                item
            );
        }
    }
}


// =========================================================
// COLLECT ITEM
// =========================================================

function collectItem(item) {

    if (
        item.collected
    ) {
        return;
    }


    item.collected =
        true;


    item.mesh.visible =
        false;


    collectedKeys++;


    playSound(
        700,
        0.15
    );


    showToast(
        "KEY FOUND! " +
        collectedKeys +
        "/" +
        totalKeys
    );


    updateObjective();
}


// =========================================================
// ESCAPE
// =========================================================

function checkEscape() {

    if (!player) {
        return;
    }


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

        if (!exitUnlocked) {

            exitUnlocked =
                true;

            unlockExitDoor();

            showToast(
                "MAIN EXIT UNLOCKED!"
            );

            updateObjective();

        }

        if (
            player.position.z <
            -18
        ) {

            escapeGame();
        }
    }
}


// =========================================================
// UNLOCK EXIT
// =========================================================

function unlockExitDoor() {

    if (
        doors.length === 0
    ) {
        return;
    }


    const door =
        doors[0];


    door.material.color.set(
        0x123d16
    );


    const light =
        new THREE.PointLight(
            0x00ff55,
            1,
            7
        );

    light.position.set(
        0,
        2,
        -18.5
    );

    scene.add(
        light
    );
}


// =========================================================
// ESCAPE GAME
// =========================================================

function escapeGame() {

    if (!gameStarted3D) {
        return;
    }


    gameStarted3D =
        false;


    showToast(
        "YOU ESCAPED THE MANSION!"
    );


    playSound(
        900,
        0.4
    );


    setTimeout(
        function() {

            alert(
                "🎉 YOU ESCAPED!\n\nKILLER ESCAPE 07"
            );

        },
        500
    );
}


// =========================================================
// KILLER AI
// =========================================================

function updateKiller(delta) {

    if (
        !killer ||
        !player
    ) {

        return;
    }


    // Killer starts after first key

    if (
        collectedKeys >= 1 &&
        !killerActive
    ) {

        killerActive =
            true;

        killer.visible =
            true;


        showToast(
            "SOMETHING IS HUNTING YOU..."
        );


        playSound(
            90,
            0.6
        );
    }


    if (!killerActive) {
        return;
    }


    const distance =
        killer.position.distanceTo(
            player.position
        );


    if (
        distance < 18
    ) {

        const direction =
            new THREE.Vector3()
                .subVectors(
                    player.position,
                    killer.position
                )
                .normalize();


        killer.position.add(
            direction.multiplyScalar(
                1.2 *
                delta
            )
        );


        killer.lookAt(
            player.position.x,
            1.2,
            player.position.z
        );
    }


    if (
        distance < 1.5
    ) {

        killerAttack();
    }
}


// =========================================================
// KILLER ATTACK
// =========================================================

function killerAttack() {

    if (attackCooldown) {
        return;
    }


    attackCooldown =
        true;


    playerHealth -= 35;


    updateHealthHUD();


    showJumpscare();


    if (
        playerHealth <= 0
    ) {

        playerLives--;


        if (
            playerLives <= 0
        ) {

            gameOver();

        }
        else {

            playerHealth =
                100;


            player.position.set(
                0,
                1.1,
                8
            );


            killer.position.set(
                0,
                0,
                -12
            );


            showToast(
                "YOU WERE CAUGHT! LIVES LEFT: " +
                playerLives
            );


            updateHealthHUD();
        }
    }


    setTimeout(
        function() {

            attackCooldown =
                false;

        },
        1800
    );
}


// =========================================================
// GAME OVER
// =========================================================

function gameOver() {

    gameStarted3D =
        false;


    showJumpscare();


    setTimeout(
        function() {

            alert(
                "YOU DIED!\n\nTHE KILLER GOT YOU."
            );


            if (
                typeof showScreen ===
                "function"
            ) {

                showScreen(
                    "lobbyScreen"
                );
            }

        },
        1000
    );
}


// =========================================================
// JUMPSCARE
// =========================================================

function showJumpscare() {

    const old =
        document.getElementById(
            "jumpscareOverlay"
        );


    if (old) {
        old.remove();
    }


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
        "radial-gradient(circle,#700000,#000)";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.flexDirection =
        "column";

    overlay.style.color =
        "white";


    overlay.innerHTML = `
        <div style="
            font-size:110px;
            filter:drop-shadow(0 0 35px red);
            animation:jumpscareShake .08s infinite;
        ">
            👹
        </div>

        <div style="
            margin-top:15px;
            font-size:24px;
            font-weight:900;
            letter-spacing:4px;
            color:#ff3333;
        ">
            THE KILLER FOUND YOU
        </div>
    `;


    if (
        !document.getElementById(
            "jumpscareStyle"
        )
    ) {

        const style =
            document.createElement(
                "style"
            );


        style.id =
            "jumpscareStyle";


        style.textContent = `
            @keyframes jumpscareShake {
                0% {
                    transform:translate(0,0) scale(1);
                }
                25% {
                    transform:translate(-12px,8px) scale(1.08);
                }
                50% {
                    transform:translate(10px,-10px) scale(1.15);
                }
                75% {
                    transform:translate(-8px,-5px) scale(1.08);
                }
                100% {
                    transform:translate(0,0) scale(1);
                }
            }
        `;


        document.head.appendChild(
            style
        );
    }


    document.body.appendChild(
        overlay
    );


    playSound(
        80,
        0.9
    );


    setTimeout(
        function() {

            if (overlay.parentNode) {
                overlay.remove();
            }

        },
        900
    );
}


// =========================================================
// FLASHLIGHT
// =========================================================

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


// =========================================================
// INTERACT
// =========================================================

function interact() {

    checkItems();

    checkEscape();
}


// =========================================================
// OBJECTIVE
// =========================================================

function updateObjective() {

    const objective =
        document.getElementById(
            "objectiveHUD"
        );


    if (!objective) {
        return;
    }


    if (
        collectedKeys === 0
    ) {

        objective.textContent =
            "OBJECTIVE: FIND THE FIRST KEY";

    }
    else if (
        collectedKeys < totalKeys
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


// =========================================================
// HEALTH HUD
// =========================================================

function updateHealthHUD() {

    const healthBar =
        document.getElementById(
            "healthBar"
        );


    if (healthBar) {

        healthBar.style.width =
            Math.max(
                0,
                playerHealth
            ) +
            "%";
    }


    const playerCount =
        document.getElementById(
            "gamePlayerCount"
        );


    if (
        playerCount &&
        typeof roomData !==
        "undefined" &&
        roomData &&
        roomData.players
    ) {

        playerCount.textContent =
            roomData.players.length;
    }
}


// =========================================================
// TOAST
// =========================================================

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.gameToastTimer
    );


    window.gameToastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


// =========================================================
// SOUND
// =========================================================

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
    catch(error) {

        console.log(
            "Audio unavailable",
            error
        );
    }
}


// =========================================================
// RESIZE
// =========================================================

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
}


// =========================================================
// ANIMATION
// =========================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    if (
        !gameStarted3D
    ) {

        return;
    }


    if (
        !clock ||
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


    // =====================================================
    // KEY ANIMATION
    // =====================================================

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
                1 +
                Math.sin(
                    performance.now() *
                    0.003
                ) *
                0.1;
        }
    }


    renderer.render(
        scene,
        camera
    );
}


// =========================================================
// LAUNCH 3D GAME
// =========================================================

function launch3DGame() {

    if (
        typeof showScreen ===
        "function"
    ) {

        showScreen(
            "gameScreen"
        );
    }


    setTimeout(
        function() {

            start3DGame();

        },
        100
    );
}


// =========================================================
// CONNECT WITH EXISTING START BUTTON
// =========================================================
//
// IMPORTANT:
// client.js ke startGame() ko directly replace
// nahi karenge. Server start hone ke baad
// "gameStarted" event par client.js ko
// launch3DGame() call karna chahiye.
//
// Agar client.js se gameStarted event aa raha hai,
// to ye function available rahega.
// =========================================================

window.launch3DGame =
    launch3DGame;


// =========================================================
// OPTIONAL DIRECT START
// =========================================================

window.start3DGame =
    start3DGame;


// =========================================================
// DEBUG
// =========================================================

console.log(
    "Killer Escape 07 - game3d.js loaded successfully"
);
