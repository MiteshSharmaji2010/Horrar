/* =========================================================
   KILLER ESCAPE 07
   3D HORROR GAME - VERSION 1
   ========================================================= */

let scene;
let camera;
let renderer;
let clock;

let player;
let killer;

let flashlight;
let flashlightOn = true;

let keys = {};
let mobileMove = {
    up: false,
    down: false,
    left: false,
    right: false
};

let playerSpeed = 3.5;
let sprintSpeed = 6;

let isSprinting = false;

let collectedKeys = 0;
let totalKeys = 3;

let gameStarted = false;
let killerActive = false;

let walls = [];
let doors = [];
let items = [];

let audioContext;


/* =========================================================
   START GAME
   ========================================================= */

function start3DGame() {

    if (gameStarted) return;

    gameStarted = true;

    const container = document.getElementById("game3D");

    if (!container) {
        console.error("game3D container not found");
        return;
    }

    container.innerHTML = "";

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x020202);

    scene.fog = new THREE.Fog(
        0x020202,
        5,
        45
    );


    /* CAMERA */

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );

    camera.position.set(
        0,
        1.7,
        8
    );


    /* RENDERER */

    renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = false;

    container.appendChild(
        renderer.domElement
    );


    clock = new THREE.Clock();


    /* LIGHT */

    const ambient = new THREE.HemisphereLight(
        0x555555,
        0x050505,
        0.35
    );

    scene.add(ambient);


    /* PLAYER */

    createPlayer();


    /* MANSION */

    createMansion();


    /* ITEMS */

    createKeys();


    /* KILLER */

    createKiller();


    /* FLASHLIGHT */

    createFlashlight();


    /* EVENTS */

    setupKeyboard();

    setupMobileControls();

    window.addEventListener(
        "resize",
        resizeGame
    );


    showToast(
        "You are trapped inside the mansion..."
    );


    updateObjective();

    animate();
}


/* =========================================================
   PLAYER
   ========================================================= */

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
        8
    );

    scene.add(player);
}


/* =========================================================
   MANSION
   ========================================================= */

function createMansion() {

    const floorMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x242424
        });

    const wallMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x343030
        });


    /* FLOOR */

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

    scene.add(floor);


    /* OUTER WALLS */

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


    /* INNER WALLS */

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


    /* HALL WALLS */

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


    /* ROOMS */

    createRoom(
        -14,
        -12
    );

    createRoom(
        14,
        -12
    );

    createRoom(
        -14,
        12
    );

    createRoom(
        14,
        12
    );


    /* EXIT DOOR */

    createExitDoor();


    /* WINDOWS */

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
            color: 0x302a2a
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

    scene.add(mesh);

    walls.push(mesh);

    return mesh;
}


/* =========================================================
   ROOM
   ========================================================= */

function createRoom(x, z) {

    const lamp =
        new THREE.PointLight(
            0x8b2020,
            0.8,
            7
        );

    lamp.position.set(
        x,
        3.5,
        z
    );

    scene.add(lamp);


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

    scene.add(table);
}


/* =========================================================
   WINDOWS
   ========================================================= */

function createWindow(
    x,
    y,
    z
) {

    const window =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                2,
                3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x07141b,
                emissive: 0x020b10
            })
        );

    window.position.set(
        x,
        y,
        z
    );

    scene.add(window);
}


/* =========================================================
   EXIT
   ========================================================= */

function createExitDoor() {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x451010
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

    scene.add(door);

    doors.push(door);
}


/* =========================================================
   KEYS
   ========================================================= */

function createKeys() {

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
                0.18,
                0.05,
                8,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffcc33,
                emissive: 0x553300
            })
        );


    const stick =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.08,
                0.45,
                0.08
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffcc33
            })
        );


    stick.position.y = -0.2;

    group.add(ring);
    group.add(stick);

    group.position.set(
        x,
        y,
        z
    );

    scene.add(group);

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


    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.5,
                1.4,
                4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x120000
            })
        );

    body.position.y = 1.2;

    group.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.38,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x0b0b0b
            })
        );

    head.position.y = 2.25;

    group.add(head);


    killer = group;

    killer.position.set(
        0,
        0,
        -12
    );

    killer.visible = false;

    scene.add(killer);
}


/* =========================================================
   FLASHLIGHT
   ========================================================= */

function createFlashlight() {

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            4,
            22,
            Math.PI / 7,
            0.5,
            1
        );

    flashlight.position.set(
        0,
        1.6,
        0
    );

    camera.add(
        flashlight
    );

    flashlight.target.position.set(
        0,
        1.2,
        -10
    );

    camera.add(
        flashlight.target
    );

    scene.add(camera);
}


