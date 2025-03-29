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
const highScoreElement = document.getElementById('high-score');
const comboDisplay = document.getElementById('combo-display');
const comboCountElement = document.getElementById('combo-count');

// Game variables
let score = 0;
let lives = 10;
let highScore = localStorage.getItem('catchBallHighScore') || 0;
let gameRunning = true;
let playerPosition = 50; // percentage from left
let playerWidth = 80; // in pixels
let playerSpeed = 10; // percentage per move (increased from 5 for smoother movement)
let baseBallSpeed = 0.7; // base pixels per frame (reduced for easier gameplay)
let ballSpeedIncrement = 0.05; // reduced for smoother difficulty progression
let spawnRate = 3000; // milliseconds (increased for easier start)
let spawnRateMin = 800;
let lastSpawnTime = 0;
let gameLoop;
let balls = [];
let keysPressed = {};
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let lastTime = 0;
let scoreMultiplier = 1; // Base score multiplier
let consecutiveCatches = 0; // Track consecutive catches for combo scoring
let lastCatchTime = 0; // Track timing between catches

// Game area dimensions
let gameWidth;
let gameHeight;

// Initialize the game
function init() {
    updateDimensions();
    
    // Update high score display from localStorage
    highScore = localStorage.getItem('catchBallHighScore') || 0;
    highScoreElement.textContent = highScore;
    
    // Add event listeners for PC controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Add event listeners for mobile controls
    leftControl.addEventListener('touchstart', () => movePlayer('left'));
    rightControl.addEventListener('touchstart', () => movePlayer('right'));
    leftControl.addEventListener('mousedown', () => movePlayer('left'));
    rightControl.addEventListener('mousedown', () => movePlayer('right'));
    
    // Add restart button event listener
    restartBtn.addEventListener('click', restartGame);
    
    // Handle window resize
    window.addEventListener('resize', updateDimensions);
    
    // Start the game loop
    gameLoop = requestAnimationFrame(update);
    
    // If it's a mobile device, add the swipe controls
    if (isMobile) {
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    
    // Hide combo display initially
    comboDisplay.classList.add('hidden');
}

// Update game dimensions
function updateDimensions() {
    gameWidth = gameArea.clientWidth;
    gameHeight = gameArea.clientHeight;
    playerWidth = Math.min(80, gameWidth * 0.2);
    player.style.width = playerWidth + 'px';
}

// Handle keyboard input
function handleKeyDown(e) {
    keysPressed[e.key] = true;
}

function handleKeyUp(e) {
    keysPressed[e.key] = false;
}

// Touch move handler for mobile
function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const gameRect = gameArea.getBoundingClientRect();
    const touchX = touch.clientX - gameRect.left;
    
    // Convert to percentage
    playerPosition = (touchX / gameWidth) * 100;
    
    // Clamp the position
    playerPosition = Math.max(playerWidth / 2 / gameWidth * 100, Math.min(100 - playerWidth / 2 / gameWidth * 100, playerPosition));
    
    // Update player position
    player.style.left = `${playerPosition}%`;
}

// Move the player
function movePlayer(direction) {
    if (direction === 'left') {
        playerPosition -= playerSpeed;
    } else if (direction === 'right') {
        playerPosition += playerSpeed;
    }
    
    // Clamp the position
    playerPosition = Math.max(playerWidth / 2 / gameWidth * 100, Math.min(100 - playerWidth / 2 / gameWidth * 100, playerPosition));
    
    // Update player position
    player.style.left = `${playerPosition}%`;
}

// Create a new ball
function createBall() {
    const ball = document.createElement('div');
    ball.classList.add('balloon');
    
    // Random position
    const position = Math.random() * 100;
    
    // Random balloon color
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    ball.classList.add(randomColor);
    
    ball.style.left = `${position}%`;
    ball.style.top = '0';
    
    gameArea.appendChild(ball);
    
    // Calculate ball speed based on score
    let calculatedSpeed = baseBallSpeed;
    
    // Very easy for first 15 scores
    if (score < 15) {
        calculatedSpeed = baseBallSpeed;
    } 
    // Medium difficulty at level 20
    else if (score < 20) {
        calculatedSpeed = baseBallSpeed + (score - 15) * 0.1;
    }
    // Progressive difficulty after score 20
    else {
        calculatedSpeed = baseBallSpeed + 0.5 + (score - 20) * ballSpeedIncrement;
    }
    
    // Add to balls array
    balls.push({
        element: ball,
        position: position,
        top: 0,
        speed: calculatedSpeed + Math.random() * 0.3,
        width: 30, // Ball width in pixels
        height: 40 // Ball height in pixels
    });
}

