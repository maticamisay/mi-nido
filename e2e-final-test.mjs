import { chromium } from 'playwright';
import { writeFileSync, readdirSync } from 'fs';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const API = 'http://api-minido.38.105.232.177.sslip.io/api';
const SHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/final';
const results = [];
function log(msg) { console.log(msg); results.push(msg); }

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

async function shot(name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  log(`📸 ${name}`);
}

async function go(path) {
  await page.goto(`${BASE}${path}`, { timeout: 30000 });
  await page.waitForTimeout(3000);
}

async function logPageInfo(label) {
  const text = await page.textContent('body').catch(() => '');
  log(`[${label}] URL: ${page.url()}`);
  log(`[${label}] Text(300): ${text?.replace(/\s+/g, ' ').substring(0, 300)}`);
  
  // Log selects
  const selects = await page.$$('select');
  for (let i = 0; i < selects.length; i++) {
    const opts = await selects[i].$$('option');
    const texts = [];
    for (const o of opts) texts.push((await o.textContent())?.trim());
    log(`[${label}] Select ${i}: ${texts.join(' | ')}`);
  }
  
  // Log buttons
  const btns = await page.$$('button');
  const bTexts = [];
  for (const b of btns.slice(0, 15)) {
    const t = (await b.textContent())?.trim().replace(/\s+/g, ' ');
    if (t && t.length < 40) bTexts.push(t);
  }
  log(`[${label}] Buttons: ${bTexts.join(' | ')}`);
  
  // Log textareas
  const tas = await page.$$('textarea');
  log(`[${label}] Textareas: ${tas.length}`);
  
  // Log text inputs
  const inputs = await page.$$('input[type="text"]');
  log(`[${label}] Text inputs: ${inputs.length}`);
}

