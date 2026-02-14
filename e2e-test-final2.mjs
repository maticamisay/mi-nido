import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const API = 'http://api-minido.38.105.232.177.sslip.io/api';
const SHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/final';
const results = [];
const observations = [];

function log(msg, ok = true) {
  const line = `${ok ? '✅' : '❌'} ${msg}`;
  console.log(line);
  results.push(line);
}
function obs(msg) { observations.push(msg); console.log(`📝 ${msg}`); }

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let browser, page, consoleErrors = [];

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  // ========== 1. LOGIN ==========
  console.log('\n=== 1. LOGIN ===');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000);
  await page.screenshot({ path: `${SHOTS}/01-login-page.png`, fullPage: true });
  log('Login page loaded — 01-login-page.png');

  await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill('admin@jardinminido.com');
  await page.locator('input[type="password"]').first().fill('MiNido2024!');
  await page.screenshot({ path: `${SHOTS}/02-login-filled.png` });
  
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }).catch(() => {});
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/03-dashboard.png`, fullPage: true });
  
  const loginOk = !page.url().includes('/login');
  log(`Login ${loginOk ? 'exitoso' : 'falló'} — URL: ${page.url()}`, loginOk);

  // Check dashboard content
  const body = await page.textContent('body');
  const hasDashboard = body.includes('Dashboard') || body.includes('Inicio') || body.includes('Hola') || body.includes('Bienvenid');
  log(`Dashboard contenido visible: ${hasDashboard}`, hasDashboard);

  // ========== 2. DASHBOARD ==========
  console.log('\n=== 2. DASHBOARD ===');
  // Go to dashboard/inicio explicitly
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await sleep(1000);
  await page.screenshot({ path: `${SHOTS}/04-dashboard-desktop.png`, fullPage: true });
  log('Dashboard desktop — 04-dashboard-desktop.png');

  await page.setViewportSize({ width: 375, height: 812 });
  await sleep(1000);
  await page.screenshot({ path: `${SHOTS}/05-dashboard-mobile.png`, fullPage: true });
  log('Dashboard mobile — 05-dashboard-mobile.png');

  // Check broken icons
  const brokenIcons = await page.evaluate(() => {
    const els = document.querySelectorAll('*');
    let count = 0;
    for (const el of els) {
      if (el.children.length === 0 && el.textContent?.includes('□')) count++;
    }
    return count;
  });
  log(`Iconos rotos (□): ${brokenIcons}`, brokenIcons === 0);
  if (brokenIcons > 0) obs('Sidebar y/o sección emoji muestran □ en lugar de iconos lucide');

  await page.setViewportSize({ width: 1280, height: 800 });

  // ========== 3. SALAS ==========
  console.log('\n=== 3. SALAS ===');
  await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/06-salas-initial.png`, fullPage: true });
  log('Salas página — 06-salas-initial.png');

  const salas = [
    { nombre: 'Sala Pollitos 🐥', capacidad: '15', edadDesde: '0', edadHasta: '1', turno: 'Mañana', cuota: '45000' },
    { nombre: 'Sala Ositos 🧸', capacidad: '20', edadDesde: '1', edadHasta: '2', turno: 'Mañana', cuota: '50000' },
    { nombre: 'Sala Jirafitas 🦒', capacidad: '18', edadDesde: '2', edadHasta: '3', turno: 'Tarde', cuota: '48000' },
  ];

  for (let i = 0; i < salas.length; i++) {
    const s = salas[i];
    console.log(`\nCreating sala: ${s.nombre}`);

    // Click "+ Nueva Sala" button
    await page.locator('button:has-text("Nueva Sala")').click({ timeout: 5000 });
    await sleep(2000);

    // The dialog is open. Fill fields within the dialog.
    const dialog = page.locator('[role="dialog"]');
    
    // Name field - placeholder "Ej: Sala Pollitos"
    await dialog.locator('input[placeholder*="Sala Pollitos"], input[type="text"]').first().fill(s.nombre);

    // Turno select
    const turnoSelect = dialog.locator('select').first();
    await turnoSelect.selectOption({ label: s.turno }).catch(() => turnoSelect.selectOption(s.turno.toLowerCase()));

    // Number fields: Edad desde, Edad hasta, Capacidad, Cuota mensual, Vence el día, Recargo
    const numberInputs = await dialog.locator('input[type="number"]').all();
    console.log(`  Found ${numberInputs.length} number inputs`);
    // Order from screenshot: edad desde, edad hasta, capacidad, cuota, vence el dia, recargo
    if (numberInputs.length >= 4) {
      await numberInputs[0].fill(s.edadDesde);  // Edad desde
      await numberInputs[1].fill(s.edadHasta);  // Edad hasta
      await numberInputs[2].fill(s.capacidad);  // Capacidad
      await numberInputs[3].fill(s.cuota);       // Cuota mensual
      if (numberInputs.length >= 5) await numberInputs[4].fill('10');  // Vence el día
      if (numberInputs.length >= 6) await numberInputs[5].fill('10');  // Recargo
    }

    await page.screenshot({ path: `${SHOTS}/07-sala-form-${i}.png`, fullPage: true });

    // Scroll dialog down and find submit button
    await dialog.locator('button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]').first().scrollIntoViewIfNeeded();
    await sleep(500);
    await dialog.locator('button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]').first().click({ timeout: 5000, force: true });
    await sleep(3000);

    const pageText = await page.textContent('body');
    const created = !await dialog.isVisible().catch(() => false);
    log(`Sala "${s.nombre}" — ${created ? 'creada' : 'dialog aún visible'}`, created);
  }

  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/09-salas-all.png`, fullPage: true });
  log('Todas las salas — 09-salas-all.png');

  // ========== 4. NIÑOS ==========
  console.log('\n=== 4. NIÑOS ===');
  await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/10-ninos-initial.png`, fullPage: true });
  log('Niños página — 10-ninos-initial.png');

  // First, let's see what the form looks like
  const newNinoBtn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Nene"), a:has-text("Nuevo"), a:has-text("Agregar")').first();
  await newNinoBtn.click({ timeout: 5000 });
  await sleep(2000);
  
  // Screenshot and inspect form
  await page.screenshot({ path: `${SHOTS}/11-nino-form-inspect.png`, fullPage: true });
  
  // Log all form fields
  const ninoDialog = page.locator('[role="dialog"]');
  const dialogVisible = await ninoDialog.isVisible().catch(() => false);
  
  let formContainer = dialogVisible ? ninoDialog : page;
  
  const allFields = await formContainer.locator('input, select, textarea').all();
  console.log(`\nNiño form has ${allFields.length} fields:`);
  for (const f of allFields) {
    const info = await f.evaluate(el => ({
      tag: el.tagName, type: el.type, name: el.name, id: el.id,
      placeholder: el.placeholder, label: el.getAttribute('aria-label'),
    }));
    console.log(`  ${info.tag} type=${info.type} name=${info.name} id=${info.id} ph="${info.placeholder}"`);
  }
  
  // Close dialog if open, we'll create each child
  if (dialogVisible) {
    await page.keyboard.press('Escape');
    await sleep(1000);
  }

  const ninos = [
    { nombre: 'Valentina', apellido: 'López', nacimiento: '2024-03-15', sala: 'Pollitos', contactoNombre: 'María López', contactoTel: '1155001122', contactoRel: 'Madre', dni: '60111222' },
    { nombre: 'Santiago', apellido: 'Rodríguez', nacimiento: '2023-08-20', sala: 'Ositos', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344', contactoRel: 'Padre', dni: '59222333' },
    { nombre: 'Mía', apellido: 'García', nacimiento: '2023-01-10', sala: 'Ositos', contactoNombre: 'Laura García', contactoTel: '1155005566', contactoRel: 'Madre', dni: '58333444' },
    { nombre: 'Mateo', apellido: 'Fernández', nacimiento: '2022-11-05', sala: 'Jirafitas', contactoNombre: 'Diego Fernández', contactoTel: '1155007788', contactoRel: 'Padre', dni: '57444555' },
    { nombre: 'Sofía', apellido: 'Martínez', nacimiento: '2022-06-22', sala: 'Jirafitas', contactoNombre: 'Ana Martínez', contactoTel: '1155009900', contactoRel: 'Madre', dni: '56555666' },
  ];

  for (let i = 0; i < ninos.length; i++) {
    const n = ninos[i];
    console.log(`\nCreating niño ${i+1}: ${n.nombre} ${n.apellido}`);

    // Click new button
    const btn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Nene")').first();
    await btn.click({ timeout: 5000 });
    await sleep(2000);

    const dlg = page.locator('[role="dialog"]');
    const isDlg = await dlg.isVisible().catch(() => false);
    const form = isDlg ? dlg : page;

    // Try to fill by placeholder/label patterns
    async function fillField(labelText, value) {
      // Try label-based approach
      try {
        const label = form.locator(`label:has-text("${labelText}")`);
        if (await label.isVisible({ timeout: 500 })) {
          const forAttr = await label.getAttribute('for');
          if (forAttr) {
            await page.locator(`#${forAttr}`).fill(value);
            return true;
          }
          // Try next sibling input
          const input = label.locator('~ input, ~ div input, + input, + div input').first();
          if (await input.isVisible({ timeout: 500 })) {
            await input.fill(value);
            return true;
          }
        }
      } catch(e) {}
      return false;
    }

    async function fillByPh(phText, value) {
      try {
        const input = form.locator(`input[placeholder*="${phText}"]`).first();
        if (await input.isVisible({ timeout: 500 })) {
          await input.fill(value);
          return true;
        }
      } catch(e) {}
      return false;
    }

    // Fill name fields
    await fillByPh('ombre', n.nombre).catch(() => {});
    await fillByPh('pellido', n.apellido).catch(() => {});
    await fillByPh('DNI', n.dni).catch(() => {});
    await fillByPh('documento', n.dni).catch(() => {});
    
    // Date field
    const dateInput = form.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dateInput.fill(n.nacimiento);
    }

    // Sala select - try to match by partial text
    const selects = await form.locator('select').all();
    for (const sel of selects) {
      const options = await sel.locator('option').allTextContents();
      const salaOption = options.find(o => o.includes(n.sala));
      if (salaOption) {
        await sel.selectOption({ label: salaOption });
        break;
      }
    }

    // Contact fields
    await fillByPh('ontacto', n.contactoNombre).catch(() => {});
    await fillByPh('adre', n.contactoNombre).catch(() => {});
    await fillByPh('eléfono', n.contactoTel).catch(() => {});
    await fillByPh('elular', n.contactoTel).catch(() => {});
    
    // Fill all visible text inputs that are empty, with reasonable data
    const textInputs = await form.locator('input[type="text"]').all();
    for (const inp of textInputs) {
      const val = await inp.inputValue();
      if (!val) {
        const ph = await inp.getAttribute('placeholder') || '';
        if (ph.toLowerCase().includes('direcc') || ph.toLowerCase().includes('domic')) {
          await inp.fill(`Av. San Martín ${100 + i * 100}, CABA`);
        } else if (ph.toLowerCase().includes('obra') || ph.toLowerCase().includes('salud')) {
          await inp.fill('OSDE 310');
        } else if (ph.toLowerCase().includes('alerg')) {
          await inp.fill('Ninguna');
        }
      }
    }

    await page.screenshot({ path: `${SHOTS}/12-nino-filled-${i}.png`, fullPage: true });

    // Submit
    const submitBtn = form.locator('button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]').first();
    try {
      await submitBtn.scrollIntoViewIfNeeded();
      await sleep(300);
      await submitBtn.click({ force: true, timeout: 5000 });
      await sleep(3000);
      log(`Niño "${n.nombre} ${n.apellido}" — formulario enviado`);
    } catch(e) {
      log(`Niño "${n.nombre} ${n.apellido}" — error: ${e.message.slice(0, 100)}`, false);
    }

    // Close dialog if still open
    const stillOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    if (stillOpen) {
      await page.keyboard.press('Escape');
      await sleep(1000);
    }
  }

  await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/13-ninos-all.png`, fullPage: true });
  log('Todos los niños — 13-ninos-all.png');

} catch(e) {
  log(`ERROR GENERAL: ${e.message}`, false);
  console.error(e.stack);
  if (page) await page.screenshot({ path: `${SHOTS}/error.png`, fullPage: true }).catch(() => {});
} finally {
  if (browser) await browser.close();
}

// Write report
const report = `# E2E Test Results — Mi Nido
**Fecha:** ${new Date().toISOString()}  
**Frontend:** ${BASE}  
**API:** ${API}

## Resultados

${results.join('\n')}

## Observaciones
${observations.length ? observations.map(o => `- ${o}`).join('\n') : '- Ninguna'}

## Errores de Consola
${consoleErrors.length ? consoleErrors.map(e => `- \`${e}\``).join('\n') : '- Ninguno'}

## Screenshots
Directorio: \`${SHOTS}/\`
`;

writeFileSync('/home/mati/projects/mi-nido/e2e-results-final-1.md', report);
console.log('\n✅ Report written');
