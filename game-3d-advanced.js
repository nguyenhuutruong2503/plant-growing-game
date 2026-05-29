// Advanced 3D Farming Game with Weather & Day/Night Cycle
const gameState = {
    day: 1,
    gameTime: 360, // minutes (6:00 AM = 360 min)
    money: 100,
    water: 50,
    energy: 100,
    maxEnergy: 100,
    selectedPlot: null,
    weather: 'sunny', // sunny, cloudy, rainy, stormy
    temperature: 25,
    humidity: 60,
    windSpeed: 5,
    plots: [
        { position: [-8, 0, 0], seed: null, stage: 0, water: 0, object: null },
        { position: [-2, 0, 0], seed: null, stage: 0, water: 0, object: null },
        { position: [4, 0, 0], seed: null, stage: 0, water: 0, object: null },
        { position: [10, 0, 0], seed: null, stage: 0, water: 0, object: null }
    ]
};

const seeds = {
    sunflower: { name: 'Hoa Hướng Dương', growTime: 3, sellPrice: 40, waterNeeded: 2, cost: 20, colors: [0x90ee90, 0xffff00, 0xffa500] },
    tulip: { name: 'Tulip', growTime: 4, sellPrice: 50, waterNeeded: 2, cost: 25, colors: [0x90ee90, 0xff69b4, 0xff1493] },
    rose: { name: 'Hoa Hồng', growTime: 5, sellPrice: 60, waterNeeded: 3, cost: 30, colors: [0x90ee90, 0xff69b4, 0xff0000] },
    carrot: { name: 'Cà Rốt', growTime: 2, sellPrice: 30, waterNeeded: 1, cost: 15, colors: [0x90ee90, 0xffa500, 0xff6347] }
};

let scene, camera, renderer, controls;
let farmer, skyBox, sunLight, moonLight;
let rainParticles, rainEmitter;
let raycaster, mouse;
let cloudGroup, fogGroup;

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 150, 250);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 20, 35);
    camera.lookAt(0, 5, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lighting system
    createAdvancedLighting();

    // Environment
    createEnvironment();
    createTerrain();
    createFarmland();
    createPlots();
    createFarmer();
    createClouds();
    createRainEffect();

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onMouseWheel);

    animate();
}

function createAdvancedLighting() {
    // Ambient light (changes with time)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    scene.userData.ambientLight = ambientLight;

    // Sun light (moves across sky)
    sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
    sunLight.position.set(50, 40, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.far = 200;
    scene.add(sunLight);

    // Moon light
    moonLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    moonLight.position.set(-50, 30, -50);
    scene.add(moonLight);

    // Hemisphere light for realistic lighting
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.5);
    scene.add(hemiLight);
}

function createEnvironment() {
    // Sky sphere
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    scene.userData.sky = sky;

    // Sun
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 50, 100);
    scene.add(sun);
    scene.userData.sun = sun;

    // Moon
    const moonGeometry = new THREE.SphereGeometry(8, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(-100, 40, -100);
    scene.add(moon);
    scene.userData.moon = moon;
}

function createClouds() {
    cloudGroup = new THREE.Group();

    for (let i = 0; i < 5; i++) {
        const cloudGeometry = new THREE.SphereGeometry(8, 16, 16);
        const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

        cloud.position.set(
            (Math.random() - 0.5) * 200,
            50 + Math.random() * 30,
            (Math.random() - 0.5) * 200
        );
        cloud.scale.set(2 + Math.random() * 2, 1, 2 + Math.random() * 2);
        cloudGroup.add(cloud);
        cloud.userData.speed = Math.random() * 0.01 + 0.005;
    }

    scene.add(cloudGroup);
}

function createRainEffect() {
    const rainGeometry = new THREE.BufferGeometry();
    const rainCount = 1000;
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = Math.random() * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMaterial = new THREE.LineBasicMaterial({ color: 0x8888ff, linewidth: 2 });
    rainParticles = new THREE.LineSegments(rainGeometry, rainMaterial);
    rainParticles.visible = false;
    scene.add(rainParticles);
}

