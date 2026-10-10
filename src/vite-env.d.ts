/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMMA_BASE_URL?: string;
  readonly VITE_GEMMA_API_KEY?: string;
  readonly VITE_GEMMA_MODEL?: string;

  readonly VITE_GOOGLE_MAPS_API_KEY?: string;

  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_NOTIFY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
