import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// Создаем сцену, камеру и рендерер
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Включаем тональное отображение для HDR
renderer.toneMappingExposure = 1; // Настройка экспозиции
document.body.appendChild(renderer.domElement);

// Добавляем освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 5);
scene.add(light);

// Загружаем HDR-текстуру для фона
let backgroundSphere;
const rgbeLoader = new RGBELoader();
//rgbeLoader.load('https://cdn.jsdelivr.net/gh/zabolotskiyd/spacegame@a7474ffbd33113de3a808410386d7f5a70057bf0/public/sci-fi.hdr', (texture) => {
rgbeLoader.load('./public/sci-fi.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const backgroundMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide
    });
    const backgroundGeometry = new THREE.SphereGeometry(100, 64, 64);
    backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    scene.add(backgroundSphere);
    backgroundSphere.rotation.y = (2 * Math.PI) / 2;
});

// Создаем куб (игрок)
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0, 0);
scene.add(player);

// Начальная позиция камеры
camera.position.set(0, 2, 5);

// Счётчик убитых врагов
let killedEnemies = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.right = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.fontSize = '20px';



scoreElement.innerHTML = `Killed: ${killedEnemies}`;
document.body.appendChild(scoreElement);
function updateScore() {
    scoreElement.innerHTML = `Killed: ${killedEnemies}`;
}

// Управление игроком
const keys = {};
window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});
const borderLimit = 4;
function movePlayer() {
    const speed = 0.1;
    if (keys['a']) player.position.x = Math.max(player.position.x - speed, -borderLimit);
    if (keys['d']) player.position.x = Math.min(player.position.x + speed, borderLimit);
}

// Враги
const enemies = [];
function createEnemy() {
    if (gameOver) return;

    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(geometry, material);

    // Установка начальной позиции врага
    enemy.position.x = Math.random() * 8 - 4;
    enemy.position.z = -40;

    // Определяем скорость врага
    enemy.speed = Math.random() * 0.2 + 0.05;

    // Частота выстрелов зависит от скорости врага (меньше скорость — больше частота)
    enemy.shootFrequency = Math.max(0.01, 0.05 - enemy.speed); // От 0.01 до 0.05

    scene.add(enemy);
    enemies.push(enemy);
}

// Обновление функции создания врагов на основе счета
function createEnemiesBasedOnScore() {
    if (gameOver) return;

    const maxEnemies = killedEnemies >= 30 ? 3 : killedEnemies >= 15 ? 2 : 1;

    for (let i = 0; i < maxEnemies; i++) {
        createEnemy();
    }
}

// Замена setInterval(createEnemy, 2000) на вызов новой функции
setInterval(() => {
    createEnemiesBasedOnScore();
}, 2000);

function moveEnemies() {
    if (gameOver) return;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.position.z += enemy.speed;
        if (enemy.position.z > 5 || enemy.position.x < -borderLimit || enemy.position.x > borderLimit) {
            scene.remove(enemy);
            enemies.splice(i, 1);
        }
    }
}

// Пули
const bullets = [];
let canShoot = true; // Флаг, разрешающий стрельбу
const fireRateDelay = 200; // Задержка между выстрелами в миллисекундах
let isShooting = false; // Переменная для отслеживания состояния стрельбы

function shoot() {
    if (!canShoot || energy < energyCost) return; // Если стрельба заблокирована или энергии недостаточно, выходим

    canShoot = false; // Блокируем стрельбу
    energy -= energyCost; // Уменьшаем энергию

    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.copy(player.position);
    bullet.position.z -= 0.5;
    scene.add(bullet);
    bullets.push(bullet);

    updateEnergyBar(); // Обновляем индикатор энергии

    // Разблокируем стрельбу через задержку
    setTimeout(() => {
        canShoot = true;
    }, fireRateDelay);
}

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') shoot();
});

function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.position.z -= 0.5;
        if (bullet.position.z < -40 || bullet.position.x < -5 || bullet.position.x > 5) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}

