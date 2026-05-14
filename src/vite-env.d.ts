/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_ORIGIN?: string;
  readonly VITE_OG_IMAGE_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
