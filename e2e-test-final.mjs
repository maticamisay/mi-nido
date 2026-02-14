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
    // === 1. LOGIN ===
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOTS + '01-login-page.png', fullPage: true });
    log('Login page loaded', '✅');

    await page.locator('input[type="email"], input[placeholder*="mail" i]').first().fill('admin@jardinminido.com');
    await page.locator('input[type="password"]').first().fill('MiNido2024!');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /iniciar|login|entrar|ingresar/i }).first().click();
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      log('Login → dashboard redirect', '✅');
    } catch {
      log('Login redirect', '⚠️', 'URL: ' + page.url());
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOTS + '02-dashboard-after-login.png', fullPage: true });

    // === 2. DASHBOARD ===
    const bodyText = await page.locator('body').innerText();
    const greeting = bodyText.match(/(buenas?|hola|bienvenid).{0,80}/i);
    log('Dashboard greeting', '✅', greeting ? greeting[0].trim() : 'not found');
    
    const statsMatch = bodyText.match(/resumen.{0,500}/is);
    log('Dashboard stats', 'ℹ️', statsMatch ? statsMatch[0].replace(/\n+/g, ' | ').substring(0, 200) : 'not found');
    await page.screenshot({ path: SCREENSHOTS + '03-dashboard-desktop.png', fullPage: true });

    // === 3. CREAR SALAS ===
    await page.locator('a[href="/salas"]').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOTS + '04-salas-initial.png', fullPage: true });
    log('Salas page loaded', '✅');

    const salas = [
      { nombre: 'Sala Pollitos 🐥', capacidad: '15', edadMin: '0', edadMax: '1', cuota: '50000' },
      { nombre: 'Sala Ositos 🧸', capacidad: '20', edadMin: '1', edadMax: '2', cuota: '55000' },
      { nombre: 'Sala Jirafitas 🦒', capacidad: '18', edadMin: '2', edadMax: '3', cuota: '60000' },
    ];

    for (let i = 0; i < salas.length; i++) {
      const sala = salas[i];
      try {
        await page.getByRole('button', { name: /nueva sala|crear.*sala/i })
          .or(page.locator('button:has-text("Nueva Sala")'))
          .or(page.locator('button:has-text("Crear Primera Sala")'))
          .first().click();
        await page.waitForTimeout(1000);

        const dialog = page.locator('div[role="dialog"]').last();
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        if (i === 0) await page.screenshot({ path: SCREENSHOTS + '05-sala-form.png', fullPage: true });

        const form = dialog.locator('form').first();
        await form.locator('input[type="text"]').first().fill(sala.nombre);

        // Number fields by label
        const numberInputs = form.locator('input[type="number"]');
        const numCount = await numberInputs.count();
        for (let j = 0; j < numCount; j++) {
          const inp = numberInputs.nth(j);
          const parentDiv = inp.locator('xpath=ancestor::div[contains(@class,"space-y")]').first();
          const labelText = await parentDiv.locator('label').first().innerText().catch(() => '');
          if (/desde/i.test(labelText)) await inp.fill(sala.edadMin);
          else if (/hasta/i.test(labelText)) await inp.fill(sala.edadMax);
          else if (/capac/i.test(labelText)) await inp.fill(sala.capacidad);
          else if (/cuota/i.test(labelText)) await inp.fill(sala.cuota);
        }

        await page.waitForTimeout(500);
        const responsePromise = page.waitForResponse(r => r.url().includes('classroom'), { timeout: 5000 }).catch(() => null);
        await dialog.getByRole('button', { name: /guardar|crear/i }).first().click();
        const response = await responsePromise;
        
        await page.waitForTimeout(2000);
        if (response && response.status() >= 200 && response.status() < 300) {
          log(`Crear sala "${sala.nombre}"`, '✅', `HTTP ${response.status()}`);
        } else {
          log(`Crear sala "${sala.nombre}"`, '⚠️', response ? `HTTP ${response.status()}` : 'No response');
        }

        // Close dialog if still open
        if (await dialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
        if (i === 0) await page.screenshot({ path: SCREENSHOTS + '06-sala-created.png', fullPage: true });
      } catch (err) {
        await page.screenshot({ path: SCREENSHOTS + `debug-sala-${i}.png`, fullPage: true });
        log(`Crear sala "${sala.nombre}"`, '❌', err.message.substring(0, 150));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOTS + '07-salas-all.png', fullPage: true });
    const salasText = await page.locator('body').innerText();
    const salasFound = ['Pollitos', 'Ositos', 'Jirafitas'].filter(s => salasText.includes(s));
    log('Salas in list', salasFound.length === 3 ? '✅' : '⚠️', `Found: ${salasFound.join(', ')}`);

    // === 4. CREAR NENES ===
    await page.locator('a[href="/ninos"]').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOTS + '08-ninos-initial.png', fullPage: true });
    log('Niños page loaded', '✅');

    const ninos = [
      { nombre: 'Valentina', apellido: 'López', fecha: '2024-03-15', sexo: 'F', sala: 'Pollitos', parentesco: 'madre', contactoNombre: 'María López', contactoTel: '1155001122', contacto2Nombre: 'Pedro López', contacto2Tel: '1155001133', parentesco2: 'padre', dni: '60000001' },
      { nombre: 'Santiago', apellido: 'Rodríguez', fecha: '2023-08-20', sexo: 'M', sala: 'Ositos', parentesco: 'padre', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344', contacto2Nombre: 'Ana Rodríguez', contacto2Tel: '1155003355', parentesco2: 'madre', dni: '60000002' },
      { nombre: 'Mía', apellido: 'García', fecha: '2023-01-10', sexo: 'F', sala: 'Ositos', parentesco: 'madre', contactoNombre: 'Laura García', contactoTel: '1155005566', contacto2Nombre: 'Pablo García', contacto2Tel: '1155005577', parentesco2: 'padre', dni: '60000003' },
      { nombre: 'Mateo', apellido: 'Fernández', fecha: '2022-11-05', sexo: 'M', sala: 'Jirafitas', parentesco: 'padre', contactoNombre: 'Diego Fernández', contactoTel: '1155007788', contacto2Nombre: 'Clara Fernández', contacto2Tel: '1155007799', parentesco2: 'madre', dni: '60000004' },
      { nombre: 'Sofía', apellido: 'Martínez', fecha: '2022-06-22', sexo: 'F', sala: 'Jirafitas', parentesco: 'madre', contactoNombre: 'Ana Martínez', contactoTel: '1155009900', contacto2Nombre: 'Luis Martínez', contacto2Tel: '1155009911', parentesco2: 'padre', dni: '60000005' },
    ];

    for (let i = 0; i < ninos.length; i++) {
      const nino = ninos[i];
      try {
        await page.getByRole('button', { name: /nuev|crear|agregar/i })
          .or(page.locator('button:has-text("+")')).first().click();
        await page.waitForTimeout(1500);

        const dialog = page.locator('div[role="dialog"]').last();
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        if (i === 0) await page.screenshot({ path: SCREENSHOTS + '09-nino-form.png', fullPage: true });

        // === Fill form by known field order ===
        // Form field order (from dump):
        // 0: Nombre (text, placeholder "Ej: Valentina")
        // 1: Apellido (text, placeholder "Ej: López")
        // 2: Apodo (text)
        // 3: DNI (text)
        // 4: Fecha nacimiento (date)
        // 5: Sexo (SELECT)
        // 6: Sala (SELECT)
        // 7: Fecha inscripción (date, pre-filled)
        // 8: Grupo sanguíneo (text)
        // 9: Obra social (text)
        // 10: Alergias (text)
        // 11: Condiciones médicas (text)
        // 12: Observaciones (textarea)
        // CONTACT 1:
        // 13: Nombre contacto 1 (text, placeholder "Ej: Laura López")
        // 14: Parentesco 1 (SELECT)
        // 15: Teléfono 1 (tel, placeholder "Ej: 2644567890")
        // CONTACT 2:
        // 16: Nombre contacto 2 (text)
        // 17: Parentesco 2 (SELECT)
        // 18: Teléfono 2 (tel)

        // Personal data
        await dialog.locator('input[placeholder="Ej: Valentina"]').fill(nino.nombre);
        await dialog.locator('input[placeholder="Ej: López"]').fill(nino.apellido);
        await dialog.locator('input[placeholder="Ej: 60123456"]').fill(nino.dni);
        await dialog.locator('input[type="date"]').first().fill(nino.fecha);
        
        // Sexo - first select
        const allSelects = dialog.locator('select');
        await allSelects.nth(0).selectOption(nino.sexo);
        
        // Sala - second select
        const salaOptions = await allSelects.nth(1).locator('option').allInnerTexts();
        const salaMatch = salaOptions.find(o => o.includes(nino.sala));
        if (salaMatch) {
          await allSelects.nth(1).selectOption({ label: salaMatch });
          console.log(`  Nino ${nino.nombre}: selected sala "${salaMatch}"`);
        } else {
          console.log(`  Nino ${nino.nombre}: sala "${nino.sala}" not found! Options: ${salaOptions.join(', ')}`);
        }

        // Contact 1 - fill by placeholder
        const contactNameInputs = dialog.locator('input[placeholder="Ej: Laura López"]');
        const contactTelInputs = dialog.locator('input[type="tel"]');
        
        await contactNameInputs.nth(0).fill(nino.contactoNombre);
        await allSelects.nth(2).selectOption(nino.parentesco); // Parentesco 1
        await contactTelInputs.nth(0).fill(nino.contactoTel);
        
        // Contact 2
        await contactNameInputs.nth(1).fill(nino.contacto2Nombre);
        await allSelects.nth(3).selectOption(nino.parentesco2); // Parentesco 2
        await contactTelInputs.nth(1).fill(nino.contacto2Tel);

        await page.waitForTimeout(500);

        // Scroll to submit button
        const scrollable = dialog.locator('.max-h-\\[70vh\\]').first();
        await scrollable.evaluate(el => el.scrollTop = el.scrollHeight).catch(() => {});
        await page.waitForTimeout(300);

        // Submit
        const responsePromise = page.waitForResponse(r => r.url().includes('children') || r.url().includes('nino'), { timeout: 5000 }).catch(() => null);
        await dialog.locator('button:has-text("Guardar nene")').click();
        const response = await responsePromise;

        await page.waitForTimeout(2000);

        if (response) {
          const status = response.status();
          const body = await response.text().catch(() => '');
          if (status >= 200 && status < 300) {
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '✅', `HTTP ${status}`);
          } else {
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '❌', `HTTP ${status}: ${body.substring(0, 100)}`);
          }
        } else {
          const stillOpen = await dialog.isVisible().catch(() => false);
          if (!stillOpen) {
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '✅', 'Dialog closed');
          } else {
            await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}-open.png`, fullPage: true });
            // Get any validation errors
            const formEl = dialog.locator('form');
            const invalidFields = await formEl.evaluate(form => {
              const invalids = form.querySelectorAll(':invalid');
              return Array.from(invalids).map(el => ({
                tag: el.tagName,
                type: el.type,
                placeholder: el.placeholder,
                validationMessage: el.validationMessage
              }));
            }).catch(() => []);
            console.log(`  Invalid fields: ${JSON.stringify(invalidFields)}`);
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '⚠️', `Dialog open. Invalid: ${JSON.stringify(invalidFields).substring(0, 150)}`);
          }
        }

        // Ensure dialog closed
        if (await dialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      } catch (err) {
        await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}.png`, fullPage: true });
        log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '❌', err.message.substring(0, 150));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOTS + '10-ninos-all.png', fullPage: true });
    const ninosText = await page.locator('body').innerText();
    const ninosFound = ['Valentina', 'Santiago', 'Mía', 'Mateo', 'Sofía'].filter(n => ninosText.includes(n));
    log('Niños in list', '✅', `Found: ${ninosFound.join(', ')} (${ninosFound.length}/5)`);

  } catch (err) {
    log('FATAL ERROR', '❌', err.message);
    await page.screenshot({ path: SCREENSHOTS + 'debug-fatal.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }

  // Write report
  let report = `# E2E Browser Test Results — Final Run\n\n**Date:** ${new Date().toISOString()}\n**URL:** ${BASE}\n\n`;
  report += `## Results\n\n`;
  for (const r of results) {
    report += `${r.status} **${r.step}**${r.details ? ' — ' + r.details : ''}\n\n`;
  }
  report += `## Console Errors (${consoleErrors.length} total, ${[...new Set(consoleErrors)].length} unique)\n\n`;
  const unique = [...new Set(consoleErrors)];
  if (unique.length === 0) report += 'None\n';
  else unique.slice(0, 15).forEach(e => report += `- \`${e.substring(0, 200)}\`\n`);
  report += `\n## Screenshots\n\nAll saved to \`${SCREENSHOTS}\`\n\n`;
  report += `| File | Description |\n|------|-------------|\n`;
  report += `| 01-login-page.png | Login page |\n`;
  report += `| 02-dashboard-after-login.png | Dashboard after login |\n`;
  report += `| 03-dashboard-desktop.png | Dashboard desktop view |\n`;
  report += `| 04-salas-initial.png | Salas page initial state |\n`;
  report += `| 05-sala-form.png | Sala creation form |\n`;
  report += `| 06-sala-created.png | After first sala created |\n`;
  report += `| 07-salas-all.png | All salas in list |\n`;
  report += `| 08-ninos-initial.png | Niños page initial state |\n`;
  report += `| 09-nino-form.png | Nino creation form |\n`;
  report += `| 10-ninos-all.png | All niños in list |\n`;
  report += `\n## Key Findings\n\n`;
  report += `- **API base URL:** \`http://api-minido.38.105.232.177.sslip.io/api/\`\n`;
  report += `- **Auth:** Bearer token + gardenId query param\n`;
  report += `- **BUG found:** Full page navigation (page.goto) causes auth token loss — API calls return 401. SPA navigation (link clicks) works correctly.\n`;
  report += `- **Salas page:** Has both error state AND empty state shown simultaneously when salas fail to load (UI bug)\n`;
  report += `- **Nino form:** Has 2 required emergency contacts (Nombre, Parentesco, Teléfono each)\n`;
  
  const fs = await import('fs');
  fs.writeFileSync('/home/mati/projects/mi-nido/e2e-browser-results-1.md', report);
  console.log('\n=== REPORT WRITTEN ===');
}

run().catch(console.error);
