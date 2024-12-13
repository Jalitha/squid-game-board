const gameBoard = document.getElementById('game-board');
const ws = new WebSocket('ws://localhost:8080'); // Connect to WebSocket server
const eliminatedPlayers = new Set(); // Track eliminated players locally

// Function to create a player card
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.classList.add('player-card');
    if (player.status === 'eliminated' || eliminatedPlayers.has(player.number)) {
        card.classList.add('eliminated');
        eliminatedPlayers.add(player.number);
    }

    const photo = document.createElement('img');
    photo.src = player.photo;
    photo.alt = `Player ${player.number}`;
    photo.classList.add('player-photo');

    const number = document.createElement('div');
    number.textContent = player.number;
    number.classList.add('player-number');

    card.appendChild(photo);
    card.appendChild(number);

    // Add click event to toggle elimination
    card.addEventListener('click', () => {
        toggleElimination(player.number);
    });

    return card;
}

// Function to toggle player elimination
function toggleElimination(playerNumber) {
    // Toggle elimination status
    let reverseElimination = false;
    if (eliminatedPlayers.has(playerNumber)) {
        reverseElimination = true
        eliminatedPlayers.delete(playerNumber);
    } else {
        eliminatedPlayers.add(playerNumber);
    }

    // Update the server with elimination status (optional)
    fetch('/api/eliminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: playerNumber, reverse: reverseElimination }),
    });

    fetchPlayers(); // Refresh the grid
}

// Function to render players
function renderPlayers(players) {
    gameBoard.innerHTML = ''; // Clear the existing grid
    players.forEach((player) => {
        let card = createPlayerCard(player);
        gameBoard.appendChild(card);
    });
    resizeGameBoard();
}

// Fetch players from the server on page load
async function fetchPlayers() {
    try {
        const response = await fetch('/api/players');
        const players = await response.json();
        renderPlayers(players); // Render the players
    } catch (error) {
        console.error('Error fetching players:', error);
    }
}

// Real-time updates from WebSocket
ws.onmessage = (event) => {
    const players = JSON.parse(event.data);
    renderPlayers(players);
};

function resizeGameBoard() {
    const gameBoard = document.getElementById('game-board');
    const gap = 20; // Match the CSS gap
    const margin = 50; // Match the CSS margin
    const viewportHeight = window.innerHeight - margin * 2;

    let cardSize = 350; // Start with the initial size
    const minCardSize = 30; // Set a minimum size

    // Apply size and measure the actual height
    const applyCardSize = (size) => {
        gameBoard.style.setProperty('--card-size', `${size}px`);
    };

    // Check if the game board fits within the viewport
    const exceedsViewport = () => {
        return gameBoard.scrollHeight > viewportHeight;
    };

    // Adjust size iteratively
    applyCardSize(cardSize);
    while (cardSize > minCardSize && exceedsViewport()) {
        cardSize -= 10; // Decrease size step-by-step
        applyCardSize(cardSize);
    }
}

// Call resizeGameBoard on load and resize events
window.addEventListener('resize', resizeGameBoard);

// Initialize game board
function initializeGameBoard() {
    fetchPlayers(); // Fetch players on load
}

// Call initialize function on page load
window.addEventListener('load', initializeGameBoard);
