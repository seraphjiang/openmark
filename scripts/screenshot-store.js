import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mockupsDir = resolve(__dirname, 'store-mockups');
const outputDir = resolve(__dirname, '..', 'store-assets');

const pages = [
  { file: 'screenshot-1.html', output: 'screenshot-1.png', width: 1280, height: 800, wait: 3000 },
  { file: 'screenshot-2.html', output: 'screenshot-2.png', width: 1280, height: 800, wait: 5000 },
  { file: 'screenshot-3.html', output: 'screenshot-3.png', width: 1280, height: 800, wait: 4000 },
  { file: 'promo-small.html', output: 'small-promo-440x280.png', width: 440, height: 280, wait: 2000 },
  { file: 'promo-marquee.html', output: 'marquee-promo-1400x560.png', width: 1400, height: 560, wait: 2000 },
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const p of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: p.width, height: p.height, deviceScaleFactor: 2 });
    const url = `file://${resolve(mockupsDir, p.file)}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    // Extra wait for mermaid/katex rendering
    await new Promise(r => setTimeout(r, p.wait));
    await page.screenshot({ path: resolve(outputDir, p.output), type: 'png' });
    console.log(`✓ ${p.output} (${p.width}x${p.height})`);
    await page.close();
  }

  await browser.close();
  console.log('\nAll store assets generated in store-assets/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
