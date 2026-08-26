const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
io.on('connection', (socket) => {
    socket.on('joinLobby', (data) => {
        players[socket.id] = { name: data.name, pos: {x:0, y:0, z:0}, role: 'survivor' };
        io.emit('updatePlayers', players);
    });
    socket.on('move', (data) => {
        if(players[socket.id]) {
            players[socket.id].pos = data;
            socket.broadcast.emit('playerMoved', {id: socket.id, pos: data});
        }
    });
    socket.on('disconnect', () => { delete players[socket.id]; io.emit('updatePlayers', players); });
});

http.listen(3000, () => console.log('Killer 07 Running on Port 3000'));
