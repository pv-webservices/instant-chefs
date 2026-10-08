/// <reference types="astro/client" />

/** True when the build has a production HTTPS origin and pages may be indexed. */
declare const __SITE_INDEXABLE__: boolean;

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}
