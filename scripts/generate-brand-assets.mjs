// Generates favicons, app icons and the social sharing image from the
// client-supplied logo in source-files/. Run with: npm run assets:brand
// Output is committed, so this only needs re-running when the logo changes.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const SOURCE_LOGO = 'source-files/website-logo.jpeg';
const PUBLIC_DIR = 'public';
const BRAND_ORANGE = '#f6a313';
// Tight square around the round mark so it stays legible at 16–48 px.
const MARK_CROP = { left: 80, top: 22, width: 560, height: 560 };

const mark = () => sharp(SOURCE_LOGO).extract(MARK_CROP);

async function png(size, file) {
  const buffer = await mark()
    .resize(size, size, { kernel: 'lanczos3' })
    .flatten({ background: BRAND_ORANGE })
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer();
  if (file) await writeFile(`${PUBLIC_DIR}/${file}`, buffer);
  return buffer;
}

/** Builds an ICO container with embedded PNG images (supported by all current browsers). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function socialImage() {
  const WIDTH = 1200;
  const HEIGHT = 630;
  const LOGO = 470;
  const logo = await sharp(SOURCE_LOGO)
    .extract(MARK_CROP)
    .resize(LOGO, LOGO)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${LOGO}" height="${LOGO}"><rect width="${LOGO}" height="${LOGO}" rx="56" fill="#fff"/></svg>`,
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
  const text = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fffaf3"/>
        <stop offset="1" stop-color="#ffe6c9"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect x="0" y="${HEIGHT - 18}" width="${WIDTH}" height="18" fill="#f26a10"/>
    <g font-family="Arial, Helvetica, sans-serif" fill="#221a14">
      <text x="590" y="200" font-size="60" font-weight="700">Hire Smart.</text>
      <text x="590" y="280" font-size="60" font-weight="700" fill="#c2410c">Hire Instant Chefs.</text>
      <text x="592" y="352" font-size="29">Trained, verified chefs &amp; domestic staff</text>
      <text x="592" y="394" font-size="29">for restaurants, cafés, cloud kitchens,</text>
      <text x="592" y="436" font-size="29">bakeries, catering businesses &amp; homes.</text>
      <text x="592" y="520" font-size="27" font-weight="700" fill="#c2410c">Faridabad · +91 84484 96343</text>
    </g>
  </svg>`;
  await sharp(Buffer.from(text))
    .composite([
      { input: logo, left: 70, top: Math.round((HEIGHT - LOGO) / 2) - 9 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`${PUBLIC_DIR}/images/og-image.jpg`);
}

await mkdir(`${PUBLIC_DIR}/images`, { recursive: true });
const icoImages = [];
for (const size of [16, 32, 48])
  icoImages.push({ size, data: await png(size) });
await writeFile(`${PUBLIC_DIR}/favicon.ico`, ico(icoImages));
await png(48, 'favicon-48x48.png');
await png(96, 'favicon-96x96.png');
await png(180, 'apple-touch-icon.png');
await png(192, 'icon-192x192.png');
await png(512, 'icon-512x512.png');

// No vector logo was supplied, so the SVG favicon wraps a raster of the mark.
const svgRaster = (await png(96)).toString('base64');
await writeFile(
  `${PUBLIC_DIR}/favicon.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 96 96"><image width="96" height="96" xlink:href="data:image/png;base64,${svgRaster}"/></svg>\n`,
);
await socialImage();
console.log('Brand assets generated in public/.');
