// Game State
const gameState = {
    day: 1,
    money: 100,
    water: 50,
    plots: [
        { seed: null, stage: 0, water: 0 },
        { seed: null, stage: 0, water: 0 },
        { seed: null, stage: 0, water: 0 },
        { seed: null, stage: 0, water: 0 }
    ],
    inventory: {
        sunflower: 0,
        tulip: 0,
        rose: 0,
        carrot: 0
    }
};

// Seed data
const seeds = {
    sunflower: {
        name: 'Hoa Hướng Dương',
        emoji: ['🌱', '🌿', '🌻', '🌻'],
        growTime: 3,
        sellPrice: 40,
        waterNeeded: 2,
        cost: 20
    },
    tulip: {
        name: 'Tulip',
        emoji: ['🌱', '🌿', '🌷', '🌷'],
        growTime: 4,
        sellPrice: 50,
        waterNeeded: 2,
        cost: 25
    },
    rose: {
        name: 'Hoa Hồng',
        emoji: ['🌱', '🌿', '🌹', '🌹'],
        growTime: 5,
        sellPrice: 60,
        waterNeeded: 3,
        cost: 30
    },
    carrot: {
        name: 'Cà Rốt',
        emoji: ['🌱', '🌿', '🥕', '🥕'],
        growTime: 2,
        sellPrice: 30,
        waterNeeded: 1,
        cost: 15
    }
};

// Initialize game
function initGame() {
    loadGame();
    updateUI();
}

// Save game to localStorage
function saveGame() {
    localStorage.setItem('plantGameState', JSON.stringify(gameState));
}

// Load game from localStorage
function loadGame() {
    const saved = localStorage.getItem('plantGameState');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
    }
}

// Update UI
function updateUI() {
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('money').textContent = gameState.money;
    document.getElementById('water').textContent = gameState.water;

    // Update all plants
    for (let i = 0; i < 4; i++) {
        updatePlantDisplay(i);
    }
}

// Update individual plant display
function updatePlantDisplay(plotIndex) {
    const plot = gameState.plots[plotIndex];
    const plantElement = document.getElementById(`plant${plotIndex}`);

    if (plot.seed) {
        const seedData = seeds[plot.seed];
        const stage = Math.min(plot.stage, seedData.emoji.length - 1);
        plantElement.textContent = seedData.emoji[stage];

        // Add visual indicator for water level
        if (plot.water === 0) {
            plantElement.style.opacity = '0.6';
            plantElement.style.filter = 'grayscale(100%)';
        } else {
            plantElement.style.opacity = '1';
            plantElement.style.filter = 'grayscale(0%)';
        }
    } else {
        plantElement.textContent = '🌾';
        plantElement.style.opacity = '0.3';
    }
}

// Plant seed
function plantSeed(plotIndex) {
    const plot = gameState.plots[plotIndex];

    if (plot.seed) {
        alert('Luống này đã có cây rồi!');
        return;
    }

    // Choose seed
    const seedType = prompt('Chọn loại hạt để trồng:\n1. Hướng dương (20💰)\n2. Tulip (25💰)\n3. Hoa hồng (30💰)\n4. Cà rốt (15💰)');

    let selectedSeed = null;
    switch(seedType) {
        case '1':
            selectedSeed = 'sunflower';
            break;
        case '2':
            selectedSeed = 'tulip';
            break;
        case '3':
            selectedSeed = 'rose';
            break;
        case '4':
            selectedSeed = 'carrot';
            break;
        default:
            alert('Lựa chọn không hợp lệ!');
            return;
    }

    const seedData = seeds[selectedSeed];

    if (gameState.money >= seedData.cost) {
        gameState.money -= seedData.cost;
        plot.seed = selectedSeed;
        plot.stage = 0;
        plot.water = 0;
        saveGame();
        updateUI();
        showMessage(`🌱 Đã trồng ${seedData.name}!`);
    } else {
        alert(`Bạn không đủ tiền! Bạn có ${gameState.money}💰, cần ${seedData.cost}💰`);
    }
}

