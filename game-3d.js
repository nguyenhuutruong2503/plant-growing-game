// Three.js 3D Game State
const gameState = {
    day: 1,
    money: 100,
    water: 50,
    energy: 100,
    maxEnergy: 100,
    selectedPlot: null,
    plots: [
        { position: [-8, 0, 0], seed: null, stage: 0, water: 0, object: null },
        { position: [-2, 0, 0], seed: null, stage: 0, water: 0, object: null },
        { position: [4, 0, 0], seed: null, stage: 0, water: 0, object: null },
        { position: [10, 0, 0], seed: null, stage: 0, water: 0, object: null }
    ]
};

// Seed data
const seeds = {
    sunflower: {
        name: 'Hoa Hướng Dương',
        growTime: 3,
        sellPrice: 40,
        waterNeeded: 2,
        cost: 20,
        colors: [0x90ee90, 0xffff00, 0xffa500]
    },
    tulip: {
        name: 'Tulip',
        growTime: 4,
        sellPrice: 50,
        waterNeeded: 2,
        cost: 25,
        colors: [0x90ee90, 0xff69b4, 0xff1493]
    },
    rose: {
        name: 'Hoa Hồng',
        growTime: 5,
        sellPrice: 60,
        waterNeeded: 3,
        cost: 30,
        colors: [0x90ee90, 0xff69b4, 0xff0000]
    },
    carrot: {
        name: 'Cà Rốt',
        growTime: 2,
        sellPrice: 30,
        waterNeeded: 1,
        cost: 15,
        colors: [0x90ee90, 0xffa500, 0xff6347]
    }
};

// Three.js setup
let scene, camera, renderer;
let farmer, farmland;
let raycaster, mouse;
const plantMeshes = {};

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 100, 150);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Raycaster for mouse picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create farmland
    createFarmland();

    // Create plots (interaction zones)
    createPlots();

    // Create farmer
    createFarmer();

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Start animation loop
    animate();
}

function createFarmland() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grass field
    const grassGeometry = new THREE.PlaneGeometry(30, 30);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0.01;
    grass.receiveShadow = true;
    scene.add(grass);

    // Fence
    createFence();
}

function createFence() {
    const fenceHeight = 2;
    const fenceLength = 40;
    const fenceWidth = 0.3;

    // Front fence
    const fenceGeometry = new THREE.BoxGeometry(fenceLength, fenceHeight, fenceWidth);
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    const frontFence = new THREE.Mesh(fenceGeometry, fenceMaterial);
    frontFence.position.z = -20;
    scene.add(frontFence);

    const backFence = new THREE.Mesh(fenceGeometry, fenceMaterial);
    backFence.position.z = 20;
    scene.add(backFence);

    const leftFence = new THREE.Mesh(new THREE.BoxGeometry(fenceWidth, fenceHeight, fenceLength), fenceMaterial);
    leftFence.position.x = -20;
    scene.add(leftFence);

    const rightFence = new THREE.Mesh(new THREE.BoxGeometry(fenceWidth, fenceHeight, fenceLength), fenceMaterial);
    rightFence.position.x = 20;
    scene.add(rightFence);
}

function createPlots() {
    gameState.plots.forEach((plot, index) => {
        // Soil plot
        const plotGeometry = new THREE.BoxGeometry(3, 0.5, 3);
        const plotMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        const plotMesh = new THREE.Mesh(plotGeometry, plotMaterial);
        plotMesh.position.set(...plot.position);
        plotMesh.receiveShadow = true;
        scene.add(plotMesh);

        // Store mesh reference for picking
        plotMesh.userData = { type: 'plot', index: index };

        plot.plotMesh = plotMesh;
    });
}

function createFarmer() {
    const farmerGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    farmerGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2;
    head.castShadow = true;
    farmerGroup.add(head);

    // Hat
    const hatGeometry = new THREE.ConeGeometry(0.5, 0.6, 32);
    const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 2.5;
    hat.castShadow = true;
    farmerGroup.add(hat);

    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.2);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 1.2, 0);
    leftArm.castShadow = true;
    farmerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 1.2, 0);
    rightArm.castShadow = true;
    farmerGroup.add(rightArm);

    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.5, 0);
    leftLeg.castShadow = true;
    farmerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.5, 0);
    rightLeg.castShadow = true;
    farmerGroup.add(rightLeg);

    farmerGroup.position.set(0, 0, -5);
    scene.add(farmerGroup);
    farmer = farmerGroup;
}

