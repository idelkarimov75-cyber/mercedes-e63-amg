let scene, camera, renderer, car, isRotating = false;
let carColor = 0x1a1a1a;
let carMeshes = [];
let bodyMeshes = [];

function initThreeJS() {
    const canvas = document.getElementById('carCanvas');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 2, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const spotLight1 = new THREE.SpotLight(0xc9a55a, 0.4);
    spotLight1.position.set(-5, 5, -5);
    scene.add(spotLight1);

    const spotLight2 = new THREE.SpotLight(0xffffff, 0.3);
    spotLight2.position.set(5, 3, -5);
    scene.add(spotLight2);

    loadCarModel();

    const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x1a1a1a);
    scene.add(gridHelper);

    animate();

    window.addEventListener('resize', onWindowResize);
}

function loadCarModel() {
    const loader = new THREE.OBJLoader();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.textContent = 'Загрузка модели...';
    loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #c9a55a; font-size: 18px; z-index: 10;';
    document.querySelector('.model-viewer').appendChild(loadingDiv);

    console.log('Начало загрузки OBJ модели...');

    loader.load(
        'Mercedes-AMG+E63+S.obj',
        function (object) {
            console.log('OBJ файл загружен, обработка...', object);
            car = new THREE.Group();

            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: carColor,
                metalness: 0.9,
                roughness: 0.3,
                envMapIntensity: 1.0
            });

            const glassMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.1,
                roughness: 0.1,
                transparent: true,
                opacity: 0.3
            });

            const tireMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0a0a,
                metalness: 0.1,
                roughness: 0.9
            });

            const chromeMaterial = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa,
                metalness: 1.0,
                roughness: 0.2
            });

            const lightMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffee,
                metalness: 0.3,
                roughness: 0.5,
                emissive: 0xffffaa,
                emissiveIntensity: 0.2
            });

            let meshCount = 0;
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    const name = child.name.toLowerCase();

                    if (name.includes('glass') || name.includes('window') || name.includes('windshield')) {
                        child.material = glassMaterial.clone();
                    } else if (name.includes('tire') || name.includes('wheel') || name.includes('tyre')) {
                        child.material = tireMaterial.clone();
                    } else if (name.includes('chrome') || name.includes('rim') || name.includes('grille') || name.includes('badge')) {
                        child.material = chromeMaterial.clone();
                    } else if (name.includes('light') || name.includes('lamp') || name.includes('headlight')) {
                        child.material = lightMaterial.clone();
                    } else {
                        child.material = bodyMaterial.clone();
                        bodyMeshes.push(child);
                    }

                    child.castShadow = true;
                    child.receiveShadow = true;
                    carMeshes.push(child);
                    meshCount++;
                }
            });

            console.log(`Найдено мешей: ${meshCount}, из них кузов: ${bodyMeshes.length}`);

            car.add(object);

            const box = new THREE.Box3().setFromObject(car);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            console.log('Размер модели:', `X: ${size.x.toFixed(2)}, Y: ${size.y.toFixed(2)}, Z: ${size.z.toFixed(2)}`);
            console.log('Центр модели:', `X: ${center.x.toFixed(2)}, Y: ${center.y.toFixed(2)}, Z: ${center.z.toFixed(2)}`);

            object.position.x = -center.x;
            object.position.y = -center.y + size.y / 2;
            object.position.z = -center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 4;
            console.log('Максимальное измерение:', maxDim.toFixed(2));

            if (maxDim > 0) {
                const scale = targetSize / maxDim;
                car.scale.set(scale, scale, scale);
                console.log('Масштаб применён:', scale.toFixed(4));
            }

            scene.add(car);

            const cameraDistance = 5.5;
            camera.position.set(cameraDistance, cameraDistance * 0.35, cameraDistance);
            camera.lookAt(0, size.y * (targetSize / maxDim) * 0.3, 0);

            console.log('Камера установлена на:', camera.position);

            if (loadingDiv && loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }

            console.log('Модель Mercedes-AMG E63 S успешно загружена и добавлена в сцену');
        },
        function (xhr) {
            if (xhr.lengthComputable && xhr.total > 0) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                if (loadingDiv) {
                    loadingDiv.textContent = `Загрузка модели... ${Math.round(percentComplete)}%`;
                }
                console.log(`Прогресс загрузки: ${Math.round(percentComplete)}%`);
            } else {
                if (loadingDiv) {
                    loadingDiv.textContent = `Загрузка модели... ${Math.round(xhr.loaded / 1024)}KB`;
                }
            }
        },
        function (error) {
            console.error('Ошибка загрузки модели:', error);
            if (loadingDiv) {
                loadingDiv.textContent = `Ошибка: ${error.message || 'Не удалось загрузить модель'}`;
                loadingDiv.style.color = '#ff4444';
            }
        }
    );
}

function animate() {
    requestAnimationFrame(animate);

    if (isRotating && car) {
        car.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const canvas = document.getElementById('carCanvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

const colors = [0x1a1a1a, 0xffffff, 0xc9a55a, 0x8b0000, 0x000080];
let currentColorIndex = 0;

document.getElementById('rotateBtn').addEventListener('click', () => {
    isRotating = !isRotating;
});

document.getElementById('colorBtn').addEventListener('click', () => {
    if (!car || bodyMeshes.length === 0) return;

    currentColorIndex = (currentColorIndex + 1) % colors.length;
    carColor = colors[currentColorIndex];

    bodyMeshes.forEach(mesh => {
        if (mesh.material && mesh.material.color) {
            mesh.material.color.setHex(carColor);
        }
    });

    console.log(`Цвет кузова изменён на: #${carColor.toString(16)}`);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (!car) return;

    isRotating = false;
    car.rotation.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;

    camera.position.set(distance, distance * 0.5, distance);
    camera.lookAt(0, 0, 0);
});

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.getElementById('carCanvas').addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && car) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        car.rotation.y += deltaX * 0.01;
        car.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});
