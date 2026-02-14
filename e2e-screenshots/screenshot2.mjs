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

// Asistencia - select a sala
await page.goto(`${FRONTEND}/asistencia`);
await page.waitForTimeout(2000);
// Try selecting a sala from dropdown
try {
  const select = page.locator('select');
  const options = await select.locator('option').allTextContents();
  console.log('Sala options:', options);
  // Pick Sala Pollitos or first real option
  const pollitos = options.find(o => o.includes('Pollitos'));
  if (pollitos) await select.selectOption({ label: pollitos });
  else if (options.length > 1) await select.selectOption({ index: 1 });
  await page.waitForTimeout(2000);
} catch(e) { console.log('Select error:', e.message); }
await page.screenshot({ path: `${OUT}/asistencia.png`, fullPage: false });
console.log('✅ asistencia');

// Cuaderno - try to select a sala too
await page.goto(`${FRONTEND}/cuaderno`);
await page.waitForTimeout(2000);
try {
  const select = page.locator('select').first();
  const options = await select.locator('option').allTextContents();
  console.log('Cuaderno options:', options);
  const pollitos = options.find(o => o.includes('Pollitos'));
  if (pollitos) await select.selectOption({ label: pollitos });
  else if (options.length > 1) await select.selectOption({ index: 1 });
  await page.waitForTimeout(2000);
} catch(e) { console.log('Cuaderno select error:', e.message); }
await page.screenshot({ path: `${OUT}/cuaderno.png`, fullPage: false });
console.log('✅ cuaderno');

// Comunicados
await page.goto(`${FRONTEND}/comunicados`);
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/comunicados.png`, fullPage: false });
console.log('✅ comunicados');

await browser.close();
console.log('Done!');
