
let canvas, ctx;
let gameActive = false;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let stageIndex = 0;
let timeLeft = 120;
let timerInterval;

// t3 jouer
let playerImage = new Image();
playerImage.src = 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png';


const stages = [
    { name: '🏫 المدرسة', background: 'https://www.gietvloerplaatsen.be/wp-content/uploads/sites/46/2023/11/gietvloer-school.jpg' },
    { name: '🏙️ المدينة', background: 'https://th.bing.com/th/id/R.ca3de67b2259fc3a710cb414f52b7858?rik=MNKHe%2bnpnKccow&riu=http%3a%2f%2fi.huffpost.com%2fgen%2f857691%2fimages%2fo-MOST-EXPENSIVE-NEIGHBORHOODS-facebook.jpg&ehk=SkTUqasYupAt1KlEVzGJ%2f4oIH3N3YdnMu1jfwiZxniA%3d&risl=&pid=ImgRaw&r=0' },
    { name: '🏖️ الشاطئ', background: 'https://media.istockphoto.com/photos/bahia-bech-scenes-picture-id1369947862?k=20&m=1369947862&s=612x612&w=0&h=nqfJ4ZawCu1URJr6zog1rtgSOUFHTb48yOLcSogTIhI=' }
];

const TrashType = {
    PLASTIC: 'plastic',
    PAPER: 'paper',
    GLASS: 'glass',
    METAL: 'metal',
    ORGANIC: 'organic'
};

const trashColors = {
    [TrashType.PLASTIC]: '#2196F3',
    [TrashType.PAPER]: '#FFFFFF',
    [TrashType.GLASS]: '#4CAF50',
    [TrashType.METAL]: '#FF9800',
    [TrashType.ORGANIC]: '#795548'
};

const binImages = {
    [TrashType.PLASTIC]: '🔄',
    [TrashType.PAPER]: '📄',
    [TrashType.GLASS]: '🍶',
    [TrashType.METAL]: '🥫',
    [TrashType.ORGANIC]: '🍎'
};

const trashSymbols = {
    [TrashType.PLASTIC]: '🥤',
    [TrashType.PAPER]: '📰',
    [TrashType.GLASS]: '🍾',
    [TrashType.METAL]: '🔩',
    [TrashType.ORGANIC]: '🍌'
};

const trashNames = {
    [TrashType.PLASTIC]: 'بلاستيك',
    [TrashType.PAPER]: 'ورق',
    [TrashType.GLASS]: 'زجاج',
    [TrashType.METAL]: 'معدن',
    [TrashType.ORGANIC]: 'عضوي'
};

const homeScreen = document.getElementById('home-screen');
const learnScreen = document.getElementById('learn-screen');
const gameScreen = document.getElementById('game-screen');
const winScreen = document.getElementById('win-screen');
const startButton = document.getElementById('start-button');
const learnButton = document.getElementById('learn-button');
const closeLearnButton = document.getElementById('close-learn-button');
const resetButton = document.getElementById('reset-button');
const dropButton = document.getElementById('drop-button');
const playAgainButton = document.getElementById('play-again-button');
const scoreValue = document.getElementById('score-value');
const bestScoreValue = document.getElementById('best-score-value');
const stageValue = document.getElementById('stage-value');
const timeValue = document.getElementById('time-value');
const finalScore = document.getElementById('final-score');
const joystickKnob = document.getElementById('joystick-knob');
const joystickBackground = document.getElementById('joystick-background');
const progressFill = document.getElementById('progress-fill');
const commandMessage = document.getElementById('command-message');
const pointsMessage = document.getElementById('points-message');
const gameCanvas = document.getElementById('game-canvas');

let player = {
    x: 0,
    y: 0,
    width: 70,
    height: 70,
    speed: 6,
    carrying: null
};

let bins = [];
let trashItems = [];
let keys = {};
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };

let binSprites = {};
// loop t3 game
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    createBinSprites();
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setupControls();
    
    startGame();
}
//li ykhdm bin 
function createBinSprites() {
    const types = Object.values(TrashType);
    types.forEach(type => {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        
        ctx.fillStyle = trashColors[type];
        ctx.fillRect(10, 20, 60, 70);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(5, 10, 70, 15);
        
        ctx.fillStyle = '#333';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(20 + i * 20, 15, 10, 5);
        }
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(binImages[type], 40, 60);
        
        binSprites[type] = canvas;
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('game-header').offsetHeight;
    
    if (gameActive) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 200;
        spawnBins();
        spawnTrash();
    }
}

