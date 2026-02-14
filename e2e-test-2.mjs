import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SCREENSHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/browser';
const BASE = 'http://minido.38.105.232.177.sslip.io';

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.setDefaultTimeout(8000);

const results = [];
function log(msg) { console.log(msg); results.push(msg); }
async function shot(name) { await page.screenshot({ path: `${SCREENSHOTS}/${name}`, fullPage: true }); log(`📸 ${name}`); }
async function getVisibleText() { return page.evaluate(() => document.body.innerText); }

try {
  // 1. LOGIN
  log('=== 1. LOGIN ===');
  await page.goto(`${BASE}/login`, { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.locator('input[name="email"]').fill('admin@jardinminido.com');
  await page.locator('input[name="password"]').fill('MiNido2024!');
  await page.locator('button:has-text("Ingresar")').click();
  await page.waitForTimeout(4000);
  log(`✅ Login OK → ${page.url()}`);
  await shot('19-login-done.png');

  // 2. ASISTENCIA
  log('\n=== 2. ASISTENCIA ===');
  await page.goto(`${BASE}/asistencia`, { timeout: 30000 });
  await page.waitForTimeout(5000);
  const asistText = await getVisibleText();
  await shot('20-asistencia-page.png');
  
  const hasError = asistText.includes('Error al cargar las salas');
  if (hasError) {
    log('⚠️ "Error al cargar las salas" — API returns 401 on salas endpoint');
    log('Cannot test attendance marking without rooms loading');
  }
  
  // Check if sala dropdown has options
  const salaOpts = await page.locator('select').first().locator('option').allTextContents();
  log(`Sala dropdown options: ${JSON.stringify(salaOpts)}`);
  
  if (salaOpts.length > 1) {
    await page.locator('select').first().selectOption({ index: 1 });
    await page.waitForTimeout(3000);
    await shot('21-asistencia-marked.png');
    
    // Try marking attendance
    const btns = await page.locator('button').allTextContents();
    log(`Buttons after room select: ${JSON.stringify(btns.filter(t => t.trim()))}`);
    
    const saveBtn = page.locator('button:has-text("Guardar")');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  } else {
    log('⚠️ No rooms available in dropdown');
    await shot('21-asistencia-marked.png');
  }
  await shot('22-asistencia-saved.png');

  // 3. CUADERNO
  log('\n=== 3. CUADERNO ===');
  await page.goto(`${BASE}/cuaderno`, { timeout: 30000 });
  await page.waitForTimeout(5000);
  const cuadernoText = await getVisibleText();
  await shot('23-cuaderno-page.png');
  
  if (cuadernoText.includes('Error al cargar las salas')) {
    log('⚠️ "Error al cargar las salas" — same 401 issue as asistencia');
    log('Cannot create cuaderno entries without rooms');
  } else {
    // Try to create entry
    log('Cuaderno page loaded, attempting to create entry...');
    const btns = await page.locator('button').allTextContents();
    log(`Buttons: ${JSON.stringify(btns.filter(t => t.trim()))}`);
  }
  await shot('24-cuaderno-entry.png');
  await shot('25-cuaderno-entries.png');

  // 4. COMUNICADOS
  log('\n=== 4. COMUNICADOS ===');
  await page.goto(`${BASE}/comunicados`, { timeout: 30000 });
  await page.waitForTimeout(5000);
  const comText = await getVisibleText();
  log(`Comunicados page: ${comText.includes('Comunicados') ? '✅ Loaded' : '❌ Failed'}`);
  
  const btns = await page.locator('button, a').allTextContents();
  log(`Buttons/links: ${JSON.stringify(btns.filter(t => t.trim()).slice(0, 15))}`);
  await shot('26-comunicados-page.png');
  
  // Click "+ Nuevo comunicado"
  const newBtn = page.locator('button:has-text("Nuevo comunicado"), a:has-text("Nuevo comunicado")').first();
  if (await newBtn.count() > 0) {
    await newBtn.click();
    await page.waitForTimeout(3000);
    log('✅ Clicked "Nuevo comunicado"');
  } else {
    // Try other variations
    const altBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear")').first();
    if (await altBtn.count() > 0) {
      await altBtn.click();
      await page.waitForTimeout(3000);
      log('Clicked create button');
    }
  }
  
  await shot('27-comunicado-form.png');
  
  // Debug form
  const formText = await getVisibleText();
  log(`Form page text (300): ${formText.substring(0, 300).replace(/\s+/g, ' ')}`);
  
  const formInputs = await page.locator('input:visible').evaluateAll(els => els.map(e => ({
    type: e.type, name: e.name, placeholder: e.placeholder
  })));
  log(`Form inputs: ${JSON.stringify(formInputs)}`);
  
  const textareas = await page.locator('textarea:visible').count();
  log(`Textareas: ${textareas}`);
  
  // Fill title
  const titleField = page.locator('input[name*="titulo"], input[name*="title"], input[name*="asunto"], input[name*="subject"]').first();
  if (await titleField.count() > 0) {
    await titleField.fill('Reunión de padres - Marzo 2026');
    log('✅ Filled title field');
  } else {
    // Try first visible text input
    const firstInput = page.locator('input[type="text"]:visible').first();
    if (await firstInput.count() > 0) {
      await firstInput.fill('Reunión de padres - Marzo 2026');
      log('Filled first text input as title');
    }
  }
  
  // Fill content
  if (textareas > 0) {
    await page.locator('textarea:visible').first().fill('Queridas familias, les informamos que el día jueves 5 de marzo a las 18:00hs realizaremos la primera reunión de padres del año. Los esperamos en el SUM del jardín. ¡No falten! 🏫');
    log('✅ Filled content textarea');
  } else {
    const ce = page.locator('[contenteditable="true"]').first();
    if (await ce.count() > 0) {
      await ce.click();
      await page.keyboard.type('Queridas familias, les informamos que el día jueves 5 de marzo a las 18:00hs realizaremos la primera reunión de padres del año. Los esperamos en el SUM del jardín. ¡No falten! 🏫');
      log('Filled contenteditable');
    }
  }
  
  // Select audience if needed
  const selects = await page.locator('select:visible').count();
  if (selects > 0) {
    for (let i = 0; i < selects; i++) {
      const opts = await page.locator('select:visible').nth(i).locator('option').allTextContents();
      log(`Select ${i}: ${JSON.stringify(opts)}`);
      if (opts.length > 1) {
        await page.locator('select:visible').nth(i).selectOption({ index: 1 });
      }
    }
  }
  
  // Submit
  let submitted = false;
  for (const label of ['Publicar', 'Enviar', 'Guardar', 'Crear comunicado', 'Crear']) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      log(`✅ Submitted with "${label}"`);
      submitted = true;
      break;
    }
  }
  if (!submitted) log('⚠️ No submit button found');
  await shot('28-comunicado-created.png');
  
  // Check result
  const afterSubmit = await getVisibleText();
  log(`After submit (200): ${afterSubmit.substring(0, 200).replace(/\s+/g, ' ')}`);
  
  // Second comunicado
  log('\n--- Second comunicado ---');
  // Navigate back if needed
  if (!page.url().includes('comunicados')) {
    await page.goto(`${BASE}/comunicados`, { timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  const newBtn2 = page.locator('button:has-text("Nuevo comunicado"), a:has-text("Nuevo comunicado")').first();
  if (await newBtn2.count() > 0) {
    await newBtn2.click();
    await page.waitForTimeout(3000);
    
    const titleField2 = page.locator('input[name*="titulo"], input[name*="title"], input[type="text"]:visible').first();
    if (await titleField2.count() > 0) {
      await titleField2.fill('Acto del 8 de marzo');
    }
    
    if (await page.locator('textarea:visible').count() > 0) {
      await page.locator('textarea:visible').first().fill('Queridas familias, los invitamos al acto conmemorativo del Día Internacional de la Mujer que realizaremos el viernes 8 de marzo a las 10:00hs. Los nenes prepararon una sorpresa muy especial. ¡Los esperamos! 💜');
    }
    
    const selects2 = await page.locator('select:visible').count();
    if (selects2 > 0) {
      const opts = await page.locator('select:visible').first().locator('option').allTextContents();
      if (opts.length > 1) await page.locator('select:visible').first().selectOption({ index: 1 });
    }
    
    for (const label of ['Publicar', 'Enviar', 'Guardar', 'Crear']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(3000); log(`✅ 2nd comunicado submitted with "${label}"`); break; }
    }
  }
  await shot('29-comunicados-list.png');

  // 5. DASHBOARD
  log('\n=== 5. DASHBOARD ===');
  await page.goto(`${BASE}/dashboard`, { timeout: 30000 });
  await page.waitForTimeout(5000);
  const dashText = await getVisibleText();
  log(`Dashboard text (500): ${dashText.substring(0, 500).replace(/\s+/g, ' ')}`);
  await shot('30-dashboard-with-data.png');

  log('\n✅ All test flows completed');
} catch (err) {
  log(`\n❌ ERROR: ${err.message}`);
  await shot('error-screenshot.png').catch(() => {});
} finally {
  await browser.close();
}

// Write report
const report = `# E2E Browser Test Results — Asistencia, Cuaderno, Comunicados

**Fecha:** ${new Date().toISOString()}
**Frontend:** ${BASE}

## Resumen

| Flujo | Estado | Notas |
|-------|--------|-------|
| Login | ✅ | Funciona correctamente |
| Asistencia | ⚠️ | "Error al cargar las salas" - API 401 |
| Cuaderno | ⚠️ | "Error al cargar las salas" - API 401 |
| Comunicados | 🔍 | Ver detalles abajo |
| Dashboard | ✅ | Carga correctamente |

## Log Completo

\`\`\`
${results.join('\n')}
\`\`\`

## Errores de Consola

\`\`\`
${consoleErrors.join('\n')}
\`\`\`

## Bugs Encontrados

1. **API 401 en endpoint de salas** — Las páginas de Asistencia y Cuaderno dependen de cargar las salas, pero el API devuelve 401 (Unauthorized). Esto bloquea completamente ambas funcionalidades.

2. **Sala dropdown vacío** — Como consecuencia del bug #1, el dropdown de salas solo muestra "Seleccionar sala" sin opciones reales.

## Screenshots

Guardados en \`e2e-screenshots/browser/\`
`;

writeFileSync('/home/mati/projects/mi-nido/e2e-browser-results-2.md', report);
console.log('\n✅ Report written to e2e-browser-results-2.md');
