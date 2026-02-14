import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const SHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/browser';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox']
});

const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

const shot = async (name) => {
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/${name}`, fullPage: true });
  console.log(`📸 ${name}`);
};

const log = [];
const L = (msg) => { console.log(msg); log.push(msg); };

// 1. LOGIN
L('=== 1. LOGIN ===');
await page.goto(`${BASE}/login`);
await page.waitForTimeout(2000);
await page.fill('input[type="email"], input[name="email"]', 'admin@jardinminido.com');
await page.fill('input[type="password"], input[name="password"]', 'MiNido2024!');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
await shot('39-login-success.png');
L(`Current URL after login: ${page.url()}`);

// 2. PAGOS
L('\n=== 2. PAGOS ===');
await page.goto(`${BASE}/pagos`);
await page.waitForTimeout(2000);
await shot('40-pagos-page.png');

// Inspect page content
const pagosContent = await page.textContent('body');
L(`Pagos page text (first 500): ${pagosContent.substring(0, 500)}`);

// Look for generate button
const genBtn = await page.$('button:has-text("Generar"), button:has-text("generar"), button:has-text("Cuota")');
if (genBtn) {
  L('Found generate button, clicking...');
  await genBtn.click();
  await page.waitForTimeout(2000);
  await shot('41-pagos-cuotas.png');
  
  // Try to find and interact with any modal/form
  const modalContent = await page.textContent('body');
  L(`After generate click (first 500): ${modalContent.substring(0, 500)}`);
  
  // Look for submit/confirm
  const confirmBtn = await page.$('button:has-text("Confirmar"), button:has-text("Guardar"), button:has-text("Generar")');
  if (confirmBtn) {
    await confirmBtn.click();
    await page.waitForTimeout(2000);
    await shot('41-pagos-cuotas-generated.png');
  }
} else {
  L('No generate button found');
  await shot('41-pagos-cuotas.png');
}

// Try registering a payment - look for clickable cuota rows
const cuotaRow = await page.$('tr:has-text("Pendiente"), [class*="cuota"], [class*="payment"]');
if (cuotaRow) {
  L('Found cuota row, clicking...');
  await cuotaRow.click();
  await page.waitForTimeout(2000);
  await shot('42-pagos-pago-registrado.png');
  
  // Look for register payment button
  const payBtn = await page.$('button:has-text("Registrar"), button:has-text("Pagar"), button:has-text("pago")');
  if (payBtn) {
    L('Found pay button, clicking...');
    await payBtn.click();
    await page.waitForTimeout(2000);
    await shot('42-pagos-pago-registrado-2.png');
  }
} else {
  L('No cuota rows found for payment');
  await shot('42-pagos-pago-registrado.png');
}

// 3. FAMILIA
L('\n=== 3. FAMILIA ===');
await page.goto(`${BASE}/familia`);
await page.waitForTimeout(2000);
await shot('43-familia-page.png');
const familiaContent = await page.textContent('body');
L(`Familia page text (first 500): ${familiaContent.substring(0, 500)}`);

// 4. MÁS
L('\n=== 4. MÁS ===');
await page.goto(`${BASE}/mas`);
await page.waitForTimeout(2000);
await shot('44-mas-page.png');
const masContent = await page.textContent('body');
L(`Más page text (first 500): ${masContent.substring(0, 500)}`);

// Click each option in "Más"
const masOptions = await page.$$('a[href], button, [role="button"], [class*="option"], [class*="item"], [class*="card"]');
L(`Found ${masOptions.length} clickable elements in Más`);

// Try clicking on links that are specific navigation items
const masLinks = await page.$$eval('a[href]', els => els.map(e => ({ href: e.getAttribute('href'), text: e.textContent.trim() })));
L(`Links in Más: ${JSON.stringify(masLinks.filter(l => l.text && !l.href?.startsWith('http')).slice(0, 20))}`);

let masIdx = 45;
for (const link of masLinks) {
  if (link.href && link.text && !link.href.startsWith('http') && !['/', '/dashboard', '/salas', '/ninos', '/asistencia', '/cuaderno', '/comunicados', '/pagos', '/familia', '/mas', '/login'].includes(link.href)) {
    L(`Navigating to ${link.href} (${link.text})`);
    await page.goto(`${BASE}${link.href}`);
    await page.waitForTimeout(1500);
    await shot(`${masIdx}-mas-${link.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}.png`);
    masIdx++;
    if (masIdx > 52) break;
  }
}

// 5. MOBILE REVIEW
L('\n=== 5. MOBILE REVIEW ===');
await page.setViewportSize({ width: 375, height: 812 });

const mobilePages = [
  ['dashboard', 'mobile-01-dashboard.png'],
  ['salas', 'mobile-02-salas.png'],
  ['ninos', 'mobile-03-ninos.png'],
  ['asistencia', 'mobile-04-asistencia.png'],
  ['cuaderno', 'mobile-05-cuaderno.png'],
  ['comunicados', 'mobile-06-comunicados.png'],
  ['pagos', 'mobile-07-pagos.png'],
  ['familia', 'mobile-08-familia.png'],
  ['mas', 'mobile-09-mas.png'],
];

for (const [route, filename] of mobilePages) {
  await page.goto(`${BASE}/${route}`);
  await page.waitForTimeout(2000);
  await shot(filename);
  
  // Check for bottom navbar
  const navbar = await page.$('nav, [class*="navbar"], [class*="bottom"], [class*="tab-bar"], [role="navigation"]');
  const navbarVisible = navbar ? await navbar.isVisible() : false;
  
  // Check for broken icons (□ characters)
  const bodyText = await page.textContent('body');
  const hasBrokenIcons = /□|&#xFFFD;|tofu/i.test(bodyText);
  
  // Get page dimensions
  const dims = await page.evaluate(() => ({
    scrollHeight: document.body.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  
  L(`[${route}] navbar=${navbarVisible}, brokenIcons=${hasBrokenIcons}, scrollH=${dims.scrollHeight}, viewH=${dims.viewportHeight}`);
}

await browser.close();

// Write log
writeFileSync('/home/mati/projects/mi-nido/e2e-test-3-log.txt', log.join('\n'));
console.log('\n✅ DONE');