// control
function setupControls() {

    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        if (e.key === ' ' && player.carrying) {
            dropTrash();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    dropButton.addEventListener('click', () => {
        if (player.carrying) {
            dropTrash();
        }
    });
    
    resetButton.addEventListener('click', resetGame);
    
    setupJoystick();
}

// joystik
function setupJoystick() {
    let joystickPressed = false;
    
    joystickKnob.addEventListener('mousedown', (e) => {
        joystickPressed = true;
        joystickActive = true;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!joystickPressed) return;
        
        const rect = joystickBackground.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let deltaX = e.clientX - centerX;
        let deltaY = e.clientY - centerY;
        
        const maxDistance = rect.width / 2 - joystickKnob.offsetWidth / 2;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
        
        if (distance > 0) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * distance;
            deltaY = Math.sin(angle) * distance;
            
            joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            joystickVector.x = deltaX / maxDistance;
            joystickVector.y = deltaY / maxDistance;
        }
    });
    
    document.addEventListener('mouseup', () => {
        joystickPressed = false;
        joystickActive = false;
        joystickKnob.style.transform = 'translate(0, 0)';
        joystickVector.x = 0;
        joystickVector.y = 0;
    });
    
    joystickKnob.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickPressed = true;
        joystickActive = true;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!joystickPressed) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = joystickBackground.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let deltaX = touch.clientX - centerX;
        let deltaY = touch.clientY - centerY;
        
        const maxDistance = rect.width / 2 - joystickKnob.offsetWidth / 2;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
        
        if (distance > 0) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * distance;
            deltaY = Math.sin(angle) * distance;
            
            joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            joystickVector.x = deltaX / maxDistance;
            joystickVector.y = deltaY / maxDistance;
        }
    });
    
    document.addEventListener('touchend', () => {
        joystickPressed = false;
        joystickActive = false;
        joystickKnob.style.transform = 'translate(0, 0)';
        joystickVector.x = 0;
        joystickVector.y = 0;
    });
}


function startGame() {
    gameActive = true;
    score = 0;
    stageIndex = 0;
    timeLeft = 120;
    updateUI();
    
    
    startTimer();
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 200;
    player.carrying = null;
    
    spawnBins();
    spawnTrash();
    
    // backgound 
    updateStageBackground();
    
    gameLoop();
}

function updateStageBackground() {
    const currentStage = stages[stageIndex];
    gameCanvas.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${currentStage.background}')`;
    gameCanvas.style.backgroundSize = 'cover';
    gameCanvas.style.backgroundPosition = 'center';
}

// lw9t
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameActive) {
            timeLeft--;
            timeValue.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

// stop
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    showWinScreen();
}

function spawnBins() {
    bins = [];
    const binWidth = 100;
    const binHeight = 120;
    const binY = canvas.height - 150;
    
    const binPositions = [
        canvas.width * 0.05,
        canvas.width * 0.2,
        canvas.width * 0.4,
        canvas.width * 0.6,
        canvas.width * 0.8
    ];
    
    const trashTypes = Object.values(TrashType);
    
    trashTypes.forEach((type, index) => {
        bins.push({
            type: type,
            x: binPositions[index] - binWidth / 2,
            y: binY,
            width: binWidth,
            height: binHeight
        });
    });
}

// la poubel 
function spawnTrash() {
    trashItems = [];
    const trashSize = 50;
    const trashYStart = canvas.height - 300;
    
    for (let i = 0; i < 12; i++) {
        const trashTypes = Object.values(TrashType);
        const type = trashTypes[Math.floor(Math.random() * trashTypes.length)];
        
        trashItems.push({
            type: type,
            x: 100 + Math.random() * (canvas.width - 200),
            y: trashYStart - Math.random() * 150,
            width: trashSize,
            height: trashSize,
            collected: false
        });
    }
}

function gameLoop() {
    if (!gameActive) return;
    update();
    
    render();
    
    requestAnimationFrame(gameLoop);
}

function update() {
    movePlayer();
    collectTrash();
    updateUI();
    updateProgressBar();
}

// kht lzrg
function updateProgressBar() {
    const totalTrash = 12;
    const collectedTrash = totalTrash - trashItems.length;
    const progress = (collectedTrash / totalTrash) * 100;
    progressFill.style.width = `${progress}%`;
}

function movePlayer() {
    let moveX = 0;
    let moveY = 0;
    
    if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX += 1;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) moveX -= 1;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) moveY -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) moveY += 1;
    
    if (joystickActive) {
        moveX += joystickVector.x;
        moveY += joystickVector.y;
    }
    
    if (moveX !== 0 || moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
        
        player.x += moveX * player.speed;
        player.y += moveY * player.speed;
    }
    
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
    
    if (player.carrying) {
        player.carrying.x = player.x;
        player.carrying.y = player.y - player.height / 2 - 20;
    }
}

