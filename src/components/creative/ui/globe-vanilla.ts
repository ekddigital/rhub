import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Fog,
  AmbientLight,
  DirectionalLight,
  PointLight,
  MeshPhongMaterial,
} from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "../../public/globe.json";
import { WorldProps, genRandomNumbers } from "./globe";

type GlobeArc = WorldProps["data"][number];

type GlobePoint = {
  size: number;
  order: number;
  color: string;
  lat: number;
  lng: number;
};

const getArcAccessor =
  <K extends keyof GlobeArc>(key: K) =>
  (obj: object) =>
    (obj as GlobeArc)[key];

const getPointAccessor =
  <K extends keyof GlobePoint>(key: K) =>
  (obj: object) =>
    (obj as GlobePoint)[key];

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

let globe: ThreeGlobe | null = null;
let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let animationId: number | null = null;

// Function to animate the globe
function animate() {
  if (!renderer || !scene || !camera || !controls) return;

  animationId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Clean up function
function cleanupGlobe() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (renderer) {
    renderer.dispose();
  }

  if (controls) {
    controls.dispose();
  }

  globe = null;
  renderer = null;
  scene = null;
  camera = null;
  controls = null;
}

// Initialize the globe
export function createGlobe(container: HTMLDivElement, props: WorldProps) {
  if (!container) return;

  // Clean up any existing globe
  cleanupGlobe();

  // Clear container
  container.innerHTML = "";

  const { globeConfig, data } = props;

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  // Initialize scene and camera
  scene = new Scene();
  scene.fog = new Fog(0xffffff, 400, 2000);

  camera = new PerspectiveCamera(50, aspect, 180, 1800);
  camera.position.z = cameraZ;

  // Initialize renderer
  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Initialize globe
  globe = new ThreeGlobe();

  // Configure globe material
  const globeMaterial = globe.globeMaterial() as MeshPhongMaterial;
  globeMaterial.color = new Color(globeConfig.globeColor);
  globeMaterial.emissive = new Color(globeConfig.emissive);
  globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
  globeMaterial.shininess = globeConfig.shininess || 0.9;

  // Process points data
  const arcs = data;
  const points: GlobePoint[] = [];

  for (let i = 0; i < arcs.length; i++) {
    const arc = arcs[i];
    points.push({
      size: defaultProps.pointSize,
      order: arc.order,
      color: arc.color,
      lat: arc.startLat,
      lng: arc.startLng,
    });
    points.push({
      size: defaultProps.pointSize,
      order: arc.order,
      color: arc.color,
      lat: arc.endLat,
      lng: arc.endLng,
    });
  }

  // Remove duplicates for same lat and lng
  const filteredPoints = points.filter(
    (v, i, a) =>
      a.findIndex((v2) =>
        ["lat", "lng"].every(
          (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
        )
      ) === i
  );

  // Configure globe data
  globe
    .hexPolygonsData(countries.features)
    .hexPolygonResolution(3)
    .hexPolygonMargin(0.7)
    .showAtmosphere(defaultProps.showAtmosphere)
    .atmosphereColor(defaultProps.atmosphereColor)
    .atmosphereAltitude(defaultProps.atmosphereAltitude)
    .hexPolygonColor(() => defaultProps.polygonColor);

  globe
    .arcsData(data)
    .arcStartLat(getArcAccessor("startLat"))
    .arcStartLng(getArcAccessor("startLng"))
    .arcEndLat(getArcAccessor("endLat"))
    .arcEndLng(getArcAccessor("endLng"))
    .arcColor(getArcAccessor("color"))
    .arcAltitude(getArcAccessor("arcAlt"))
    .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
    .arcDashLength(defaultProps.arcLength)
    .arcDashInitialGap(getArcAccessor("order"))
    .arcDashGap(15)
    .arcDashAnimateTime(() => defaultProps.arcTime);

  globe
    .pointsData(filteredPoints)
    .pointColor(getPointAccessor("color"))
    .pointsMerge(true)
    .pointAltitude(0.0)
    .pointRadius(2);

  globe
    .ringsData([])
    .ringColor(() => defaultProps.polygonColor)
    .ringMaxRadius(defaultProps.maxRings)
    .ringPropagationSpeed(RING_PROPAGATION_SPEED)
    .ringRepeatPeriod(
      (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
    );

  // Add globe to scene
  scene.add(globe);

  // Add lights
  const ambLight = new AmbientLight(globeConfig.ambientLight, 0.6);
  const directionalLight1 = new DirectionalLight(
    globeConfig.directionalLeftLight,
    0.8
  );
  const directionalLight2 = new DirectionalLight(
    globeConfig.directionalTopLight,
    0.8
  );
  const pointLight = new PointLight(globeConfig.pointLight, 0.8);

  directionalLight1.position.set(-400, 100, 400);
  directionalLight2.position.set(-200, 500, 200);
  pointLight.position.set(-200, 500, 200);

  scene.add(ambLight);
  scene.add(directionalLight1);
  scene.add(directionalLight2);
  scene.add(pointLight);

  // Setup controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = cameraZ;
  controls.maxDistance = cameraZ;
  controls.autoRotate = globeConfig.autoRotate !== false;
  controls.autoRotateSpeed = globeConfig.autoRotateSpeed || 1;
  controls.minPolarAngle = Math.PI / 3.5;
  controls.maxPolarAngle = Math.PI - Math.PI / 3;

  // Handle window resize
  const handleResize = () => {
    if (!camera || !renderer || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener("resize", handleResize);

  // Setup ring animation

  const updateRings = () => {
    if (!globe || !data || data.length === 0) return;

    const newNumbersOfRings = genRandomNumbers(
      0,
      data.length,
      Math.floor((data.length * 4) / 5)
    );

    const ringsData = data
      .filter((d, i) => newNumbersOfRings.includes(i))
      .map((d) => ({
        lat: d.startLat,
        lng: d.startLng,
        color: d.color,
      }));

    globe.ringsData(ringsData);
  };

  const ringsInterval = window.setInterval(updateRings, 2000);

  // Start animation
  animate();

  // Return cleanup function
  return () => {
    window.removeEventListener("resize", handleResize);
    clearInterval(ringsInterval);
    cleanupGlobe();
    if (container) {
      container.innerHTML = "";
    }
  };
}
