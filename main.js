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
rgbeLoader.load('https://cdn.jsdelivr.net/gh/zabolotskiyd/spacegame@b884c7b6b1c9352ace5d3c8e7d17b0ca2a480615/public/sci-fi.hdr', (texture) => {
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