//Энергия
let energy = 100; // Текущая энергия
const maxEnergy = 100; // Максимальная энергия
const energyCost = 20; // Стоимость одного выстрела
const energyRecoveryRate = 0.5; // Скорость восстановления энергии (за кадр)

// Создаем индикатор энергии
const energyBar = document.createElement('div');
energyBar.style.position = 'absolute';
energyBar.style.top = '50px';
energyBar.style.left = '20px';
energyBar.style.width = '100px';
energyBar.style.height = '20px';
energyBar.style.backgroundColor = 'gray';
document.body.appendChild(energyBar);

const energyBarInner = document.createElement('div');
energyBarInner.style.position = 'absolute';
energyBarInner.style.top = '0';
energyBarInner.style.left = '0';
energyBarInner.style.width = '100%';
energyBarInner.style.height = '100%';
energyBarInner.style.backgroundColor = 'blue';
energyBar.appendChild(energyBarInner);

// Функция обновления индикатора энергии
function updateEnergyBar() {
    const percentage = (energy / maxEnergy) * 100;
    energyBarInner.style.width = `${percentage}%`;
}


// Аптечки
let activeHealthPack = null; // Текущая активная аптечка
function createHealthPack(enemyPosition, enemySpeed) {
    if (activeHealthPack) return; // Если уже есть активная аптечка, не создаём новую
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const healthPack = new THREE.Mesh(geometry, material);
    healthPack.position.copy(enemyPosition);
    healthPack.speed = enemySpeed; // Аптечка наследует скорость врага
    scene.add(healthPack);
    activeHealthPack = healthPack;
}
function moveHealthPacks() {
    if (!activeHealthPack) return;
    // Движение аптечки по траектории врага
    activeHealthPack.position.z += activeHealthPack.speed;
    // Проверка столкновения с игроком
    if (player.position.distanceTo(activeHealthPack.position) < 0.5) {
        collectHealthPack();
    }
    // Если аптечка вышла за пределы видимости, удаляем её
    if (activeHealthPack.position.z > 5) {
        scene.remove(activeHealthPack);
        activeHealthPack = null;
    }
}
function collectHealthPack() {
    playerHealth = Math.min(playerHealth + 2, maxHealth);
    updateHealthBar(); // Обновляем цвет полоски здоровья после получения аптечки
    scene.remove(activeHealthPack);
    activeHealthPack = null;
}
function checkHealthPackConditions(enemyPosition, enemySpeed) {
    let dropChance = 0; // Вероятность выпадения аптечки

    // Условие 1: Если убито больше 15 врагов и здоровье меньше 50%
    if (killedEnemies > 15 && playerHealth / maxHealth < 0.5) {
        dropChance = 0.5; // Вероятность 50%
    }

    // Условие 2: Если убито больше 35 врагов и здоровье меньше 50%
    if (killedEnemies > 35 && playerHealth / maxHealth < 0.5) {
        dropChance = 0.65; // Вероятность 65%
    }

    // Условие 3: Если убито больше 35 врагов и здоровье меньше 70%, каждые 10 убийств
    if (killedEnemies > 35 && playerHealth / maxHealth < 0.7 && killedEnemies % 10 === 0) {
        dropChance = 0.5; // Вероятность 50%
    }

    // Проверяем, выпадет ли аптечка
    if (Math.random() < dropChance) {
        createHealthPack(enemyPosition, enemySpeed);
    }
}

// Обработка столкновений
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const distance = bullet.position.distanceTo(enemy.position);
            if (distance < 0.5) {
                scene.remove(bullet);
                scene.remove(enemy);
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                killedEnemies++;
                updateScore();
                checkHealthPackConditions(enemy.position, enemy.speed); // Передаём позицию и скорость врага
            }
        });
    });
}

