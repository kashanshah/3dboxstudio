import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { FaceId, MaterialPreset, OpeningStyle, SplitTopHingeSide } from "../types";
import { useLoadedTexture } from "../hooks/useTextures";

const EPS = 0.02;

/** Shared unprinted liner (inside the box); BackSide so it is visible from the cavity. */
let innerLinerMaterial: THREE.MeshStandardMaterial | null = null;
function getInnerLinerMaterial(): THREE.MeshStandardMaterial {
  if (!innerLinerMaterial) {
    innerLinerMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e6,
      roughness: 0.98,
      metalness: 0,
      side: THREE.BackSide,
    });
  }
  return innerLinerMaterial;
}

function faceRotation(deg: Partial<Record<FaceId, number>> | undefined, id: FaceId): number {
  return deg?.[id] ?? 0;
}

function FacePlane({
  url,
  preset,
  args,
  position,
  rotation,
  wireframe,
  textureRotationDeg = 0,
  cleanCapture = false,
}: {
  url: string | null;
  preset: MaterialPreset;
  args: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  wireframe: boolean;
  /** Rotate the texture in its plane (degrees), pivot at center. */
  textureRotationDeg?: number;
  cleanCapture?: boolean;
}) {
  const map = useLoadedTexture(url);
  const inset = Math.max(0.06, Math.min(args[0], args[1]) * 0.04);
  const innerMat = getInnerLinerMaterial();

  const mat = useMemo(() => {
    if (cleanCapture) {
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
        envMapIntensity: preset.envMapIntensity * 0.45,
        side: THREE.FrontSide,
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
      side: THREE.FrontSide,
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

  useEffect(() => {
    mat.map = map ?? null;
    mat.needsUpdate = true;
  }, [map, mat]);

  useEffect(() => {
    if (!map) return;
    map.center.set(0.5, 0.5);
    map.rotation = (textureRotationDeg * Math.PI) / 180;
    map.needsUpdate = true;
  }, [map, textureRotationDeg]);

  useEffect(() => {
    return () => {
      mat.dispose();
    };
  }, [mat]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]} material={mat} castShadow={!cleanCapture} receiveShadow={!cleanCapture}>
        <planeGeometry args={args} />
      </mesh>
      {!wireframe && (
        <mesh position={[0, 0, -inset]} material={innerMat} receiveShadow={!cleanCapture}>
          <planeGeometry args={args} />
        </mesh>
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
  cleanCapture = false,
}: PackagingBoxProps) {
  const angle = openT * ((75 * Math.PI) / 180);
  const rr = texRot;

  const topUrlLeft = textures.topLeft ?? textures.top ?? null;
  const topUrlRight = textures.topRight ?? textures.top ?? null;
  const topWhole = textures.top ?? null;

  return (
    <group>
      <FacePlane
        url={textures.bottom ?? null}
        preset={preset}
        args={[w, d]}
        position={[0, -h / 2 - EPS, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "bottom")}
      />

      <FacePlane
        url={textures.front ?? null}
        preset={preset}
        args={[w, h]}
        position={[0, 0, d / 2 + EPS]}
        rotation={[0, 0, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "front")}
      />

      <FacePlane
        url={textures.back ?? null}
        preset={preset}
        args={[w, h]}
        position={[0, 0, -d / 2 - EPS]}
        rotation={[0, Math.PI, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "back")}
      />

      <FacePlane
        url={textures.right ?? null}
        preset={preset}
        args={[d, h]}
        position={[w / 2 + EPS, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
        textureRotationDeg={faceRotation(rr, "right")}
      />

      {opening === "door_left" ? (
        <group position={[-w / 2, 0, d / 2]} rotation={[0, angle, 0]}>
          <group position={[0, 0, -d / 2]}>
            <FacePlane
              url={textures.left ?? null}
              preset={preset}
              args={[d, h]}
              position={[-EPS, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              wireframe={wireframe}
              cleanCapture={cleanCapture}
              textureRotationDeg={faceRotation(rr, "left")}
            />
          </group>
        </group>
      ) : (
        <FacePlane
          url={textures.left ?? null}
          preset={preset}
          args={[d, h]}
          position={[-w / 2 - EPS, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          wireframe={wireframe}
          cleanCapture={cleanCapture}
          textureRotationDeg={faceRotation(rr, "left")}
        />
      )}

      {splitTop && opening === "top_split_meet_center" && splitTopHingeSide === "side_a" ? (
        <>
          <group position={[-w / 2, h / 2, 0]} rotation={[0, 0, angle]}>
            <group position={[w / 4, 0, 0]}>
              <FacePlane
                url={topUrlLeft}
                preset={preset}
                args={[w / 2, d]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topLeft")}
              />
            </group>
          </group>
          <group position={[w / 2, h / 2, 0]} rotation={[0, 0, -angle]}>
            <group position={[-w / 4, 0, 0]}>
              <FacePlane
                url={topUrlRight}
                preset={preset}
                args={[w / 2, d]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topRight")}
              />
            </group>
          </group>
        </>
      ) : splitTop && opening === "top_split_meet_center" && splitTopHingeSide === "side_b" ? (
        <>
          <group position={[0, h / 2, -d / 2]} rotation={[-angle, 0, 0]}>
            <group position={[0, 0, d / 4]}>
              <FacePlane
                url={topUrlLeft}
                preset={preset}
                args={[w, d / 2]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topLeft")}
              />
            </group>
          </group>
          <group position={[0, h / 2, d / 2]} rotation={[angle, 0, 0]}>
            <group position={[0, 0, -d / 4]}>
              <FacePlane
                url={topUrlRight}
                preset={preset}
                args={[w, d / 2]}
                position={[0, EPS, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                wireframe={wireframe}
                cleanCapture={cleanCapture}
                textureRotationDeg={faceRotation(rr, "topRight")}
              />
            </group>
          </group>
        </>
      ) : opening === "lid_from_back" ? (
        <group position={[0, h / 2, -d / 2]} rotation={[angle, 0, 0]}>
          <group position={[0, 0, d / 2]}>
            <FacePlane
              url={topWhole}
              preset={preset}
              args={[w, d]}
              position={[0, EPS, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              wireframe={wireframe}
              cleanCapture={cleanCapture}
              textureRotationDeg={faceRotation(rr, "top")}
            />
          </group>
        </group>
      ) : (
        <FacePlane
          url={topWhole}
          preset={preset}
          args={[w, d]}
          position={[0, h / 2 + EPS, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
              wireframe={wireframe}
              cleanCapture={cleanCapture}
              textureRotationDeg={faceRotation(rr, "top")}
        />
      )}
    </group>
  );
}
