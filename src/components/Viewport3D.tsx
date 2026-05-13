import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Canvas, type RootState, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { PackagingBox } from "./PackagingBox";
import type { FaceId, MaterialPreset, OpeningStyle, SplitTopHingeSide } from "../types";

function applyOrbitZoomDistance(
  controls: OrbitControlsImpl,
  minDistance: number,
  maxDistance: number,
  zoomFraction: number
) {
  const cam = controls.object;
  const target = controls.target;
  const offset = new THREE.Vector3().subVectors(cam.position, target);
  const len = offset.length();
  if (len < 1e-6) return;
  const newDist = THREE.MathUtils.lerp(
    minDistance,
    maxDistance,
    THREE.MathUtils.clamp(zoomFraction, 0, 1)
  );
  offset.multiplyScalar(newDist / len);
  cam.position.copy(target).add(offset);
  if ("updateProjectionMatrix" in cam && typeof (cam as THREE.PerspectiveCamera).updateProjectionMatrix === "function") {
    (cam as THREE.PerspectiveCamera).updateProjectionMatrix();
  }
  controls.update();
}

/** Keeps UI zoom slider in sync with OrbitControls and applies slider changes to the camera. */
function OrbitControlsZoomSync({
  width,
  height,
  length,
  zoomFraction,
  onZoomFractionChange,
}: {
  width: number;
  height: number;
  length: number;
  zoomFraction: number;
  onZoomFractionChange: (t: number) => void;
}) {
  const maxDim = Math.max(width, height, length, 1);
  const minDistance = maxDim * 0.35;
  const maxDistance = maxDim * 6;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | undefined;
  const applyingRef = useRef(false);
  const hasSyncedInitial = useRef(false);

  useEffect(() => {
    if (!controls) return;
    if (!hasSyncedInitial.current) {
      hasSyncedInitial.current = true;
      const dist = controls.getDistance();
      const t = THREE.MathUtils.clamp((dist - minDistance) / (maxDistance - minDistance), 0, 1);
      onZoomFractionChange(Math.round(t * 1000) / 1000);
    }
    const onChange = () => {
      if (applyingRef.current) return;
      const dist = controls.getDistance();
      const t = THREE.MathUtils.clamp((dist - minDistance) / (maxDistance - minDistance), 0, 1);
      const r = Math.round(t * 1000) / 1000;
      onZoomFractionChange(r);
    };
    controls.addEventListener("change", onChange);
    return () => controls.removeEventListener("change", onChange);
  }, [controls, minDistance, maxDistance, onZoomFractionChange]);

  useLayoutEffect(() => {
    if (!controls || !hasSyncedInitial.current) return;
    applyingRef.current = true;
    applyOrbitZoomDistance(controls, minDistance, maxDistance, zoomFraction);
    requestAnimationFrame(() => {
      applyingRef.current = false;
    });
  }, [controls, minDistance, maxDistance, zoomFraction]);

  return null;
}

export interface Viewport3DProps {
  width: number;
  height: number;
  length: number;
  textures: Partial<Record<FaceId, string | null>>;
  splitTop: boolean;
  splitTopHingeSide: SplitTopHingeSide;
  preset: MaterialPreset;
  opening: OpeningStyle;
  openT: number;
  wireframe: boolean;
  showGrid: boolean;
  showAxesGizmo: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  autoRotateReverse: boolean;
  envPreset: "studio" | "city" | "warehouse" | "sunset" | "dawn";
  /** 0 = min zoom (closest), 1 = max zoom (farthest). Synced with scroll / pinch. */
  zoomFraction: number;
  onZoomFractionChange: (t: number) => void;
  onCanvasReady?: (state: RootState) => void;
  /** Per-face texture rotation in degrees (0 / 90 / 180 / 270). */
  textureRotationDeg: Partial<Record<FaceId, number>>;
  /**
   * When true, OrbitControls damping is off so the camera follows motion immediately.
   * Recording uses a 2D copy each frame; damped orbit looks like a trailing “shadow” on video.
   */
  snappyOrbit?: boolean;
}

