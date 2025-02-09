import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// Создаем сцену, камеру и рендерер
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60,
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

// Переменные для управления поворотом HDR
let rotationX = 0;
let rotationY = 0;
let rotationZ = 0;

// Загружаем HDR-текстуру для фона
let hdrTexture;
const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://cdn.jsdelivr.net/gh/zabolotskiyd/spacegame@287f9f663fbc636a52c883a5cc8ec0cf8eb7acd5/public/sci-fi.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    hdrTexture = texture;
    // Создаем сферу для отображения HDR-текстуры
    const sphereMaterial = new THREE.MeshBasicMaterial({
        map: hdrTexture,
        side: THREE.BackSide
    });
    const sphereGeometry = new THREE.SphereBufferGeometry(500, 64, 32);
    const skybox = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(skybox);
    updateHDROrientation(); // Применяем начальную ориентацию после загрузки текстуры
});

// Функция для обновления ориентации HDR
function updateHDROrientation() {
    const skybox = scene.getObjectByProperty('type', 'Mesh'); // Находим сферу в сцене
    if (!skybox) return;
    // Поворачиваем сферу согласно текущим значениям
    skybox.rotation.set(rotationX, rotationY, rotationZ);
}

// Создаем слайдеры для управления поворотом
function createRotationSliders() {
    const sliderContainer = document.createElement('div');
    sliderContainer.style.position = 'absolute';
    sliderContainer.style.top = '10px';
    sliderContainer.style.left = '10px';
    sliderContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    sliderContainer.style.padding = '10px';
    sliderContainer.style.color = 'white';
    sliderContainer.style.fontFamily = 'Arial, sans-serif';
    sliderContainer.style.zIndex = '1000';
    document.body.appendChild(sliderContainer);

    function createSlider(label, defaultValue, onChange) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        container.appendChild(labelElement);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = -Math.PI;
        slider.max = Math.PI;
        slider.step = 0.01;
        slider.value = defaultValue;
        slider.style.width = '150px';
        slider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            onChange(value);
        });
        container.appendChild(slider);
        sliderContainer.appendChild(container);
        return slider;
    }

    const xSlider = createSlider('Rotate X:', 0, (value) => {
        rotationX = value;
        updateHDROrientation();
    });

    const ySlider = createSlider('Rotate Y:', 0, (value) => {
        rotationY = value;
        updateHDROrientation();
    });

    const zSlider = createSlider('Rotate Z:', 0, (value) => {
        rotationZ = value;
        updateHDROrientation();
    });

    return { xSlider, ySlider, zSlider };
}

// Создаем слайдеры
const sliders = createRotationSliders();

// Когда вы определите нужные значения, удалите слайдеры и задайте поворот напрямую в коде
function lockHDRValues() {
    const finalRotationX = parseFloat(sliders.xSlider.value);
    const finalRotationY = parseFloat(sliders.ySlider.value);
    const finalRotationZ = parseFloat(sliders.zSlider.value);
    console.log(`Final HDR Rotation: X=${finalRotationX}, Y=${finalRotationY}, Z=${finalRotationZ}`);
    // Удаляем слайдеры из DOM
    document.querySelector('.slider-container').remove();
    // Закрепляем значения в коде
    rotationX = finalRotationX;
    rotationY = finalRotationY;
    rotationZ = finalRotationZ;
    // Обновляем ориентацию без слайдеров
    updateHDROrientation();
}

// Создаем куб (игрок)
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0, 0);
scene.add(player);

// Начальная позиция камеры
camera.position.set(0, 2, 10);
camera.lookAt(player.position);

// Счётчик убитых врагов
let killedEnemies = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.bottom = '20px';
scoreElement.style.right = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.fontSize = '20px';
scoreElement.innerHTML = `Killed: ${killedEnemies}`;
document.body.appendChild(scoreElement);

function updateScore() {
    scoreElement.innerHTML = `Killed: ${killedEnemies}`;
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
        if (Math.random() < 0.01) {
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

function takeDamage() {
    playerHealth--;
    updateHealthBar();
    if (playerHealth <= 0) {
        gameOver = true;
        console.log("Game Over!");
        scene.remove(player);
        alert("Game Over!");
        location.reload(); // Перезагружаем страницу для перезапуска игры
    }
}

// Основной игровой цикл
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Обновление размеров при изменении окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});