const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); // File system module
const path = require('path');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 }); // Create a WebSocket server

const app = express();
const PORT = 3000;

if (!fs.existsSync(path.join(__dirname, 'photos'))) {
    fs.mkdirSync(path.join(__dirname, 'photos'));
}

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Increase the limit for larger images
app.use(express.static(path.join(__dirname, 'public')));

let registeredNumbers = []; // Store registered numbers temporarily
const players = []; // In-memory player data


// API Endpoint for registration
app.post('/api/register', (req, res) => {
    const { number, photo } = req.body;

    // Check if the number has already been registered
    if (registeredNumbers.includes(number)) {
        return res.status(400).json({ success: false, message: 'Number already registered' });
    }

    // Add the number to the registered list
    registeredNumbers.push(number);

    // Save player data
    players.push({ number, photo, status: 'active' });
    broadcastPlayers(); // Notify clients of the updated player list

    // Decode and save the photo
    const photoBuffer = Buffer.from(photo.split(',')[1], 'base64');
    const photoPath = path.join(__dirname, 'photos', `${number}.jpg`);

    fs.writeFile(photoPath, photoBuffer, (err) => {
        if (err) {
            console.error('Error saving photo:', err);
            return res.status(500).json({ success: false, message: 'Failed to save photo' });
        }

        console.log(`Photo for Player ${number} saved at ${photoPath}`);
        res.json({ success: true });
    });
});

// API Endpoint to check if a number is already registered
app.get('/api/check-number/:number', (req, res) => {
    const number = req.params.number;
    if (registeredNumbers.includes(number)) {
        return res.json({ isRegistered: true });
    }
    res.json({ isRegistered: false });
});

// Get all players
app.get('/api/players', (req, res) => {
    res.json(players);
});


// Mark a player as eliminated
app.post('/api/eliminate', (req, res) => {
    const { number, reverse } = req.body;
    const player = players.find((p) => p.number === number);

    if (player) {
        if (reverse) {
            player.status = 'active'
        } else {
            player.status = 'eliminated';
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Player not found' });
    }
});

// Broadcast function to send updates to all clients
function broadcastPlayers() {
    const playerData = JSON.stringify(players);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(playerData);
        }
    });
}


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
