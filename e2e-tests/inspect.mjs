import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://minido.38.105.232.177.sslip.io/register', { waitUntil: 'networkidle', timeout: 15000 });
const btns = await page.$$eval('button', els => els.map(e => ({ text: e.textContent.trim(), type: e.type, cls: e.className.substring(0,80) })));
console.log('Buttons:', JSON.stringify(btns, null, 2));
const bodyText = await page.textContent('body');
console.log('Body (2000):', bodyText.substring(0, 2000));
await browser.close();
