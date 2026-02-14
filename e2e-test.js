const { chromium } = require('playwright');
const BASE = 'http://minido.38.105.232.177.sslip.io';
const DIR = '/home/mati/projects/mi-nido/e2e-screenshots/final';

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto(BASE + '/login', { timeout: 30000 });
  console.log('Title:', await p.title());
  await p.screenshot({ path: DIR + '/test-login.png' });
  
  const inputs = await p.locator('input').all();
  console.log('Inputs:', inputs.length);
  for (const inp of inputs) {
    const t = await inp.getAttribute('type');
    const n = await inp.getAttribute('name');
    const ph = await inp.getAttribute('placeholder');
    console.log('  ', t, n, ph);
  }
  
  await b.close();
  console.log('DONE');
})();
