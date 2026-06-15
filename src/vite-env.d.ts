/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override for the backend base URL (see src/config.ts). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
