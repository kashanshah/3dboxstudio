import { Suspense, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { FaceId, MaterialPreset, OpeningStyle, SplitTopHingeSide } from "../types";
import { faceShortLabels } from "../types";
import { useLoadedTexture } from "../hooks/useTextures";
import { cropToTextureTransform, type SideImageCrop } from "../lib/faceImageCrop";

/** Push outer face slightly past the AABB so coplanar neighbors don't z-fight. */
const EPS = 0.02;
/** Default board thickness; also capped vs face size so thin cartons keep a cavity. */
const WALL_MAX = 0.18;

/**
 * Extra half-size so neighboring walls cross at corners.
 * Floor is intentionally large: paper-thin silhouettes still leak on mobile MSAA.
 */
function faceSeam(width: number, height: number): number {
  return Math.min(0.55, Math.max(0.32, Math.min(width, height) * 0.025));
}

function wallThickness(width: number, height: number): number {
  return Math.min(WALL_MAX, Math.max(0.1, Math.min(width, height) * 0.02));
}

/** Shared unprinted liner (inside face of each wall). */
let innerLinerMaterial: THREE.MeshStandardMaterial | null = null;
function getInnerLinerMaterial(): THREE.MeshStandardMaterial {
  if (!innerLinerMaterial) {
    innerLinerMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e6,
      roughness: 0.98,
      metalness: 0,
    });
  }
  return innerLinerMaterial;
}

function faceRotation(deg: Partial<Record<FaceId, number>> | undefined, id: FaceId): number {
  return deg?.[id] ?? 0;
}

function FaceLabel({
  label,
  args,
}: {
  label: string;
  args: [number, number];
}) {
  const fontSize = Math.min(args[0], args[1]) * 0.16;
  return (
    <Suspense fallback={null}>
      <Text
        position={[0, 0, 0.015]}
        fontSize={fontSize}
        color="#2c2418"
        anchorX="center"
        anchorY="middle"
        outlineWidth={fontSize * 0.04}
        outlineColor="#f5f0e8"
        maxWidth={args[0] * 0.85}
        textAlign="center"
      >
        {label}
      </Text>
    </Suspense>
  );
}

function FacePlane({
  url,
  faceId,
  preset,
  args,
  position,
  rotation,
  wireframe,
  textureRotationDeg = 0,
  crop,
  cleanCapture = false,
}: {
  url: string | null;
  faceId: FaceId;
  preset: MaterialPreset;
  args: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  wireframe: boolean;
  /** Rotate the texture in its plane (degrees), pivot at center. */
  textureRotationDeg?: number;
  /** Percent-space crop of the original source. Absent = legacy full-image mapping. */
  crop?: SideImageCrop;
  cleanCapture?: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const map = useLoadedTexture(url);
  const linerMat = getInnerLinerMaterial();
  const faceW = args[0];
  const faceH = args[1];
  const seam = faceSeam(faceW, faceH);
  const wall = wallThickness(faceW, faceH);
  const printW = faceW + 2 * seam;
  const printH = faceH + 2 * seam;

  const printMat = useMemo(() => {
    if (cleanCapture) {
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
        envMapIntensity: preset.envMapIntensity * 0.45,
        wireframe,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: preset.color,
      roughness: preset.roughness,
      metalness: preset.metalness,
      envMapIntensity: preset.envMapIntensity,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness,
      wireframe,
    });
  }, [
    cleanCapture,
    preset.clearcoat,
    preset.clearcoatRoughness,
    preset.color,
    preset.envMapIntensity,
    preset.metalness,
    preset.roughness,
    wireframe,
  ]);

  /** Solid board color on wall edges — no artwork map (avoids stretched print on thickness). */
  const edgeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: preset.color,
      roughness: Math.min(1, preset.roughness + 0.08),
      metalness: preset.metalness,
      envMapIntensity: preset.envMapIntensity * 0.35,
      wireframe,
    });
  }, [preset.color, preset.envMapIntensity, preset.metalness, preset.roughness, wireframe]);

  // BoxGeometry material order: +X, -X, +Y, -Y, +Z (outer print), -Z (liner).
  const materials = useMemo(
    () => [edgeMat, edgeMat, edgeMat, edgeMat, printMat, linerMat],
    [edgeMat, printMat, linerMat],
  );

  useEffect(() => {
    printMat.map = map ?? null;
    printMat.needsUpdate = true;
    invalidate();
  }, [map, printMat, invalidate]);

  useEffect(() => {
    if (!map) return;
    const transform = cropToTextureTransform(crop, textureRotationDeg);
    map.offset.set(transform.offsetX, transform.offsetY);
    map.repeat.set(transform.repeatX, transform.repeatY);
    map.center.set(transform.centerX, transform.centerY);
    map.rotation = transform.rotationRad;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.needsUpdate = true;
    invalidate();
  }, [map, crop, textureRotationDeg, invalidate]);

  useEffect(() => {
    return () => {
      printMat.dispose();
      edgeMat.dispose();
    };
  }, [printMat, edgeMat]);

  return (
    <group position={position} rotation={rotation}>
      {wireframe ? (
        <mesh material={printMat}>
          <planeGeometry args={[printW, printH]} />
        </mesh>
      ) : (
        /*
          Outer print sits at local z=0 (same as the old plane). The wall extends inward so
          neighboring faces share volume at corners instead of a paper-thin silhouette crack.
        */
        <mesh
          position={[0, 0, -wall / 2]}
          material={materials}
          castShadow={!cleanCapture}
          receiveShadow={!cleanCapture}
        >
          <boxGeometry args={[printW, printH, wall]} />
        </mesh>
      )}
      {!url && !wireframe && !cleanCapture && (
        <FaceLabel label={faceShortLabels[faceId]} args={args} />
      )}
    </group>
  );
}

