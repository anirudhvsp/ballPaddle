const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active game rooms
const gameRooms = new Map();

// Serve static files
app.use(express.static('public'));

// Serve home page
app.get('/', (req, res) => {
    res.send(path.join(__dirname, 'public', 'home.html'));
});

// Serve game page
app.get('/game/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Add this after other routes
app.get('/api/rooms', (req, res) => {
    const rooms = Array.from(gameRooms.entries()).map(([roomId, room]) => ({
        roomId,
        playerCount: room.players.size,
        hasGameState: room.gameState !== null
    }));
    res.json(rooms);
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const roomId = req.url.split('/')[1]; // Get room ID from URL

    if (!gameRooms.has(roomId)) {
        gameRooms.set(roomId, {
            players: new Set(),
            gameState: null
        });
    }

    const room = gameRooms.get(roomId);
    room.players.add(ws);

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'gameState') {
            room.gameState = data.state;
            // Broadcast state to all other players in room
            room.players.forEach(player => {
                if (player !== ws && player.readyState === WebSocket.OPEN) {
                    player.send(message.toString()); // Send the raw message for better performance
                }
            });
        }
    });

    ws.on('close', () => {
        room.players.delete(ws);
        if (room.players.size === 0) {
            gameRooms.delete(roomId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 