function createTerrain() {
    const terrainGeometry = new THREE.PlaneGeometry(80, 80, 50, 50);
    const terrainMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x8b7355,
        wireframe: false
    });

    // Add some height variation to terrain
    const positionAttribute = terrainGeometry.getAttribute('position');
    const positions = positionAttribute.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = Math.sin(positions[i] * 0.1) * Math.cos(positions[i + 1] * 0.1) * 0.5;
    }
    positionAttribute.needsUpdate = true;
    terrainGeometry.computeVertexNormals();

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
}

function createFarmland() {
    const grassGeometry = new THREE.PlaneGeometry(50, 50);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0.01;
    grass.receiveShadow = true;
    scene.add(grass);

    // Wooden fence
    const fenceHeight = 3;
    const fenceLength = 60;
    createFence(fenceLength, fenceHeight);
}

function createFence(length, height) {
    const fenceGeometry = new THREE.BoxGeometry(length, height, 0.3);
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    const directions = [
        { pos: [0, height/2, -length/2], rot: [0, 0, 0] },
        { pos: [0, height/2, length/2], rot: [0, 0, 0] },
        { pos: [-length/2, height/2, 0], rot: [0, Math.PI/2, 0] },
        { pos: [length/2, height/2, 0], rot: [0, Math.PI/2, 0] }
    ];

    directions.forEach(d => {
        const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
        fence.position.set(...d.pos);
        fence.rotation.set(...d.rot);
        fence.castShadow = true;
        fence.receiveShadow = true;
        scene.add(fence);
    });
}

function createPlots() {
    gameState.plots.forEach((plot, index) => {
        const plotGeometry = new THREE.BoxGeometry(3, 0.5, 3);
        const plotMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        const plotMesh = new THREE.Mesh(plotGeometry, plotMaterial);
        plotMesh.position.set(...plot.position);
        plotMesh.castShadow = true;
        plotMesh.receiveShadow = true;
        scene.add(plotMesh);

        plotMesh.userData = { type: 'plot', index: index };
        plot.plotMesh = plotMesh;
    });
}

function createFarmer() {
    const farmerGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    farmerGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.1;
    head.castShadow = true;
    farmerGroup.add(head);

    // Hat
    const hatGeometry = new THREE.ConeGeometry(0.55, 0.7, 32);
    const hatMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 2.65;
    hat.castShadow = true;
    farmerGroup.add(hat);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 2.15, 0.35);
    farmerGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 2.15, 0.35);
    farmerGroup.add(rightEye);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.15, 1.1, 4, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.65, 1.3, 0);
    leftArm.castShadow = true;
    farmerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.65, 1.3, 0);
    rightArm.castShadow = true;
    farmerGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.15, 0.9, 4, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, 0.45, 0);
    leftLeg.castShadow = true;
    farmerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, 0.45, 0);
    rightLeg.castShadow = true;
    farmerGroup.add(rightLeg);

    farmerGroup.position.set(0, 0, -8);
    scene.add(farmerGroup);
    farmer = farmerGroup;
}

