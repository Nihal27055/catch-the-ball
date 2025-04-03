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
const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const restartFromPauseBtn = document.getElementById('restart-from-pause-btn');

// Game variables
let score = 0;
let lives = 10;
let highScore = 0;
let gameLoop;
let isGameRunning = false;
let isPaused = false;
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
let backgrounds = ['forest', 'blank', 'ice', 'desert', 'night']; // Different background themes

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
    
    // Pause functionality
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumeGame);
    }
    
    if (restartFromPauseBtn) {
        restartFromPauseBtn.addEventListener('click', function() {
            pauseScreen.classList.add('hidden');
            restartGame();
        });
    }
    
    // Add keyboard shortcut for pause (press 'P' key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    });
    
    // Mobile controls
    if (isMobile) {
        // Show regular mobile controls by default
        document.querySelector('.mobile-controls').style.display = 'flex';
        
        // Standard button controls
        if (leftControl && rightControl) {
            // Touch and hold controls for smoother movement
            leftControl.addEventListener('touchstart', () => startMovePlayer('left'));
            leftControl.addEventListener('touchend', () => stopMovePlayer('left'));
            
            rightControl.addEventListener('touchstart', () => startMovePlayer('right'));
            rightControl.addEventListener('touchend', () => stopMovePlayer('right'));
            
            // Mouse controls (for testing on desktop)
            leftControl.addEventListener('mousedown', () => startMovePlayer('left'));
            leftControl.addEventListener('mouseup', () => stopMovePlayer('left'));
            
            rightControl.addEventListener('mousedown', () => startMovePlayer('right'));
            rightControl.addEventListener('mouseup', () => stopMovePlayer('right'));
        }
        
        // Direct touch/drag on game area for more intuitive control
        gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
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

// Toggle pause state
function togglePause() {
    if (!isGameRunning) return; // Only pause if game is running
    
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Pause the game
function pauseGame() {
    if (!isGameRunning || isPaused) return;
    
    isPaused = true;
    cancelAnimationFrame(gameLoop);
    pauseBtn.classList.add('paused');
    pauseScreen.classList.remove('hidden');
}

// Resume the game
function resumeGame() {
    if (!isPaused) return;
    
    isPaused = false;
    lastTime = 0; // Reset time to avoid huge delta time after pause
    pauseBtn.classList.remove('paused');
    pauseScreen.classList.add('hidden');
    gameLoop = requestAnimationFrame(update);
}

// Mobile player movement
let movingLeft = false;
let movingRight = false;

function startMovePlayer(direction) {
    if (direction === 'left') {
        movingLeft = true;
    } else if (direction === 'right') {
        movingRight = true;
    }
}

function stopMovePlayer(direction) {
    if (direction === 'left') {
        movingLeft = false;
    } else if (direction === 'right') {
        movingRight = false;
    }
}

// Handle touch movement directly on game area
function handleTouchMove(e) {
    e.preventDefault();
    if (!isGameRunning || isPaused) return;
    
    const touch = e.touches[0];
    const gameRect = gameArea.getBoundingClientRect();
    const touchX = touch.clientX - gameRect.left;
    
    // Get the control line position
    const controlLine = document.getElementById('player-control-line');
    const controlLineRect = controlLine ? controlLine.getBoundingClientRect() : null;
    
    // Calculate bowl position based on touch X position
    const newPosition = (touchX / gameWidth) * 100;
    
    // Clamp the position to keep bowl within game area
    playerPosition = Math.max(playerWidth/2/gameWidth*100, Math.min(100-playerWidth/2/gameWidth*100, newPosition));
    player.style.left = `${playerPosition}%`;
    
    // Visual feedback on the control line (add a highlight effect)
    if (controlLine) {
        const highlightEffect = document.createElement('div');
        highlightEffect.style.position = 'absolute';
        highlightEffect.style.width = '20px';
        highlightEffect.style.height = '20px';
        highlightEffect.style.borderRadius = '50%';
        highlightEffect.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        highlightEffect.style.left = `${touchX - 10}px`;
        highlightEffect.style.top = `${controlLineRect.top - gameRect.top - 8}px`;
        highlightEffect.style.pointerEvents = 'none';
        highlightEffect.style.zIndex = '10';
        highlightEffect.style.opacity = '0.8';
        highlightEffect.style.transition = 'opacity 0.5s';
        
        // Add to game area
        gameArea.appendChild(highlightEffect);
        
        // Fade out and remove
        setTimeout(() => {
            highlightEffect.style.opacity = '0';
            setTimeout(() => {
                if (gameArea.contains(highlightEffect)) {
                    gameArea.removeChild(highlightEffect);
                }
            }, 500);
        }, 100);
    }
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
    
    // Higher chance for rainbow balloons - now 20% chance regardless of level
    const rainbowChance = 0.20; // 20% chance for rainbow balloons
    const isRainbow = Math.random() < rainbowChance;
    
    // Add variety of balloon colors
    const colors = [
        'red', 'blue', 'green', 'purple', 'orange', 'pink', 'yellow'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    if (isRainbow) {
        balloon.classList.add('rainbow-effect');
    } else {
        balloon.classList.add(randomColor);
    }
    
    // Set balloon gradient based on color (unless it's rainbow)
    if (!isRainbow) {
        let gradientStart, gradientEnd;
        switch(randomColor) {
            case 'red':
                gradientStart = '#ff9999';
                gradientEnd = '#ff0000';
                break;
            case 'blue':
                gradientStart = '#99c2ff';
                gradientEnd = '#0066ff';
                break;
            case 'green':
                gradientStart = '#99ffa2';
                gradientEnd = '#00cc00';
                break;
            case 'purple':
                gradientStart = '#d299ff';
                gradientEnd = '#9900cc';
                break;
            case 'orange':
                gradientStart = '#ffcc99';
                gradientEnd = '#ff6600';
                break;
            case 'pink':
                gradientStart = '#ffb8e6';
                gradientEnd = '#ff3399';
                break;
            case 'yellow':
                gradientStart = '#fff099';
                gradientEnd = '#ffcc00';
                break;
            default:
                gradientStart = '#ff9999';
                gradientEnd = '#ff0000';
        }
        
        balloon.style.background = `radial-gradient(circle at 30% 30%, ${gradientStart}, ${gradientEnd})`;
    }
    
    // Random position
    const randomX = Math.random() * (gameArea.offsetWidth - 30);
    balloon.style.left = randomX + 'px';
    
    gameArea.appendChild(balloon);
    
    // Adjust balloon speed based on level - much slower at level 1
    let balloonSpeed;
    if (level === 1) {
        balloonSpeed = ballSpeed * 0.7; // 30% slower at level 1
    } else {
        balloonSpeed = ballSpeed * (1 + (level - 2) * 0.1); // Normal scaling from level 2+
    }
    
    // Rainbow balloons are worth more but fall faster
    if (isRainbow) {
        balloonSpeed *= 1.3; // 30% faster
    }
    
    balls.push({
        element: balloon,
        y: -40,
        speed: balloonSpeed,
        color: isRainbow ? 'rainbow' : randomColor,
        isRainbow: isRainbow,
        value: isRainbow ? 3 : 1 // Rainbow balloons are worth 3 points
    });
}

// Create a catch effect
function createCatchEffect(x, y, color) {
    const effect = document.createElement('div');
    effect.classList.add('catch-effect');
    
    // Get color for the effect based on balloon color
    let effectColor;
    switch(color) {
        case 'blue': effectColor = '#0066ff'; break;
        case 'green': effectColor = '#00cc00'; break;
        case 'yellow': effectColor = '#ffcc00'; break;
        case 'purple': effectColor = '#9900cc'; break;
        case 'orange': effectColor = '#ff6600'; break;
        case 'pink': effectColor = '#ff3399'; break;
        case 'red': default: effectColor = '#ff0000'; break;
    }
    
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
    if (!isGameRunning || isPaused) return;
    
    // Calculate delta time for smoother movement
    const deltaTime = timestamp - lastTime || 16.7;
    lastTime = timestamp;
    
    // Check for level up based on score - at 30, 60, 90, etc.
    let newLevel = Math.floor(score / 30) + 1; // Level up every 30 points
    if (newLevel > level) {
        level = newLevel;
        // Display level up message
        showLevelUpMessage(level);
        
        // Make game harder by increasing spawn rate and ball speed
        // Level 1: Very slow, Level 2+: Progressively harder
        if (level === 2) {
            spawnRate = 1300; // Medium difficulty at level 2
            ballSpeed = 1.8;
        } else if (level > 2) {
            spawnRate = Math.max(spawnRateMin, 1300 - (level - 2) * 100);
            ballSpeed = 1.8 + (level - 2) * 0.2;
        }
        
        // Add rainbow effect to all balloons
        makeBalloonsRainbow();
        
        // Change the background theme based on level
        changeBackgroundTheme(level);
        
        // Add forest animation effect when leveling up
        addForestEffect();
        
        // Add party popper animation
        showPartyPopper();
    }
    
    // Reset combo if too much time has passed since last catch
    if (timestamp - lastCatchTime > 3000 && consecutiveCatches > 0) {
        consecutiveCatches = 0;
        scoreMultiplier = 1;
        updateComboDisplay();
    }
    
    // Handle keyboard movement
    if (keysPressed['ArrowLeft']) {
        movePlayer(-playerSpeed * (deltaTime / 16.67));
    }
    if (keysPressed['ArrowRight']) {
        movePlayer(playerSpeed * (deltaTime / 16.67));
    }
    
    // Handle touch/hold movement for mobile
    if (movingLeft) {
        movePlayer(-playerSpeed * (deltaTime / 16.67));
    }
    if (movingRight) {
        movePlayer(playerSpeed * (deltaTime / 16.67));
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
                // Balloon caught - add points based on balloon value
                score += ball.value;
                scoreElement.textContent = score;
                
                // Update high score if needed
                if (score > highScore) {
                    highScore = score;
                    highScoreElement.textContent = highScore;
                    localStorage.setItem('catchBalloonHighScore', highScore);
                }
                
                // Track consecutive catches and update multiplier
                consecutiveCatches++;
                lastCatchTime = timestamp;
                
                // Update multiplier for consecutive catches
                scoreMultiplier = Math.min(5, 1 + Math.floor(consecutiveCatches / 3));
                updateComboDisplay();
                
                // Create catch effect with balloon's color
                createCatchEffect(ballCenter, playerTop, ball.color);
                
                // Show score pop-up animation
                showScorePopAnimation(ballCenter, playerTop - 20, ball.value);
                
                // Play catch sound - special sound for rainbow balloons
                playSound(ball.isRainbow ? 'special' : 'catch');
                
                // Remove balloon
                ball.element.remove();
                balls.splice(i, 1);
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
        } else if (type === 'special') {
            // Special sound for rainbow balloons
            const specialSound = new Audio('sounds/special.mp3');
            specialSound.currentTime = 0;
            specialSound.play();
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
    
    // Show what score is needed for next level
    const nextLevelScore = level * 30;
    levelUpMsg.innerHTML = `Level ${level}!<br><span style="font-size: 24px;">Speed Increased!<br>Next level at ${nextLevelScore} points</span>`;
    
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
    spawnRate = 2000; // Slow spawn rate at level 1
    ballSpeed = 1.2; // Slow ball speed at level 1
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    playerPosition = 50;
    player.style.left = `${playerPosition}%`;
    isPaused = false;
    pauseBtn.classList.remove('paused');
    
    // Clear existing balloons
    const existingBalloons = gameArea.querySelectorAll('.balloon');
    existingBalloons.forEach(balloon => balloon.remove());
    
    // Reset to forest theme (default)
    document.body.classList.remove('theme-forest', 'theme-blank', 'theme-ice', 'theme-desert', 'theme-night');
    document.body.classList.add('theme-forest');
    
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

// Apply rainbow effect to all balloons for a short time
function makeBalloonsRainbow() {
    const allBalloons = document.querySelectorAll('.balloon');
    
    allBalloons.forEach(balloon => {
        // Save original classes for restoring later
        const originalClasses = balloon.className;
        const originalBackground = balloon.style.background;
        
        // Add rainbow animation class
        balloon.classList.add('rainbow-effect');
        
        // Reset after 2 seconds
        setTimeout(() => {
            balloon.classList.remove('rainbow-effect');
            balloon.className = originalClasses;
            balloon.style.background = originalBackground;
        }, 2000);
    });
}

// Show score pop animation
function showScorePopAnimation(x, y, value) {
    const popup = document.createElement('div');
    popup.className = 'score-pop';
    
    // Show the actual point value
    popup.textContent = `+${value}`;
    
    // Position popup
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    // Apply multiplier and special styling for rainbow balloons
    if (value > 1) {
        popup.classList.add('rainbow-score');
        popup.style.fontSize = `${18}px`;
    }
    
    // Apply higher value for combo
    if (scoreMultiplier > 1) {
        popup.textContent = `+${value * scoreMultiplier}`;
        popup.style.fontSize = `${16 + scoreMultiplier * 2}px`;
        popup.style.color = getComboColor(scoreMultiplier);
    }
    
    // Add to game area
    gameArea.appendChild(popup);
    
    // Remove after animation completes
    setTimeout(() => {
        if (gameArea.contains(popup)) {
            gameArea.removeChild(popup);
        }
    }, 1000);
}

// Get color based on combo multiplier
function getComboColor(multiplier) {
    switch(multiplier) {
        case 2: return '#4CAF50'; // green
        case 3: return '#2196F3'; // blue
        case 4: return '#9C27B0'; // purple
        case 5: return '#F44336'; // red
        default: return 'white';
    }
}

// Show party popper animation on level up
function showPartyPopper() {
    // Create confetti container
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    gameArea.appendChild(confettiContainer);
    
    // Add multiple confetti pieces
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
        
        confettiContainer.appendChild(confetti);
    }
    
    // Play party sound
    try {
        const partySound = new Audio('sounds/party.mp3');
        partySound.volume = 0.5;
        partySound.play();
    } catch (e) {
        console.log("Couldn't play party sound:", e);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
        if (gameArea.contains(confettiContainer)) {
            gameArea.removeChild(confettiContainer);
        }
    }, 4000);
}

// Change the background theme based on level
function changeBackgroundTheme(level) {
    // Remove existing theme classes
    document.body.classList.remove('theme-forest', 'theme-blank', 'theme-ice', 'theme-desert', 'theme-night');
    
    // Determine which theme to apply (cycle through themes as level increases)
    const themeIndex = (level - 1) % backgrounds.length;
    const theme = backgrounds[themeIndex];
    
    // Add the new theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Announce the theme change
    const themeMessage = document.createElement('div');
    themeMessage.classList.add('theme-message');
    themeMessage.textContent = `${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme!`;
    gameArea.appendChild(themeMessage);
    
    // Remove after animation
    setTimeout(() => {
        themeMessage.classList.add('fade-out');
        setTimeout(() => {
            if (gameArea.contains(themeMessage)) {
                gameArea.removeChild(themeMessage);
            }
        }, 1000);
    }, 2000);
}

// Start the game when the page loads
window.addEventListener('load', init); 