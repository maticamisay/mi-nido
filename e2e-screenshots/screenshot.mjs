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

// Dashboard
await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: false });
console.log('✅ dashboard');

// Asistencia
await page.goto(`${FRONTEND}/asistencia`);
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/asistencia.png`, fullPage: false });
console.log('✅ asistencia');

// Cuaderno
await page.goto(`${FRONTEND}/cuaderno`);
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/cuaderno.png`, fullPage: false });
console.log('✅ cuaderno');

// Comunicados
await page.goto(`${FRONTEND}/comunicados`);
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/comunicados.png`, fullPage: false });
console.log('✅ comunicados');

await browser.close();
console.log('Done!');
