let scene, camera, renderer, model, light;
let velocity = new THREE.Vector3();
let keys = {};
let cameraSpeed = 0.2;
let isMouseLocked = false;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10).normalize();
  scene.add(light);

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('pointerlockchange', onPointerLockChange, false);
  document.addEventListener('pointerlockerror', onPointerLockError, false);
  renderer.domElement.addEventListener('click', onCanvasClick, false);
  window.addEventListener('mousemove', onMouseMove, false);

  initEventListeners();
  loadSettingsFromCookies();
  animate();
}

// ==== Смена фона ====

document.getElementById("backgroundColorPicker").addEventListener("input", function (e) {
  const color = e.target.value;
  scene.background = new THREE.Color(color);
  setCookie("backgroundColor", color);
  setCookie("backgroundImageActive", "false"); // отключить картинку
});

document.getElementById('bgUploadInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('background', file);

  fetch('http://localhost:3000/upload-bg', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      loadBackgroundFromURL(data.path);
    });
});

function loadBackgroundFromURL(url) {
  const isHDR = url.endsWith(".hdr");
  const isEXR = url.endsWith(".exr");

  const loader = isHDR
    ? new THREE.RGBELoader()
    : isEXR
    ? new THREE.EXRLoader()
    : null;

  if (!loader) return;

  loader.load(url, function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = envMap;

    texture.dispose();
    pmremGenerator.dispose();
  });
}


function onCanvasClick() {
  if (!isMouseLocked) {
    renderer.domElement.requestPointerLock();
  }
}

function onPointerLockChange() {
  isMouseLocked = document.pointerLockElement === renderer.domElement;
}

function onPointerLockError() {
  console.error('Pointer lock error');
}

function onMouseMove(event) {
  if (isMouseLocked) {
    let dx = event.movementX || 0;
    let dy = event.movementY || 0;
    camera.rotation.y -= dx * 0.002;
    camera.rotation.x -= dy * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  }
}

function onKeyDown(e) {
  keys[e.code] = true;
}

function onKeyUp(e) {
  keys[e.code] = false;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  moveCamera();
  renderer.render(scene, camera);
}

// ======== COOKIE UTILS ==========
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  const cookie = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

// ======== SAVE/LOAD SETTINGS ==========
function saveSettingsToCookies() {
  const settings = {
    scale: document.getElementById("scale").value,
    rotateX: document.getElementById("rotateX").value,
    rotateY: document.getElementById("rotateY").value,
    rotateZ: document.getElementById("rotateZ").value,
    lightIntensity: document.getElementById("lightIntensity").value,
    lightColor: document.getElementById("favcolor").value,
    cameraSpeed: cameraSpeed,
  };

  for (const [key, value] of Object.entries(settings)) {
    setCookie(key, value);
  }
}

function loadSettingsFromCookies() {
  const scale = getCookie("scale");
  const rotateX = getCookie("rotateX");
  const rotateY = getCookie("rotateY");
  const rotateZ = getCookie("rotateZ");
  const lightIntensity = getCookie("lightIntensity");
  const lightColor = getCookie("lightColor");
  const speed = getCookie("cameraSpeed");
  const bgColor = getCookie("backgroundColor");
  const bgImgActive = getCookie("backgroundImageActive");
  const modelPath = getCookie("lastModelPath");
  const bgPath = getCookie("lastBackgroundPath");
  if (modelPath) {
    loadModelFromURL(modelPath);
  }
  if (bgPath && (bgPath.endsWith(".hdr") || bgPath.endsWith(".exr"))) {
    loadBackgroundFromURL(bgPath);
  }
  if (scale) {
    document.getElementById("scale").value = scale;
    updateScale();
  }
  if (rotateX && rotateY && rotateZ) {
    document.getElementById("rotateX").value = rotateX;
    document.getElementById("rotateY").value = rotateY;
    document.getElementById("rotateZ").value = rotateZ;
    updateRotation();
  }
  if (lightIntensity) {
    document.getElementById("lightIntensity").value = lightIntensity;
    updateLightIntensity();
  }
  if (lightColor) {
    document.getElementById("favcolor").value = lightColor;
    light.color = new THREE.Color(lightColor);
  }
  if (speed) {
    cameraSpeed = parseFloat(speed);
    document.getElementById("cameraSpeedSlider").value = speed;
    document.getElementById("cameraSpeedValue").innerText = speed;
  }
  if (bgImgActive === "true") {
    // Картинку из локального файла восстановить нельзя, покажем серый фон как fallback
    scene.background = new THREE.Color(0x444444);
  } else if (bgColor) {
    scene.background = new THREE.Color(bgColor);
    const colorInput = document.getElementById("backgroundColorPicker");
    if (colorInput) colorInput.value = bgColor;
  }
}