function createPlant(plotIndex, seedType) {
    const plot = gameState.plots[plotIndex];
    const seedData = seeds[seedType];

    // Remove old plant if exists
    if (plot.object) {
        scene.remove(plot.object);
    }

    const plantGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
    const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.5;
    stem.castShadow = true;
    plantGroup.add(stem);

    // Leaves
    const leafGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.3);
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32cd32 });

    const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf1.position.set(0.3, 0.6, 0.1);
    leaf1.rotation.z = Math.PI / 4;
    leaf1.castShadow = true;
    plantGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf2.position.set(-0.3, 0.4, 0.1);
    leaf2.rotation.z = -Math.PI / 4;
    leaf2.castShadow = true;
    plantGroup.add(leaf2);

    // Flower (appears in later stages)
    if (plot.stage >= 2) {
        const flowerGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const flowerColor = seedData.colors[Math.min(plot.stage - 2, seedData.colors.length - 1)];
        const flowerMaterial = new THREE.MeshLambertMaterial({ color: flowerColor });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 1.2;
        flower.castShadow = true;
        plantGroup.add(flower);
    }

    plantGroup.position.set(...plot.position);
    plantGroup.userData = { type: 'plant', index: plotIndex };
    scene.add(plantGroup);

    plot.object = plantGroup;
    plantMeshes[plotIndex] = plantGroup;
}

function plantSeed(plotIndex, seedType) {
    const plot = gameState.plots[plotIndex];
    const seedData = seeds[seedType];

    if (plot.seed) {
        showMessage('❌ Luống này đã có cây rồi!');
        return;
    }

    if (gameState.money < seedData.cost) {
        showMessage(`❌ Không đủ tiền! Bạn có ${gameState.money}💰, cần ${seedData.cost}💰`);
        return;
    }

    if (gameState.energy < 10) {
        showMessage('❌ Năng lực không đủ!');
        return;
    }

    gameState.money -= seedData.cost;
    gameState.energy -= 10;
    plot.seed = seedType;
    plot.stage = 0;
    plot.water = 0;

    createPlant(plotIndex, seedType);
    updateUI();
    saveGame();
    showMessage(`🌱 Đã trồng ${seedData.name}!`);
}

function waterPlant(plotIndex) {
    const plot = gameState.plots[plotIndex];

    if (!plot.seed) {
        showMessage('❌ Không có cây ở đây!');
        return;
    }

    if (gameState.water < 5) {
        showMessage('❌ Nước không đủ!');
        return;
    }

    if (gameState.energy < 5) {
        showMessage('❌ Năng lực không đủ!');
        return;
    }

    const seedData = seeds[plot.seed];
    gameState.water -= 5;
    gameState.energy -= 5;
    plot.water += 1;

    if (plot.water >= seedData.waterNeeded) {
        plot.stage += 1;
        plot.water = 0;
        createPlant(plotIndex, plot.seed);
        showMessage(`💧 Cây đã lớn lên!`);
    } else {
        showMessage(`💧 Đã tưới nước!`);
    }

    updateUI();
    saveGame();
}

function harvestPlant(plotIndex) {
    const plot = gameState.plots[plotIndex];

    if (!plot.seed) {
        showMessage('❌ Không có cây để thu hoạch!');
        return;
    }

    const seedData = seeds[plot.seed];

    if (plot.stage < seedData.growTime) {
        showMessage(`❌ Cây chưa chín! (Giai đoạn ${plot.stage}/${seedData.growTime})`);
        return;
    }

    if (gameState.energy < 15) {
        showMessage('❌ Năng lực không đủ!');
        return;
    }

    gameState.money += seedData.sellPrice;
    gameState.energy -= 15;
    showMessage(`🌾 Thu hoạch thành công! Được ${seedData.sellPrice}💰`);

    plot.seed = null;
    plot.stage = 0;
    plot.water = 0;

    if (plot.object) {
        scene.remove(plot.object);
        plot.object = null;
    }

    updateUI();
    saveGame();
}

function buySeed(seedType) {
    const seedData = seeds[seedType];

    if (gameState.money >= seedData.cost) {
        gameState.money -= seedData.cost;
        updateUI();
        saveGame();
        showMessage(`🛍️ Đã mua hạt ${seedData.name}!`);
    } else {
        showMessage(`❌ Không đủ tiền! Bạn có ${gameState.money}💰`);
    }
}

function buyWater() {
    const cost = 5;
    const amount = 20;

    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.water += amount;
        updateUI();
        saveGame();
        showMessage(`💧 Đã mua ${amount}L nước!`);
    } else {
        showMessage(`❌ Không đủ tiền! Bạn có ${gameState.money}💰`);
    }
}

