import * as THREE from 'three';

// Создаем сцену, камеру и рендерер
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 5);
scene.add(light);

// Создаем куб (игрок)
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.z = 1;
scene.add(player);

// Фиксированная позиция камеры
camera.position.set(0, 2, 3); // Камера находится выше и позади игрового поля
camera.lookAt(0, 0, 0); // Камера смотрит в центр (0, 0, 0)

// // Создаем плоскость (пол)
// const planeGeometry = new THREE.PlaneGeometry(20, 20); // Размеры плоскости
// const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Серый цвет
// const plane = new THREE.Mesh(planeGeometry, planeMaterial);

// plane.rotation.x = -Math.PI / 2; // Поворачиваем плоскость горизонтально
// scene.add(plane);

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
    if (keys['a']) player.position.x = Math.max(player.position.x - speed, -5); // Левая граница
    if (keys['d']) player.position.x = Math.min(player.position.x + speed, 5); // Правая граница
}

// Враги
const enemies = [];
function createEnemy() {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(geometry, material);

    // Ограничиваем позицию врага по оси X
    enemy.position.x = Math.random() * 10 - 5; // Случайная позиция от -5 до 5
    enemy.position.z = -20; // Начинают далеко позади игрока
    scene.add(enemy);
    enemies.push(enemy);
}

setInterval(createEnemy, 2000); // Добавляем врагов каждые 2 секунды

function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.position.z += 0.1; // Враги летят вперед

        // Удаляем врагов, которые прошли мимо игрока или вышли за границы
        if (enemy.position.z > 5 || enemy.position.x < -5 || enemy.position.x > 5) {
            scene.remove(enemy);
            enemies.splice(index, 1);
        }
    });
}

// Пули
const bullets = [];
function shoot() {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
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

        // Удаляем пули, которые улетели далеко или вышли за границы
        if (bullet.position.z < -20 || bullet.position.x < -5 || bullet.position.x > 5) {
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

// Обработка столкновений врагов с игроком
function checkPlayerCollisions() {
    enemies.forEach((enemy, index) => {
        const distance = player.position.distanceTo(enemy.position);
        if (distance < 0.8) { // Пороговое значение для столкновения
            console.log("Game Over!"); // Выводим сообщение о конце игры
            scene.remove(player); // Удаляем игрока
            scene.remove(enemy); // Удаляем врага
            enemies.splice(index, 1); // Удаляем врага из массива
            alert("Game Over!"); // Оповещаем игрока
        }
    });
}

// Пули врагов
const enemyBullets = [];
function enemyShoot(enemy) {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshPhongMaterial({ color: 0xff00ff }); // Розовый цвет
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.copy(enemy.position); // Пуля появляется в позиции врага
    scene.add(bullet);
    enemyBullets.push(bullet);
}

function shootEnemyBullets() {
    enemies.forEach((enemy) => {
        if (Math.random() < 0.01) { // Вероятность выстрела (1% на кадр)
            enemyShoot(enemy);
        }
    });
}

function moveEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.position.z += 0.3; // Пули летят вперёд

        // Удаляем пули, которые улетели далеко или вышли за границы
        if (bullet.position.z > 10 || bullet.position.x < -5 || bullet.position.x > 5) {
            scene.remove(bullet);
            enemyBullets.splice(index, 1);
        }
    });
}

function checkEnemyBulletCollisions() {
    enemyBullets.forEach((bullet, index) => {
        const distance = player.position.distanceTo(bullet.position);
        if (distance < 0.5) { // Пороговое значение для столкновения
            console.log("Game Over!"); // Выводим сообщение о конце игры
            scene.remove(player); // Удаляем игрока
            scene.remove(bullet); // Удаляем пулю
            enemyBullets.splice(index, 1); // Удаляем пулю из массива
            alert("Game Over!"); // Оповещаем игрока
        }
    });
}

// Основной игровой цикл
function animate() {
    requestAnimationFrame(animate);

    movePlayer();
    moveEnemies();
    moveBullets();
    moveEnemyBullets(); // Двигаем пули врагов
    shootEnemyBullets(); // Враги стреляют
    checkCollisions();
    checkPlayerCollisions(); // Проверяем столкновения игрока с врагами
    checkEnemyBulletCollisions(); // Проверяем столкновения пуль врагов с игроком

    renderer.render(scene, camera);
}
animate();

// Обновление размеров при изменении окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});