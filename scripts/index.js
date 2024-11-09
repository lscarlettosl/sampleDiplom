let scene, camera, renderer, model, light;

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

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

document.getElementById('modelInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  const url = URL.createObjectURL(file);
  const extension = file.name.split('.').pop().toLowerCase();

  if (model) scene.remove(model);

  if (extension === 'glb' || extension === 'gltf') {
    const loader = new THREE.GLTFLoader();
    loader.load(url, function(gltf) {
      model = gltf.scene;
      scene.add(model);
      updateScale();
      updateRotation();
    });
  } else if (extension === 'obj') {
    const loader = new THREE.OBJLoader();
    loader.load(url, function(obj) {
      model = obj;
      scene.add(model);
      updateScale();
      updateRotation();
    });
  } else if (extension === 'fbx') {
    const loader = new THREE.FBXLoader();
    loader.load(url, function(fbx) {
      model = fbx;
      scene.add(model);
      updateScale();
      updateRotation();
    });
  } else {
    alert("Неподдерживаемый формат файла. Пожалуйста, загрузите файл в формате .glb, .gltf, .obj или .fbx.");
  }
});

function updateRotation() {
  if (!model) return;
  const rotateX = document.getElementById("rotateX").value * (Math.PI / 180);
  const rotateY = document.getElementById("rotateY").value * (Math.PI / 180);
  const rotateZ = document.getElementById("rotateZ").value * (Math.PI / 180);
  model.rotation.set(rotateX, rotateY, rotateZ);

  document.getElementById("rotateXValue").innerText = document.getElementById("rotateX").value;
  document.getElementById("rotateYValue").innerText = document.getElementById("rotateY").value;
  document.getElementById("rotateZValue").innerText = document.getElementById("rotateZ").value;
}

function updateScale() {
  if (!model) return;
  const scale = document.getElementById("scale").value;
  model.scale.set(scale, scale, scale);
  document.getElementById("scaleValue").innerText = scale;
}

function updateLightIntensity() {
  const intensity = document.getElementById("lightIntensity").value;
  light.intensity = intensity;
  document.getElementById("lightIntensityValue").innerText = intensity;
}

function toggleModal() {
  const modal = document.getElementById("infoModal");
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

init();