"use client";

import { useEffect, useRef } from "react";
import {
  previewBootstrapKey,
  runUrlBootstrapOnce,
  shareBootstrapKey,
} from "@/lib/studioUrlBootstrap";

type DocApi = {
  loadShareById: (shareId: string, source: "opened" | "saved") => Promise<boolean>;
  loadShareByPreviewToken: (previewToken: string) => Promise<boolean>;
  showStatus: (message: string, ms?: number) => void;
  markClean: () => void;
};

type UseStudioUrlBootstrapArgs = {
  shareIdFromUrl?: string | null;
  previewTokenFromUrl?: string | null;
  docRef: { current: DocApi };
  sharedOpenedMessage: string;
  sharedLoadFailedMessage: string;
  previewOpenedMessage: string;
  previewLoadFailedMessage: string;
  onCloudLoadFailed: () => void;
  onSettled: () => void;
};

/**
 * Loads share/preview URLs once per id/token. Safe under React Strict Mode:
 * cleanup of the first effect does not strand sessionReady, and a failed load
 * can be retried on a later effect run.
 */
export function useStudioUrlBootstrap({
  shareIdFromUrl,
  previewTokenFromUrl,
  docRef,
  sharedOpenedMessage,
  sharedLoadFailedMessage,
  previewOpenedMessage,
  previewLoadFailedMessage,
  onCloudLoadFailed,
  onSettled,
}: UseStudioUrlBootstrapArgs): void {
  const onCloudLoadFailedRef = useRef(onCloudLoadFailed);
  const onSettledRef = useRef(onSettled);
  onCloudLoadFailedRef.current = onCloudLoadFailed;
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (!shareIdFromUrl) return;
    let active = true;
    const docApi = docRef.current;
    const key = shareBootstrapKey(shareIdFromUrl);

    void (async () => {
      const result = await runUrlBootstrapOnce(key, async () => {
        await docApi.loadShareById(shareIdFromUrl, "opened");
      });
      if (!active) return;
      if (result === "ok") {
        docApi.showStatus(sharedOpenedMessage);
      } else {
        docApi.showStatus(sharedLoadFailedMessage, 5000);
        onCloudLoadFailedRef.current();
      }
      onSettledRef.current();
      docApi.markClean();
    })();

    return () => {
      active = false;
    };
  }, [
    shareIdFromUrl,
    docRef,
    sharedOpenedMessage,
    sharedLoadFailedMessage,
  ]);

  useEffect(() => {
    if (!previewTokenFromUrl) return;
    let active = true;
    const docApi = docRef.current;
    const key = previewBootstrapKey(previewTokenFromUrl);

    void (async () => {
      const result = await runUrlBootstrapOnce(key, async () => {
        await docApi.loadShareByPreviewToken(previewTokenFromUrl);
      });
      if (!active) return;
      if (result === "ok") {
        docApi.showStatus(previewOpenedMessage);
      } else {
        docApi.showStatus(previewLoadFailedMessage, 5000);
        onCloudLoadFailedRef.current();
      }
      onSettledRef.current();
      docApi.markClean();
    })();

    return () => {
      active = false;
    };
  }, [
    previewTokenFromUrl,
    docRef,
    previewOpenedMessage,
    previewLoadFailedMessage,
  ]);
}