function Scene({
  width,
  height,
  length,
  textures,
  splitTop,
  splitTopHingeSide,
  preset,
  opening,
  openT,
  wireframe,
  showGrid,
  autoRotate,
  autoRotateSpeed,
  autoRotateReverse,
  envPreset,
  textureRotationDeg,
  zoomFraction,
  onZoomFractionChange,
  snappyOrbit = false,
}: Omit<Viewport3DProps, "showAxesGizmo" | "onCanvasReady">) {
  const maxDim = Math.max(width, height, length, 1);
  const camDist = maxDim * 2.2;
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  useLayoutEffect(() => {
    const cam = keyLightRef.current?.shadow.camera;
    if (!cam) return;
    cam.near = 0.1;
    cam.far = maxDim * 25;
    cam.left = -maxDim * 5;
    cam.right = maxDim * 5;
    cam.top = maxDim * 5;
    cam.bottom = -maxDim * 5;
    cam.updateProjectionMatrix();
  }, [maxDim]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[camDist * 0.85, camDist * 0.55, camDist * 0.9]} fov={42} near={0.1} far={maxDim * 80} />
      <OrbitControls
        makeDefault
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateReverse ? -autoRotateSpeed : autoRotateSpeed}
        minDistance={maxDim * 0.35}
        maxDistance={maxDim * 6}
        target={[0, height * 0.05, 0]}
        enableDamping={!snappyOrbit}
        dampingFactor={0.08}
      />
      <ambientLight intensity={0.35} />
      <directionalLight
        ref={keyLightRef}
        castShadow
        position={[maxDim * 2.5, maxDim * 4, maxDim * 1.2]}
        intensity={1.15}
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-maxDim * 1.5, maxDim * 2, -maxDim * 2]} intensity={0.35} />

      {/* Environment suspends while HDRI loads — keep the box outside so it always mounts */}
      <Suspense fallback={null}>
        <Environment preset={envPreset} />
      </Suspense>
      <PackagingBox
        width={width}
        height={height}
        length={length}
        textures={textures}
        splitTop={splitTop}
        splitTopHingeSide={splitTopHingeSide}
        preset={preset}
        opening={opening}
        openT={openT}
        wireframe={wireframe}
        textureRotationDeg={textureRotationDeg}
      />

      <ContactShadows opacity={0.45} scale={maxDim * 8} blur={2.4} far={maxDim * 5} position={[0, -height / 2 - 0.05, 0]} />

      {showGrid && (
        <Grid
          infiniteGrid
          fadeDistance={maxDim * 12}
          sectionSize={maxDim / 4}
          cellSize={maxDim / 20}
          sectionColor="#3d4a5c"
          cellColor="#252b36"
          position={[0, -height / 2 - 0.01, 0]}
        />
      )}

      <OrbitControlsZoomSync
        width={width}
        height={height}
        length={length}
        zoomFraction={zoomFraction}
        onZoomFractionChange={onZoomFractionChange}
      />
    </>
  );
}

export function Viewport3D(props: Viewport3DProps) {
  const { showAxesGizmo, onCanvasReady, ...sceneProps } = props;
  const handleCreated = (state: RootState) => {
    state.gl.toneMapping = THREE.ACESFilmicToneMapping;
    state.gl.toneMappingExposure = 1;
    state.gl.shadowMap.enabled = true;
    state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    onCanvasReady?.(state);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 0 }}>
      <Canvas shadows onCreated={handleCreated} gl={{ preserveDrawingBuffer: true }}>
        <Scene {...sceneProps} />
        {showAxesGizmo && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={["#ff6b8a", "#5be7a9", "#6bb8ff"]} labelColor="white" />
          </GizmoHelper>
        )}
      </Canvas>
    </div>
  );
}
