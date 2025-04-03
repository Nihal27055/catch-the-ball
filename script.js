// DOM Elements
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const leftControl = document.getElementById('left-control');
const rightControl = document.getElementById('right-control');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

// Game variables
let score = 0;
let lives = 10;
let gameLoop;
let isGameRunning = false;
let playerPosition = 50; // percentage from left
let playerWidth = 100; // in pixels
let playerSpeed = 5; // percentage per move
let ballSpeed = 2; // pixels per frame
let spawnRate = 1500; // milliseconds
let lastSpawnTime = 0;
let balls = [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize the game
function init() {
    console.log("Game initialized");
    
    // Add event listeners for PC controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Add event listeners for mobile controls
    leftControl.addEventListener('touchstart', () => movePlayer(-playerSpeed));
    rightControl.addEventListener('touchstart', () => movePlayer(playerSpeed));
    leftControl.addEventListener('mousedown', () => movePlayer(-playerSpeed));
    rightControl.addEventListener('mousedown', () => movePlayer(playerSpeed));
    
    // Add restart button event listener
    restartBtn.addEventListener('click', restartGame);
    
    // Add start button event listener
    startBtn.addEventListener('click', function() {
        console.log("Start button clicked");
        startGame();
    });
    
    // If it's a mobile device, show mobile controls
    if (isMobile) {
        document.querySelector('.mobile-controls').style.display = 'flex';
    }
    
    // Position player at the start
    player.style.left = `${playerPosition}%`;
}

function handleKeyPress(e) {
    if (!isGameRunning) return;
    
    if (e.key === 'ArrowLeft') {
        movePlayer(-playerSpeed);
    } else if (e.key === 'ArrowRight') {
        movePlayer(playerSpeed);
    }
}

function movePlayer(dx) {
    playerPosition = Math.max(0, Math.min(100, playerPosition + dx));
    player.style.left = `${playerPosition}%`;
}

function createBall() {
    const ball = document.createElement('div');
    ball.className = 'balloon';
    ball.style.left = Math.random() * (gameArea.offsetWidth - 40) + 'px';
    gameArea.appendChild(ball);
    
    balls.push({
        element: ball,
        y: -50,
        speed: ballSpeed
    });
}

function update() {
    if (!isGameRunning) return;
    
    // Spawn new balls
    if (Date.now() - lastSpawnTime > spawnRate) {
        createBall();
        lastSpawnTime = Date.now();
    }
    
    // Update balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.y += ball.speed;
        ball.element.style.top = ball.y + 'px';
        
        // Check for collision with player
        if (ball.y + 50 > gameArea.offsetHeight - 70) {
            const ballLeft = parseInt(ball.element.style.left);
            const playerLeft = (playerPosition / 100) * gameArea.offsetWidth - (playerWidth / 2);
            const playerRight = playerLeft + playerWidth;
            
            if (ballLeft >= playerLeft && ballLeft <= playerRight) {
                // Ball caught
                score++;
                scoreElement.textContent = score;
            } else {
                // Ball missed
                lives--;
                livesElement.textContent = lives;
                if (lives <= 0) {
                    gameOver();
                }
            }
            
            // Remove ball
            ball.element.remove();
            balls.splice(i, 1);
        }
    }
    
    // Continue game loop
    gameLoop = requestAnimationFrame(update);
}

function gameOver() {
    isGameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    // Reset game state
    score = 0;
    lives = 10;
    balls = [];
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    playerPosition = 50;
    player.style.left = `${playerPosition}%`;
    
    // Clear existing balls
    const existingBalls = gameArea.querySelectorAll('.balloon');
    existingBalls.forEach(ball => ball.remove());
    
    // Hide game over screen
    gameOverScreen.classList.add('hidden');
    
    // Start game loop
    isGameRunning = true;
    lastSpawnTime = 0;
    gameLoop = requestAnimationFrame(update);
}

function startGame() {
    console.log("Starting game");
    // Hide start screen
    startScreen.classList.add('hidden');
    
    // Reset game state
    score = 0;
    lives = 10;
    balls = [];
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    playerPosition = 50;
    player.style.left = `${playerPosition}%`;
    
    // Start game loop
    isGameRunning = true;
    lastSpawnTime = Date.now();
    gameLoop = requestAnimationFrame(update);
}

// Start the game when the page loads
window.addEventListener('load', init); 