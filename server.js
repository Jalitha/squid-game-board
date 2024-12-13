const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); // File system module
const path = require('path');

const app = express();
const PORT = 3000;

if (!fs.existsSync(path.join(__dirname, 'photos'))) {
    fs.mkdirSync(path.join(__dirname, 'photos'));
}

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Increase the limit for larger images
app.use(express.static(path.join(__dirname, 'public')));

let registeredNumbers = []; // Store registered numbers temporarily

// API Endpoint for registration
app.post('/api/register', (req, res) => {
    const { number, photo } = req.body;

    // Check if the number has already been registered
    if (registeredNumbers.includes(number)) {
        return res.status(400).json({ success: false, message: 'Number already registered' });
    }

    // Add the number to the registered list
    registeredNumbers.push(number);

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