function plantSeedAction() {
    if (gameState.selectedPlot === null) return;
    
    const seedType = prompt('Chọn loại hạt:\n1. Hướng dương (20💰)\n2. Tulip (25💰)\n3. Hoa hồng (30💰)\n4. Cà rốt (15💰)');
    
    let selected = null;
    switch(seedType) {
        case '1': selected = 'sunflower'; break;
        case '2': selected = 'tulip'; break;
        case '3': selected = 'rose'; break;
        case '4': selected = 'carrot'; break;
    }

    if (selected) {
        plantSeed(gameState.selectedPlot, selected);
        closeActionMenu();
    }
}

function waterPlantAction() {
    if (gameState.selectedPlot !== null) {
        waterPlant(gameState.selectedPlot);
        closeActionMenu();
    }
}

function harvestPlantAction() {
    if (gameState.selectedPlot !== null) {
        harvestPlant(gameState.selectedPlot);
        closeActionMenu();
    }
}

function closeActionMenu() {
    document.getElementById('actionMenu').style.display = 'none';
    gameState.selectedPlot = null;
}

function showActionMenu(plotIndex) {
    gameState.selectedPlot = plotIndex;
    const plot = gameState.plots[plotIndex];
    const menuDiv = document.getElementById('actionMenu');
    const nameDiv = document.getElementById('selectedPlotName');

    if (plot.seed) {
        nameDiv.textContent = `📍 ${seeds[plot.seed].name} (Giai đoạn ${plot.stage})`;
    } else {
        nameDiv.textContent = '📍 Luống trống';
    }

    menuDiv.style.display = 'block';
}

function nextDay() {
    gameState.day += 1;

    // Plants grow
    gameState.plots.forEach((plot, index) => {
        if (plot.seed) {
            if (Math.random() < 0.3) {
                plot.water = 0;
                // Cây có thể chết
            } else if (plot.water > 0) {
                plot.water -= 0.5;
            }
        }
    });

    gameState.money += 20;
    gameState.water += 10;
    gameState.energy = Math.min(gameState.energy + 30, gameState.maxEnergy);

    updateUI();
    saveGame();
    showMessage(`📅 Bây giờ là ngày ${gameState.day}! +20💰 +10💧 +30❤️`);
}

function resetGame() {
    if (confirm('Bạn có chắc chắn muốn chơi lại không?')) {
        localStorage.removeItem('plantGameState');
        location.reload();
    }
}

function updateUI() {
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('money').textContent = gameState.money;
    document.getElementById('water').textContent = gameState.water;
    document.getElementById('energy').textContent = gameState.energy;
}

function showMessage(message) {
    const logDiv = document.getElementById('messageLog');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.textContent = message;
    logDiv.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.classList.add('remove');
        setTimeout(() => msgDiv.remove(), 300);
    }, 2000);
}

function saveGame() {
    const saveData = {
        day: gameState.day,
        money: gameState.money,
        water: gameState.water,
        energy: gameState.energy,
        plots: gameState.plots.map(p => ({
            seed: p.seed,
            stage: p.stage,
            water: p.water
        }))
    };
    localStorage.setItem('plantGameState', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('plantGameState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.day = data.day;
        gameState.money = data.money;
        gameState.water = data.water;
        gameState.energy = data.energy;
        
        data.plots.forEach((pData, i) => {
            gameState.plots[i].seed = pData.seed;
            gameState.plots[i].stage = pData.stage;
            gameState.plots[i].water = pData.water;
        });

        // Create plants from saved data
        gameState.plots.forEach((plot, i) => {
            if (plot.seed) {
                createPlant(i, plot.seed);
            }
        });
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);

    const plotMeshes = gameState.plots.map(p => p.plotMesh);
    const intersects = raycaster.intersectObjects(plotMeshes);

    if (intersects.length > 0) {
        const clickedPlot = intersects[0].object.userData.index;
        showActionMenu(clickedPlot);
    }
}

function onKeyDown(event) {
    if (gameState.selectedPlot !== null) {
        if (event.key === 'w' || event.key === 'W') {
            plantSeedAction();
        } else if (event.key === 'e' || event.key === 'E') {
            waterPlantAction();
        } else if (event.key === 'r' || event.key === 'R') {
            harvestPlantAction();
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let cameraAngle = 0;

function animate() {
    requestAnimationFrame(animate);

    // Rotate camera around farm
    cameraAngle += 0.0003;
    camera.position.x = Math.sin(cameraAngle) * 25;
    camera.position.z = Math.cos(cameraAngle) * 25;
    camera.lookAt(0, 5, 0);

    // Farmer idle animation
    farmer.position.y = Math.sin(Date.now() * 0.001) * 0.2;
    farmer.rotation.y += 0.001;

    renderer.render(scene, camera);
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    loadGame();
    updateUI();
});