// Create a catch effect
function createCatchEffect(x, y, color) {
    const effect = document.createElement('div');
    effect.classList.add('catch-effect');
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.backgroundColor = color;
    
    gameArea.appendChild(effect);
    
    // Remove the effect after animation completes
    setTimeout(() => {
        gameArea.removeChild(effect);
    }, 500);
}

// Show score increase animation
function showScoreIncrease(x, y, points) {
    const scorePopup = document.createElement('div');
    scorePopup.classList.add('score-popup');
    scorePopup.textContent = `+${points}`;
    scorePopup.style.left = `${x}px`;
    scorePopup.style.top = `${y}px`;
    
    // Add data attribute for CSS styling based on point value
    if (points >= 5) {
        scorePopup.setAttribute('data-value', '5');
    } else if (points >= 4) {
        scorePopup.setAttribute('data-value', '4');
    } else if (points >= 3) {
        scorePopup.setAttribute('data-value', '3');
    } else if (points >= 2) {
        scorePopup.setAttribute('data-value', '2');
    }
    
    gameArea.appendChild(scorePopup);
    
    // Remove the popup after animation completes
    setTimeout(() => {
        if (gameArea.contains(scorePopup)) {
            gameArea.removeChild(scorePopup);
        }
    }, 1000);
}

// Update combo display
function updateComboDisplay() {
    if (scoreMultiplier > 1) {
        comboCountElement.textContent = scoreMultiplier;
        comboDisplay.classList.remove('hidden');
        
        // Hide the combo display after 3 seconds if no new catches
        clearTimeout(window.comboTimeout);
        window.comboTimeout = setTimeout(() => {
            comboDisplay.classList.add('hidden');
        }, 3000);
    } else {
        comboDisplay.classList.add('hidden');
    }
}

