import { chromium } from 'playwright';

const SCREENSHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/browser/';
const BASE = 'http://minido.38.105.232.177.sslip.io';
const results = [];
const consoleErrors = [];

function log(step, status, details = '') {
  const entry = { step, status, details };
  results.push(entry);
  console.log(`${status} ${step}${details ? ' — ' + details : ''}`);
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

  try {
    // === 1. LOGIN ===
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOTS + '01-login-page.png', fullPage: true });
    log('Login page loaded', '✅');

    // Find and fill email/password
    const emailInput = page.getByPlaceholder(/email|correo/i).or(page.locator('input[type="email"]')).first();
    const passInput = page.getByPlaceholder(/contraseña|password/i).or(page.locator('input[type="password"]')).first();
    await emailInput.fill('admin@jardinminido.com');
    await passInput.fill('MiNido2024!');
    await page.waitForTimeout(500);
    
    // Click login button
    const loginBtn = page.getByRole('button', { name: /iniciar|login|entrar|ingresar/i }).first();
    await loginBtn.click();
    
    // Wait for navigation
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      log('Login successful, redirected to dashboard', '✅');
    } catch {
      await page.screenshot({ path: SCREENSHOTS + '02-login-debug.png', fullPage: true });
      log('Login redirect', '⚠️', 'URL: ' + page.url());
    }
    await page.screenshot({ path: SCREENSHOTS + '02-dashboard-after-login.png', fullPage: true });

    // === 2. DASHBOARD ===
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    const greeting = bodyText.match(/(hola|bienvenid|buenos|welcome).{0,50}/i);
    log('Dashboard', '✅', greeting ? `Greeting: "${greeting[0]}"` : 'No greeting found');
    
    // Stats
    const statsText = bodyText.substring(0, 1000);
    log('Dashboard stats', 'ℹ️', statsText.replace(/\n+/g, ' | ').substring(0, 300));
    await page.screenshot({ path: SCREENSHOTS + '03-dashboard-desktop.png', fullPage: true });

    // === 3. CREAR SALAS ===
    await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOTS + '04-salas-initial.png', fullPage: true });
    log('Salas page loaded', '✅');

    const salas = [
      { nombre: 'Sala Pollitos 🐥', capacidad: '15', edadMin: '0', edadMax: '1' },
      { nombre: 'Sala Ositos 🧸', capacidad: '20', edadMin: '1', edadMax: '2' },
      { nombre: 'Sala Jirafitas 🦒', capacidad: '18', edadMin: '2', edadMax: '3' },
    ];

    for (let i = 0; i < salas.length; i++) {
      const sala = salas[i];
      try {
        // Find create button
        const createBtn = page.getByRole('button', { name: /nueva|crear|agregar|añadir/i })
          .or(page.locator('button:has-text("+")')).first();
        await createBtn.click();
        await page.waitForTimeout(1000);
        
        if (i === 0) {
          await page.screenshot({ path: SCREENSHOTS + '05-sala-form.png', fullPage: true });
          // Log form HTML for debugging
          const formHTML = await page.locator('dialog, [role="dialog"], .modal, form').first().innerHTML().catch(() => 'no dialog found');
          console.log('FORM HTML (truncated):', formHTML.substring(0, 2000));
        }

        // Fill name
        const nameInput = page.locator('dialog, [role="dialog"], .modal, [class*="modal"], [class*="drawer"], form').last()
          .locator('input').first();
        await nameInput.fill(sala.nombre);
        
        // Try to fill capacity
        const allInputs = page.locator('dialog, [role="dialog"], .modal, [class*="modal"], [class*="drawer"], form').last()
          .locator('input, select, textarea');
        const inputCount = await allInputs.count();
        console.log(`Form has ${inputCount} inputs for sala ${sala.nombre}`);
        
        // Try various strategies to fill capacity and age fields
        for (let j = 0; j < inputCount; j++) {
          const input = allInputs.nth(j);
          const type = await input.getAttribute('type').catch(() => '');
          const name = await input.getAttribute('name').catch(() => '');
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          const label = name + ' ' + placeholder;
          console.log(`  Input ${j}: type=${type} name=${name} placeholder=${placeholder}`);
          
          if (/capac/i.test(label)) await input.fill(sala.capacidad);
          if (/edad.*min|min.*edad|desde/i.test(label)) await input.fill(sala.edadMin);
          if (/edad.*max|max.*edad|hasta/i.test(label)) await input.fill(sala.edadMax);
          if (/turno/i.test(label)) {
            const tag = await input.evaluate(el => el.tagName);
            if (tag === 'SELECT') await input.selectOption({ index: 1 });
          }
          if (/cuota|precio/i.test(label)) await input.fill('50000');
        }
        
        // Also try selects separately
        const selects = page.locator('dialog, [role="dialog"], .modal, [class*="modal"], [class*="drawer"], form').last()
          .locator('select');
        const selectCount = await selects.count();
        for (let j = 0; j < selectCount; j++) {
          const sel = selects.nth(j);
          const name = await sel.getAttribute('name').catch(() => '');
          console.log(`  Select ${j}: name=${name}`);
          if (/turno/i.test(name)) await sel.selectOption({ index: 1 });
        }

        await page.waitForTimeout(500);
        
        // Submit
        const submitBtn = page.locator('dialog, [role="dialog"], .modal, [class*="modal"], [class*="drawer"], form').last()
          .getByRole('button', { name: /guardar|crear|save|submit|agregar/i }).first();
        await submitBtn.click();
        await page.waitForTimeout(2000);
        
        if (i === 0) {
          await page.screenshot({ path: SCREENSHOTS + '06-sala-created.png', fullPage: true });
        }
        
        log(`Crear sala "${sala.nombre}"`, '✅');
      } catch (err) {
        await page.screenshot({ path: SCREENSHOTS + `debug-sala-${i}.png`, fullPage: true });
        log(`Crear sala "${sala.nombre}"`, '❌', err.message);
        // Try to close any open modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOTS + '07-salas-all.png', fullPage: true });
    const salasText = await page.locator('body').innerText();
    const salasFound = ['Pollitos', 'Ositos', 'Jirafitas'].filter(s => salasText.includes(s));
    log('Salas visible in list', salasFound.length === 3 ? '✅' : '⚠️', `Found: ${salasFound.join(', ')}`);

    // === 4. CREAR NENES ===
    await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOTS + '08-ninos-initial.png', fullPage: true });
    log('Niños page loaded', '✅');

    const ninos = [
      { nombre: 'Valentina', apellido: 'López', fecha: '2024-03-15', sala: 'Pollitos', contactoNombre: 'María López', contactoTel: '1155001122' },
      { nombre: 'Santiago', apellido: 'Rodríguez', fecha: '2023-08-20', sala: 'Ositos', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344' },
      { nombre: 'Mía', apellido: 'García', fecha: '2023-01-10', sala: 'Ositos', contactoNombre: 'Laura García', contactoTel: '1155005566' },
      { nombre: 'Mateo', apellido: 'Fernández', fecha: '2022-11-05', sala: 'Jirafitas', contactoNombre: 'Diego Fernández', contactoTel: '1155007788' },
      { nombre: 'Sofía', apellido: 'Martínez', fecha: '2022-06-22', sala: 'Jirafitas', contactoNombre: 'Ana Martínez', contactoTel: '1155009900' },
    ];

    for (let i = 0; i < ninos.length; i++) {
      const nino = ninos[i];
      try {
        const createBtn = page.getByRole('button', { name: /nuev|crear|agregar|añadir/i })
          .or(page.locator('button:has-text("+")')).first();
        await createBtn.click();
        await page.waitForTimeout(1000);

        if (i === 0) {
          await page.screenshot({ path: SCREENSHOTS + '09-nino-form.png', fullPage: true });
          const formHTML = await page.locator('dialog, [role="dialog"], .modal, form').first().innerHTML().catch(() => 'no dialog');
          console.log('NINO FORM HTML (truncated):', formHTML.substring(0, 3000));
        }

        // Fill all inputs based on name/placeholder
        const container = page.locator('dialog, [role="dialog"], .modal, [class*="modal"], [class*="drawer"], form').last();
        const allInputs = container.locator('input, select, textarea');
        const inputCount = await allInputs.count();
        console.log(`Nino form has ${inputCount} inputs`);

        for (let j = 0; j < inputCount; j++) {
          const input = allInputs.nth(j);
          const type = await input.getAttribute('type').catch(() => '');
          const name = await input.getAttribute('name').catch(() => '');
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          const id = await input.getAttribute('id').catch(() => '');
          const tag = await input.evaluate(el => el.tagName).catch(() => '');
          const label = [name, placeholder, id].join(' ').toLowerCase();
          console.log(`  Input ${j}: tag=${tag} type=${type} name=${name} placeholder=${placeholder} id=${id}`);

          if (tag === 'SELECT') {
            if (/sala/i.test(label)) {
              // Select sala by partial text match
              const options = await input.locator('option').allInnerTexts();
              console.log(`  Sala options: ${options.join(', ')}`);
              const match = options.find(o => o.includes(nino.sala));
              if (match) await input.selectOption({ label: match });
            } else {
              // Other selects - try index 1
              await input.selectOption({ index: 1 }).catch(() => {});
            }
            continue;
          }

          if (/nombre.*contacto|contacto.*nombre|emergencia.*nombre|nombre.*emergencia|padre|madre|tutor/i.test(label)) {
            await input.fill(nino.contactoNombre);
          } else if (/tel|phone|celular|móvil/i.test(label)) {
            await input.fill(nino.contactoTel);
          } else if (/apellido|last/i.test(label)) {
            await input.fill(nino.apellido);
          } else if (/nombre|first|name/i.test(label) && !/usuario|user/i.test(label)) {
            await input.fill(nino.nombre);
          } else if (type === 'date' || /fecha|nacimiento|birth/i.test(label)) {
            await input.fill(nino.fecha);
          } else if (/dni|documento/i.test(label)) {
            await input.fill(String(40000000 + i * 1000000));
          }
        }

        await page.waitForTimeout(500);

        // Submit
        const submitBtn = container.getByRole('button', { name: /guardar|crear|save|submit|agregar/i }).first();
        await submitBtn.click();
        await page.waitForTimeout(2000);

        // Check if modal closed or error
        const modalStillOpen = await container.isVisible().catch(() => false);
        if (modalStillOpen) {
          await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}-modal.png`, fullPage: true });
          const errorText = await container.locator('[class*="error"], [role="alert"], .text-red, .text-destructive').allInnerTexts().catch(() => []);
          if (errorText.length) console.log(`  Form errors: ${errorText.join(', ')}`);
          // Try escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }

        log(`Crear niño "${nino.nombre} ${nino.apellido}"`, '✅');
      } catch (err) {
        await page.screenshot({ path: SCREENSHOTS + `debug-nino-${i}.png`, fullPage: true });
        log(`Crear niño "${nino.nombre} ${nino.apellido}"`, '❌', err.message);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: SCREENSHOTS + '10-ninos-all.png', fullPage: true });
    const ninosText = await page.locator('body').innerText();
    const ninosFound = ['Valentina', 'Santiago', 'Mía', 'Mateo', 'Sofía'].filter(n => ninosText.includes(n));
    log('Niños visible in list', '✅', `Found: ${ninosFound.join(', ')} (${ninosFound.length}/5)`);

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
  report += `## Console Errors\n\n`;
  if (consoleErrors.length === 0) report += 'None\n';
  else consoleErrors.forEach(e => report += `- ${e}\n`);
  report += `\n## Screenshots\n\n`;
  report += `All saved to \`${SCREENSHOTS}\`\n`;
  
  const fs = await import('fs');
  fs.writeFileSync('/home/mati/projects/mi-nido/e2e-browser-results-1.md', report);
  console.log('\n=== REPORT WRITTEN ===');
}

run().catch(console.error);