// Water plant
function waterPlant(plotIndex) {
    const plot = gameState.plots[plotIndex];

    if (!plot.seed) {
        alert('Chưa có cây ở đây!');
        return;
    }

    if (gameState.water < 1) {
        alert('Bạn không có nước! Hãy mua nước từ cửa hàng.');
        return;
    }

    const seedData = seeds[plot.seed];
    gameState.water -= 1;
    plot.water += 1;

    // Grow plant if watered enough
    if (plot.water >= seedData.waterNeeded) {
        plot.stage += 1;
        plot.water = 0;
        showMessage(`💧 Đã tưới nước! Cây đã lớn lên!`);
    } else {
        showMessage(`💧 Đã tưới nước!`);
    }

    // Add animation
    const plantElement = document.getElementById(`plant${plotIndex}`);
    plantElement.classList.add('watered');
    setTimeout(() => {
        plantElement.classList.remove('watered');
    }, 500);

    saveGame();
    updateUI();
}

// Harvest plant
function harvestPlant(plotIndex) {
    const plot = gameState.plots[plotIndex];

    if (!plot.seed) {
        alert('Không có gì để thu hoạch!');
        return;
    }

    const seedData = seeds[plot.seed];

    if (plot.stage < seedData.emoji.length - 1) {
        alert('Cây chưa chín! Hãy tiếp tục tưới nước.');
        return;
    }

    gameState.money += seedData.sellPrice;
    showMessage(`🌾 Thu hoạch thành công! Được ${seedData.sellPrice}💰`);

    plot.seed = null;
    plot.stage = 0;
    plot.water = 0;

    saveGame();
    updateUI();
}

// Buy seed from shop
function buySeed(seedType) {
    const seedData = seeds[seedType];

    if (gameState.money >= seedData.cost) {
        gameState.money -= seedData.cost;
        gameState.inventory[seedType] += 1;
        saveGame();
        updateUI();
        showMessage(`🛍️ Đã mua ${seedData.name}!`);
    } else {
        alert(`Bạn không đủ tiền! Bạn có ${gameState.money}💰, cần ${seedData.cost}💰`);
    }
}

// Buy water
function buyWater() {
    const cost = 5;
    const amount = 20;

    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.water += amount;
        saveGame();
        updateUI();
        showMessage(`💧 Đã mua ${amount} lít nước!`);
    } else {
        alert(`Bạn không đủ tiền! Bạn có ${gameState.money}💰, cần ${cost}💰`);
    }
}

// Next day
function nextDay() {
    gameState.day += 1;

    // Plants grow naturally
    for (let i = 0; i < 4; i++) {
        const plot = gameState.plots[i];
        if (plot.seed) {
            const seedData = seeds[plot.seed];
            
            // Water loss (plants dry out)
            if (plot.water > 0) {
                plot.water -= 0.5;
                if (plot.water < 0) plot.water = 0;
            } else {
                // Plant wilts without water
                if (Math.random() < 0.3) {
                    plot.seed = null;
                    plot.stage = 0;
                }
            }
        }
    }

    // Daily money bonus (doing work)
    gameState.money += 10;
    gameState.water += 5; // Get some water daily

    saveGame();
    updateUI();
    showMessage(`📅 Bây giờ là ngày ${gameState.day}! +10💰 +5💧`);
}

// Reset game
function resetGame() {
    if (confirm('Bạn có chắc chắn muốn chơi lại không? Tất cả dữ liệu sẽ bị xóa!')) {
        localStorage.removeItem('plantGameState');
        gameState.day = 1;
        gameState.money = 100;
        gameState.water = 50;
        gameState.plots = [
            { seed: null, stage: 0, water: 0 },
            { seed: null, stage: 0, water: 0 },
            { seed: null, stage: 0, water: 0 },
            { seed: null, stage: 0, water: 0 }
        ];
        gameState.inventory = {
            sunflower: 0,
            tulip: 0,
            rose: 0,
            carrot: 0
        };
        saveGame();
        updateUI();
        showMessage('🔄 Trò chơi đã được đặt lại!');
    }
}

// Show message
function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease-in-out;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        max-width: 300px;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 2000);
}

// CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Start the game
window.addEventListener('DOMContentLoaded', initGame);