try {
  // ===== LOGIN =====
  log('=== LOGIN ===');
  await go('/login');
  await shot('01-login');
  
  await page.fill('#email', 'admin@jardinminido.com');
  await page.fill('#password', 'MiNido2024!');
  await shot('02-login-filled');
  
  // Click submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  log(`Post-login: ${page.url()}`);
  await shot('03-post-login');

  // ===== ASISTENCIA =====
  log('\n=== ASISTENCIA ===');
  await go('/asistencia');
  await shot('10-asistencia');
  await logPageInfo('asistencia');
  
  // Try selecting sala
  const selects = await page.$$('select');
  if (selects.length > 0) {
    const opts = await selects[0].$$('option');
    if (opts.length > 1) {
      const val = await opts[1].getAttribute('value');
      await selects[0].selectOption(val);
      await page.waitForTimeout(2000);
      log('Selected sala');
      await logPageInfo('asistencia-post-select');
    }
  }
  
  await shot('11-asistencia-sala');
  
  // Try various attendance UI patterns
  // Check for clickable icons/badges/chips
  const allButtons = await page.$$('button');
  for (const btn of allButtons) {
    const text = (await btn.textContent())?.trim().toLowerCase();
    const ariaLabel = await btn.getAttribute('aria-label');
    if (text?.includes('presente') || text?.includes('ausente') || text?.includes('tarde') ||
        ariaLabel?.includes('presente') || ariaLabel?.includes('ausente')) {
      log(`Found attendance button: "${text}" aria="${ariaLabel}"`);
    }
  }
  
  // Try checkboxes
  const checkboxes = await page.$$('input[type="checkbox"]');
  log(`Checkboxes: ${checkboxes.length}`);
  
  // Try radio buttons
  const radios = await page.$$('input[type="radio"]');
  log(`Radios: ${radios.length}`);
  
  // Look for icons that might be clickable (common pattern: click to toggle status)
  const statusEls = await page.$$('[class*="status"], [class*="attend"], [class*="check"], [role="button"]');
  log(`Status-like elements: ${statusEls.length}`);
  
  // Click what we can
  if (checkboxes.length > 0) {
    const max = Math.min(5, checkboxes.length);
    for (let i = 0; i < max; i++) {
      try { await checkboxes[i].click(); await page.waitForTimeout(200); } catch(e) {}
    }
    log(`Clicked ${max} checkboxes`);
  }
  
  await page.waitForTimeout(1000);
  await shot('12-asistencia-marked');
  
  // Look for save button
  const saveBtnA = await page.$('button:has-text("Guardar")');
  if (saveBtnA) {
    await saveBtnA.click();
    await page.waitForTimeout(2000);
    log('Saved attendance');
    await shot('13-asistencia-saved');
  }

  // ===== CUADERNO =====
  log('\n=== CUADERNO ===');
  await go('/cuaderno');
  await shot('20-cuaderno');
  await logPageInfo('cuaderno');
  
  // New entry
  const newBtn = await page.$('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Agregar"), a:has-text("Nueva"), a:has-text("Crear")');
  if (newBtn) {
    await newBtn.click();
    await page.waitForTimeout(2000);
    log('Clicked new entry');
    await shot('21-cuaderno-form');
    await logPageInfo('cuaderno-form');
  }
  
  // Fill all selects
  const cSelects = await page.$$('select');
  for (const sel of cSelects) {
    const opts = await sel.$$('option');
    if (opts.length > 1) {
      const val = await opts[1].getAttribute('value');
      if (val) try { await sel.selectOption(val); await page.waitForTimeout(1000); } catch(e) {}
    }
  }
  
  // After first select, check for new selects
  await page.waitForTimeout(1000);
  const cSelects2 = await page.$$('select');
  if (cSelects2.length > cSelects.length) {
    for (let i = cSelects.length; i < cSelects2.length; i++) {
      const opts = await cSelects2[i].$$('option');
      if (opts.length > 1) {
        const val = await opts[1].getAttribute('value');
        if (val) try { await cSelects2[i].selectOption(val); } catch(e) {}
      }
    }
  }
  
  // Fill textarea
  const ta = await page.$('textarea');
  if (ta) {
    await ta.fill('Hoy Valentina comió muy bien el almuerzo y durmió la siesta tranquila. Jugó con bloques y pintó con témperas. 🎨');
    log('Filled entry text');
  }
  
  await shot('22-cuaderno-filled');
  
  // Submit
  const submitC = await page.$('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Enviar"), button[type="submit"]');
  if (submitC) {
    await submitC.click();
    await page.waitForTimeout(3000);
    log('Saved entry 1');
    await shot('23-cuaderno-saved');
  }
  
  // Second entry
  log('Creating second cuaderno entry...');
  const newBtn2 = await page.$('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Agregar")');
  if (newBtn2) {
    await newBtn2.click();
    await page.waitForTimeout(2000);
    
    const sels = await page.$$('select');
    for (const sel of sels) {
      const opts = await sel.$$('option');
      const idx = opts.length > 2 ? 2 : (opts.length > 1 ? 1 : 0);
      if (idx > 0) {
        const val = await opts[idx].getAttribute('value');
        if (val) try { await sel.selectOption(val); await page.waitForTimeout(500); } catch(e) {}
      }
    }
    await page.waitForTimeout(1000);
    
    // Re-check for dynamic selects
    const sels2 = await page.$$('select');
    for (const sel of sels2) {
      const opts = await sel.$$('option');
      if (opts.length > 1) {
        const val = await opts[1].getAttribute('value');
        if (val) try { await sel.selectOption(val); } catch(e) {}
      }
    }
    
    const ta2 = await page.$('textarea');
    if (ta2) await ta2.fill('Mateo tuvo un excelente día. Compartió juguetes y aprendió los colores. ¡Bravo Mateo! 🌟');
    
    const sub2 = await page.$('button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]');
    if (sub2) { await sub2.click(); await page.waitForTimeout(2000); log('Saved entry 2'); }
  }
  await shot('24-cuaderno-entries');

  // ===== COMUNICADOS =====
  log('\n=== COMUNICADOS ===');
  await go('/comunicados');
  await shot('30-comunicados');
  await logPageInfo('comunicados');
  
  // Create comunicado 1
  const newCom = await page.$('button:has-text("Nuevo"), button:has-text("Crear"), a:has-text("Nuevo"), a:has-text("Crear")');
  if (newCom) {
    await newCom.click();
    await page.waitForTimeout(2000);
    await shot('31-comunicado-form');
    await logPageInfo('comunicado-form');
  }
  
  // Fill title
  const titleInput = await page.$('input[type="text"]');
  if (titleInput) { await titleInput.fill('Reunión de padres - Marzo 2026'); log('Filled title'); }
  
  // Fill content
  const contentTa = await page.$('textarea');
  if (contentTa) {
    await contentTa.fill('Queridas familias, les informamos que el día jueves 5 de marzo a las 18:00hs realizaremos la primera reunión de padres del año. Los esperamos en el SUM del jardín. ¡No falten! 🏫');
    log('Filled content');
  }
  
  // Scope selector
  const comSels = await page.$$('select');
  for (const sel of comSels) {
    const opts = await sel.$$('option');
    for (const o of opts) {
      const t = ((await o.textContent()) || '').toLowerCase();
      if (t.includes('todo') || t.includes('jardín') || t.includes('general') || t.includes('all')) {
        const v = await o.getAttribute('value');
        if (v) { await sel.selectOption(v); log('Selected scope: all'); break; }
      }
    }
  }
  
  await shot('32-comunicado-filled');
  
  const subCom = await page.$('button:has-text("Publicar"), button:has-text("Enviar"), button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]');
  if (subCom) {
    await subCom.click();
    await page.waitForTimeout(3000);
    log('Created comunicado 1');
    await shot('33-comunicado-created');
  }
  
  // Create comunicado 2
  const newCom2 = await page.$('button:has-text("Nuevo"), button:has-text("Crear"), a:has-text("Nuevo"), a:has-text("Crear")');
  if (newCom2) {
    await newCom2.click();
    await page.waitForTimeout(2000);
    
    const ti2 = await page.$('input[type="text"]');
    if (ti2) await ti2.fill('Acto del 8 de marzo');
    
    const ct2 = await page.$('textarea');
    if (ct2) await ct2.fill('Invitamos a todas las familias al acto por el Día Internacional de la Mujer. Viernes 8 de marzo, 10:00hs. Los nenes prepararán una sorpresa especial. 💜');
    
    const sc2 = await page.$('button:has-text("Publicar"), button:has-text("Enviar"), button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]');
    if (sc2) { await sc2.click(); await page.waitForTimeout(2000); log('Created comunicado 2'); }
  }
  await shot('34-comunicados-list');

  // ===== NAVIGATION =====
  log('\n=== NAVEGACIÓN ===');
  for (const [path, name] of [['/asistencia','40-nav-asistencia'],['/cuaderno','41-nav-cuaderno'],['/comunicados','42-nav-comunicados'],['/dashboard','43-dashboard'],['/','44-home']]) {
    await go(path);
    await shot(name);
    log(`${path} → ${page.url()}`);
  }
  
  log('\n✅ ALL TESTS COMPLETE');

} catch (err) {
  log(`❌ ERROR: ${err.message}`);
  log(err.stack);
  try { await shot('99-error'); } catch(e) {}
} finally {
  await browser.close();
}

const screenshots = readdirSync(SHOTS).filter(f => f.endsWith('.png')).sort();
const report = `# E2E Test Results - Mi Nido (Final)
**Date:** ${new Date().toISOString()}
**Frontend:** ${BASE}
**API:** ${API}

## Test Log

\`\`\`
${results.join('\n')}
\`\`\`

## Screenshots (${screenshots.length})

${screenshots.map(s => `- \`${s}\``).join('\n')}
`;

writeFileSync('/home/mati/projects/mi-nido/e2e-results-final-2.md', report);
log('Report written.');