export interface PackagingBoxProps {
  width: number;
  height: number;
  length: number;
  textures: Partial<Record<FaceId, string | null>>;
  splitTop: boolean;
  /** Only used when split top is active; hinges on X-pair (side_a) vs Z-pair (side_b). */
  splitTopHingeSide: SplitTopHingeSide;
  preset: MaterialPreset;
  opening: OpeningStyle;
  /** 0 = closed, 1 = fully open animation */
  openT: number;
  wireframe: boolean;
  /** Per-face in-plane texture rotation (degrees). */
  textureRotationDeg: Partial<Record<FaceId, number>>;
  /** Per-face crop of the original source image. */
  textureCrops?: Partial<Record<FaceId, SideImageCrop>>;
  /** Simpler materials and no shadow casting while recording. */
  cleanCapture?: boolean;
}

export function PackagingBox({
  width: w,
  height: h,
  length: d,
  textures,
  splitTop,
  splitTopHingeSide,
  preset,
  opening,
  openT,
  wireframe,
  textureRotationDeg: texRot,
  textureCrops = {},
  cleanCapture = false,
}: PackagingBoxProps) {
  const angle = openT * ((75 * Math.PI) / 180);
  const rr = texRot;
  const cropOf = (id: FaceId, fallback?: FaceId) => textureCrops[id] ?? (fallback ? textureCrops[fallback] : undefined);

  const topUrlLeft = textures.topLeft ?? textures.top ?? null;
  const topUrlRight = textures.topRight ?? textures.top ?? null;
  const topWhole = textures.top ?? null;

  const leftSwings = opening === "door_left" || opening === "double_doors";
  const rightSwings = opening === "door_right" || opening === "double_doors";

  const topPlane = (
    <FacePlane
      url={topWhole}
      faceId="top"
      preset={preset}
      args={[w, d]}
      position={[0, EPS, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      wireframe={wireframe}
      cleanCapture={cleanCapture}
      textureRotationDeg={faceRotation(rr, "top")}
      crop={cropOf("top")}
    />
  );

  const renderTop = () => {
    if (splitTop && opening === "top_split_meet_center") {
      return splitTopHingeSide === "side_a" ? (
        <>
          <group position={[-w / 2, h / 2, 0]} rotation={[0, 0, angle]}>
            <group position={[w / 4, 0, 0]}>
              <FacePlane
                url={topUrlLeft}
                faceId="topLeft"
                preset={preset}
                args={[w / 2, d]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topLeft")}
                crop={cropOf("topLeft", "top")}
              />
            </group>
          </group>
          <group position={[w / 2, h / 2, 0]} rotation={[0, 0, -angle]}>
            <group position={[-w / 4, 0, 0]}>
              <FacePlane
                url={topUrlRight}
                faceId="topRight"
                preset={preset}
                args={[w / 2, d]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topRight")}
                crop={cropOf("topRight", "top")}
              />
            </group>
          </group>
        </>
      ) : (
        <>
          <group position={[0, h / 2, -d / 2]} rotation={[-angle, 0, 0]}>
            <group position={[0, 0, d / 4]}>
              <FacePlane
                url={topUrlLeft}
                faceId="topLeft"
                preset={preset}
                args={[w, d / 2]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topLeft")}
                crop={cropOf("topLeft", "top")}
              />
            </group>
          </group>
          <group position={[0, h / 2, d / 2]} rotation={[angle, 0, 0]}>
            <group position={[0, 0, -d / 4]}>
              <FacePlane
                url={topUrlRight}
                faceId="topRight"
                preset={preset}
                args={[w, d / 2]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topRight")}
                crop={cropOf("topRight", "top")}
              />
            </group>
          </group>
        </>
      );
    }

    if (opening === "lid_from_back") {
      return (
        <group position={[0, h / 2, -d / 2]} rotation={[-angle, 0, 0]}>
          <group position={[0, 0, d / 2]}>{topPlane}</group>
        </group>
      );
    }

    if (opening === "lid_from_front") {
      return (
        <group position={[0, h / 2, d / 2]} rotation={[angle, 0, 0]}>
          <group position={[0, 0, -d / 2]}>{topPlane}</group>
        </group>
      );
    }

    if (opening === "lid_from_left") {
      return (
        <group position={[-w / 2, h / 2, 0]} rotation={[0, 0, angle]}>
          <group position={[w / 2, 0, 0]}>{topPlane}</group>
        </group>
      );
    }

    if (opening === "lid_from_right") {
      return (
        <group position={[w / 2, h / 2, 0]} rotation={[0, 0, -angle]}>
          <group position={[-w / 2, 0, 0]}>{topPlane}</group>
        </group>
      );
    }

    return (
      <FacePlane
        url={topWhole}
        faceId="top"
        preset={preset}
        args={[w, d]}
        position={[0, h / 2 + EPS, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "top")}
        crop={cropOf("top")}
      />
    );
  };

  return (
    <group>
      <FacePlane
        url={textures.bottom ?? null}
        faceId="bottom"
        preset={preset}
        args={[w, d]}
        position={[0, -h / 2 - EPS, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "bottom")}
        crop={cropOf("bottom")}
      />

      <FacePlane
        url={textures.front ?? null}
        faceId="front"
        preset={preset}
        args={[w, h]}
        position={[0, 0, d / 2 + EPS]}
        rotation={[0, 0, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "front")}
        crop={cropOf("front")}
      />

      <FacePlane
        url={textures.back ?? null}
        faceId="back"
        preset={preset}
        args={[w, h]}
        position={[0, 0, -d / 2 - EPS]}
        rotation={[0, Math.PI, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "back")}
        crop={cropOf("back")}
      />

      {rightSwings ? (
        <group position={[w / 2, 0, d / 2]} rotation={[0, -angle, 0]}>
          <group position={[0, 0, -d / 2]}>
            <FacePlane
              url={textures.right ?? null}
              faceId="right"
              preset={preset}
              args={[d, h]}
              position={[EPS, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              wireframe={wireframe}
              cleanCapture={cleanCapture}
              textureRotationDeg={faceRotation(rr, "right")}
              crop={cropOf("right")}
            />
          </group>
        </group>
      ) : (
        <FacePlane
          url={textures.right ?? null}
          faceId="right"
          preset={preset}
          args={[d, h]}
          position={[w / 2 + EPS, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          wireframe={wireframe}
          cleanCapture={cleanCapture}
          textureRotationDeg={faceRotation(rr, "right")}
          crop={cropOf("right")}
        />
      )}

      {leftSwings ? (
        <group position={[-w / 2, 0, d / 2]} rotation={[0, angle, 0]}>
          <group position={[0, 0, -d / 2]}>
            <FacePlane
              url={textures.left ?? null}
              faceId="left"
              preset={preset}
              args={[d, h]}
              position={[-EPS, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              wireframe={wireframe}
              cleanCapture={cleanCapture}
              textureRotationDeg={faceRotation(rr, "left")}
              crop={cropOf("left")}
            />
          </group>
        </group>
      ) : (
        <FacePlane
          url={textures.left ?? null}
          faceId="left"
          preset={preset}
          args={[d, h]}
          position={[-w / 2 - EPS, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          wireframe={wireframe}
          cleanCapture={cleanCapture}
          textureRotationDeg={faceRotation(rr, "left")}
          crop={cropOf("left")}
        />
      )}

      {renderTop()}
    </group>
  );
}
