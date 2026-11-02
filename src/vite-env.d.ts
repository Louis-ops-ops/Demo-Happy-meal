/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TARGET: 'web' | 'desktop'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
