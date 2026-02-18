import * as THREE from 'three';

export interface SceneHandle {
  container: HTMLElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

export interface CreateSceneOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
}

export function createScene(container: HTMLElement, options: CreateSceneOptions = {}): SceneHandle {
  const width = (options.width ?? container.clientWidth) || 800;
  const height = (options.height ?? container.clientHeight) || 600;
  const backgroundColor = options.backgroundColor ?? 0x202025;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);

  try {
    container.appendChild(renderer.domElement);
  } catch (error) {
    console.error('Failed to append renderer domElement to container', error);
  }

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  let rafId: number | null = null;

  const handleWindowResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleWindowResize);

  function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    rafId = (globalThis.requestAnimationFrame ?? ((cb: FrameRequestCallback) => setTimeout(cb, 16))) (animate);
  }

  function start() {
    if (rafId == null) animate();
  }

  function stop() {
    if (rafId != null) {
      if (typeof globalThis.cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      } else {
        clearTimeout(rafId);
      }
      rafId = null;
    }
  }

  function dispose() {
    stop();
    window.removeEventListener('resize', handleWindowResize);

    scene.traverse((obj) => {
      // Dispose geometries
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
      }

      // Dispose materials and textures
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            m.dispose();
            if (m.map) m.map.dispose();
            if (m.normalMap) m.normalMap.dispose();
            if (m.roughnessMap) m.roughnessMap.dispose();
            if (m.metalnessMap) m.metalnessMap.dispose();
            if (m.emissiveMap) m.emissiveMap.dispose();
            if (m.alphaMap) m.alphaMap.dispose();
            if (m.aoMap) m.aoMap.dispose();
          });
        } else if (obj.material) {
          obj.material.dispose();
          if (obj.material.map) obj.material.map.dispose();
          if (obj.material.normalMap) obj.material.normalMap.dispose();
          if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
          if (obj.material.metalnessMap) obj.material.metalnessMap.dispose();
          if (obj.material.emissiveMap) obj.material.emissiveMap.dispose();
          if (obj.material.alphaMap) obj.material.alphaMap.dispose();
          if (obj.material.aoMap) obj.material.aoMap.dispose();
        }
      }
    });

    renderer.dispose();

    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  return { container, renderer, scene, camera, start, stop, dispose };
}

export default createScene;