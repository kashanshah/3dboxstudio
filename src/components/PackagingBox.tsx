import { Suspense, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { FaceId, MaterialPreset, OpeningStyle, SplitTopHingeSide } from "../types";
import { faceShortLabels } from "../types";
import { useLoadedTexture } from "../hooks/useTextures";
import { cropToTextureTransform, type SideImageCrop } from "../lib/faceImageCrop";

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

function createPrintMaterial(
  preset: MaterialPreset,
  wireframe: boolean,
  cleanCapture: boolean,
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
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
}

function applyTextureTransform(
  map: THREE.Texture,
  crop: SideImageCrop | undefined,
  textureRotationDeg: number,
) {
  const transform = cropToTextureTransform(crop, textureRotationDeg);
  map.offset.set(transform.offsetX, transform.offsetY);
  map.repeat.set(transform.repeatX, transform.repeatY);
  map.center.set(transform.centerX, transform.centerY);
  map.rotation = transform.rotationRad;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.needsUpdate = true;
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

/**
 * Exact-size panel used while lids/doors are open. No seam flanges (those read as
 * weird thickness) and no outward EPS (that opens corner tunnels).
 */
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
  textureRotationDeg?: number;
  crop?: SideImageCrop;
  cleanCapture?: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const map = useLoadedTexture(url);
  const inset = Math.max(0.06, Math.min(args[0], args[1]) * 0.04);
  const innerMat = getInnerLinerMaterial();

  const mat = useMemo(
    () => createPrintMaterial(preset, wireframe, cleanCapture),
    [
      cleanCapture,
      preset.clearcoat,
      preset.clearcoatRoughness,
      preset.color,
      preset.envMapIntensity,
      preset.metalness,
      preset.roughness,
      wireframe,
    ],
  );

  useEffect(() => {
    mat.map = map ?? null;
    mat.needsUpdate = true;
    invalidate();
  }, [map, mat, invalidate]);

  useEffect(() => {
    if (!map) return;
    applyTextureTransform(map, crop, textureRotationDeg);
    invalidate();
  }, [map, crop, textureRotationDeg, invalidate]);

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
      {!url && !wireframe && !cleanCapture && (
        <FaceLabel label={faceShortLabels[faceId]} args={args} />
      )}
    </group>
  );
}

type ShellFace = {
  id: FaceId;
  url: string | null;
  crop?: SideImageCrop;
  textureRotationDeg: number;
  /** BoxGeometry material slot: +x,-x,+y,-y,+z,-z */
  slot: 0 | 1 | 2 | 3 | 4 | 5;
  labelArgs: [number, number];
  labelPosition: [number, number, number];
  labelRotation: [number, number, number];
};

function useShellFaceMaterial(
  face: ShellFace,
  preset: MaterialPreset,
  wireframe: boolean,
  cleanCapture: boolean,
) {
  const invalidate = useThree((state) => state.invalidate);
  const map = useLoadedTexture(face.url);
  const mat = useMemo(
    () => createPrintMaterial(preset, wireframe, cleanCapture),
    [
      cleanCapture,
      preset.clearcoat,
      preset.clearcoatRoughness,
      preset.color,
      preset.envMapIntensity,
      preset.metalness,
      preset.roughness,
      wireframe,
    ],
  );

  useEffect(() => {
    mat.map = map ?? null;
    mat.needsUpdate = true;
    invalidate();
  }, [map, mat, invalidate]);

  useEffect(() => {
    if (!map) return;
    applyTextureTransform(map, face.crop, face.textureRotationDeg);
    invalidate();
  }, [map, face.crop, face.textureRotationDeg, invalidate]);

  useEffect(() => {
    return () => {
      mat.dispose();
    };
  }, [mat]);

  return mat;
}

/**
 * Watertight closed carton: one BoxGeometry, six materials.
 * Shared edges — no plane seams, flanges, or EPS tunnels.
 */