function createPlant(plotIndex, seedType) {
    const plot = gameState.plots[plotIndex];
    const seedData = seeds[seedType];

    if (plot.object) {
        scene.remove(plot.object);
    }

    const plantGroup = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5 + plot.stage * 0.3, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.75 + plot.stage * 0.15;
    stem.castShadow = true;
    plantGroup.add(stem);

    // Multiple leaves
    for (let i = 0; i < 4; i++) {
        const leafGeometry = new THREE.BoxGeometry(0.9, 0.05, 0.35);
        const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x32cd32 });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        leaf.position.set(
            Math.cos(i * Math.PI / 2) * 0.4,
            0.6 + i * 0.3,
            Math.sin(i * Math.PI / 2) * 0.4
        );
        leaf.rotation.z = Math.PI / 3;
        leaf.castShadow = true;
        plantGroup.add(leaf);
    }

    // Flower (appears at stage 2+)
    if (plot.stage >= 2) {
        const flowerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const flowerColor = seedData.colors[Math.min(plot.stage - 2, seedData.colors.length - 1)];
        const flowerMaterial = new THREE.MeshPhongMaterial({ color: flowerColor, shininess: 100 });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 1.5 + plot.stage * 0.2;
        flower.castShadow = true;
        plantGroup.add(flower);

        // Petals
        for (let i = 0; i < 5; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.25, 16, 16);
            const petal = new THREE.Mesh(petalGeometry, flowerMaterial);
            petal.position.set(
                Math.cos(i * Math.PI * 2 / 5) * 0.6,
                flower.position.y,
                Math.sin(i * Math.PI * 2 / 5) * 0.6
            );
            petal.scale.set(0.8, 1, 0.8);
            petal.castShadow = true;
            plantGroup.add(petal);
        }
    }

    plantGroup.position.set(...plot.position);
    plantGroup.userData = { type: 'plant', index: plotIndex };
    scene.add(plantGroup);

    plot.object = plantGroup;
}

function updateDayNightCycle() {
    gameState.gameTime += 0.5; // ~30 seconds = 1 game hour
    if (gameState.gameTime >= 1440) { // 24 hours = 1440 minutes
        gameState.gameTime = 0;
    }

    // Calculate sun position (0-360 degrees over 24 hours)
    const timePercent = gameState.gameTime / 1440;
    const sunAngle = timePercent * Math.PI * 2 - Math.PI / 2;

    const sunDistance = 80;
    sunLight.position.x = Math.cos(sunAngle) * sunDistance;
    sunLight.position.y = Math.sin(sunAngle) * sunDistance + 20;
    sunLight.position.z = 50;

    scene.userData.sun.position.copy(sunLight.position).normalize().multiplyScalar(120);

    // Update sky color based on time
    let skyColor, ambientIntensity;
    if (gameState.gameTime < 360 || gameState.gameTime > 1080) { // Night (12AM-6AM, 6PM-12AM)
        skyColor = new THREE.Color().setHSL(0.6, 0.5, 0.1);
        ambientIntensity = 0.2;
    } else if (gameState.gameTime < 420 || gameState.gameTime > 1020) { // Dawn/Dusk
        skyColor = new THREE.Color().setHSL(0.1, 1, 0.5);
        ambientIntensity = 0.4;
    } else { // Day
        skyColor = new THREE.Color().setHSL(0.6, 0.5, 0.7);
        ambientIntensity = 0.7;
    }

    scene.background = skyColor;
    scene.fog.color = skyColor;
    scene.userData.ambientLight.intensity = ambientIntensity;

    // Update display
    const hours = Math.floor(gameState.gameTime / 60);
    const minutes = Math.floor(gameState.gameTime % 60);
    document.getElementById('time').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    // Update weather
    updateWeather();
}

function updateWeather() {
    const rand = Math.random();
    
    if (rand < 0.7) {
        gameState.weather = 'sunny';
        gameState.temperature = 20 + Math.random() * 10;
        gameState.humidity = 40 + Math.random() * 20;
        rainParticles.visible = false;
    } else if (rand < 0.85) {
        gameState.weather = 'cloudy';
        gameState.temperature = 15 + Math.random() * 8;
        gameState.humidity = 60 + Math.random() * 20;
        rainParticles.visible = false;
    } else {
        gameState.weather = 'rainy';
        gameState.temperature = 10 + Math.random() * 8;
        gameState.humidity = 80 + Math.random() * 15;
        rainParticles.visible = true;
    }

    // Update weather display
    let weatherIcon, weatherText;
    switch(gameState.weather) {
        case 'sunny': weatherIcon = '☀️'; weatherText = 'Trời đẹp'; break;
        case 'cloudy': weatherIcon = '☁️'; weatherText = 'Có mây'; break;
        case 'rainy': weatherIcon = '🌧️'; weatherText = 'Mưa'; break;
    }

    document.getElementById('weather-icon').textContent = weatherIcon;
    document.getElementById('weather-text').textContent = weatherText;
    document.getElementById('temperature').textContent = `${gameState.temperature.toFixed(1)}°C`;
    document.getElementById('humidity').textContent = `${gameState.humidity.toFixed(0)}%`;
}

