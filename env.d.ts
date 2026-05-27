/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POMODORO_SECONDS: string
  readonly VITE_SHORT_BREAK_SECONDS: string
  readonly VITE_LONG_BREAK_SECONDS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
