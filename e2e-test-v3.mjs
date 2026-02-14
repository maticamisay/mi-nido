import { chromium } from 'playwright';

const SCREENSHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/browser/';
const BASE = 'http://minido.38.105.232.177.sslip.io';
const results = [];
const consoleErrors = [];

function log(step, status, details = '') {
  results.push({ step, status, details });
  console.log(`${status} ${step}${details ? ' — ' + details : ''}`);
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

  try {
    // === LOGIN ===
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.locator('input[type="email"], input[placeholder*="mail" i]').first().fill('admin@jardinminido.com');
    await page.locator('input[type="password"]').first().fill('MiNido2024!');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /iniciar|login|entrar|ingresar/i }).first().click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    log('Login', '✅');

    // === Go to ninos page - check if salas load in the dropdown ===
    await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Click create button
    await page.getByRole('button', { name: /nuev|crear|agregar/i }).or(page.locator('button:has-text("+")')).first().click();
    await page.waitForTimeout(2000);

    const dialog = page.locator('div[role="dialog"], dialog, [class*="DialogContent"]').last();
    
    // Wait a bit more for sala select to load
    await page.waitForTimeout(3000);
    
    // Check sala select options
    const salaSelect = dialog.locator('select').nth(1); // Second select (after sexo)
    const salaOptions = await salaSelect.locator('option').allInnerTexts();
    console.log('Sala options after wait:', salaOptions);
    
    // Get the full HTML of the sala select area
    const salaParent = salaSelect.locator('xpath=ancestor::div[contains(@class,"space-y")]').first();
    const salaHTML = await salaParent.innerHTML();
    console.log('Sala select HTML:', salaHTML);

    // Check if there are API calls happening
    // Let's also intercept network to see what's being fetched
    const salaSelectAll = await salaSelect.innerHTML();
    console.log('Sala select innerHTML:', salaSelectAll);
    
    // Maybe the salas are loaded but as a different element? Check for any combobox or custom dropdown
    const allSelectLike = await dialog.locator('select, [role="combobox"], [role="listbox"]').count();
    console.log('Select-like elements:', allSelectLike);
    
    // Let's check what the page looks like
    await page.screenshot({ path: SCREENSHOTS + 'debug-sala-select.png', fullPage: true });
    
    // Try scrolling up in the dialog to see the sala field
    await dialog.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(500);
    
    // Get ALL the select HTML
    const allSelects = dialog.locator('select');
    const selCount = await allSelects.count();
    for (let i = 0; i < selCount; i++) {
      const sel = allSelects.nth(i);
      const html = await sel.innerHTML();
      console.log(`Select ${i} options HTML:`, html);
    }
    
    // Maybe need to reload /ninos after creating salas to get fresh data
    // Or maybe salas weren't actually created? Let's check
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    const salasPageText = await page.locator('body').innerText();
    console.log('Salas page content:', salasPageText.substring(0, 500));
    await page.screenshot({ path: SCREENSHOTS + 'debug-salas-check.png', fullPage: true });

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: SCREENSHOTS + 'debug-error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