function SolidPackagingShell({
  width: w,
  height: h,
  length: d,
  faces,
  preset,
  wireframe,
  cleanCapture,
}: {
  width: number;
  height: number;
  length: number;
  faces: ShellFace[];
  preset: MaterialPreset;
  wireframe: boolean;
  cleanCapture: boolean;
}) {
  const bySlot = useMemo(() => {
    const map = new Map<number, ShellFace>();
    for (const face of faces) map.set(face.slot, face);
    return map;
  }, [faces]);

  const right = useShellFaceMaterial(bySlot.get(0)!, preset, wireframe, cleanCapture);
  const left = useShellFaceMaterial(bySlot.get(1)!, preset, wireframe, cleanCapture);
  const top = useShellFaceMaterial(bySlot.get(2)!, preset, wireframe, cleanCapture);
  const bottom = useShellFaceMaterial(bySlot.get(3)!, preset, wireframe, cleanCapture);
  const front = useShellFaceMaterial(bySlot.get(4)!, preset, wireframe, cleanCapture);
  const back = useShellFaceMaterial(bySlot.get(5)!, preset, wireframe, cleanCapture);

  const materials = useMemo(
    () => [right, left, top, bottom, front, back],
    [right, left, top, bottom, front, back],
  );

  return (
    <group>
      <mesh
        material={materials}
        castShadow={!cleanCapture}
        receiveShadow={!cleanCapture}
      >
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {!wireframe &&
        !cleanCapture &&
        faces.map((face) =>
          face.url ? null : (
            <group key={face.id} position={face.labelPosition} rotation={face.labelRotation}>
              <FaceLabel label={faceShortLabels[face.id]} args={face.labelArgs} />
            </group>
          ),
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

/** True when the carton should render as one solid shell (no hinged gap). */
export function shouldUseSolidShell(opening: OpeningStyle, openT: number): boolean {
  if (opening === "closed") return true;
  return openT < 0.001;
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
  const cropOf = (id: FaceId, fallback?: FaceId) =>
    textureCrops[id] ?? (fallback ? textureCrops[fallback] : undefined);

  const topUrlLeft = textures.topLeft ?? textures.top ?? null;
  const topUrlRight = textures.topRight ?? textures.top ?? null;
  const topWhole = textures.top ?? null;

  const leftSwings = opening === "door_left" || opening === "double_doors";
  const rightSwings = opening === "door_right" || opening === "double_doors";
  const useSolid = shouldUseSolidShell(opening, openT);

  const shellFaces = useMemo<ShellFace[]>(
    () => [
      {
        id: "right",
        slot: 0,
        url: textures.right ?? null,
        crop: cropOf("right"),
        textureRotationDeg: faceRotation(rr, "right"),
        labelArgs: [d, h],
        labelPosition: [w / 2 + 0.02, 0, 0],
        labelRotation: [0, Math.PI / 2, 0],
      },
      {
        id: "left",
        slot: 1,
        url: textures.left ?? null,
        crop: cropOf("left"),
        textureRotationDeg: faceRotation(rr, "left"),
        labelArgs: [d, h],
        labelPosition: [-w / 2 - 0.02, 0, 0],
        labelRotation: [0, -Math.PI / 2, 0],
      },
      {
        id: "top",
        slot: 2,
        url: topWhole,
        crop: cropOf("top"),
        textureRotationDeg: faceRotation(rr, "top"),
        labelArgs: [w, d],
        labelPosition: [0, h / 2 + 0.02, 0],
        labelRotation: [-Math.PI / 2, 0, 0],
      },
      {
        id: "bottom",
        slot: 3,
        url: textures.bottom ?? null,
        crop: cropOf("bottom"),
        textureRotationDeg: faceRotation(rr, "bottom"),
        labelArgs: [w, d],
        labelPosition: [0, -h / 2 - 0.02, 0],
        labelRotation: [Math.PI / 2, 0, 0],
      },
      {
        id: "front",
        slot: 4,
        url: textures.front ?? null,
        crop: cropOf("front"),
        textureRotationDeg: faceRotation(rr, "front"),
        labelArgs: [w, h],
        labelPosition: [0, 0, d / 2 + 0.02],
        labelRotation: [0, 0, 0],
      },
      {
        id: "back",
        slot: 5,
        url: textures.back ?? null,
        crop: cropOf("back"),
        textureRotationDeg: faceRotation(rr, "back"),
        labelArgs: [w, h],
        labelPosition: [0, 0, -d / 2 - 0.02],
        labelRotation: [0, Math.PI, 0],
      },
    ],
    // textures / crops / rotations intentionally tracked via fields above
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w, h, d, textures, textureCrops, rr, topWhole],
  );

  if (useSolid) {
    return (
      <SolidPackagingShell
        width={w}
        height={h}
        length={d}
        faces={shellFaces}
        preset={preset}
        wireframe={wireframe}
        cleanCapture={cleanCapture}
      />
    );
  }

  const topPlane = (
    <FacePlane
      url={topWhole}
      faceId="top"
      preset={preset}
      args={[w, d]}
      position={[0, 0, 0]}
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
                position={[0, 0, 0]}
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
                position={[0, 0, 0]}
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
                position={[0, 0, 0]}
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
                position={[0, 0, 0]}
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
        position={[0, h / 2, 0]}
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
        position={[0, -h / 2, 0]}
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
        position={[0, 0, d / 2]}
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
        position={[0, 0, -d / 2]}
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
              position={[0, 0, 0]}
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
          position={[w / 2, 0, 0]}
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
              position={[0, 0, 0]}
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
          position={[-w / 2, 0, 0]}
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
