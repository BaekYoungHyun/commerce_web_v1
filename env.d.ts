/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_IMAGE_URL?: string
  readonly VITE_MODE?: string
  readonly VITE_URL?: string
  readonly VITE_USE_MOCK_API?: 'true' | 'false'
  readonly VITE_CART_SEQ?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
