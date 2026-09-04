import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { FaceId } from "../types";
import { createSharedFileObjectUrls } from "../lib/faceObjectUrls";

/** Loads a texture from an object URL; disposes on change/unmount. */
export function useLoadedTexture(url: string | null) {
  const invalidate = useThree((state) => state.invalidate);
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setMap(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    let cancelled = false;
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        if (cancelled) {
          tex.dispose();
          return;
        }
        setMap(tex);
      },
      undefined,
      () => {
        if (!cancelled) setMap(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Demand-mode canvas only repaints on invalidate(); refresh after map loads or clears.
  useEffect(() => {
    invalidate();
  }, [map, invalidate]);

  useEffect(() => {
    return () => {
      if (map) map.dispose();
    };
  }, [map]);

  return map;
}

/** Revokes previous URLs when the map of Files changes. Same File shares one object URL. */
export function useFaceObjectUrls(
  files: Partial<Record<FaceId, File | null>>
): Partial<Record<FaceId, string>> {
  const [urls, setUrls] = useState<Partial<Record<FaceId, string>>>({});

  useEffect(() => {
    const { urls: next, revoke } = createSharedFileObjectUrls(files);
    setUrls(next);
    return revoke;
  }, [files]);

  return urls;
}
