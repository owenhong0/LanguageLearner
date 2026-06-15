/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL of a server-side proxy that forwards to the Anthropic API and returns
   * a `{ native, roman, en, feedback }` reply (T1). When unset, Converse runs
   * in scripted demo mode. The Anthropic key lives only on the proxy — never here.
   */
  readonly VITE_TUTOR_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
