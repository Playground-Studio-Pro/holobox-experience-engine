/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_CANVAS_WIDTH: string
  readonly VITE_CANVAS_HEIGHT: string
  readonly VITE_TARGET_FPS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
