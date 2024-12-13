const gameBoard = document.getElementById('game-board');
const ws = new WebSocket('ws://localhost:8080'); // Connect to WebSocket server
const eliminatedPlayers = new Set(); // Track eliminated players locally

// Function to create a player card
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.classList.add('player-card');
    if (player.status === 'eliminated' || eliminatedPlayers.has(player.number)) {
        card.classList.add('eliminated');
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
    if (eliminatedPlayers.has(playerNumber)) {
        eliminatedPlayers.delete(playerNumber);
    } else {
        eliminatedPlayers.add(playerNumber);
    }

    // Update the server with elimination status (optional)
    fetch('/api/eliminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: playerNumber }),
    });

    updatePlayers(); // Refresh the grid
}

// Function to render players
function renderPlayers(players) {
    gameBoard.innerHTML = ''; // Clear the existing grid
    players.forEach((player) => {
        const card = createPlayerCard(player);
        gameBoard.appendChild(card);
    });

    // Ensure proper resizing and centering after rendering
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

// Function to resize the game board
function resizeGameBoard() {
    const margin = 50; // Match the CSS margin
    const gap = 20; // Match the CSS gap
    const viewportWidth = window.innerWidth - margin * 2;
    const viewportHeight = window.innerHeight - margin * 2;

    // Estimate the optimal number of columns based on viewport width
    const columns = Math.floor((viewportWidth + gap) / (300 + gap)); // 300 is the minimum size
    const cardSize = (viewportWidth - (columns - 1) * gap) / columns;

    // Set grid styles dynamically
    gameBoard.style.gridTemplateColumns = `repeat(${columns}, ${cardSize}px)`;
    gameBoard.style.gridAutoRows = `${cardSize}px`; // Ensure rows match column height

    // Center align the game board content
    const totalRows = Math.ceil(gameBoard.childElementCount / columns);
    const totalHeight = totalRows * (cardSize + gap) - gap;

    if (totalHeight < viewportHeight) {
        gameBoard.style.alignContent = 'center'; // Center vertically
    } else {
        gameBoard.style.alignContent = 'start'; // Default to top-alignment if it overflows
    }
}

// Initialize game board resizing and listeners
function initializeGameBoard() {
    resizeGameBoard(); // Resize when the page loads

    // Resize dynamically when the window size changes
    window.addEventListener('resize', resizeGameBoard);

    // Recalculate grid size after new players are added
    const observer = new MutationObserver(() => {
        resizeGameBoard();
    });
    observer.observe(gameBoard, { childList: true });
}

// Initial setup
window.addEventListener('load', () => {
    fetchPlayers(); // Fetch players on load
    initializeGameBoard(); // Initialize resizing and centering logic
});