/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        function(event) {

            keys[event.code] = true;

            if (
                event.code === "ShiftLeft" ||
                event.code === "ShiftRight"
            ) {
                isSprinting = true;
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

        }
    );


    window.addEventListener(
        "keyup",
        function(event) {

            keys[event.code] = false;

            if (
                event.code === "ShiftLeft" ||
                event.code === "ShiftRight"
            ) {
                isSprinting = false;
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
            "touchstart",
            function(e) {

                e.preventDefault();

                isSprinting = true;

            }
        );

        sprint.addEventListener(
            "touchend",
            function(e) {

                e.preventDefault();

                isSprinting = false;

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


function setupHold(
    id,
    direction
) {

    const button =
        document.getElementById(id);

    if (!button) return;


    button.addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            mobileMove[direction] = true;

        }
    );


    button.addEventListener(
        "touchend",
        function(e) {

            e.preventDefault();

            mobileMove[direction] = false;

        }
    );


    button.addEventListener(
        "mousedown",
        function() {

            mobileMove[direction] = true;

        }
    );


    button.addEventListener(
        "mouseup",
        function() {

            mobileMove[direction] = false;

        }
    );


    button.addEventListener(
        "mouseleave",
        function() {

            mobileMove[direction] = false;

        }
    );
}


/* =========================================================
   MOVEMENT
   ========================================================= */

function updatePlayer(delta) {

    if (!player) return;

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

        forward /= length;
        sideways /= length;

    }


    const speed =
        isSprinting
            ? sprintSpeed
            : playerSpeed;


    player.position.z +=
        forward *
        speed *
        delta;


    player.position.x +=
        sideways *
        speed *
        delta;


    /* BOUNDARY */

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


    /* CAMERA */

    camera.position.x =
        player.position.x;

    camera.position.z =
        player.position.z + 5;

    camera.position.y = 1.7;

    camera.lookAt(
        player.position.x,
        1.5,
        player.position.z - 10
    );
}


/* =========================================================
   ITEM COLLECTION
   ========================================================= */

function checkItems() {

    for (
        const item of items
    ) {

        if (item.collected)
            continue;


        const distance =
            player.position.distanceTo(
                item.mesh.position
            );


        if (distance < 1.5) {

            item.collected = true;

            item.mesh.visible = false;

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

    }
}


/* =========================================================
   ESCAPE
   ========================================================= */

function checkEscape() {

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

        document.getElementById(
            "objectiveHUD"
        ).textContent =
            "ESCAPED THE MANSION";

    }

}


/* =========================================================
   KILLER AI
   ========================================================= */

function updateKiller(delta) {

    if (!killer)
        return;


    /* Activate when player has progressed */

    if (
        collectedKeys >= 1 &&
        !killerActive
    ) {

        killerActive = true;

        killer.visible = true;

        showToast(
            "SOMETHING IS HUNTING YOU..."
        );

        playSound(
            90,
            0.6
        );

    }


    if (!killerActive)
        return;


    const distance =
        killer.position.distanceTo(
            player.position
        );


    if (
        distance < 15
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
                1.2 * delta
            )
        );

    }


    if (
        distance < 1.4
    ) {

        killerAttack();

    }

}


/* =========================================================
   KILLER ATTACK
   ========================================================= */

let attackCooldown = false;

function killerAttack() {

    if (attackCooldown)
        return;

    attackCooldown = true;


    showJumpscare();


    setTimeout(
        function() {

            attackCooldown = false;

        },
        2500
    );
}


/* =========================================================
   JUMPSCARE
   ========================================================= */

function showJumpscare() {

    const overlay =
        document.createElement(
            "div"
        );

    overlay.style.position =
        "fixed";

    overlay.style.inset =
        "0";

    overlay.style.zIndex =
        "999999";

    overlay.style.background =
        "radial-gradient(circle,#600000,#000)";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.fontSize =
        "70px";

    overlay.style.fontWeight =
        "900";

    overlay.style.color =
        "#fff";

    overlay.innerHTML =
        "😱";


    document.body.appendChild(
        overlay
    );


    playSound(
        80,
        0.9
    );


    setTimeout(
        function() {

            overlay.remove();

        },
        900
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
   INTERACTION
   ========================================================= */

function interact() {

    checkItems();

    checkEscape();

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


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast)
        return;


    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    setTimeout(
        function() {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );
}


/* =========================================================
   SIMPLE SOUND
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


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.frequency.value =
            frequency;

        oscillator.type =
            "sawtooth";


        gain.gain.setValueAtTime(
            0.08,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime +
            duration
        );


        oscillator.connect(gain);

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
    ) return;


    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}


/* =========================================================
   GAME LOOP
   ========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    if (!gameStarted)
        return;


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


    /* KEY ANIMATION */

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


/* =========================================================
   START WHEN GAME SCREEN OPENS
   ========================================================= */

function launch3DGame() {

    showScreen(
        "gameScreen"
    );

    setTimeout(
        function() {

            start3DGame();

        },
        100
    );

}


/* =========================================================
   CONNECT TO EXISTING START BUTTON
   ========================================================= */

const oldStartGame =
    window.startGame;


window.startGame =
    function() {

        try {

            if (
                typeof oldStartGame ===
                "function"
            ) {

                oldStartGame();

            }

        }
        catch(error) {

            console.log(error);

        }


        setTimeout(
            function() {

                launch3DGame();

            },
            300
        );

    };
