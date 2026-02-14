import { chromium } from 'playwright';

const FRONTEND = 'http://minido.38.105.232.177.sslip.io';
const OUT = '/home/mati/projects/mi-nido/e2e-screenshots/final';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// Login
await page.goto(`${FRONTEND}/login`);
await page.waitForTimeout(2000);
await page.fill('input[type="email"], input[name="email"]', 'admin@jardinminido.com');
await page.fill('input[type="password"], input[name="password"]', 'MiNido2024!');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

// Comunicados - click Todos tab
await page.goto(`${FRONTEND}/comunicados`);
await page.waitForTimeout(2000);
// Check network for announcements
page.on('response', r => {
  if (r.url().includes('announcements')) console.log('API:', r.url(), r.status());
});
await page.reload();
await page.waitForTimeout(3000);
// Click "Todos" or "Borradores"
try {
  await page.click('text=Todos');
  await page.waitForTimeout(2000);
} catch(e) {}
await page.screenshot({ path: `${OUT}/comunicados-todos.png`, fullPage: false });
console.log('✅ comunicados-todos');

try {
  await page.click('text=Borradores');
  await page.waitForTimeout(2000);
} catch(e) {}
await page.screenshot({ path: `${OUT}/comunicados-borradores.png`, fullPage: false });
console.log('✅ comunicados-borradores');

await browser.close();