// ======== SETTINGS UPDATE ==========
function updateRotation() {
  if (!model) return;
  const rx = +document.getElementById("rotateX").value * Math.PI / 180;
  const ry = +document.getElementById("rotateY").value * Math.PI / 180;
  const rz = +document.getElementById("rotateZ").value * Math.PI / 180;
  model.rotation.set(rx, ry, rz);
  document.getElementById("rotateXValue").innerText = document.getElementById("rotateX").value;
  document.getElementById("rotateYValue").innerText = document.getElementById("rotateY").value;
  document.getElementById("rotateZValue").innerText = document.getElementById("rotateZ").value;
}

function updateScale() {
  if (!model) return;
  const scale = parseFloat(document.getElementById("scale").value);
  model.scale.set(scale, scale, scale);
  document.getElementById("scaleValue").innerText = scale;
}

function updateLightIntensity() {
  const val = document.getElementById("lightIntensity").value;
  light.intensity = parseFloat(val);
  document.getElementById("lightIntensityValue").innerText = val;
}

// ======== INPUT LISTENERS ==========
function initEventListeners() {
  document.getElementById("scale").addEventListener("input", () => {
    updateScale();
    saveSettingsToCookies();
  });

  ["rotateX", "rotateY", "rotateZ"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      updateRotation();
      saveSettingsToCookies();
    });
  });

  document.getElementById("lightIntensity").addEventListener("input", () => {
    updateLightIntensity();
    saveSettingsToCookies();
  });

  document.getElementById("favcolor").addEventListener("change", () => {
    const color = document.getElementById("favcolor").value;
    light.color = new THREE.Color(color);
    saveSettingsToCookies();
  });

  document.getElementById("cameraSpeedSlider").addEventListener("input", function (e) {
    cameraSpeed = parseFloat(e.target.value);
    document.getElementById("cameraSpeedValue").innerText = e.target.value;
    saveSettingsToCookies();
  });
}

// ======== CAMERA MOVEMENT ==========
function moveCamera() {
  velocity.set(0, 0, 0);
  if (keys['KeyW']) velocity.z -= cameraSpeed;
  if (keys['KeyS']) velocity.z += cameraSpeed;
  if (keys['KeyA']) velocity.x -= cameraSpeed;
  if (keys['KeyD']) velocity.x += cameraSpeed;
  if (keys['Space']) camera.position.y += cameraSpeed;
  if (keys['ControlLeft'] || keys['ControlRight']) camera.position.y -= cameraSpeed;
  camera.position.add(velocity);
}

// ======== MODEL LOAD ==========
document.getElementById('modelUploadInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('model', file);

  fetch('http://localhost:3000/upload-model', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      loadModelFromURL(data.path);
    });
});

function loadModelFromURL(url) {
  const ext = url.split('.').pop().toLowerCase();
  if (model) scene.remove(model);

  let loader;
  if (ext === 'glb' || ext === 'gltf') {
    loader = new THREE.GLTFLoader();
    loader.load(url, function (gltf) {
      model = gltf.scene;
      scene.add(model);
      updateScale();
      updateRotation();
    });
  } else if (ext === 'obj') {
    loader = new THREE.OBJLoader();
    loader.load(url, function (obj) {
      model = obj;
      scene.add(model);
      updateScale();
      updateRotation();
    });
  } else if (ext === 'fbx') {
    loader = new THREE.FBXLoader();
    loader.load(url, function (fbx) {
      model = fbx;
      scene.add(model);
      updateScale();
      updateRotation();
    });
  } else {
    alert("Неподдерживаемый формат файла.");
  }
}


// ======== BACKGROUND CHANGER =========
function togglePanel() {
  const panel = document.getElementById("bgDialog");
  panel.style.display = panel.style.display === "flex" ? "none" : "flex";
}
// ======== ABOUT ME =========
function toggleModal() {
  const modal = document.getElementById("infoModal");
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}


init();
