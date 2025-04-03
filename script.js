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
const instructionsScreen = document.getElementById('instructions-screen');
const startGameBtn = document.getElementById('start-game-btn');
const instructionsToggle = document.getElementById('instructions-toggle');
const sideInstructions = document.getElementById('side-instructions');
const closeSideInstructions = document.getElementById('close-side-instructions');

// Sound effects
const catchSound = new Audio('sounds/catch.mp3');
const missSound = new Audio('sounds/miss.mp3');
const levelUpSound = new Audio('sounds/levelup.mp3');

// Game variables
let score = 0;
let lives = 10;
let highScore = 0;
let gameLoop;
let isGameRunning = false;
let playerPosition = 50; // percentage from left
let playerWidth = 80; // in pixels
let playerSpeed = 5; // percentage per move
let ballSpeed = 1.5; // pixels per frame
let spawnRate = 1500; // milliseconds
let spawnRateMin = 800; // minimum spawn rate
let lastSpawnTime = 0;
let balls = [];
let keysPressed = {};
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let lastTime = 0;
let scoreMultiplier = 1; // Base score multiplier
let consecutiveCatches = 0; // Track consecutive catches for combo scoring
let lastCatchTime = 0; // Track timing between catches
let level = 1; // Current game level

// Game area dimensions
let gameWidth;
let gameHeight;

// Initialize the game
function init() {
    updateDimensions();
    
    // Update high score from localStorage if available
    const savedHighScore = localStorage.getItem('catchBalloonHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        highScoreElement.textContent = highScore;
    }
    
    // Set initial lives display
    livesElement.textContent = lives;
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    startGameBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    // Mobile controls
    if (isMobile) {
        document.querySelector('.mobile-controls').style.display = 'flex';
        leftControl.addEventListener('touchstart', () => movePlayer(-playerSpeed));
        rightControl.addEventListener('touchstart', () => movePlayer(playerSpeed));
        leftControl.addEventListener('mousedown', () => movePlayer(-playerSpeed));
        rightControl.addEventListener('mousedown', () => movePlayer(playerSpeed));
    }
    
    // Add side instructions toggle event listeners
    instructionsToggle.addEventListener('click', toggleSideInstructions);
    closeSideInstructions.addEventListener('click', closeSideInstructionsPanel);
    
    // Handle window resize
    window.addEventListener('resize', updateDimensions);
    
    // Hide combo display initially
    comboDisplay.classList.add('hidden');
    
    // Show instructions screen at startup
    instructionsScreen.style.display = 'flex';
    
    // Preload sounds
    catchSound.load();
    missSound.load();
    levelUpSound.load();
    
    // Add keyboard shortcut for instructions (press 'I' key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'i' || e.key === 'I') {
            toggleSideInstructions();
        }
    });
}

// Update game dimensions
function updateDimensions() {
    gameWidth = gameArea.offsetWidth;
    gameHeight = gameArea.offsetHeight;
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

// Move the player
function movePlayer(dx) {
    playerPosition = Math.max(0, Math.min(100, playerPosition + dx));
    player.style.left = `${playerPosition}%`;
}

// Create a new balloon
function createBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    // Random position
    const randomX = Math.random() * (gameArea.offsetWidth - 30);
    balloon.style.left = randomX + 'px';
    
    gameArea.appendChild(balloon);
    
    balls.push({
        element: balloon,
        y: -40,
        speed: ballSpeed
    });
}

// Create a catch effect
function createCatchEffect(x, y, color) {
    const effect = document.createElement('div');
    effect.classList.add('catch-effect');
    
    // Get balloon color for the effect
    let effectColor = '#ff0000'; // default red
    if (color === 'blue') effectColor = '#0066ff';
    if (color === 'green') effectColor = '#00cc00';
    if (color === 'yellow') effectColor = '#ffcc00';
    if (color === 'purple') effectColor = '#9900cc';
    if (color === 'orange') effectColor = '#ff6600';
    
    effect.style.backgroundColor = effectColor;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    gameArea.appendChild(effect);
    
    // Add particle burst effect
    createParticles(x, y, effectColor);
    
    // Remove the effect after animation completes
    setTimeout(() => {
        if (gameArea.contains(effect)) {
            gameArea.removeChild(effect);
        }
    }, 500);
}

