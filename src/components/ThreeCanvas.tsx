import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  MotionStyle, 
  CameraMovement, 
  Background3DTheme, 
  LightingConfig, 
  FrameRate,
  GeneratedAsset 
} from '../types.ts';
import { 
  Camera, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Video, 
  Sparkles, 
  SunMedium, 
  Thermometer, 
  Layers
} from 'lucide-react';

interface ThreeCanvasProps {
  asset: GeneratedAsset | null;
  background3D: Background3DTheme;
  lighting: LightingConfig;
  motionStyle: MotionStyle;
  animationSpeed: number;
  cameraMovement: CameraMovement;
  duration: number;
  frameRate: FrameRate;
  isPlaying: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  seekTime?: number | null;
  aspectRatio: string;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  asset,
  background3D,
  lighting,
  motionStyle,
  animationSpeed,
  cameraMovement,
  duration,
  frameRate,
  isPlaying,
  onTimeUpdate,
  seekTime,
  aspectRatio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const subjectMeshRef = useRef<THREE.Mesh | null>(null);
  const bgGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    mainSpot: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
  } | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);

  // Animation timeline state
  const elapsedTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [manualControl, setManualControl] = useState(false);

  // Mouse orbit
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const manualRotRef = useRef({ x: 0, y: 0 });

  // 1. Initialize Scene & Renderer
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.03);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    textureLoaderRef.current = new THREE.TextureLoader();

    // Lighting setup
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const mainSpot = new THREE.DirectionalLight(0xffffff, 2.0);
    mainSpot.position.set(5, 7, 6);
    scene.add(mainSpot);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    lightsRef.current = { ambient, mainSpot, rimLight };

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w && h && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // 2. Update Lighting (Brightness & Color Temperature)
  useEffect(() => {
    if (!lightsRef.current) return;
    const { ambient, mainSpot, rimLight } = lightsRef.current;

    // Calculate light color based on color temperature (0 = Warm Amber 2700K, 0.5 = Neutral White 5000K, 1 = Cool Ice Blue 7000K)
    const t = Math.max(0, Math.min(1, lighting.colorTemperature));
    let r = 1.0;
    let g = 1.0;
    let b = 1.0;

    if (t < 0.5) {
      // Warm shift (increase red/yellow, decrease blue)
      const factor = (0.5 - t) * 2;
      r = 1.0;
      g = 0.95 - factor * 0.15;
      b = 0.9 - factor * 0.45;
    } else {
      // Cool shift (increase blue/cyan, decrease red)
      const factor = (t - 0.5) * 2;
      r = 0.95 - factor * 0.25;
      g = 0.98 - factor * 0.05;
      b = 1.0;
    }

    const lightColor = new THREE.Color(r, g, b);
    mainSpot.color = lightColor;
    mainSpot.intensity = 2.2 * lighting.brightness;

    ambient.intensity = 0.8 * lighting.brightness * lighting.ambientIntensity;
    ambient.color = lightColor.clone().multiplyScalar(0.9);

    rimLight.intensity = 1.4 * lighting.brightness;
  }, [lighting]);

  // 3. Update 3D Background Theme
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (bgGroupRef.current) {
      scene.remove(bgGroupRef.current);
      bgGroupRef.current.traverse((obj) => {
        if ((obj as any).geometry) (obj as any).geometry.dispose();
        if ((obj as any).material) {
          if (Array.isArray((obj as any).material)) {
            (obj as any).material.forEach((m: any) => m.dispose());
          } else {
            (obj as any).material.dispose();
          }
        }
      });
    }

    const bgGroup = new THREE.Group();
    bgGroupRef.current = bgGroup;

    if (background3D === 'sci_fi_city') {
      // Sci-Fi City with skyscrapers, glowing windows, and cyber grid
      const grid = new THREE.GridHelper(50, 40, 0x00f0ff, 0x3b0764);
      grid.position.y = -1.8;
      bgGroup.add(grid);

      const buildingGeo = new THREE.BoxGeometry(1.4, 1, 1.4);
      for (let i = 0; i < 35; i++) {
        const h = 4 + Math.random() * 12;
        const mat = new THREE.MeshStandardMaterial({
          color: 0x090d16,
          metalness: 0.9,
          roughness: 0.2,
        });
        const building = new THREE.Mesh(buildingGeo, mat);
        building.scale.set(1 + Math.random() * 1.5, h, 1 + Math.random() * 1.5);
        const x = (Math.random() - 0.5) * 36;
        const z = -6 - Math.random() * 26;
        building.position.set(x, h / 2 - 1.8, z);

        // Neon edge strip on building
        const stripGeo = new THREE.BoxGeometry(0.1, h, 0.1);
        const stripMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x00f0ff : 0xff007f,
        });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0.7, 0, 0.7);
        building.add(strip);

        bgGroup.add(building);
      }

      // Flying traffic light streaks
      const count = 800;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 35;
        pos[i + 1] = Math.random() * 10;
        pos[i + 2] = -5 - Math.random() * 25;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.08,
        transparent: true,
        opacity: 0.75,
      });
      const points = new THREE.Points(pGeo, pMat);
      particlesRef.current = points;
      bgGroup.add(points);

    } else if (background3D === 'enchanted_forest') {
      // Enchanted Forest with glowing ground, bioluminescent spores, and mystical ring
      const groundGeo = new THREE.PlaneGeometry(40, 40, 32, 32);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x052e16,
        roughness: 0.8,
        metalness: 0.1,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.8;
      bgGroup.add(ground);

      // Bioluminescent tree canopies
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 6, 16);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });
      for (let i = 0; i < 18; i++) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.2;
        tree.add(trunk);

        const canopyGeo = new THREE.DodecahedronGeometry(1.6 + Math.random() * 0.8);
        const canopyMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x10b981 : 0x059669,
          wireframe: true,
        });
        const canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.y = 4.2;
        tree.add(canopy);

        const x = (Math.random() - 0.5) * 32;
        const z = -4 - Math.random() * 20;
        tree.position.set(x, 0, z);
        bgGroup.add(tree);
      }

      // Glowing mystical spores / fireflies
      const count = 1200;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 30;
        pos[i + 1] = Math.random() * 8;
        pos[i + 2] = (Math.random() - 0.5) * 25;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x34d399,
        size: 0.12,
        transparent: true,
        opacity: 0.9,
      });
      const points = new THREE.Points(pGeo, pMat);
      particlesRef.current = points;
      bgGroup.add(points);

    } else if (background3D === 'abstract_geometric') {
      // Abstract Geometric with floating Platonic solids and neon rings
      const grid = new THREE.GridHelper(35, 35, 0x818cf8, 0x1e1b4b);
      grid.position.y = -1.8;
      bgGroup.add(grid);

      // Rotating Platonic solids
      const geoShapes = [
        new THREE.IcosahedronGeometry(1.5, 0),
        new THREE.OctahedronGeometry(1.3, 0),
        new THREE.TetrahedronGeometry(1.4, 0),
        new THREE.TorusGeometry(1.6, 0.2, 16, 60),
      ];

      for (let i = 0; i < 8; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x38bdf8 : 0xc084fc,
          wireframe: true,
        });
        const mesh = new THREE.Mesh(geoShapes[i % geoShapes.length], mat);
        const angle = (i / 8) * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * 7, (i % 3) * 1.5, Math.sin(angle) * 7);
        bgGroup.add(mesh);
      }

      // Ambient particle lattice
      const count = 1000;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 30;
        pos[i + 1] = (Math.random() - 0.5) * 16;
        pos[i + 2] = (Math.random() - 0.5) * 30;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xa78bfa,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
      });
      const points = new THREE.Points(pGeo, pMat);
      particlesRef.current = points;
      bgGroup.add(points);

    } else if (background3D === 'minimalist_studio') {
      // Minimalist Studio with exhibition pedestal and curved horizon backdrop
      const floorGeo = new THREE.PlaneGeometry(35, 35);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.25,
        metalness: 0.7,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.8;
      bgGroup.add(floor);

      // Curved backdrop wall
      const wallGeo = new THREE.CylinderGeometry(18, 18, 14, 32, 1, true, -Math.PI / 2, Math.PI);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        roughness: 0.8,
        side: THREE.BackSide,
      });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(0, 5, 0);
      bgGroup.add(wall);

      // Exhibition pedestal
      const pedGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.45, 36);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.6, roughness: 0.3 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.set(0, -1.6, 0);
      bgGroup.add(ped);

    } else {
      // cosmic_nebula
      const count = 2200;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 45;
        pos[i + 1] = (Math.random() - 0.5) * 35;
        pos[i + 2] = (Math.random() - 0.5) * 45;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const points = new THREE.Points(pGeo, pMat);
      particlesRef.current = points;
      bgGroup.add(points);
    }

    scene.add(bgGroup);
  }, [background3D]);

  // 4. Update Subject Texture & Curved 3D Mesh
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (subjectMeshRef.current) {
      scene.remove(subjectMeshRef.current);
      if (subjectMeshRef.current.geometry) subjectMeshRef.current.geometry.dispose();
      subjectMeshRef.current = null;
    }

    const imgUrl = asset?.upscaledUrl || asset?.imageUrl;
    if (!imgUrl) return;

    const loader = textureLoaderRef.current || new THREE.TextureLoader();
    loader.load(imgUrl, (texture) => {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;

      let meshW = 4.2;
      let meshH = 2.4;
      if (aspectRatio === '9:16') {
        meshW = 2.4;
        meshH = 4.2;
      } else if (aspectRatio === '1:1') {
        meshW = 3.3;
        meshH = 3.3;
      } else if (aspectRatio === '4:3') {
        meshW = 4.0;
        meshH = 3.0;
      }

      const geo = new THREE.PlaneGeometry(meshW, meshH, 32, 32);
      // Immersive subtle curvature
      const posAttr = geo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        posAttr.setZ(i, -Math.pow(x / (meshW * 0.5), 2) * 0.12);
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.15,
        metalness: 0.1,
        emissive: new THREE.Color(0x0f172a),
        emissiveIntensity: 0.25,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0.4, 0);

      // Frame backing
      const frameGeo = new THREE.BoxGeometry(meshW + 0.12, meshH + 0.12, 0.08);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(0, 0, -0.05);
      mesh.add(frameMesh);

      scene.add(mesh);
      subjectMeshRef.current = mesh;
    });
  }, [asset, aspectRatio]);

  // 5. Seek Time synchronization
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined) {
      elapsedTimeRef.current = seekTime;
    }
  }, [seekTime]);

  // 6. Master Animation & Camera Loop
  useEffect(() => {
    const videoDuration = duration || 5;

    const animate = () => {
      const now = performance.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        elapsedTimeRef.current += deltaSec * animationSpeed;
        if (elapsedTimeRef.current > videoDuration) {
          elapsedTimeRef.current = elapsedTimeRef.current % videoDuration;
        }
        if (onTimeUpdate) {
          onTimeUpdate(elapsedTimeRef.current, videoDuration);
        }
      }

      const t = elapsedTimeRef.current;
      const camera = cameraRef.current;
      const subject = subjectMeshRef.current;
      const bgGroup = bgGroupRef.current;

      // Slowly revolve background particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = t * 0.035;
      }
      if (bgGroup) {
        bgGroup.rotation.y = Math.sin(t * 0.02) * 0.04;
      }

      // Apply Motion Style to Subject
      if (subject) {
        if (motionStyle === 'smooth') {
          // Quintic fluid floating
          subject.position.y = 0.4 + Math.sin(t * 1.6) * 0.18;
          subject.rotation.y = Math.sin(t * 0.8) * 0.08;
          subject.rotation.z = Math.cos(t * 0.7) * 0.03;
          subject.scale.set(1, 1, 1);
        } else if (motionStyle === 'choppy') {
          // Stepped stop-motion / comic book quantization (10fps step)
          const steppedT = Math.floor(t * 10) / 10;
          const jitter = (Math.random() - 0.5) * 0.02;
          subject.position.y = 0.4 + Math.sin(steppedT * 1.8) * 0.22 + jitter;
          subject.rotation.y = Math.sin(steppedT * 1.2) * 0.12;
          subject.rotation.z = jitter * 2;
        } else if (motionStyle === 'slow-motion') {
          // Ultra-fluid viscous slow-mo sway
          subject.position.y = 0.4 + Math.sin(t * 0.6) * 0.22;
          subject.position.x = Math.sin(t * 0.4) * 0.15;
          subject.rotation.y = Math.sin(t * 0.3) * 0.1;
          subject.rotation.x = Math.cos(t * 0.25) * 0.05;
          subject.scale.set(1, 1, 1);
        } else if (motionStyle === 'bouncing') {
          // Elastic bouncing physics with harmonic recoil
          const bounce = Math.abs(Math.sin(t * 2.8));
          subject.position.y = 0.1 + bounce * 0.6;
          const squash = 1 + (1 - bounce) * 0.12;
          const stretch = 1 / Math.sqrt(squash);
          subject.scale.set(squash, stretch, 1);
          subject.rotation.z = Math.sin(t * 2.8) * 0.04;
        }
      }

      // Apply Camera Movement
      if (camera && !manualControl) {
        const camDistance = 6.0;
        const progress = (t % videoDuration) / videoDuration; // 0 to 1

        if (cameraMovement === 'orbit') {
          const angle = progress * Math.PI * 2;
          camera.position.x = Math.sin(angle) * camDistance;
          camera.position.z = Math.cos(angle) * camDistance;
          camera.position.y = 1.2 + Math.sin(angle * 2) * 0.35;
          camera.lookAt(0, 0.4, 0);

        } else if (cameraMovement === 'pan_left') {
          camera.position.x = 3.5 - progress * 7.0;
          camera.position.y = 1.2;
          camera.position.z = 5.8;
          camera.lookAt(0, 0.4, 0);

        } else if (cameraMovement === 'pan_right') {
          camera.position.x = -3.5 + progress * 7.0;
          camera.position.y = 1.2;
          camera.position.z = 5.8;
          camera.lookAt(0, 0.4, 0);

        } else if (cameraMovement === 'zoom_in') {
          const z = 8.2 - progress * 4.4;
          camera.position.set(0, 1.1 - progress * 0.3, z);
          camera.lookAt(0, 0.4, 0);

        } else if (cameraMovement === 'zoom_out') {
          const z = 3.8 + progress * 4.4;
          camera.position.set(0, 0.6 + progress * 0.5, z);
          camera.lookAt(0, 0.4, 0);

        } else if (cameraMovement === 'tilt_up') {
          camera.position.set(0, -0.6 + progress * 2.4, 5.6);
          camera.lookAt(0, 0.4 + progress * 0.6, 0);

        } else if (cameraMovement === 'tilt_down') {
          camera.position.set(0, 3.0 - progress * 2.4, 5.6);
          camera.lookAt(0, 0.4 - progress * 0.4, 0);

        } else if (cameraMovement === 'drone_fpv') {
          const angle = progress * Math.PI * 2;
          camera.position.x = Math.sin(angle * 1.5) * 4.5;
          camera.position.y = 1.4 + Math.sin(angle * 3) * 1.0;
          camera.position.z = Math.cos(angle) * 5.0;
          camera.rotation.z = Math.sin(angle * 2) * 0.18;
          camera.lookAt(0, 0.4, 0);
        }
      } else if (camera && manualControl) {
        const radius = 5.8;
        camera.position.x = radius * Math.sin(manualRotRef.current.x) * Math.cos(manualRotRef.current.y);
        camera.position.y = radius * Math.sin(manualRotRef.current.y) + 1.2;
        camera.position.z = radius * Math.cos(manualRotRef.current.x) * Math.cos(manualRotRef.current.y);
        camera.lookAt(0, 0.4, 0);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, motionStyle, animationSpeed, cameraMovement, duration, manualControl, onTimeUpdate]);

  // Mouse Orbit Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!manualControl) return;
    isMouseDownRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !manualControl) return;
    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    manualRotRef.current.x += dx * 0.008;
    manualRotRef.current.y = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, manualRotRef.current.y + dy * 0.008));
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  // Video Export Engine with exact FrameRate and Duration
  const handleRecordVideo = useCallback(async () => {
    if (!canvasRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);

      const canvas = canvasRef.current;
      const fps = frameRate || 30;
      const stream = canvas.captureStream(fps);
      const totalDuration = duration || 5;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 16000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `3D-Video-${background3D}-${fps}fps-${totalDuration}s.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordProgress(100);
      };

      elapsedTimeRef.current = 0;
      mediaRecorder.start();

      const interval = setInterval(() => {
        const progress = Math.min(100, Math.round((elapsedTimeRef.current / totalDuration) * 100));
        setRecordProgress(progress);
        if (elapsedTimeRef.current >= totalDuration) {
          clearInterval(interval);
          mediaRecorder.stop();
        }
      }, 100);

    } catch (err) {
      console.error('Recording error:', err);
      setIsRecording(false);
    }
  }, [background3D, duration, frameRate, isRecording]);

  const handleSnapshotFrame = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `3d-snapshot-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="three-stage-viewport"
      className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className={`w-full h-full block ${manualControl ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} />

      {/* Floating HUD Indicators */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-xs text-slate-200 shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-semibold text-white uppercase tracking-wider font-mono text-[11px]">
            {background3D.replace('_', ' ')}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-medium">Cam: {cameraMovement.replace('_', ' ')}</span>
          <span className="text-slate-500">|</span>
          <span className="text-purple-400 font-medium">Motion: {motionStyle}</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-mono">{duration}s @ {frameRate}fps</span>
        </div>

        {/* Viewport Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="btn-toggle-manual-cam"
            type="button"
            onClick={() => setManualControl(!manualControl)}
            title={manualControl ? 'Auto Camera Animation' : 'Free 3D Mouse Orbit'}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
              manualControl
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {manualControl ? 'Free Orbit' : 'Auto Cam'}
          </button>

          <button
            id="btn-snapshot-frame"
            type="button"
            onClick={handleSnapshotFrame}
            title="Download Frame Snapshot (PNG)"
            className="p-2 rounded-xl text-xs bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:text-white hover:bg-slate-800 backdrop-blur-md transition-all shadow-md"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-record-export-video"
            type="button"
            onClick={handleRecordVideo}
            disabled={isRecording}
            title={`Export ${duration}s Video @ ${frameRate}fps (WebM HD)`}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400/40 hover:from-cyan-400 hover:to-blue-500'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            {isRecording ? `Recording ${recordProgress}%` : `Export ${duration}s Video`}
          </button>

          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            title="Fullscreen 3D View"
            className="p-2 rounded-xl text-xs bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:text-white hover:bg-slate-800 backdrop-blur-md transition-all shadow-md"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Recording Progress Overlay */}
      {isRecording && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 pointer-events-none">
          <div className="h-12 w-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-white font-semibold text-sm tracking-wide">
            Rendering Video @ {frameRate} FPS... {recordProgress}%
          </p>
          <p className="text-xs text-slate-400">Capturing 3D background, camera kinematics & motion style</p>
        </div>
      )}

      {/* Empty State Banner */}
      {!asset && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">3D Creative Studio Viewport</h3>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            Enter your text prompt, select an art style, 3D background theme, and adjust lighting or video parameters to generate your masterpiece.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <span>🎨 5 Art Styles</span>
            <span>•</span>
            <span>🌆 3D Environments</span>
            <span>•</span>
            <span>💡 Realtime Lighting</span>
            <span>•</span>
            <span>🎬 24/30/60 FPS Video</span>
            <span>•</span>
            <span>💎 4K Upscaler</span>
          </div>
        </div>
      )}

      {manualControl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs px-4 py-1.5 rounded-full pointer-events-none shadow-lg">
          🖱️ Click and drag on the stage to rotate the 3D camera freely
        </div>
      )}
    </div>
  );
};