function collectTrash() {
    if (player.carrying) return;
    
    for (let trash of trashItems) {
        if (trash.collected) continue;
        
        const distance = Math.sqrt(
            Math.pow(trash.x - player.x, 2) + 
            Math.pow(trash.y - player.y, 2)
        );
        
        if (distance < 70) {
            trash.collected = true;
            player.carrying = trash;
            break;
        }
    }
}
// p jdid
function dropTrash() {
    if (!player.carrying) return;
    
    const trash = player.carrying;
    let nearestBin = null;
    let minDistance = Infinity;
    
    for (let bin of bins) {
        const distance = Math.sqrt(
            Math.pow(bin.x + bin.width / 2 - player.x, 2) + 
            Math.pow(bin.y + bin.height / 2 - player.y, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestBin = bin;
        }
    }
    
    if (nearestBin && minDistance < 120) {
        const correct = trash.type === nearestBin.type;
        
        if (correct) {
            score += 15;
            timeLeft += 10;
            showPointsMessage('+15 نقطة! +10 ثوانٍ!', '#4ECDC4');
            
            createConfetti();
        } else {
            score = Math.max(0, score - 8);
            
            showPointsMessage('-8 نقاط!', '#FF6B6B');
        }
        
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
        }
        
        const index = trashItems.indexOf(trash);
        if (index > -1) {
            trashItems.splice(index, 1);
        }
        
        player.carrying = null;
        
        if (score >= 100) {
            stageIndex++;
            
            if (stageIndex >= stages.length) {
                showWinScreen();
            } else {
                score = 0;
                timeLeft = 120;
                spawnBins();
                spawnTrash();
                updateStageBackground();
                
                showPointsMessage(`مرحلة جديدة: ${stages[stageIndex].name}`, '#FFD700');
            }
        }
        
        if (trashItems.length === 0) {
            spawnTrash();
        }
    }
}
function showPointsMessage(message, color) {
    pointsMessage.textContent = message;
    pointsMessage.style.color = color;
    pointsMessage.style.opacity = '1';
    
    setTimeout(() => {
        pointsMessage.style.opacity = '0';
    }, 2000);
}

function createConfetti() {
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.width = `${8 + Math.random() * 8}px`;
        confetti.style.height = `${8 + Math.random() * 8}px`;
        document.body.appendChild(confetti);
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 3000);
    }
}

function showWinScreen() {
    gameActive = false;
    clearInterval(timerInterval);
    finalScore.textContent = `⭐ النقاط: ${score}`;
    winScreen.style.display = 'flex';
}
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bins.forEach(bin => {
        ctx.drawImage(binSprites[bin.type], bin.x, bin.y, bin.width, bin.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(trashNames[bin.type], bin.x + bin.width / 2, bin.y + bin.height + 5);
    });
    
    trashItems.forEach(trash => {
        if (trash.collected) return;
        
        ctx.fillStyle = trashColors[trash.type];
        ctx.beginPath();
        ctx.arc(trash.x, trash.y, trash.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(trashSymbols[trash.type], trash.x, trash.y);
    });
    
    if (playerImage.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.clip();
        
        ctx.drawImage(
            playerImage, 
            player.x - player.width / 2, 
            player.y - player.height / 2, 
            player.width, 
            player.height
        );
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    if (player.carrying) {
        const trash = player.carrying;
        ctx.fillStyle = trashColors[trash.type];
        ctx.beginPath();
        ctx.arc(trash.x, trash.y, trash.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(trashSymbols[trash.type], trash.x, trash.y);
    }
}
function updateUI() {
    scoreValue.textContent = score;
    bestScoreValue.textContent = bestScore;
    stageValue.textContent = stages[stageIndex].name;
}

function resetGame() {
    score = 0;
    stageIndex = 0;
    timeLeft = 120;
    player.carrying = null;
    clearInterval(timerInterval);
    startTimer();
    spawnBins();
    spawnTrash();
    updateStageBackground();
    updateUI();
}

function setupEventListeners() {
    startButton.addEventListener('click', () => {
        homeScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        initGame();
    });
    
    learnButton.addEventListener('click', () => {
        homeScreen.style.display = 'none';
        learnScreen.style.display = 'flex';
    });
    
    closeLearnButton.addEventListener('click', () => {
        learnScreen.style.display = 'none';
        homeScreen.style.display = 'flex';
    });
    
    playAgainButton.addEventListener('click', () => {
        winScreen.style.display = 'none';
        resetGame();
        gameActive = true;
        gameLoop();
    });
}
window.onload = function() {
    setupEventListeners();
    bestScoreValue.textContent = bestScore;
};