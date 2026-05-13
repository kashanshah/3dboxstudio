import { useEffect, useState } from "react";
import * as THREE from "three";
import type { FaceId } from "../types";

/** Loads a texture from an object URL; disposes on change/unmount. */
export function useLoadedTexture(url: string | null) {
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

  useEffect(() => {
    return () => {
      if (map) map.dispose();
    };
  }, [map]);

  return map;
}

/** Revokes previous URLs when the map of Files changes. */
export function useFaceObjectUrls(
  files: Partial<Record<FaceId, File | null>>
): Partial<Record<FaceId, string>> {
  const [urls, setUrls] = useState<Partial<Record<FaceId, string>>>({});

  useEffect(() => {
    const next: Partial<Record<FaceId, string>> = {};
    const created: string[] = [];
    (Object.keys(files) as FaceId[]).forEach((key) => {
      const f = files[key];
      if (f) {
        const u = URL.createObjectURL(f);
        next[key] = u;
        created.push(u);
      }
    });
    setUrls(next);
    return () => {
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  return urls;
}
