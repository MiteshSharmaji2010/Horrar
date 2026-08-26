const socket = io();

// UI Elements
const loginScreen = document.getElementById('login-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameHud = document.getElementById('game-hud');
const btnLogin = document.getElementById('btn-login');
const btnStart = document.getElementById('btn-start');
const playerCount = document.getElementById('player-count');

// Stats & Controls
let localPlayer = { health: 100, stamina: 100, sanity: 100, isKiller: false, isHiding: false };
let speed = 0.12;
let scene, camera, renderer, flashLight;
let otherPlayers = {};
let spawnedItems = [];
let keysPressed = {};
let escapeCounts = { GATE: 0, HELI: 0, BOAT: 0 };

// --- 1. LOBBY & SOCKET CONNECTIONS ---
btnLogin.addEventListener('click', () => {
  const name = document.getElementById('player-name').value;
  const username = document.getElementById('player-username').value;
  socket.emit('joinLobby', { name, username });
  loginScreen.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
  init3D();
});

socket.on('updatePlayers', (players) => {
  playerCount.innerText = `Players: ${Object.keys(players).length}/9`;
});

btnStart.addEventListener('click', () => {
  socket.emit('startGame');
});

socket.on('gameStarted', (data) => {
  lobbyScreen.classList.add('hidden');
  gameHud.classList.remove('hidden');
  localPlayer.isKiller = data.players[socket.id].isKiller;
  buildMansion();
  renderItems(data.items);
  animate();
});

// --- 2. THREE.JS ENGINE SETUP ---
function init3D() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010101, 0.06); // Optimization Fog

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 80);
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x080808);
  scene.add(ambient);

  flashLight = new THREE.SpotLight(0xffffff, 2.5, 30, Math.PI / 5, 0.5, 1);
  camera.add(flashLight);
  flashLight.position.set(0, 0, 1);
  flashLight.target = camera;
  scene.add(camera);

  // Keyboard
  window.addEventListener('keydown', e => keysPressed[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keysPressed[e.key.toLowerCase()] = false);
}

// Low-Poly Mansion Base Map
function buildMansion() {
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Outer Walls
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x1a0f0f });
  const wallGeo = new THREE.BoxGeometry(2, 5, 100);
  
  const w1 = new THREE.Mesh(wallGeo, wallMat); w1.position.set(-50, 2.5, 0);
  const w2 = new THREE.Mesh(wallGeo, wallMat); w2.position.set(50, 2.5, 0);
  scene.add(w1); scene.add(w2);
}

function renderItems(items) {
  const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  items.forEach(item => {
    let col = item.type === 'GATE' ? 0xffff00 : (item.type === 'HELI' ? 0x00ffff : 0xff00ff);
    const mat = new THREE.MeshBasicMaterial({ color: col });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(item.x, 0.3, item.z);
    mesh.userData = item;
    scene.add(mesh);
    spawnedItems.push(mesh);
  });
}

// --- 3. CONTROLS & LOOP ---
function handleMovement() {
  let curSpeed = speed;
  
  // Stamina Run
  if (keysPressed['shift'] && localPlayer.stamina > 0) {
    curSpeed *= 1.7;
    localPlayer.stamina = Math.max(0, localPlayer.stamina - 0.3);
  } else if (localPlayer.stamina < 100) {
    localPlayer.stamina = Math.min(100, localPlayer.stamina + 0.15);
  }
  document.getElementById('stamina-bar').style.width = localPlayer.stamina + '%';

  if (keysPressed['w']) camera.translateZ(-curSpeed);
  if (keysPressed['s']) camera.translateZ(curSpeed);
  if (keysPressed['a']) camera.translateX(-curSpeed);
  if (keysPressed['d']) camera.translateX(curSpeed);

  camera.position.y = 1.6;

  socket.emit('playerMove', {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    rotation: camera.rotation.y,
    sanity: localPlayer.sanity,
    isHiding: localPlayer.isHiding
  });
}

document.getElementById('btn-flash').addEventListener('click', () => {
  flashLight.visible = !flashLight.visible;
});

function animate() {
  requestAnimationFrame(animate);
  handleMovement();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