// Update game state
function update(timestamp) {
    if (!gameRunning) return;
    
    // Calculate delta time for smoother movement
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Reset combo if too much time has passed since last catch
    if (timestamp - lastCatchTime > 3000 && consecutiveCatches > 0) {
        consecutiveCatches = 0;
        scoreMultiplier = 1;
        updateComboDisplay();
    }
    
    // Handle keyboard movement with smoother movement
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        movePlayer('left');
    }
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        movePlayer('right');
    }
    
    // Spawn new balls based on score
    let currentSpawnRate = spawnRate;
    
    // Very easy for first 15 scores - balls come less frequently
    if (score < 15) {
        currentSpawnRate = spawnRate - score * 50; // Gradually decrease from 3000ms
    } 
    // Medium at level 20
    else if (score < 20) {
        currentSpawnRate = spawnRate - 15 * 50 - (score - 15) * 100;
    }
    // Hard after score 20
    else {
        currentSpawnRate = spawnRate - 15 * 50 - 5 * 100 - (score - 20) * 50;
    }
    
    // Ensure minimum spawn rate
    currentSpawnRate = Math.max(spawnRateMin, currentSpawnRate);
    
    if (timestamp - lastSpawnTime > currentSpawnRate) {
        createBall();
        lastSpawnTime = timestamp;
    }
    
    // Update balls with delta time for smoother movement
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        
        // Move ball down with delta time adjustment
        ball.top += ball.speed * (deltaTime / 16.67); // normalize to ~60fps
        ball.element.style.top = `${ball.top}px`;
        
        // Ball position in pixels
        const ballLeft = (ball.position / 100) * gameWidth;
        const ballCenter = ballLeft + ball.width / 2;
        const ballBottom = ball.top + ball.height;
        
        // Player position in pixels
        const playerLeft = (playerPosition / 100) * gameWidth - playerWidth / 2;
        const playerRight = playerLeft + playerWidth;
        const playerTop = gameHeight - 70; // Bowl top position
        
        // Improved collision detection with the bowl
        const isCollisionX = ballCenter > playerLeft && ballCenter < playerRight;
        const isCollisionY = ballBottom > playerTop && ball.top < playerTop + 20;
        
        if (isCollisionX && isCollisionY) {
            // Calculate points based on speed and combo
            // Faster catches = more points
            const catchSpeed = timestamp - lastCatchTime;
            let speedBonus = 1;
            
            // If catching quickly (less than 1 second between catches)
            if (lastCatchTime > 0 && catchSpeed < 1000) {
                // Enhanced speed bonus calculation - higher points for faster catches
                speedBonus = Math.max(2, Math.floor(1500 / catchSpeed));
                consecutiveCatches++;
                // Increase multiplier for consecutive quick catches - faster progression
                scoreMultiplier = Math.min(10, 1 + Math.floor(consecutiveCatches / 2));
            } else {
                // Reset combo if too slow, but keep minimum multiplier of 2
                consecutiveCatches = 1;
                scoreMultiplier = 2;
            }
            
            // Calculate final points - increased base points for all catches
            const points = speedBonus * scoreMultiplier;
            
            // Update score
            score += points;
            scoreElement.textContent = score;
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('catchBallHighScore', highScore);
            }
            
            // Update last catch time for combo calculation
            lastCatchTime = timestamp;
            
            // Get balloon color for the effect
            let ballColor = '#ff0000'; // default red
            if (ball.element.classList.contains('blue')) ballColor = '#0066ff';
            if (ball.element.classList.contains('green')) ballColor = '#00cc00';
            if (ball.element.classList.contains('yellow')) ballColor = '#ffcc00';
            if (ball.element.classList.contains('purple')) ballColor = '#9900cc';
            if (ball.element.classList.contains('orange')) ballColor = '#ff6600';
            
            // Create visual effects
            createCatchEffect(ballCenter, playerTop, ballColor);
            
            // Update score popup to show actual points
            showScoreIncrease(ballCenter, playerTop - 20, points);
            
            // Apply the bounce animation to the bowl for better feedback
            player.style.animation = 'catchBounce 0.3s ease-out';
            
            // Remove animation after it completes
            setTimeout(() => {
                player.style.animation = '';
            }, 300);
            
            // Remove the ball
            gameArea.removeChild(ball.element);
            balls.splice(i, 1);
            
            // Play catch sound
            playSound('catch');
            
            // Update combo display
            updateComboDisplay();
            
            continue;
        }
        
        // Check if ball reached the red line
        if (ball.top > gameHeight - 50) {
            // Ball missed
            lives--;
            livesElement.textContent = lives;
            
            // Remove the ball
            gameArea.removeChild(ball.element);
            balls.splice(i, 1);
            
            // Play miss sound
            playSound('miss');
            
            // Check game over
            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    }
    
    // Continue the game loop
    gameLoop = requestAnimationFrame(update);
}

// Simple sound effects (placeholder functions, can be implemented with actual sounds)
function playSound(type) {
    // Placeholder for sound effects
    // In a real game, you would create and play audio elements here
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    
    // Show new high score message if applicable
    const highScoreMessage = document.getElementById('high-score-message');
    if (score > highScore && highScoreMessage) {
        highScoreMessage.classList.remove('hidden');
        // Update the stored high score
        localStorage.setItem('catchBallHighScore', score);
        highScore = score;
    } else if (highScoreMessage) {
        highScoreMessage.classList.add('hidden');
    }
    
    gameOverScreen.classList.remove('hidden');
}

// Restart the game
function restartGame() {
    // Reset game variables
    score = 0;
    lives = 10;
    gameRunning = true;
    playerPosition = 50;
    consecutiveCatches = 0;
    scoreMultiplier = 1;
    
    // Hide combo display
    comboDisplay.classList.add('hidden');
    
    // Update display
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    
    // Clear balls
    balls.forEach(ball => {
        gameArea.removeChild(ball.element);
    });
    balls = [];
    
    // Reset player position
    player.style.left = `${playerPosition}%`;
    
    // Hide game over screen
    gameOverScreen.classList.add('hidden');
    
    // Restart game loop
    lastSpawnTime = 0;
    gameLoop = requestAnimationFrame(update);
}

// Start the game when the page loads
window.addEventListener('load', init); 