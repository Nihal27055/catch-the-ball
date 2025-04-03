// Sound effects - Use try/catch to prevent errors if sounds don't exist
let catchSound, missSound, levelUpSound;

try {
    catchSound = new Audio('sounds/catch.mp3');
    missSound = new Audio('sounds/miss.mp3');
    levelUpSound = new Audio('sounds/levelup.mp3');
} catch (e) {
    console.log("Error loading sounds:", e);
    // Create dummy sound objects to avoid errors
    catchSound = { play: function() {}, load: function() {} };
    missSound = { play: function() {}, load: function() {} };
    levelUpSound = { play: function() {}, load: function() {} };
}

// DOM Elements - Properly check for null elements
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
const instructionsToggle = document.getElementById('instructions-toggle') || { addEventListener: function(){} };
const sideInstructions = document.getElementById('side-instructions') || { classList: { toggle: function(){}, remove: function(){} } };
const closeSideInstructions = document.getElementById('close-side-instructions') || { addEventListener: function(){} };

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
    
    // Make sure the start button works - FIXED HERE
    if (startGameBtn) {
        // Remove any existing listeners first
        startGameBtn.replaceWith(startGameBtn.cloneNode(true));
        // Get the new button reference
        const newStartBtn = document.getElementById('start-game-btn');
        // Add the event listener
        newStartBtn.addEventListener('click', function() {
            console.log("Start button clicked!");
            startGame();
        });
        console.log("Start button event listener added");
    } else {
        console.error("Start button not found in the DOM!");
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
    
    // Mobile controls
    if (isMobile && leftControl && rightControl) {
        document.querySelector('.mobile-controls').style.display = 'flex';
        leftControl.addEventListener('touchstart', () => movePlayer(-playerSpeed));
        rightControl.addEventListener('touchstart', () => movePlayer(playerSpeed));
        leftControl.addEventListener('mousedown', () => movePlayer(-playerSpeed));
        rightControl.addEventListener('mousedown', () => movePlayer(playerSpeed));
    }
    
    // Add side instructions toggle event listeners
    if (instructionsToggle) {
        instructionsToggle.addEventListener('click', toggleSideInstructions);
    }
    
    if (closeSideInstructions) {
        closeSideInstructions.addEventListener('click', closeSideInstructionsPanel);
    }
    
    // Handle window resize
    window.addEventListener('resize', updateDimensions);
    
    // Hide combo display initially
    if (comboDisplay) {
        comboDisplay.classList.add('hidden');
    }
    
    // Show instructions screen at startup
    if (instructionsScreen) {
        instructionsScreen.style.display = 'flex';
    }
    
    // Preload sounds
    try {
        catchSound.load();
        missSound.load();
        levelUpSound.load();
    } catch (e) {
        console.log("Error preloading sounds:", e);
    }
    
    // Add keyboard shortcut for instructions (press 'I' key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'i' || e.key === 'I') {
            toggleSideInstructions();
        }
    });
    
    console.log("Game initialized successfully!");
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
    
    // Random balloon color
    const colors = [
        'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloon.classList.add(color);
    
    // Set gradient based on color
    let gradientStart, gradientEnd;
    switch(color) {
        case 'red': 
            gradientStart = '#ff9999'; 
            gradientEnd = '#ff0000'; 
            break;
        case 'blue': 
            gradientStart = '#99ccff'; 
            gradientEnd = '#0066ff'; 
            break;
        case 'green': 
            gradientStart = '#99ff99'; 
            gradientEnd = '#00cc00'; 
            break;
        case 'yellow': 
            gradientStart = '#ffffcc'; 
            gradientEnd = '#ffcc00'; 
            break;
        case 'purple': 
            gradientStart = '#cc99ff'; 
            gradientEnd = '#9900cc'; 
            break;
        case 'orange': 
            gradientStart = '#ffcc99'; 
            gradientEnd = '#ff6600'; 
            break;
        case 'pink': 
            gradientStart = '#ffccff'; 
            gradientEnd = '#ff66ff'; 
            break;
        default: 
            gradientStart = '#ff9999'; 
            gradientEnd = '#ff0000';
    }
    
    balloon.style.background = `radial-gradient(circle at 30% 30%, ${gradientStart}, ${gradientEnd})`;
    
    // Random position
    const randomX = Math.random() * (gameArea.offsetWidth - 30);
    balloon.style.left = randomX + 'px';
    
    gameArea.appendChild(balloon);
    
    // Add to game balls array with color information
    balls.push({
        element: balloon,
        y: -40,
        speed: ballSpeed * (level > 3 ? (1 + (level - 3) * 0.1) : 1), // Increase speed with level
        color: color,
        isRainbow: false
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
        
        // Make all current balloons rainbow for 2 seconds
        makeBalloonsRainbow();
        
        // Create party popper effect
        createPartyPopperEffect();
        
        // Adjust difficulty based on level
        adjustDifficulty(level);
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
    
    // Spawn new balloons - faster spawn rate at higher levels
    const currentSpawnRate = spawnRate - ((level - 1) * 100);
    if (timestamp - lastSpawnTime > currentSpawnRate) {
        createBalloon();
        lastSpawnTime = timestamp;
    }
    
    // Update balloons
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        
        // Update rainbow effect if active
        if (ball.isRainbow) {
            const hue = (timestamp / 10) % 360;
            ball.element.style.background = `radial-gradient(circle at 30% 30%, hsl(${hue}, 100%, 80%), hsl(${hue}, 100%, 50%))`;
        }
        
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
                // Calculate points - more points for rainbow balloons
                let points = ball.isRainbow ? 2 : 1;
                
                // Balloon caught
                score += points;
                scoreElement.textContent = score;
                
                // Show score animation
                showScoreIncrease(ballCenter, playerTop - 20, points);
                
                // Create catch effect with balloon color
                createCatchEffect(ballCenter, playerTop, ball.color);
                
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
    console.log("Starting game...");
    
    // Hide instructions screen
    if (instructionsScreen) {
        instructionsScreen.style.display = 'none';
    }
    
    // Reset game state
    score = 0;
    lives = 10;
    balls = [];
    level = 1;
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
    
    console.log("Game started!");
}

// Toggle side instructions panel
function toggleSideInstructions() {
    sideInstructions.classList.toggle('show');
}

// Close the side instructions panel
function closeSideInstructionsPanel() {
    sideInstructions.classList.remove('show');
}

// Make all balloons rainbow for 2 seconds
function makeBalloonsRainbow() {
    for (let ball of balls) {
        ball.isRainbow = true;
        ball.element.classList.add('rainbow');
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
        for (let ball of balls) {
            if (ball.isRainbow) {
                ball.isRainbow = false;
                ball.element.classList.remove('rainbow');
                
                // Restore original color
                let gradientStart, gradientEnd;
                switch(ball.color) {
                    case 'red': 
                        gradientStart = '#ff9999'; 
                        gradientEnd = '#ff0000'; 
                        break;
                    case 'blue': 
                        gradientStart = '#99ccff'; 
                        gradientEnd = '#0066ff'; 
                        break;
                    case 'green': 
                        gradientStart = '#99ff99'; 
                        gradientEnd = '#00cc00'; 
                        break;
                    case 'yellow': 
                        gradientStart = '#ffffcc'; 
                        gradientEnd = '#ffcc00'; 
                        break;
                    case 'purple': 
                        gradientStart = '#cc99ff'; 
                        gradientEnd = '#9900cc'; 
                        break;
                    case 'orange': 
                        gradientStart = '#ffcc99'; 
                        gradientEnd = '#ff6600'; 
                        break;
                    case 'pink': 
                        gradientStart = '#ffccff'; 
                        gradientEnd = '#ff66ff'; 
                        break;
                    default: 
                        gradientStart = '#ff9999'; 
                        gradientEnd = '#ff0000';
                }
                ball.element.style.background = `radial-gradient(circle at 30% 30%, ${gradientStart}, ${gradientEnd})`;
            }
        }
    }, 2000);
}

// Adjust game difficulty based on level
function adjustDifficulty(level) {
    // Increase balloon fall speed
    ballSpeed = 1.5 + (level - 1) * 0.2;
    
    // Decrease spawn rate (faster spawning) but with a minimum limit
    spawnRate = Math.max(spawnRateMin, 1500 - (level - 1) * 100);
    
    // Make player movement slightly faster on higher levels for better control
    playerSpeed = 5 + (level - 1) * 0.3;
    
    console.log(`Level ${level}: Speed ${ballSpeed}, Spawn Rate ${spawnRate}, Player Speed ${playerSpeed}`);
}

// Create party popper effect for level up
function createPartyPopperEffect() {
    // Create confetti-like particles
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Random position from center top
        confetti.style.left = `${gameWidth / 2}px`;
        confetti.style.top = '0px';
        
        // Random confetti color
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                         '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
                         '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
                         '#FF5722'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random size
        const size = 5 + Math.random() * 10;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        
        // Random rotation
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Random shape
        const shapes = ['circle', 'square', 'triangle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.classList.add(shape);
        
        // Set animation properties
        const duration = 1 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        const angle = -30 + Math.random() * 60; // -30 to 30 degrees
        const distance = 50 + Math.random() * 200;
        
        confetti.style.animation = `confettiDrop ${duration}s ease-out ${delay}s forwards`;
        confetti.style.setProperty('--angle', angle + 'deg');
        confetti.style.setProperty('--distance', distance + 'px');
        
        gameArea.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            if (gameArea.contains(confetti)) {
                gameArea.removeChild(confetti);
            }
        }, (duration + delay) * 1000);
    }
    
    // Play party sound
    try {
        const partySound = new Audio('sounds/party.mp3');
        partySound.volume = 0.6;
        partySound.play();
    } catch (e) {
        console.log("Error playing party sound:", e);
    }
}

// Start the game when the page loads
window.addEventListener('load', init); 