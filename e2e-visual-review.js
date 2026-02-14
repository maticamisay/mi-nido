const { chromium } = require('playwright');

const BASE = 'http://minido.38.105.232.177.sslip.io';
const DIR = '/home/mati/projects/mi-nido/e2e-screenshots/final';
const PAGES = ['dashboard','salas','ninos','asistencia','cuaderno','comunicados','pagos','familia','mas'];

async function login(page) {
  await page.goto(BASE + '/login', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('input[name="email"]', 'admin@jardinminido.com');
  await page.fill('input[name="password"]', 'MiNido2024!');
  await page.click('button[type="submit"]');
  // Wait for navigation or timeout
  await page.waitForTimeout(5000);
  console.log('After login URL:', page.url());
}

const CHECK_ISSUES = `
(() => {
  const found = [];
  const body = document.body;
  if (body.scrollWidth > window.innerWidth + 2) {
    found.push('OVERFLOW: scrollWidth=' + body.scrollWidth + ' viewport=' + window.innerWidth);
  }
  if (body.innerText.includes('□')) found.push('BROKEN_ICON: □ found');
  
  document.querySelectorAll('*').forEach(el => {
    try {
      const s = getComputedStyle(el);
      if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 2) {
        const t = el.textContent.trim().substring(0, 40);
        if (t) found.push('TRUNCATED: "' + t + '"');
      }
    } catch(e) {}
  });
  
  document.querySelectorAll('div,section,main,nav,header,aside').forEach(el => {
    try {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 5 && r.width > 10) {
        const cls = (el.className || '').toString().substring(0, 50);
        found.push('OVERFLOW_EL: ' + el.tagName + '.' + cls + ' +' + Math.round(r.right - window.innerWidth) + 'px');
      }
    } catch(e) {}
  });
  
  // Check bottom nav (mobile)
  const fixedBottom = [...document.querySelectorAll('nav, div')].filter(el => {
    try {
      const s = getComputedStyle(el);
      const b = parseInt(s.bottom);
      return (s.position === 'fixed' || s.position === 'sticky') && (isNaN(b) || b <= 10);
    } catch(e) { return false; }
  });
  
  return { issues: found, hasBottomNav: fixedBottom.length > 0 };
})()
`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const allIssues = [];
  
  // DESKTOP
  console.log('=== DESKTOP ===');
  const dCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dPage = await dCtx.newPage();
  
  await dPage.goto(BASE + '/login', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(1500);
  await dPage.screenshot({ path: DIR + '/desktop-login.png', fullPage: true });
  
  await login(dPage);
  
  for (const pg of PAGES) {
    console.log('  desktop-' + pg);
    await dPage.goto(BASE + '/' + pg, { timeout: 20000, waitUntil: 'domcontentloaded' }).catch(() => {});
    await dPage.waitForTimeout(2500);
    await dPage.screenshot({ path: DIR + '/desktop-' + pg + '.png', fullPage: true });
    const result = await dPage.evaluate(CHECK_ISSUES).catch(() => ({ issues: [], hasBottomNav: false }));
    if (result.issues.length > 0) {
      allIssues.push({ viewport: 'desktop', page: pg, issues: result.issues });
    }
  }
  await dCtx.close();
  
  // MOBILE
  console.log('=== MOBILE ===');
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const mPage = await mCtx.newPage();
  
  await mPage.goto(BASE + '/login', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(1500);
  await mPage.screenshot({ path: DIR + '/mobile-login.png', fullPage: true });
  
  await login(mPage);
  
  for (const pg of PAGES) {
    console.log('  mobile-' + pg);
    await mPage.goto(BASE + '/' + pg, { timeout: 20000, waitUntil: 'domcontentloaded' }).catch(() => {});
    await mPage.waitForTimeout(2500);
    await mPage.screenshot({ path: DIR + '/mobile-' + pg + '.png', fullPage: true });
    const result = await mPage.evaluate(CHECK_ISSUES).catch(() => ({ issues: [], hasBottomNav: false }));
    const pgIssues = [...result.issues];
    if (!result.hasBottomNav && pg !== 'login') {
      pgIssues.push('NO_BOTTOM_NAV: Bottom navigation not detected');
    }
    if (pgIssues.length > 0) {
      allIssues.push({ viewport: 'mobile', page: pg, issues: pgIssues });
    }
  }
  await mCtx.close();
  
  // TABLET
  console.log('=== TABLET ===');
  const tCtx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tPage = await tCtx.newPage();
  await login(tPage);
  for (const pg of ['dashboard', 'salas']) {
    console.log('  tablet-' + pg);
    await tPage.goto(BASE + '/' + pg, { timeout: 20000, waitUntil: 'domcontentloaded' }).catch(() => {});
    await tPage.waitForTimeout(2500);
    await tPage.screenshot({ path: DIR + '/tablet-' + pg + '.png', fullPage: true });
    const result = await tPage.evaluate(CHECK_ISSUES).catch(() => ({ issues: [], hasBottomNav: false }));
    if (result.issues.length > 0) {
      allIssues.push({ viewport: 'tablet', page: pg, issues: result.issues });
    }
  }
  await tCtx.close();
  
  await browser.close();
  
  console.log('\n=== ALL ISSUES ===');
  console.log(JSON.stringify(allIssues, null, 2));
})();
