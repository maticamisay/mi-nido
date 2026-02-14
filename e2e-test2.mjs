import { chromium } from 'playwright';

const FRONTEND = 'http://minido.38.105.232.177.sslip.io';
const DIR = '/home/mati/projects/mi-nido/e2e-screenshots/final';

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Login
console.log('Going to login...');
await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${DIR}/login-debug.png` });
console.log('Login page loaded, URL:', page.url());

// Find inputs
const inputs = await page.locator('input').all();
console.log('Found inputs:', inputs.length);
for (const inp of inputs) {
  const type = await inp.getAttribute('type');
  const name = await inp.getAttribute('name');
  const ph = await inp.getAttribute('placeholder');
  console.log(`  input: type=${type} name=${name} placeholder=${ph}`);
}

// Fill login
try {
  await page.locator('input[type="email"]').fill('admin@jardinminido.com');
  await page.locator('input[type="password"]').fill('MiNido2024!');
} catch(e) {
  // Try by placeholder
  console.log('Trying by placeholder...');
  await page.locator('input').first().fill('admin@jardinminido.com');
  await page.locator('input').nth(1).fill('MiNido2024!');
}

await page.locator('button[type="submit"]').click();
console.log('Clicked submit');
await page.waitForTimeout(5000);
console.log('After login URL:', page.url());
await page.screenshot({ path: `${DIR}/dashboard.png` });
console.log('✅ Dashboard');

// Salas
await page.goto(`${FRONTEND}/salas`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${DIR}/salas.png` });
console.log('✅ Salas');

// Niños
await page.goto(`${FRONTEND}/ninos`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${DIR}/ninos.png` });
console.log('✅ Niños');

await browser.close();
console.log('Done!');