// Create particles for catch effect
function createParticles(x, y, color) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random direction
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        particle.style.setProperty('--angle', angle + 'rad');
        particle.style.setProperty('--speed', speed);
        
        gameArea.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (gameArea.contains(particle)) {
                gameArea.removeChild(particle);
            }
        }, 1000);
    }
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
    if (!isGameRunning) return;
    
    // Calculate delta time for smoother movement
    const deltaTime = timestamp - lastTime || 16.7;
    lastTime = timestamp;
    
    // Check for level up based on score
    let newLevel = Math.floor(score / 20) + 1;
    if (newLevel > level) {
        level = newLevel;
        // Display level up message
        showLevelUpMessage(level);
        
        // Add forest animation effect when leveling up
        addForestEffect();
    }
    
    // Reset combo if too much time has passed since last catch
    if (timestamp - lastCatchTime > 3000 && consecutiveCatches > 0) {
        consecutiveCatches = 0;
        scoreMultiplier = 1;
        updateComboDisplay();
    }
    
    // Handle keyboard movement
    if (keysPressed['ArrowLeft']) {
        movePlayer(-playerSpeed);
    }
    if (keysPressed['ArrowRight']) {
        movePlayer(playerSpeed);
    }
    
    // Spawn new balloons
    if (timestamp - lastSpawnTime > spawnRate) {
        createBalloon();
        lastSpawnTime = timestamp;
    }
    
    // Update balloons
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        
        // Move ball down with delta time adjustment
        ball.y += ball.speed * (deltaTime / 16.67); // normalize to ~60fps
        ball.element.style.top = ball.y + 'px';
        
        // Ball position in pixels
        const ballLeft = parseInt(ball.element.style.left);
        const ballCenter = ballLeft + 15;
        const ballBottom = ball.y + 40;
        
        // Player position in pixels
        const playerLeft = (playerPosition / 100) * gameWidth - playerWidth / 2;
        const playerRight = playerLeft + playerWidth;
        const playerTop = gameHeight - 60; // Bowl top position
        
        // Collision detection with the bowl
        if (ballBottom >= playerTop && ballBottom <= playerTop + 40) {
            if (ballCenter >= playerLeft && ballCenter <= playerRight) {
                // Balloon caught
                score++;
                scoreElement.textContent = score;
                
                // Update high score if needed
                if (score > highScore) {
                    highScore = score;
                    highScoreElement.textContent = highScore;
                    localStorage.setItem('catchBalloonHighScore', highScore);
                }
                
                // Remove balloon
                ball.element.remove();
                balls.splice(i, 1);
                
                // Play catch sound
                playSound('catch');
                continue;
            }
        }
        
        // Check if balloon reached the bottom
        if (ball.y > gameHeight) {
            // Balloon missed
            lives--;
            livesElement.textContent = lives;
            
            // Remove balloon
            ball.element.remove();
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

// Simple sound effects
function playSound(type) {
    try {
        if (type === 'catch') {
            // Stop and reset the sound before playing again
            catchSound.currentTime = 0;
            catchSound.play();
        } else if (type === 'miss') {
            missSound.currentTime = 0;
            missSound.play();
        } else if (type === 'levelup') {
            levelUpSound.currentTime = 0;
            levelUpSound.play();
        }
    } catch (e) {
        console.log("Error playing sound:", e);
    }
}

// Game over
function gameOver() {
    isGameRunning = false;
    finalScoreElement.textContent = score;
    
    // Show high score message if applicable
    const highScoreMessage = document.getElementById('high-score-message');
    if (score > highScore) {
        highScoreMessage.classList.remove('hidden');
    } else {
        highScoreMessage.classList.add('hidden');
    }
    
    gameOverScreen.classList.remove('hidden');
}

// Show level up message
function showLevelUpMessage(level) {
    const levelUpMsg = document.createElement('div');
    levelUpMsg.classList.add('level-up-message');
    levelUpMsg.innerHTML = `Level ${level}!<br><span style="font-size: 24px;">Speed Increased!</span>`;
    
    gameArea.appendChild(levelUpMsg);
    
    // Play level up sound
    playSound('levelup');
    
    // Create forest animals that peek out on level up
    createForestAnimal();
    
    setTimeout(() => {
        levelUpMsg.classList.add('fade-out');
        setTimeout(() => {
            if (gameArea.contains(levelUpMsg)) {
                gameArea.removeChild(levelUpMsg);
            }
        }, 1000);
    }, 2000);
}

// Create a forest animal that peeks from the side on level up
function createForestAnimal() {
    const animals = [
        'https://i.imgur.com/XZxmAOh.png', // deer
        'https://i.imgur.com/hXjqpng.png', // fox
        'https://i.imgur.com/VQ5Lcmb.png', // rabbit
        'https://i.imgur.com/sMYPufA.png'  // squirrel
    ];
    
    const animal = document.createElement('div');
    animal.classList.add('forest-animal');
    
    // Randomly position left or right
    const isRight = Math.random() > 0.5;
    animal.style.left = isRight ? '100%' : '-100px';
    animal.style.bottom = (Math.random() * 30) + '%';
    animal.style.transform = `scaleX(${isRight ? -1 : 1})`;
    
    // Random animal
    const animalImg = document.createElement('img');
    animalImg.src = animals[Math.floor(Math.random() * animals.length)];
    animal.appendChild(animalImg);
    
    gameArea.appendChild(animal);
    
    // Animate in
    setTimeout(() => {
        animal.style.left = isRight ? 'calc(100% - 80px)' : '0';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        animal.style.left = isRight ? '100%' : '-100px';
        setTimeout(() => {
            if (gameArea.contains(animal)) {
                gameArea.removeChild(animal);
            }
        }, 1000);
    }, 3000);
}

// Add forest animation effect
function addForestEffect() {
    // Create leaves falling effect
    for (let i = 0; i < 20; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('forest-leaf');
        leaf.style.left = Math.random() * 100 + '%';
        leaf.style.animationDuration = (2 + Math.random() * 3) + 's';
        leaf.style.animationDelay = (Math.random() * 2) + 's';
        
        // Random leaf color
        const leafColors = ['#8BC34A', '#689F38', '#558B2F', '#33691E'];
        leaf.style.backgroundColor = leafColors[Math.floor(Math.random() * leafColors.length)];
        
        gameArea.appendChild(leaf);
        
        // Remove leaf after animation
        setTimeout(() => {
            if (gameArea.contains(leaf)) {
                gameArea.removeChild(leaf);
            }
        }, 5000);
    }
}

// Restart the game
function restartGame() {
    // Hide game over screen
    gameOverScreen.classList.add('hidden');
    
    // Reset game
    startGame();
}

// Show instructions again
function showInstructions() {
    isGameRunning = false;
    instructionsScreen.style.display = 'flex';
    cancelAnimationFrame(gameLoop);
}

// Start the game after viewing instructions
function startGame() {
    // Hide instructions screen
    instructionsScreen.style.display = 'none';
    
    // Reset game state
    score = 0;
    lives = 10;
    balls = [];
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    playerPosition = 50;
    player.style.left = `${playerPosition}%`;
    
    // Clear existing balloons
    const existingBalloons = gameArea.querySelectorAll('.balloon');
    existingBalloons.forEach(balloon => balloon.remove());
    
    // Start game loop
    isGameRunning = true;
    lastSpawnTime = 0;
    lastTime = 0;
    gameLoop = requestAnimationFrame(update);
}

// Toggle side instructions panel
function toggleSideInstructions() {
    sideInstructions.classList.toggle('show');
}

// Close the side instructions panel
function closeSideInstructionsPanel() {
    sideInstructions.classList.remove('show');
}

// Start the game when the page loads
window.addEventListener('load', init); 