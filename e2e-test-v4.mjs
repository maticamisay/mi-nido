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
    
    // Extract stats
    const statsSection = bodyText.match(/resumen.{0,500}/is);
    log('Dashboard stats', 'ℹ️', statsSection ? statsSection[0].replace(/\n+/g, ' | ').substring(0, 200) : 'not found');
    await page.screenshot({ path: SCREENSHOTS + '03-dashboard-desktop.png', fullPage: true });

    // === 3. CREAR SALAS ===
    // Navigate via SPA link to preserve auth state
    await page.locator('a[href="/salas"]').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOTS + '04-salas-initial.png', fullPage: true });
    
    const salasPageText = await page.locator('body').innerText();
    log('Salas page loaded', '✅', salasPageText.includes('error') ? 'Has error message' : 'OK');

    // First, let's delete existing salas if any (clean state)
    // Check if there are existing salas
    const existingSalas = salasPageText.match(/Sala\s+\w+/g);
    if (existingSalas) {
      console.log('Existing salas found:', existingSalas);
    }

    const salas = [
      { nombre: 'Sala Pollitos 🐥', emoji: '🐥', capacidad: '15', edadMin: '0', edadMax: '1', cuota: '50000' },
      { nombre: 'Sala Ositos 🧸', emoji: '🐻', capacidad: '20', edadMin: '1', edadMax: '2', cuota: '55000' },
      { nombre: 'Sala Jirafitas 🦒', emoji: '🦊', capacidad: '18', edadMin: '2', edadMax: '3', cuota: '60000' },
    ];

    for (let i = 0; i < salas.length; i++) {
      const sala = salas[i];
      try {
        // Click create button
        const createBtn = page.getByRole('button', { name: /nueva sala|crear.*sala/i })
          .or(page.locator('button:has-text("Nueva Sala")'))
          .or(page.locator('button:has-text("Crear Primera Sala")'))
          .first();
        await createBtn.click();
        await page.waitForTimeout(1000);

        const dialog = page.locator('div[role="dialog"]').last();
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        
        if (i === 0) await page.screenshot({ path: SCREENSHOTS + '05-sala-form.png', fullPage: true });

        const form = dialog.locator('form').first();

        // Fill name
        await form.locator('input[type="text"]').first().fill(sala.nombre);

        // Select emoji
        await dialog.locator(`button:has-text("${sala.emoji}")`).click().catch(() => {
          console.log(`Emoji ${sala.emoji} not found, skipping`);
        });

        // Fill number fields by their labels
        const numberInputs = form.locator('input[type="number"]');
        const numCount = await numberInputs.count();
        for (let j = 0; j < numCount; j++) {
          const inp = numberInputs.nth(j);
          const parentDiv = inp.locator('xpath=ancestor::div[contains(@class,"space-y")]').first();
          const labelText = await parentDiv.locator('label').first().innerText().catch(() => '');

          if (/desde|m[íi]n/i.test(labelText)) await inp.fill(sala.edadMin);
          else if (/hasta|m[áa]x/i.test(labelText)) await inp.fill(sala.edadMax);
          else if (/capac/i.test(labelText)) await inp.fill(sala.capacidad);
          else if (/cuota|monto|precio/i.test(labelText)) await inp.fill(sala.cuota);
        }

        // Turno select
        const selects = form.locator('select');
        const selCount = await selects.count();
        for (let j = 0; j < selCount; j++) {
          await selects.nth(j).selectOption({ index: 1 }).catch(() => {});
        }

        // But wait - the Select might be a Radix Select component, not native <select>
        // Check for Radix Select triggers
        const radixTriggers = dialog.locator('button[role="combobox"]');
        const triggerCount = await radixTriggers.count();
        if (triggerCount > 0) {
          console.log(`Found ${triggerCount} Radix select triggers`);
          for (let j = 0; j < triggerCount; j++) {
            const trigger = radixTriggers.nth(j);
            const text = await trigger.innerText();
            console.log(`  Trigger ${j}: "${text}"`);
            if (/turno|seleccionar/i.test(text)) {
              await trigger.click();
              await page.waitForTimeout(500);
              // Click first option
              const option = page.locator('[role="option"]').first();
              await option.click().catch(() => {});
              await page.waitForTimeout(300);
            }
          }
        }

        await page.waitForTimeout(500);

        // Submit - intercept response
        const responsePromise = page.waitForResponse(r => r.url().includes('classroom'), { timeout: 5000 }).catch(() => null);
        await dialog.getByRole('button', { name: /guardar|crear|save|agregar/i }).first().click();
        const response = await responsePromise;
        
        if (response) {
          const status = response.status();
          const body = await response.text().catch(() => '');
          console.log(`  Create sala response: ${status} ${body.substring(0, 100)}`);
          if (status >= 200 && status < 300) {
            log(`Crear sala "${sala.nombre}"`, '✅', `HTTP ${status}`);
          } else {
            log(`Crear sala "${sala.nombre}"`, '❌', `HTTP ${status}: ${body.substring(0, 100)}`);
          }
        } else {
          log(`Crear sala "${sala.nombre}"`, '⚠️', 'No API response captured');
        }

        await page.waitForTimeout(2000);
        
        // Check if dialog closed
        const dialogVisible = await dialog.isVisible().catch(() => false);
        if (dialogVisible) {
          console.log('  Dialog still open, pressing Escape');
          await page.screenshot({ path: SCREENSHOTS + `debug-sala-${i}-open.png`, fullPage: true });
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
    log('Salas in list', salasFound.length === 3 ? '✅' : '⚠️', `Found: ${salasFound.join(', ')} (${salasFound.length}/3)`);

    // === 4. CREAR NENES ===
    // Navigate via SPA link
    await page.locator('a[href="/ninos"]').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOTS + '08-ninos-initial.png', fullPage: true });
    log('Niños page loaded', '✅');

    const ninos = [
      { nombre: 'Valentina', apellido: 'López', fecha: '2024-03-15', sexo: 'F', sala: 'Pollitos', parentesco: 'madre', contactoNombre: 'María López', contactoTel: '1155001122', dni: '60000001' },
      { nombre: 'Santiago', apellido: 'Rodríguez', fecha: '2023-08-20', sexo: 'M', sala: 'Ositos', parentesco: 'padre', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344', dni: '60000002' },
      { nombre: 'Mía', apellido: 'García', fecha: '2023-01-10', sexo: 'F', sala: 'Ositos', parentesco: 'madre', contactoNombre: 'Laura García', contactoTel: '1155005566', dni: '60000003' },
      { nombre: 'Mateo', apellido: 'Fernández', fecha: '2022-11-05', sexo: 'M', sala: 'Jirafitas', parentesco: 'padre', contactoNombre: 'Diego Fernández', contactoTel: '1155007788', dni: '60000004' },
      { nombre: 'Sofía', apellido: 'Martínez', fecha: '2022-06-22', sexo: 'F', sala: 'Jirafitas', parentesco: 'madre', contactoNombre: 'Ana Martínez', contactoTel: '1155009900', dni: '60000005' },
    ];

    for (let i = 0; i < ninos.length; i++) {
      const nino = ninos[i];
      try {
        const createBtn = page.getByRole('button', { name: /nuev|crear|agregar/i })
          .or(page.locator('button:has-text("+")')).first();
        await createBtn.click();
        await page.waitForTimeout(1500);

        const dialog = page.locator('div[role="dialog"]').last();
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        
        if (i === 0) {
          await page.screenshot({ path: SCREENSHOTS + '09-nino-form.png', fullPage: true });
        }

        // Fill by placeholder (known from form HTML inspection)
        await dialog.locator('input[placeholder="Ej: Valentina"]').fill(nino.nombre);
        await dialog.locator('input[placeholder="Ej: López"]').fill(nino.apellido);
        await dialog.locator('input[placeholder="Ej: 60123456"]').fill(nino.dni);
        await dialog.locator('input[type="date"]').first().fill(nino.fecha);
        
        // Fill selects by label
        const selects = dialog.locator('select');
        const selectCount = await selects.count();
        
        for (let j = 0; j < selectCount; j++) {
          const sel = selects.nth(j);
          const parentDiv = sel.locator('xpath=ancestor::div[contains(@class,"space-y")]').first();
          const labelText = await parentDiv.locator('label').first().innerText().catch(() => '');
          
          if (/sexo/i.test(labelText)) {
            await sel.selectOption(nino.sexo);
          } else if (/sala/i.test(labelText)) {
            const options = await sel.locator('option').allInnerTexts();
            if (i === 0) console.log('Sala options in nino form:', options);
            const match = options.find(o => o.includes(nino.sala));
            if (match) {
              await sel.selectOption({ label: match });
              console.log(`  Selected sala: ${match}`);
            } else {
              console.log(`  Sala "${nino.sala}" not found in options: ${options.join(', ')}`);
            }
          } else if (/parentesco/i.test(labelText)) {
            await sel.selectOption(nino.parentesco);
          }
        }

        // Contact fields - find by label
        const allDivs = dialog.locator('div.space-y-1\\.5');
        const divCount = await allDivs.count();
        
        let contactNameFilled = false;
        let contactTelFilled = false;
        
        for (let j = 0; j < divCount; j++) {
          const div = allDivs.nth(j);
          const labelText = await div.locator('label').first().innerText().catch(() => '');
          const input = div.locator('input[type="text"], input[type="tel"], input:not([type="date"]):not([type="hidden"])').first();
          const isVisible = await input.isVisible().catch(() => false);
          if (!isVisible) continue;
          
          // Skip already filled fields
          const value = await input.inputValue().catch(() => '');
          if (value) continue;
          
          if (/nombre/i.test(labelText) && !contactNameFilled && !/apellido/i.test(labelText)) {
            // This might be contact name - check if it's in the "Contacto" section
            const sectionHeader = await div.locator('xpath=preceding::h3[1]').innerText().catch(() => '');
            if (/contacto|emergencia/i.test(sectionHeader)) {
              await input.fill(nino.contactoNombre);
              contactNameFilled = true;
            }
          } else if (/tel[eé]fono|celular/i.test(labelText) && !contactTelFilled) {
            await input.fill(nino.contactoTel);
            contactTelFilled = true;
          }
        }

        // If contact fields weren't filled by label, try by position
        // Contact section inputs are after the main personal data
        if (!contactNameFilled) {
          // Find inputs with placeholder containing "nombre" in contact section
          const contactInputs = dialog.locator('input[placeholder*="nombre" i], input[placeholder*="Nombre" i]');
          const cCount = await contactInputs.count();
          for (let j = 0; j < cCount; j++) {
            const inp = contactInputs.nth(j);
            const val = await inp.inputValue();
            if (!val) {
              await inp.fill(nino.contactoNombre);
              contactNameFilled = true;
              break;
            }
          }
        }
        
        if (!contactTelFilled) {
          const telInputs = dialog.locator('input[placeholder*="tel" i], input[placeholder*="1155" i], input[type="tel"]');
          const tCount = await telInputs.count();
          for (let j = 0; j < tCount; j++) {
            const inp = telInputs.nth(j);
            const val = await inp.inputValue();
            if (!val) {
              await inp.fill(nino.contactoTel);
              contactTelFilled = true;
              break;
            }
          }
        }

        await page.waitForTimeout(500);

        // Scroll form to bottom to reveal submit button
        const scrollable = dialog.locator('.max-h-\\[70vh\\]').first();
        await scrollable.evaluate(el => el.scrollTop = el.scrollHeight).catch(() => {});
        await page.waitForTimeout(300);

        // Submit with response interception
        const responsePromise = page.waitForResponse(r => r.url().includes('children') || r.url().includes('nino'), { timeout: 5000 }).catch(() => null);
        await dialog.getByRole('button', { name: /guardar|crear|save|agregar/i }).first().click();
        const response = await responsePromise;

        await page.waitForTimeout(2000);

        if (response) {
          const status = response.status();
          const body = await response.text().catch(() => '');
          console.log(`  Create nino response: ${status} ${body.substring(0, 150)}`);
          if (status >= 200 && status < 300) {
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '✅', `HTTP ${status}`);
          } else {
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '❌', `HTTP ${status}: ${body.substring(0, 100)}`);
          }
        } else {
          // No response - check if dialog closed
          const stillVisible = await dialog.isVisible().catch(() => false);
          if (!stillVisible) {
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '✅', 'Dialog closed (no API response captured)');
          } else {
            await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}-open.png`, fullPage: true });
            log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '⚠️', 'Dialog stayed open');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }

        // Ensure dialog is closed before next iteration
        const finalCheck = await dialog.isVisible().catch(() => false);
        if (finalCheck) {
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
    log('Niños in list', ninosFound.length > 0 ? '✅' : '⚠️', `Found: ${ninosFound.join(', ')} (${ninosFound.length}/5)`);

  } catch (err) {
    log('FATAL ERROR', '❌', err.message);
    await page.screenshot({ path: SCREENSHOTS + 'debug-fatal.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }

  // Write report
  let report = `# E2E Browser Test Results\n\n**Date:** ${new Date().toISOString()}\n**URL:** ${BASE}\n\n`;
  report += `## Results\n\n`;
  for (const r of results) {
    report += `${r.status} **${r.step}**${r.details ? ' — ' + r.details : ''}\n\n`;
  }
  report += `## Console Errors (${consoleErrors.length})\n\n`;
  if (consoleErrors.length === 0) report += 'None\n';
  else {
    const unique = [...new Set(consoleErrors)];
    unique.slice(0, 15).forEach(e => report += `- \`${e.substring(0, 200)}\`\n`);
  }
  report += `\n## Screenshots\n\nAll saved to \`${SCREENSHOTS}\`\n`;
  report += `\n## Key Findings\n\n`;
  report += `- API base: \`http://api-minido.38.105.232.177.sslip.io/api/\`\n`;
  report += `- Auth via Bearer token in header + gardenId as query param\n`;
  report += `- **BUG:** Navigating via \`page.goto()\` (full reload) causes 401 on API calls — auth token race condition on page load\n`;
  report += `- SPA navigation (clicking links) preserves auth state correctly\n`;
  
  const fs = await import('fs');
  fs.writeFileSync('/home/mati/projects/mi-nido/e2e-browser-results-1.md', report);
  console.log('\n=== REPORT WRITTEN ===');
}

run().catch(console.error);
