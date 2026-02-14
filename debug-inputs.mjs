import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await page.goto('http://minido.38.105.232.177.sslip.io/login', { timeout: 30000 });
await page.waitForTimeout(3000);

const inputs = await page.$$('input');
for (const inp of inputs) {
  const type = await inp.getAttribute('type');
  const name = await inp.getAttribute('name');
  const ph = await inp.getAttribute('placeholder');
  const id = await inp.getAttribute('id');
  console.log('Input:', JSON.stringify({ type, name, ph, id }));
}

await browser.close();