// Обработка столкновений врагов с игроком
let gameOver = false;
let playerHealth = 5;
const maxHealth = 5;
const healthBar = document.createElement('div');
healthBar.style.position = 'absolute';
healthBar.style.top = '20px';
healthBar.style.left = '20px';
healthBar.style.width = '100px';
healthBar.style.height = '20px';
healthBar.style.backgroundColor = 'gray';
document.body.appendChild(healthBar);
const healthBarInner = document.createElement('div');
healthBarInner.style.position = 'absolute';
healthBarInner.style.top = '0';
healthBarInner.style.left = '0';
healthBarInner.style.width = '100%';
healthBarInner.style.height = '100%';
healthBarInner.style.backgroundColor = 'green';
healthBar.appendChild(healthBarInner);
function updateHealthBar() {
    const percentage = (playerHealth / maxHealth) * 100;
    healthBarInner.style.width = `${percentage}%`;
    if (percentage <= 20) {
        healthBarInner.style.backgroundColor = 'red';
    } else if (percentage <= 50) {
        healthBarInner.style.backgroundColor = 'orange';
    } else {
        healthBarInner.style.backgroundColor = 'green';
    }
}
updateHealthBar();

function checkPlayerCollisions() {
    enemies.forEach((enemy, index) => {
        const distance = player.position.distanceTo(enemy.position);
        if (distance < 0.8 && !gameOver) {
            takeDamage();
        }
    });
}

function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    modal.style.display = 'block';

    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', () => {
        location.reload(); // Перезагрузка страницы
    });
}

function takeDamage() {
    playerHealth--;
    updateHealthBar();
    if (playerHealth <= 0) {
        gameOver = true;
        console.log("Game Over!");
        scene.remove(player);

        // Обновляем текст с количеством убитых врагов
        const killedEnemiesCountElement = document.getElementById('killedEnemiesCount');
        killedEnemiesCountElement.textContent = killedEnemies;

        // Показываем модальное окно
        const modal = document.getElementById('gameOverModal');
        modal.style.display = 'block';

        // Добавляем обработчик для кнопки "Restart"
        const restartButton = document.getElementById('restartButton');
        restartButton.addEventListener('click', () => {
            location.reload(); // Перезагружаем страницу для рестарта игры
        });
    }
}

// Пули врагов
const enemyBullets = [];
function enemyShoot(enemy) {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshPhongMaterial({ color: 0xff00ff });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.copy(enemy.position);
    scene.add(bullet);
    enemyBullets.push(bullet);
}

function shootEnemyBullets() {
    enemies.forEach((enemy) => {
        // Увеличиваем вероятность выстрела до 0.05 (5%)
        if (Math.random() < enemy.shootFrequency) {
            enemyShoot(enemy);
        }
    });
}

function moveEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.position.z += 0.3;
        if (bullet.position.z > 10 || bullet.position.x < -5 || bullet.position.x > 5) {
            scene.remove(bullet);
            enemyBullets.splice(index, 1);
        }
    });
}

function checkEnemyBulletCollisions() {
    enemyBullets.forEach((bullet, index) => {
        const distance = player.position.distanceTo(bullet.position);
        if (distance < 0.5 && !gameOver) {
            takeDamage();
            scene.remove(bullet);
            enemyBullets.splice(index, 1);
        }
    });
}

// Основной игровой цикл
function animate() {
    requestAnimationFrame(animate);
    if (backgroundSphere) {
        backgroundSphere.rotation.y = 20;
    }
    if (!gameOver) {
        if (energy < maxEnergy) {
            energy = Math.min(energy + energyRecoveryRate, maxEnergy);
            updateEnergyBar(); // Обновляем индикатор энергии
        }
        movePlayer();
        moveEnemies();
        moveBullets();
        moveEnemyBullets();
        shootEnemyBullets();
        checkCollisions();
        checkPlayerCollisions();
        checkEnemyBulletCollisions();
        moveHealthPacks();
    }

    renderer.render(scene, camera);
}
animate();

// Обновление размеров при изменении окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});