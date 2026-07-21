import { test, expect } from '@playwright/test';
import { inflateSync } from 'node:zlib';

// LEGAL: Smoke test — the safety net that guards the header.ts split. If a
// LEGAL: refactor breaks how the game boots or switches tabs, this goes red
// LEGAL: before a player ever sees a white screen.
interface PngImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

interface MapCanvasColorStats {
  bluePixels: number;
  landPixels: number;
  darkPixels: number;
  sampledPixels: number;
  colorBuckets: number;
}

const PNG_SIGNATURE = '89504e470d0a1a0a';

function parsePng(buffer: Buffer): PngImage {
  if(buffer.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) throw new Error('Expected a PNG screenshot');
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const imageChunks: Buffer[] = [];

  while(offset < buffer.length){
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if(type === 'IHDR'){
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    }
    if(type === 'IDAT') imageChunks.push(data);
    if(type === 'IEND') break;
  }

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if(width <= 0 || height <= 0 || bytesPerPixel === 0) throw new Error(`Unsupported PNG format: ${width}x${height}, color type ${colorType}`);

  const inflated = inflateSync(Buffer.concat(imageChunks));
  const stride = width * bytesPerPixel;
  const rows = new Uint8Array(height * stride);
  let sourceOffset = 0;

  for(let y = 0; y < height; y += 1){
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowStart = y * stride;
    for(let x = 0; x < stride; x += 1){
      const raw = inflated[sourceOffset + x];
      const left = x >= bytesPerPixel ? rows[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? rows[rowStart + x - stride] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? rows[rowStart + x - stride - bytesPerPixel] : 0;
      rows[rowStart + x] = unfilterPngByte(filter, raw, left, up, upLeft);
    }
    sourceOffset += stride;
  }

  const pixels = new Uint8Array(width * height * 4);
  for(let i = 0, p = 0; i < rows.length; i += bytesPerPixel, p += 4){
    pixels[p] = rows[i];
    pixels[p + 1] = rows[i + 1];
    pixels[p + 2] = rows[i + 2];
    pixels[p + 3] = bytesPerPixel === 4 ? rows[i + 3] : 255;
  }

  return { width, height, pixels };
}

function unfilterPngByte(filter: number, raw: number, left: number, up: number, upLeft: number): number {
  if(filter === 0) return raw;
  if(filter === 1) return (raw + left) & 255;
  if(filter === 2) return (raw + up) & 255;
  if(filter === 3) return (raw + Math.floor((left + up) / 2)) & 255;
  if(filter === 4) return (raw + paethPredictor(left, up, upLeft)) & 255;
  throw new Error(`Unsupported PNG filter: ${filter}`);
}

function paethPredictor(left: number, up: number, upLeft: number): number {
  const prediction = left + up - upLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upLeftDistance = Math.abs(prediction - upLeft);
  if(leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if(upDistance <= upLeftDistance) return up;
  return upLeft;
}

function mapCanvasColorStats(buffer: Buffer): MapCanvasColorStats {
  const image = parsePng(buffer);
  const buckets = new Set<string>();
  let bluePixels = 0;
  let landPixels = 0;
  let darkPixels = 0;
  let sampledPixels = 0;

  for(let y = 0; y < image.height; y += 3){
    for(let x = 0; x < image.width; x += 3){
      const index = (y * image.width + x) * 4;
      const r = image.pixels[index];
      const g = image.pixels[index + 1];
      const b = image.pixels[index + 2];
      const a = image.pixels[index + 3];
      if(a < 200) continue;
      sampledPixels += 1;
      buckets.add(`${Math.floor(r / 16)}:${Math.floor(g / 16)}:${Math.floor(b / 16)}`);
      if(b > 62 && b > r * 1.18 && b > g * 0.78) bluePixels += 1;
      if((g > 52 && g > r * 0.88 && g > b * 1.12) || (r > 62 && g > 46 && b < 58 && Math.abs(r - g) < 58)) landPixels += 1;
      if(r + g + b < 54) darkPixels += 1;
    }
  }

  return { bluePixels, landPixels, darkPixels, sampledPixels, colorBuckets:buckets.size };
}

test.describe('game boot', () => {
  test.describe.configure({ mode: 'serial' });

  test('loads with the full-screen start page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Seat at the Table');
    await expect(page.locator('#hud-cash')).toHaveText('$47');
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('starting the game and switching to the Map tab works', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    await page.locator('.tab-btn[data-tab="map"]').click();
    await expect(page.locator('.tab-panel[data-tab="map"]')).toHaveClass(/active/);
  });

  test('map renders without WebGL shader failures or missing GLB assets', async ({ page }) => {
    const browserIssues: string[] = [];

    page.on('console', function(message){
      const text = message.text();
      if(text.includes('Shader Error') || text.includes('program not valid') || text.includes('GLTFLoader') || text.includes("Couldn't load texture")) browserIssues.push(text);
    });
    page.on('response', function(response){
      if(response.url().includes('/assets/map/') && response.status() >= 400) browserIssues.push(`${response.status()} ${response.url()}`);
    });
    page.on('requestfailed', function(request){
      if(request.url().includes('/assets/map/')) browserIssues.push(request.url());
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await expect(page.locator('#scene3d-container canvas.webgl-canvas')).toBeVisible();
    await page.waitForTimeout(1200);

    expect(browserIssues).toEqual([]);
  });

  test('map canvas keeps water and land visually distinct', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    const canvas = page.locator('#scene3d-container canvas.webgl-canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(1600);

    const stats = mapCanvasColorStats(await canvas.screenshot());
    const darkRatio = stats.sampledPixels === 0 ? 1 : stats.darkPixels / stats.sampledPixels;

    expect(stats.bluePixels).toBeGreaterThan(900);
    expect(stats.landPixels).toBeGreaterThan(180);
    expect(stats.colorBuckets).toBeGreaterThan(36);
    expect(darkRatio).toBeLessThan(0.68);
  });

  test('map fullscreen expands the scene container to the viewport', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await expect(page.locator('#scene3d-container')).toBeVisible();

    const beforeBox = await page.locator('#scene3d-container').evaluate((element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    await page.locator('#fullscreen-btn').click();

    const box = await page.locator('#scene3d-container').evaluate((element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return { width: rect.width, height: rect.height, top: rect.top, position: style.position, viewportWidth: document.documentElement.clientWidth };
    });

    expect(Math.round(box.width)).toBe(Math.round(box.viewportWidth));
    expect(Math.round(box.top)).toBe(0);
    expect(box.width).toBeGreaterThan(beforeBox.width * 1.2);
    expect(box.height).toBeGreaterThanOrEqual(Math.min(beforeBox.height, 380));
    expect(box.position).toBe('fixed');
    await expect(page.locator('#scene3d-container')).toHaveClass(/fullscreen/);

    await page.locator('#minimap-expand').dispatchEvent('click');
    expect(await page.locator('#citymap-overlay').getAttribute('class')).not.toContain('hidden');
    await page.keyboard.press('Escape');
    await expect(page.locator('#citymap-overlay')).toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#scene3d-container')).not.toHaveClass(/fullscreen/);

  });

  test('minimap centers the player marker', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();

    await expect.poll(async () => page.locator('#minimap-canvas').evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(50, 50, 50, 50).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBeGreaterThan(0);
  });

  test('minimap can pan while stopped and recenters while moving', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    const minimap = page.locator('#minimap-canvas');
    await expect(minimap).toBeVisible();

    const box = await minimap.boundingBox();
    expect(box).not.toBeNull();
    if(!box) return;

    await page.mouse.move(box.x + 75, box.y + 75);
    await page.mouse.down();
    await page.mouse.move(box.x + 112, box.y + 75);
    await page.mouse.up();

    await expect.poll(async () => minimap.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(68, 68, 14, 14).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBe(0);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(350);
    await page.keyboard.up('ArrowRight');

    await expect.poll(async () => minimap.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(68, 68, 14, 14).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBeGreaterThan(0);
  });

  test('minimap expands before waypoint placement is allowed', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    const minimap = page.locator('#minimap-canvas');
    await expect(minimap).toBeVisible();

    const minimapBox = await minimap.boundingBox();
    expect(minimapBox).not.toBeNull();
    if(!minimapBox) return;

    await page.mouse.click(minimapBox.x + 80, minimapBox.y + 80);
    await expect(page.locator('#citymap-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#minimap-clear')).not.toHaveClass(/show/);

    const cityMap = page.locator('#citymap-canvas');
    const cityBox = await cityMap.boundingBox();
    expect(cityBox).not.toBeNull();
    if(!cityBox) return;

    await page.mouse.click(cityBox.x + cityBox.width * 0.13, cityBox.y + cityBox.height * 0.55);
    await expect(page.locator('#minimap-clear')).toHaveClass(/show/);
  });

  test('expanded minimap hover shows exact place and category', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.locator('#minimap-expand').dispatchEvent('click');
    await expect(page.locator('#citymap-overlay')).not.toHaveClass(/hidden/);

    const target = await page.locator('#citymap-canvas').evaluate(async (canvas: HTMLCanvasElement) => {
      const [{ windhavenMapModel }, viewportModule] = await Promise.all([
        import('/src/map/mapModel.ts'),
        import('/src/map/viewport.ts'),
      ]);
      const viewport = viewportModule.createMapViewport(
        canvas.width,
        canvas.height,
        windhavenMapModel.districts.flatMap(district => district.landArea),
      );
      const point = viewportModule.worldToScreen(viewport, { x:485, y:450 });
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + point.x * (rect.width / canvas.width),
        y: rect.top + point.y * (rect.height / canvas.height),
      };
    });

    await page.mouse.move(target.x, target.y);
    await expect(page.locator('#citymap-hint')).toContainText('Rentport City National');
    await expect(page.locator('#citymap-hint')).toContainText('Bank');
  });
});
