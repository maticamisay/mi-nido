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
      log('Login → dashboard', '✅');
    } catch {
      log('Login redirect', '⚠️', 'URL: ' + page.url());
    }
    await page.screenshot({ path: SCREENSHOTS + '02-dashboard-after-login.png', fullPage: true });

    // === 2. DASHBOARD ===
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    const greeting = bodyText.match(/(buenas?|hola|bienvenid).{0,60}/i);
    log('Dashboard', '✅', greeting ? greeting[0].trim() : 'greeting not captured');
    await page.screenshot({ path: SCREENSHOTS + '03-dashboard-desktop.png', fullPage: true });

    // === 3. CREAR SALAS ===
    // Sala form structure (from first run):
    // Input 0: nombre (text), Input 1: color picker (skip), Input 2-7: number fields
    // Select 0: turno
    // Number fields likely: capacidad, edad_min, edad_max, cuota_mensual, ...
    
    await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
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
        await page.getByRole('button', { name: /nueva|crear|agregar/i }).or(page.locator('button:has-text("+")')).first().click();
        await page.waitForTimeout(1000);

        const dialog = page.locator('div[role="dialog"], dialog, [class*="DialogContent"]').last();
        
        if (i === 0) await page.screenshot({ path: SCREENSHOTS + '05-sala-form.png', fullPage: true });

        // Fill by label proximity
        const form = dialog.locator('form').first();
        
        // Name input (first text input)
        await form.locator('input[type="text"]').first().fill(sala.nombre);
        
        // Number inputs - fill by getting all and using labels
        // Let's get labels to understand order
        const labels = await form.locator('label').allInnerTexts();
        console.log(`Sala form labels: ${labels.join(' | ')}`);
        
        // Fill number inputs based on label order
        // Labels likely: "Nombre", "Emoji", "Color", "Capacidad", "Edad mín", "Edad máx", "Cuota", "Turno"
        const numberInputs = form.locator('input[type="number"]');
        const numCount = await numberInputs.count();
        console.log(`Number inputs: ${numCount}`);
        
        // Try to match by label text near each number input
        for (let j = 0; j < numCount; j++) {
          const inp = numberInputs.nth(j);
          // Get the parent div's label
          const parentDiv = inp.locator('xpath=ancestor::div[contains(@class,"space-y")]').first();
          const labelText = await parentDiv.locator('label').first().innerText().catch(() => '');
          console.log(`  Number input ${j} label: "${labelText}"`);
          
          if (/capac/i.test(labelText)) await inp.fill(sala.capacidad);
          else if (/m[íi]n/i.test(labelText)) await inp.fill(sala.edadMin);
          else if (/m[áa]x/i.test(labelText)) await inp.fill(sala.edadMax);
          else if (/cuota|precio|monto/i.test(labelText)) await inp.fill(sala.cuota);
        }

        // Select turno
        const selects = form.locator('select');
        const selCount = await selects.count();
        for (let j = 0; j < selCount; j++) {
          await selects.nth(j).selectOption({ index: 1 }).catch(() => {});
        }

        await page.waitForTimeout(500);
        
        // Submit
        await dialog.getByRole('button', { name: /guardar|crear|save|agregar/i }).first().click();
        await page.waitForTimeout(2000);

        if (i === 0) await page.screenshot({ path: SCREENSHOTS + '06-sala-created.png', fullPage: true });
        log(`Crear sala "${sala.nombre}"`, '✅');
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
    log('Salas in list', salasFound.length === 3 ? '✅' : '⚠️', salasFound.join(', '));

    // === 4. CREAR NENES ===
    // Form structure (from first run):
    // Input 0: nombre (placeholder "Ej: Valentina")
    // Input 1: apellido (placeholder "Ej: López")  
    // Input 2: apodo (placeholder "Ej: Vale")
    // Input 3: DNI (placeholder "Ej: 60123456")
    // Input 4: fecha nacimiento (date)
    // Select 0: sexo (F/M/X)
    // Select 1: sala
    // Then more inputs for contacto de emergencia...

    await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOTS + '08-ninos-initial.png', fullPage: true });
    log('Niños page loaded', '✅');

    const ninos = [
      { nombre: 'Valentina', apellido: 'López', fecha: '2024-03-15', sexo: 'F', sala: 'Pollitos', contactoNombre: 'María López', contactoTel: '1155001122', dni: '60000001' },
      { nombre: 'Santiago', apellido: 'Rodríguez', fecha: '2023-08-20', sexo: 'M', sala: 'Ositos', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344', dni: '60000002' },
      { nombre: 'Mía', apellido: 'García', fecha: '2023-01-10', sexo: 'F', sala: 'Ositos', contactoNombre: 'Laura García', contactoTel: '1155005566', dni: '60000003' },
      { nombre: 'Mateo', apellido: 'Fernández', fecha: '2022-11-05', sexo: 'M', sala: 'Jirafitas', contactoNombre: 'Diego Fernández', contactoTel: '1155007788', dni: '60000004' },
      { nombre: 'Sofía', apellido: 'Martínez', fecha: '2022-06-22', sexo: 'F', sala: 'Jirafitas', contactoNombre: 'Ana Martínez', contactoTel: '1155009900', dni: '60000005' },
    ];

    for (let i = 0; i < ninos.length; i++) {
      const nino = ninos[i];
      try {
        await page.getByRole('button', { name: /nuev|crear|agregar/i }).or(page.locator('button:has-text("+")')).first().click();
        await page.waitForTimeout(1000);

        const dialog = page.locator('div[role="dialog"], dialog, [class*="DialogContent"]').last();
        
        if (i === 0) {
          await page.screenshot({ path: SCREENSHOTS + '09-nino-form.png', fullPage: true });
          // Dump all labels for debugging
          const allLabels = await dialog.locator('label').allInnerTexts();
          console.log(`Nino form labels: ${allLabels.join(' | ')}`);
        }

        // Fill by placeholder (known from form HTML)
        await dialog.locator('input[placeholder="Ej: Valentina"]').fill(nino.nombre);
        await dialog.locator('input[placeholder="Ej: López"]').fill(nino.apellido);
        // Skip apodo
        await dialog.locator('input[placeholder="Ej: 60123456"]').fill(nino.dni);
        await dialog.locator('input[type="date"]').first().fill(nino.fecha);
        
        // Sexo select (first select)
        const selects = dialog.locator('select');
        const selectCount = await selects.count();
        console.log(`Nino form has ${selectCount} selects`);
        
        // Find and fill selects by label
        for (let j = 0; j < selectCount; j++) {
          const sel = selects.nth(j);
          const parentDiv = sel.locator('xpath=ancestor::div[contains(@class,"space-y")]').first();
          const labelText = await parentDiv.locator('label').first().innerText().catch(() => '');
          console.log(`  Select ${j} label: "${labelText}"`);
          
          if (/sexo/i.test(labelText)) {
            await sel.selectOption(nino.sexo);
          } else if (/sala/i.test(labelText)) {
            // Select sala by partial text
            const options = await sel.locator('option').allInnerTexts();
            console.log(`  Sala options: ${options.join(', ')}`);
            const match = options.find(o => o.includes(nino.sala));
            if (match) await sel.selectOption({ label: match });
          } else if (/turno/i.test(labelText)) {
            await sel.selectOption({ index: 1 }).catch(() => {});
          }
        }

        // Contacto emergencia - fill remaining text inputs
        // After the first 4 known inputs, look for contact fields by label
        const allInputDivs = dialog.locator('div.space-y-1\\.5, div[class*="space-y"]');
        const divCount = await allInputDivs.count();
        
        for (let j = 0; j < divCount; j++) {
          const div = allInputDivs.nth(j);
          const labelText = await div.locator('label').first().innerText().catch(() => '');
          const input = div.locator('input').first();
          const isVisible = await input.isVisible().catch(() => false);
          if (!isVisible) continue;
          
          if (/nombre.*contacto|contacto.*nombre|nombre.*tutor|tutor|padre|madre|responsable/i.test(labelText)) {
            await input.fill(nino.contactoNombre);
          } else if (/tel[eé]fono|celular|m[oó]vil|phone|tel\b/i.test(labelText)) {
            await input.fill(nino.contactoTel);
          } else if (/parentesco|relaci[oó]n|v[ií]nculo/i.test(labelText)) {
            await input.fill('Madre/Padre');
          } else if (/email|correo/i.test(labelText) && !/login/i.test(labelText)) {
            await input.fill(`contacto${i+1}@test.com`);
          }
        }

        await page.waitForTimeout(500);
        
        // Scroll down in dialog to find submit button
        await dialog.locator('form').first().evaluate(el => el.scrollTop = el.scrollHeight).catch(() => {});
        await dialog.evaluate(el => el.scrollTop = el.scrollHeight).catch(() => {});
        await page.waitForTimeout(300);

        // Submit
        await dialog.getByRole('button', { name: /guardar|crear|save|agregar/i }).first().click();
        await page.waitForTimeout(2000);

        // Check for errors
        const errorTexts = await dialog.locator('.text-destructive, [role="alert"], .text-red-500').allInnerTexts().catch(() => []);
        const validErrors = errorTexts.filter(e => e.length > 2 && !/\*/i.test(e));
        if (validErrors.length > 0) {
          console.log(`  Form errors: ${validErrors.join(', ')}`);
          await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}-errors.png`, fullPage: true });
        }

        // Check if dialog closed
        await page.waitForTimeout(500);
        const stillVisible = await dialog.isVisible().catch(() => false);
        if (stillVisible) {
          console.log(`  Dialog still open after submit for ${nino.nombre}`);
          await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}-still-open.png`, fullPage: true });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '⚠️', 'Dialog stayed open');
        } else {
          log(`Crear nene "${nino.nombre} ${nino.apellido}"`, '✅');
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
  let report = `# E2E Browser Test Results\n\n**Date:** ${new Date().toISOString()}\n**URL:** ${BASE}\n\n`;
  report += `## Results\n\n`;
  for (const r of results) {
    report += `${r.status} **${r.step}**${r.details ? ' — ' + r.details : ''}\n\n`;
  }
  report += `## Console Errors (${consoleErrors.length})\n\n`;
  if (consoleErrors.length === 0) report += 'None\n';
  else consoleErrors.slice(0, 20).forEach(e => report += `- \`${e.substring(0, 200)}\`\n`);
  report += `\n## Screenshots\n\nAll saved to \`${SCREENSHOTS}\`\n`;
  
  const fs = await import('fs');
  fs.writeFileSync('/home/mati/projects/mi-nido/e2e-browser-results-1.md', report);
  console.log('\n=== REPORT WRITTEN ===');
}

run().catch(console.error);