function updateRainEffect() {
    if (gameState.weather === 'rainy' && rainParticles) {
        const positions = rainParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 0.5;
            if (positions[i + 1] < -10) {
                positions[i + 1] = 100;
            }
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
    }
}

function updateClouds() {
    if (cloudGroup) {
        cloudGroup.children.forEach(cloud => {
            cloud.position.x += cloud.userData.speed;
            if (cloud.position.x > 150) cloud.position.x = -150;
        });
    }
}

function plantSeed(plotIndex, seedType) {
    const plot = gameState.plots[plotIndex];
    const seedData = seeds[seedType];

    if (plot.seed) {
        showMessage('❌ Luống này đã có cây rồi!');
        return;
    }

    if (gameState.money < seedData.cost) {
        showMessage(`❌ Không đủ tiền! Bạn có ${gameState.money}💰`);
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
        showMessage(`❌ Không đủ tiền!`);
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
        showMessage(`❌ Không đủ tiền!`);
    }
}

function plantSeedAction() {
    if (gameState.selectedPlot === null) return;
    const seedType = prompt('1. Hướng dương (20)\n2. Tulip (25)\n3. Hoa hồng (30)\n4. Cà rốt (15)');
    const seedMap = { '1': 'sunflower', '2': 'tulip', '3': 'rose', '4': 'carrot' };
    if (seedMap[seedType]) {
        plantSeed(gameState.selectedPlot, seedMap[seedType]);
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
    gameState.gameTime = 360;

    gameState.plots.forEach(plot => {
        if (plot.seed) {
            if (gameState.weather === 'rainy') {
                plot.water += 2; // Rain helps
            }
            if (Math.random() < 0.2) {
                plot.water = 0; // Chance to dry out
            }
        }
    });

    gameState.money += 20;
    gameState.water += 10;
    gameState.energy = Math.min(gameState.energy + 50, gameState.maxEnergy);

    updateUI();
    saveGame();
    showMessage(`📅 Ngày ${gameState.day}! +20💰 +10💧 +50❤️`);
}

function resetGame() {
    if (confirm('Chơi lại?')) {
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
        gameTime: gameState.gameTime,
        money: gameState.money,
        water: gameState.water,
        energy: gameState.energy,
        plots: gameState.plots.map(p => ({ seed: p.seed, stage: p.stage, water: p.water }))
    };
    localStorage.setItem('plantGameState', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('plantGameState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.day = data.day;
        gameState.gameTime = data.gameTime || 360;
        gameState.money = data.money;
        gameState.water = data.water;
        gameState.energy = data.energy;
        
        data.plots.forEach((pData, i) => {
            gameState.plots[i].seed = pData.seed;
            gameState.plots[i].stage = pData.stage;
            gameState.plots[i].water = pData.water;
        });

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
        showActionMenu(intersects[0].object.userData.index);
    }
}

function onMouseWheel(event) {
    event.preventDefault();
    camera.position.z += event.deltaY * 0.05;
    camera.position.z = Math.max(20, Math.min(100, camera.position.z));
}

function onKeyDown(event) {
    if (gameState.selectedPlot !== null) {
        if (event.key === 'w' || event.key === 'W') plantSeedAction();
        else if (event.key === 'e' || event.key === 'E') waterPlantAction();
        else if (event.key === 'r' || event.key === 'R') harvestPlantAction();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    updateDayNightCycle();
    updateRainEffect();
    updateClouds();

    // Farmer animation
    farmer.position.y = Math.sin(Date.now() * 0.0005) * 0.15;

    renderer.render(scene, camera);
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    loadGame();
    updateUI();
});
