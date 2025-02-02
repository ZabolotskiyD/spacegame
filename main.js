import * as THREE from 'three';

// Создаем сцену, камеру и рендерер
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60, // Угол обзора
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 5);
scene.add(light);

// Загружаем текстуру для фона
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('https://rawcdn.githack.com/ZabolotskiyD/spacegame/763a0342327e0cfc18659571b3afe1609f3025be/2c915b54-f35e-4987-8f33-fc6873a77b7b%20(1).jpg'); // Текстура фона

// Создаем гигантскую плоскость для фона
const backgroundGeometry = new THREE.PlaneGeometry(200, 200); // Увеличиваем размер плоскости
const backgroundMaterial = new THREE.MeshBasicMaterial({
    map: backgroundTexture,
    side: THREE.DoubleSide // Текстура видна с обеих сторон
});
const backgroundPlane = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundPlane.position.z = 20; // Плоскость находится позади всех объектов
backgroundPlane.position.y = -70; // Смещаем плоскость вниз, чтобы её центр совпадал с центром экрана
backgroundPlane.rotation.x = -60 * (Math.PI / 180); // Поворот на -30 градусов по оси X
scene.add(backgroundPlane);

// Создаем куб (игрок)
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.z = 0.2;
scene.add(player);

// Начальная позиция камеры
camera.position.set(0, 2, -3); // Камера ближе к игроку и выше
camera.lookAt(player.position); // Камера смотрит на игрока

// Счётчик убитых врагов
let killedEnemies = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.bottom = '20px'; // Перемещаем счётчик