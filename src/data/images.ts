import type { ImageMetadata } from 'astro';

/**
 * Pre-sized responsive photographs live in src/assets/images/<folder>/ as
 * `<name>-<width>.webp`. Importing them gives hashed URLs and real dimensions.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/images/{editorial,people}/*.webp',
  { eager: true },
);

export interface ResponsiveImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

const library = new Map<string, ImageMetadata[]>();
for (const [path, module] of Object.entries(modules)) {
  const name = path.match(/\/([a-z0-9-]+)-\d+\.webp$/)?.[1];
  if (!name) throw new Error(`Unexpected image file name: ${path}`);
  library.set(name, [...(library.get(name) ?? []), module.default]);
}

export function getResponsiveImage(name: string): ResponsiveImage {
  const variants = [...(library.get(name) ?? [])].sort(
    (a, b) => a.width - b.width,
  );
  const largest = variants.at(-1);
  if (!largest) throw new Error(`Unknown image: ${name}`);
  return {
    src: largest.src,
    srcset: variants.map((v) => `${v.src} ${v.width}w`).join(', '),
    width: largest.width,
    height: largest.height,
  };
}
