import { chromium } from 'playwright';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const SCREENSHOT_DIR = '/home/mati/projects/mi-nido/e2e-screenshots';
const WAIT = { waitUntil: 'load', timeout: 30000 };
const SETTLE = 3000;

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });

  // --- MOBILE (375x812) ---
  console.log('=== MOBILE TESTING (375x812) ===');
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await mCtx.newPage();

  // Login page
  await mp.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-login.png`, fullPage: true });
  console.log('✓ mobile-login');

  // Register page
  await mp.goto(`${BASE}/register`, { waitUntil: 'load', timeout: 30000 });
  await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-register.png`, fullPage: true });
  console.log('✓ mobile-register');

  // Login
  await mp.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await mp.fill('input[type="email"], input[name="email"]', 'e2e-mobile@jardin.com');
  await mp.fill('input[type="password"], input[name="password"]', 'Test123!');
  await mp.click('button[type="submit"]');
  await mp.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await mp.waitForTimeout(3000);

  // Dashboard
  await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-dashboard.png`, fullPage: true });
  console.log('✓ mobile-dashboard');

  // Check overflow
  const hasOverflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`  Dashboard overflow: ${hasOverflow}`);

  // Pages to visit after login
  const pages = ['salas', 'ninos', 'asistencia', 'cuaderno', 'comunicados', 'pagos', 'familia', 'mas'];
  
  for (const pg of pages) {
    try {
      await mp.goto(`${BASE}/${pg}`, { waitUntil: 'load', timeout: 30000 });
      await mp.waitForTimeout(2000);
      await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-${pg}.png`, fullPage: true });
      const ov = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      console.log(`✓ mobile-${pg} (overflow: ${ov})`);
    } catch (e) {
      // Try alternate routes
      if (pg === 'ninos') {
        try {
          await mp.goto(`${BASE}/niños`, { waitUntil: 'load', timeout: 30000 });
          await mp.waitForTimeout(2000);
          await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-ninos.png`, fullPage: true });
          console.log('✓ mobile-ninos (alt route)');
        } catch (e2) {
          console.log(`✗ mobile-${pg}: ${e2.message}`);
        }
      } else {
        console.log(`✗ mobile-${pg}: ${e.message}`);
      }
    }
  }

  // Sidebar/hamburger
  try {
    await mp.goto(`${BASE}/dashboard`, { waitUntil: 'load', timeout: 30000 });
    await mp.waitForTimeout(2000);
    // Try common hamburger selectors
    const hamburger = await mp.$('button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger, [data-testid="menu"], button:has(svg):first-of-type, nav button, header button');
    if (hamburger) {
      await hamburger.click();
      await mp.waitForTimeout(1000);
      await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-sidebar.png`, fullPage: true });
      console.log('✓ mobile-sidebar');
    } else {
      console.log('⚠ No hamburger button found');
      // Screenshot anyway
      await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-sidebar-attempt.png`, fullPage: true });
    }
  } catch (e) {
    console.log(`✗ mobile-sidebar: ${e.message}`);
  }

  // Bottom navbar check
  try {
    await mp.goto(`${BASE}/dashboard`, { waitUntil: 'load', timeout: 30000 });
    await mp.waitForTimeout(2000);
    // Viewport screenshot (not full page) to see bottom navbar
    await mp.screenshot({ path: `${SCREENSHOT_DIR}/mobile-viewport-dashboard.png` });
    console.log('✓ mobile-viewport-dashboard (for navbar check)');
    
    // Check if bottom nav exists and its properties
    const navInfo = await mp.evaluate(() => {
      const nav = document.querySelector('nav, [role="navigation"], .bottom-nav, .navbar-bottom, footer nav');
      if (!nav) return { found: false };
      const rect = nav.getBoundingClientRect();
      return { found: true, bottom: rect.bottom, height: rect.height, top: rect.top };
    });
    console.log(`  Bottom nav info: ${JSON.stringify(navInfo)}`);
  } catch (e) {
    console.log(`✗ navbar check: ${e.message}`);
  }

  await mCtx.close();

  // --- TABLET (768x1024) ---
  console.log('\n=== TABLET TESTING (768x1024) ===');
  const tCtx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tp = await tCtx.newPage();

  // Login
  await tp.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 30000 });
  await tp.screenshot({ path: `${SCREENSHOT_DIR}/tablet-login.png`, fullPage: true });
  console.log('✓ tablet-login');

  // Login and go to dashboard
  await tp.fill('input[type="email"], input[name="email"]', 'e2e-mobile@jardin.com');
  await tp.fill('input[type="password"], input[name="password"]', 'Test123!');
  await tp.click('button[type="submit"]');
  await tp.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await tp.waitForTimeout(3000);
  await tp.screenshot({ path: `${SCREENSHOT_DIR}/tablet-dashboard.png`, fullPage: true });
  console.log('✓ tablet-dashboard');

  // Salas
  await tp.goto(`${BASE}/salas`, { waitUntil: 'load', timeout: 30000 });
  await tp.waitForTimeout(2000);
  await tp.screenshot({ path: `${SCREENSHOT_DIR}/tablet-salas.png`, fullPage: true });
  console.log('✓ tablet-salas');

  await tCtx.close();
  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
