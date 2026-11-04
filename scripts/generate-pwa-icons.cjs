const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Pixel rendering function for DocStock icon
function renderDocStockPixel(x, y, width, height, isMaskable = false) {
  // Normalize coordinates to [0, 1]
  const u = x / width;
  const v = y / height;

  // Background gradient: Dark Navy (#0a192f to #0f2b48)
  const bgR = Math.round(10 + (15 - 10) * v);
  const bgG = Math.round(25 + (43 - 25) * v);
  const bgB = Math.round(47 + (72 - 47) * v);

  // If not maskable, we give it a rounded squircle corner mask
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const dx = Math.max(0, Math.max(cornerRadius - u, u - (1 - cornerRadius)));
    const dy = Math.max(0, Math.max(cornerRadius - v, v - (1 - cornerRadius)));
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Content scaling: for maskable icons, keep within 80% safe zone
  const scale = isMaskable ? 0.78 : 0.88;
  const cu = (u - 0.5) / scale + 0.5;
  const cv = (v - 0.5) / scale + 0.5;

  // Check if inside normalized icon coordinates [0, 1]
  if (cu < 0.1 || cu > 0.9 || cv < 0.1 || cv > 0.9) {
    return [bgR, bgG, bgB, 255];
  }

  // Corner brackets (SE4710 reticle corners)
  const isCorner = 
    // Top-left
    ((cu >= 0.18 && cu <= 0.28 && Math.abs(cv - 0.22) < 0.012) || (cv >= 0.22 && cv <= 0.32 && Math.abs(cu - 0.18) < 0.012)) ||
    // Top-right
    ((cu >= 0.72 && cu <= 0.82 && Math.abs(cv - 0.22) < 0.012) || (cv >= 0.22 && cv <= 0.32 && Math.abs(cu - 0.82) < 0.012)) ||
    // Bottom-left
    ((cu >= 0.18 && cu <= 0.28 && Math.abs(cv - 0.78) < 0.012) || (cv >= 0.68 && cv <= 0.78 && Math.abs(cu - 0.18) < 0.012)) ||
    // Bottom-right
    ((cu >= 0.72 && cu <= 0.82 && Math.abs(cv - 0.78) < 0.012) || (cv >= 0.68 && cv <= 0.78 && Math.abs(cu - 0.82) < 0.012));

  if (isCorner) {
    return [0, 180, 216, 255]; // Cyan reticle
  }

  // Red laser scan line across center (cv around 0.5)
  if (Math.abs(cv - 0.5) < 0.008 && cu >= 0.20 && cu <= 0.80) {
    return [255, 59, 48, 255]; // Sharp red laser
  }
  if (Math.abs(cv - 0.5) < 0.025 && cu >= 0.22 && cu <= 0.78) {
    const alpha = (1 - Math.abs(cv - 0.5) / 0.025);
    return [
      Math.round(bgR * (1 - alpha) + 239 * alpha),
      Math.round(bgG * (1 - alpha) + 68 * alpha),
      Math.round(bgB * (1 - alpha) + 68 * alpha),
      255
    ];
  }

  // Center laser dot
  const dotDist = Math.sqrt((cu - 0.5) ** 2 + (cv - 0.5) ** 2);
  if (dotDist < 0.018) {
    return [255, 255, 255, 255];
  }
  if (dotDist < 0.035) {
    return [255, 59, 48, 255];
  }

  // Barcode bars (between cv: 0.30 and 0.70)
  if (cv >= 0.30 && cv <= 0.70) {
    // Relative position across barcode width
    const bu = (cu - 0.26) / (0.74 - 0.26);
    if (bu >= 0 && bu <= 1) {
      // Barcode bars distribution
      const bars = [
        [0.00, 0.06],
        [0.12, 0.16],
        [0.22, 0.30],
        [0.36, 0.40],
        [0.45, 0.52],
        [0.58, 0.68],
        [0.74, 0.78],
        [0.85, 0.94]
      ];
      for (const [start, end] of bars) {
        if (bu >= start && bu <= end) {
          // If close to center laser, blend slightly
          if (Math.abs(cv - 0.5) < 0.015) {
            return [255, 200, 200, 255];
          }
          return [255, 255, 255, 255]; // White barcode bar
        }
      }
    }
  }

  // Top-right Zebra Status Dot (Online Green)
  const greenDotDist = Math.sqrt((cu - 0.78) ** 2 + (cv - 0.22) ** 2);
  if (greenDotDist < 0.022) {
    return [34, 197, 94, 255]; // #22c55e
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons in /public...');

// 1. 192x192
const png192 = createPng(192, 192, (x, y, w, h) => renderDocStockPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. 512x512
const png512 = createPng(512, 512, (x, y, w, h) => renderDocStockPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. Maskable 512x512 (with safe-zone margins and full-bleed)
const pngMaskable512 = createPng(512, 512, (x, y, w, h) => renderDocStockPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

// 4. Apple Touch Icon 180x180
const appleTouchPng = createPng(180, 180, (x, y, w, h) => renderDocStockPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);

// 5. Favicon 32x32 & ICO
const faviconPng = createPng(32, 32, (x, y, w, h) => renderDocStockPixel(x, y, w, h, false));
// Save as favicon.ico (modern browsers accept PNG format inside or directly as favicon)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconPng);

// Remove test.png if present
if (fs.existsSync(path.join(publicDir, 'test.png'))) {
  fs.unlinkSync(path.join(publicDir, 'test.png'));
}

console.log('All PWA PNG icons generated successfully!');
