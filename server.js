const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let gameState = 'LOBBY';
let killerId = null;

// Objectives for 3 Escapes (Gate, Helicopter, Boat)
const ALL_ITEMS = [
  // Main Gate Items
  { id: 1, name: "Main Gate Key", type: "GATE" },
  { id: 2, name: "Security Pass Card", type: "GATE" },
  { id: 3, name: "Gate Code Note", type: "GATE" },
  { id: 4, name: "Master Exit Key", type: "GATE" },
  // Helicopter Items
  { id: 5, name: "Aviation Fuel Can", type: "HELI" },
  { id: 6, name: "Helicopter Key", type: "HELI" },
  { id: 7, name: "High Power Battery", type: "HELI" },
  { id: 8, name: "Wire Cutters", type: "HELI" },
  // Boat Items
  { id: 9, name: "Boat Motor Propeller", type: "BOAT" },
  { id: 10, name: "Spark Plug", type: "BOAT" },
  { id: 11, name: "Gasoline Can", type: "BOAT" },
  { id: 12, name: "Boat Key", type: "BOAT" }
];

let spawnedItems = [];

function generateItems() {
  spawnedItems = ALL_ITEMS.map(item => ({
    ...item,
    x: (Math.random() - 0.5) * 70,
    z: (Math.random() - 0.5) * 70,
    collected: false
  }));
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinLobby', (data) => {
    if (Object.keys(players).length >= 9) {
      socket.emit('errorMsg', 'Lobby Full! Max 9 Players allowed.');
      return;
    }
    players[socket.id] = {
      id: socket.id,
      name: data.name || 'Survivor',
      username: data.username || 'User',
      x: (Math.random() - 0.5) * 5,
      y: 1.6,
      z: (Math.random() - 0.5) * 5,
      rotation: 0,
      isKiller: false,
      health: 100,
      sanity: 100,
      isDowned: false,
      isHiding: false
    };
    io.emit('updatePlayers', players);
  });

  socket.on('startGame', () => {
    const pKeys = Object.keys(players);
    if (pKeys.length < 1) return;

    // Random Killer Selection
    killerId = pKeys[Math.floor(Math.random() * pKeys.length)];
    pKeys.forEach(id => {
      players[id].isKiller = (id === killerId);
    });

    generateItems();
    gameState = 'IN_GAME';
    io.emit('gameStarted', { players, items: spawnedItems, killerId });
  });

  socket.on('playerMove', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
      players[socket.id].rotation = data.rotation;
      players[socket.id].sanity = data.sanity;
      players[socket.id].isHiding = data.isHiding;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  socket.on('collectItem', (itemId) => {
    const item = spawnedItems.find(i => i.id === itemId);
    if (item && !item.collected) {
      item.collected = true;
      io.emit('itemCollected', { itemId, itemType: item.type, name: item.name });
    }
  });

  socket.on('attackPlayer', (targetId) => {
    if (players[targetId] && !players[targetId].isKiller) {
      players[targetId].health -= 40;
      if (players[targetId].health <= 0) {
        players[targetId].health = 0;
        players[targetId].isDowned = true;
      }
      io.emit('playerHealthUpdate', { id: targetId, health: players[targetId].health, isDowned: players[targetId].isDowned });
    }
  });

  socket.on('revivePlayer', (targetId) => {
    if (players[targetId] && players[targetId].isDowned) {
      players[targetId].health = 50;
      players[targetId].isDowned = false;
      io.emit('playerHealthUpdate', { id: targetId, health: 50, isDowned: false });
    }
  });

  socket.on('triggerEscape', (escapeType) => {
    io.emit('gameFinished', { winner: 'SURVIVORS', escapeType });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`KILLER 07 Server listening on port ${PORT}`);
});
