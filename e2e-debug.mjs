import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(5000);

console.log('Going to login...');
await page.goto('http://minido.38.105.232.177.sslip.io/login', { timeout: 30000 });
console.log('Page loaded');
await page.waitForTimeout(3000);

const inputs = await page.locator('input').evaluateAll(els => els.map(e => ({
  type: e.type, name: e.name, placeholder: e.placeholder, id: e.id
})));
console.log('INPUTS:', JSON.stringify(inputs));

await page.locator('input').first().fill('admin@jardinminido.com');
await page.locator('input').nth(1).fill('MiNido2024!');
await page.locator('button:has-text("Ingresar")').click();
console.log('Clicked Ingresar');
await page.waitForTimeout(4000);
console.log('URL:', page.url());
await page.screenshot({ path: '/home/mati/projects/mi-nido/e2e-screenshots/browser/debug-login.png' });

console.log('Going to asistencia...');
await page.goto('http://minido.38.105.232.177.sslip.io/asistencia', { timeout: 30000 });
await page.waitForTimeout(3000);
const bodyText = await page.textContent('body');
console.log('BODY:', bodyText.substring(0, 500).replace(/\s+/g, ' '));
const btns = await page.locator('button').allTextContents();
console.log('BUTTONS:', JSON.stringify(btns));
await page.screenshot({ path: '/home/mati/projects/mi-nido/e2e-screenshots/browser/debug-asistencia.png' });

await browser.close();
console.log('DONE');
