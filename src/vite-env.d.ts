/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD_PORT: `${number}`
  readonly VITE_MAX_FILE_SIZE_BYTES: `${number}`
  readonly VITE_MAX_USERS_OVERRIDE: `${number}`
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
