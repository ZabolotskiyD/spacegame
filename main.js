import * as THREE from "three";

// Создаем сцену, камеру и рендерер
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 5);
scene.add(light);

// Создаем куб (игрок)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.z = 2;
scene.add(player);

// Позиция камеры
camera.position.set(0, 2, 5); // Камера немного выше и позади игрока

// Функция для обновления позиции камеры
function updateCameraPosition() {
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 5; // Камера всегда позади игрока
    camera.lookAt(player.position);
}

// Управление игроком
const keys = {};
window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

function movePlayer() {
    const speed = 0.1;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;
}

// Враги
const enemies = [];
function createEnemy() {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(geometry, material);

    enemy.position.x = Math.random() * 6 - 3; // Случайная позиция по X
    enemy.position.z = -10; // Начинают далеко позади игрока
    scene.add(enemy);
    enemies.push(enemy);
}

setInterval(createEnemy, 2000); // Добавляем врагов каждые 2 секунды

function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.position.z += 0.1; // Враги летят вперед

        // Удаляем врагов, которые прошли мимо игрока
        if (enemy.position.z > 5) {
            scene.remove(enemy);
            enemies.splice(index, 1);
        }
    });
}

// Пули
const bullets = [];
function shoot() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.copy(player.position);
    bullet.position.z -= 0.5; // Чуть впереди игрока
    scene.add(bullet);
    bullets.push(bullet);
}

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') shoot();
});

function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.position.z -= 0.5; // Пули летят вперед

        // Удаляем пули, которые улетели далеко
        if (bullet.position.z < -10) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const distance = bullet.position.distanceTo(enemy.position);
            if (distance < 0.5) {
                // Удаляем пулю и врага
                scene.remove(bullet);
                scene.remove(enemy);
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
            }
        });
    });
}

// Основной игровой цикл
function animate() {
    requestAnimationFrame(animate);

    // Двигаем игрока
    movePlayer();

    // Двигаем врагов
    moveEnemies();

    // Двигаем пули
    moveBullets();

    // Проверяем столкновения
    checkCollisions();

    // Обновляем позицию камеры
    updateCameraPosition();

    renderer.render(scene, camera);
}
animate();