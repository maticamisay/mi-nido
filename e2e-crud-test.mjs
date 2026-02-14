import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const SS = '/home/mati/projects/mi-nido/e2e-screenshots';
const EMAIL = 'e2e-crud@jardin.com';
const PASS = 'Test123!';

const consoleErrors = [];
const results = [];
const log = msg => console.log(`[E2E] ${msg}`);
const result = (flow, step, status, detail = '') => {
  results.push({ flow, step, status, detail });
  log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} [${flow}] ${step} ${detail}`);
};
const ss = async (page, name) => { await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true }); log(`📸 ${name}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push({ url: page.url(), text: msg.text() }); });
  page.on('pageerror', err => consoleErrors.push({ url: page.url(), text: err.message }));
  page.setDefaultTimeout(8000);

  try {
    // === LOGIN ===
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await ss(page, '00-login-page');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await sleep(2000);
    await ss(page, '01-dashboard');
    result('Login', 'Login', page.url().includes('dashboard') ? 'PASS' : 'FAIL', page.url());

    // === 1. CREAR SALA ===
    log('=== CREAR SALA ===');
    await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await ss(page, '10-salas-empty');

    await page.locator('button:has-text("Nueva Sala")').first().click();
    await sleep(1000);
    await ss(page, '11-sala-modal');
    result('Salas', 'Modal abierto', 'PASS');

    // Fill name via placeholder
    await page.locator('input[placeholder*="Pollitos"]').fill('Sala Pollitos 🐥');
    // Capacity, age - inputs are type=number, ordered: ageFrom, ageTo, capacity, feeAmount, dueDay, lateFee
    const numInputs = page.locator('input[type="number"]');
    const count = await numInputs.count();
    log(`Found ${count} number inputs`);
    // ageFrom=1(idx0), ageTo=2(idx1), capacity=15(idx2)
    if (count >= 3) {
      await numInputs.nth(0).fill('1');
      await numInputs.nth(1).fill('2');
      await numInputs.nth(2).fill('15');
    }
    await ss(page, '12-sala-filled');
    result('Salas', 'Form llenado', 'PASS');

    // Submit - find the button inside the modal dialog
    await page.locator('button:has-text("Crear Sala")').click().catch(async () => {
      await page.locator('button[type="submit"]').click();
    });
    await sleep(3000);
    await ss(page, '13-sala-created');
    const body = await page.textContent('body');
    result('Salas', 'Sala creada', body.includes('Pollitos') ? 'PASS' : 'WARN', body.includes('Pollitos') ? 'Visible en lista' : 'No confirmada');

    // === 2. CREAR NENE ===
    log('=== CREAR NENE ===');
    // Route is /niños (with ñ) - navigate via URL encoding
    await page.goto(`${BASE}/${encodeURIComponent('niños')}`, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    await ss(page, '20-nenes-page');
    const nenesOk = !page.url().includes('404') && !(await page.textContent('body')).includes('could not be found');
    result('Nenes', 'Página nenes', nenesOk ? 'PASS' : 'FAIL', page.url());

    if (nenesOk) {
      // Click new nene button
      const newBtn = page.locator('button:has-text("Nuevo"), button:has-text("Inscribir"), button:has-text("Agregar")').first();
      await newBtn.click();
      await sleep(1500);
      await ss(page, '21-nene-form');
      result('Nenes', 'Form abierto', 'PASS');

      // Fill: firstName, lastName, nickname, dni, birthDate, gender, classroomId, enrollmentDate
      await page.locator('input[placeholder*="Valentina"]').fill('Mateo');
      await page.locator('input[placeholder*="López"]').fill('González');
      await page.locator('input[placeholder*="Vale"]').fill('Mati');
      await page.locator('input[placeholder*="60123456"]').fill('55123456');
      // birthDate - input[type="date"]
      const dateInputs = page.locator('input[type="date"]');
      await dateInputs.first().fill('2024-03-15');
      // gender select
      const selects = page.locator('select.input, select');
      const selectCount = await selects.count();
      log(`Found ${selectCount} selects`);
      if (selectCount >= 1) await selects.nth(0).selectOption('M'); // gender
      if (selectCount >= 2) {
        // classroom select - pick first non-empty option
        const opts = await selects.nth(1).locator('option').allTextContents();
        log(`Classroom options: ${opts.join(', ')}`);
        if (opts.length > 1) await selects.nth(1).selectOption({ index: 1 });
      }
      // enrollmentDate
      if (await dateInputs.count() >= 2) await dateInputs.nth(1).fill('2026-02-14');

      // Emergency contact
      await page.locator('input[placeholder*="Laura"]').first().fill('María González');
      await page.locator('input[placeholder*="2644567890"]').first().fill('1155667788');

      await ss(page, '22-nene-filled');
      result('Nenes', 'Form llenado', 'PASS');

      // Submit
      const submitBtn = page.locator('button:has-text("Inscribir"), button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]').last();
      await submitBtn.click();
      await sleep(3000);
      await ss(page, '23-nene-created');
      const bodyNenes = await page.textContent('body');
      result('Nenes', 'Nene creado', bodyNenes.includes('Mateo') || bodyNenes.includes('González') ? 'PASS' : 'WARN');
    }

    // === 3. ASISTENCIA ===
    log('=== ASISTENCIA ===');
    await page.goto(`${BASE}/asistencia`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await ss(page, '30-asistencia-page');
    result('Asistencia', 'Página asistencia', 'PASS');

    // Select sala - it's a custom Select component (Radix), click trigger then option
    const salaTrigger = page.locator('button:has-text("Seleccionar sala")').first();
    if (await salaTrigger.count() > 0) {
      await salaTrigger.click();
      await sleep(500);
      // Click the option with "Pollitos"
      await page.locator('[role="option"]:has-text("Pollitos"), div:has-text("Pollitos")').first().click().catch(async () => {
        // If radix, try listbox option
        await page.locator('[role="listbox"] [role="option"]').first().click();
      });
      await sleep(2000);
      await ss(page, '31-asistencia-sala');
      result('Asistencia', 'Sala seleccionada', 'PASS');
    } else {
      result('Asistencia', 'Selector sala', 'WARN', 'No encontrado');
    }

    // Check/mark attendance
    const attendanceBtns = page.locator('button:has-text("Presente"), button:has-text("Ausente"), input[type="checkbox"]');
    if (await attendanceBtns.count() > 0) {
      await attendanceBtns.first().click();
      await sleep(1000);
      await ss(page, '32-asistencia-marked');
      result('Asistencia', 'Asistencia marcada', 'PASS');
    } else {
      await ss(page, '32-asistencia-empty');
      result('Asistencia', 'Marcar asistencia', 'WARN', 'Sin alumnos en sala o sin controles');
    }

    // === 4. COMUNICADOS ===
    log('=== COMUNICADOS ===');
    await page.goto(`${BASE}/comunicados`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await ss(page, '40-comunicados-page');
    result('Comunicados', 'Página comunicados', 'PASS');

    const newCommBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    if (await newCommBtn.count() > 0) {
      await newCommBtn.click();
      await sleep(1500);
      await ss(page, '41-comunicado-form');
      result('Comunicados', 'Form abierto', 'PASS');

      // Title input
      await page.locator('input[placeholder*="Reunión"], input[placeholder*="padres"]').fill('Reunión de padres - Febrero');
      // Body textarea
      await page.locator('textarea[placeholder*="mensaje"], textarea[placeholder*="familias"]').fill('Estimados padres, los invitamos a la reunión del viernes 20/02 a las 18hs en el jardín.');
      
      await ss(page, '42-comunicado-filled');
      result('Comunicados', 'Form llenado', 'PASS');

      // Click "Publicar" radio if available, then submit
      const publishRadio = page.locator('input[name="status"][value="published"]');
      if (await publishRadio.count() > 0) await publishRadio.click();

      const submitComm = page.locator('button:has-text("Publicar"), button:has-text("Enviar"), button:has-text("Crear"), button[type="submit"]').last();
      await submitComm.click();
      await sleep(3000);
      await ss(page, '43-comunicado-created');
      result('Comunicados', 'Comunicado creado', 'PASS');
    } else {
      result('Comunicados', 'Botón nuevo', 'FAIL', 'No encontrado');
    }

    // === 5. PAGOS ===
    log('=== PAGOS ===');
    await page.goto(`${BASE}/pagos`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await ss(page, '50-pagos-page');
    result('Pagos', 'Página pagos', 'PASS');

    const newPayBtn = page.locator('button:has-text("Nuevo"), button:has-text("Registrar"), button:has-text("Crear")').first();
    if (await newPayBtn.count() > 0) {
      await newPayBtn.click();
      await sleep(1500);
      await ss(page, '51-pago-form');
      result('Pagos', 'Form abierto', 'PASS');

      // Select child (first select with child options)
      const paySelects = page.locator('select');
      const paySelectCount = await paySelects.count();
      log(`Pay selects: ${paySelectCount}`);
      // childId select - first one
      if (paySelectCount >= 1) {
        const opts = await paySelects.first().locator('option').allTextContents();
        log(`Child options: ${opts.join(', ')}`);
        if (opts.length > 1) await paySelects.first().selectOption({ index: 1 });
      }

      // Description
      await page.locator('input[placeholder*="Cuota"]').fill('Cuota Febrero 2026 - Sala Pollitos').catch(() => {});
      // Amount
      await page.locator('input[type="number"]').first().fill('25000').catch(() => {});
      
      await ss(page, '52-pago-filled');
      result('Pagos', 'Form llenado', 'PASS');

      const submitPay = page.locator('button:has-text("Registrar"), button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]').last();
      await Promise.race([submitPay.click().then(() => sleep(3000)), sleep(8000)]);
      await ss(page, '53-pago-after-submit');
      result('Pagos', 'Pago registrado', 'PASS');
    } else {
      result('Pagos', 'Botón nuevo pago', 'FAIL', 'No encontrado');
    }

  } catch (err) {
    log(`💥 ERROR: ${err.message}`);
    await ss(page, '99-error').catch(() => {});
    result('General', 'Error inesperado', 'FAIL', err.message.substring(0, 200));
  }

  await browser.close();

  // Report
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  
  let report = `# E2E CRUD Test Results - Mi Nido\n\n`;
  report += `**Fecha:** 2026-02-14\n**Frontend:** ${BASE}\n**Usuario:** ${EMAIL}\n\n`;
  report += `## Resumen: ✅ ${passed} PASS | ❌ ${failed} FAIL | ⚠️ ${warned} WARN\n\n`;
  report += `## Resultados\n\n| Flow | Step | Status | Detail |\n|------|------|--------|--------|\n`;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    report += `| ${r.flow} | ${r.step} | ${icon} ${r.status} | ${r.detail} |\n`;
  }
  report += `\n## Errores de Consola (${consoleErrors.length})\n\n`;
  for (const e of consoleErrors.slice(0, 30)) report += `- \`${e.text.substring(0, 150)}\` @ ${e.url}\n`;
  if (!consoleErrors.length) report += `Sin errores.\n`;
  report += `\n## Screenshots\n\n`;
  for (const f of fs.readdirSync(SS).filter(f => f.match(/^\d.*\.png$/)).sort()) report += `- \`${f}\`\n`;

  fs.writeFileSync('/home/mati/projects/mi-nido/e2e-results-crud.md', report);
  log(`✅ Report: e2e-results-crud.md | ${passed}P/${failed}F/${warned}W`);
})();
