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
  log('Login page — 01-login-page.png');

  await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill('admin@jardinminido.com');
  await page.locator('input[type="password"]').first().fill('MiNido2024!');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }).catch(() => {});
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/03-dashboard.png`, fullPage: true });
  log(`Login — URL: ${page.url()}`, !page.url().includes('/login'));

  // ========== 2. DASHBOARD ==========
  console.log('\n=== 2. DASHBOARD ===');
  await page.screenshot({ path: `${SHOTS}/04-dashboard-desktop.png`, fullPage: true });
  log('Dashboard desktop — 04-dashboard-desktop.png');
  await page.setViewportSize({ width: 375, height: 812 });
  await sleep(1500);
  await page.screenshot({ path: `${SHOTS}/05-dashboard-mobile.png`, fullPage: true });
  log('Dashboard mobile — 05-dashboard-mobile.png');

  // Check sidebar icons
  const sidebarText = await page.evaluate(() => {
    const sidebar = document.querySelector('nav, [class*="sidebar"], aside');
    return sidebar ? sidebar.innerText : '';
  });
  const hasSquareBoxes = sidebarText.includes('□');
  if (hasSquareBoxes) obs('Sidebar icons aparecen como □ — fuente de iconos no carga');
  log(`Sidebar icons OK (sin □)`, !hasSquareBoxes);

  await page.setViewportSize({ width: 1280, height: 800 });

  // ========== 3. SALAS (ya creadas, skip) ==========
  console.log('\n=== 3. SALAS (verificar existentes) ===');
  await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  const salasBody = await page.textContent('body');
  const hasPollitos = salasBody.includes('Pollitos');
  const hasOsitos = salasBody.includes('Ositos');
  const hasJirafitas = salasBody.includes('Jirafitas');
  log(`Sala Pollitos: ${hasPollitos}`, hasPollitos);
  log(`Sala Ositos: ${hasOsitos}`, hasOsitos);
  log(`Sala Jirafitas: ${hasJirafitas}`, hasJirafitas);
  await page.screenshot({ path: `${SHOTS}/09-salas-all.png`, fullPage: true });

  // ========== 4. NIÑOS ==========
  console.log('\n=== 4. NIÑOS ===');
  await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/10-ninos-initial.png`, fullPage: true });
  log('Niños página — 10-ninos-initial.png');

  const ninos = [
    { nombre: 'Valentina', apellido: 'López', nacimiento: '2024-03-15', sexo: 'Femenino', sala: 'Pollitos', contactoNombre: 'María López', contactoTel: '1155001122', contactoRel: 'Madre', dni: '60111222' },
    { nombre: 'Santiago', apellido: 'Rodríguez', nacimiento: '2023-08-20', sexo: 'Masculino', sala: 'Ositos', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344', contactoRel: 'Padre', dni: '59222333' },
    { nombre: 'Mía', apellido: 'García', nacimiento: '2023-01-10', sexo: 'Femenino', sala: 'Ositos', contactoNombre: 'Laura García', contactoTel: '1155005566', contactoRel: 'Madre', dni: '58333444' },
    { nombre: 'Mateo', apellido: 'Fernández', nacimiento: '2022-11-05', sexo: 'Masculino', sala: 'Jirafitas', contactoNombre: 'Diego Fernández', contactoTel: '1155007788', contactoRel: 'Padre', dni: '57444555' },
    { nombre: 'Sofía', apellido: 'Martínez', nacimiento: '2022-06-22', sexo: 'Femenino', sala: 'Jirafitas', contactoNombre: 'Ana Martínez', contactoTel: '1155009900', contactoRel: 'Madre', dni: '56555666' },
  ];

  for (let i = 0; i < ninos.length; i++) {
    const n = ninos[i];
    console.log(`\nCreating niño ${i+1}: ${n.nombre} ${n.apellido}`);

    // Click "+ Agregar nene" or "Registrar primer nene"
    const addBtn = page.locator('button:has-text("Agregar nene"), button:has-text("Registrar primer nene"), button:has-text("Nuevo")').first();
    await addBtn.click({ timeout: 5000 });
    await sleep(2000);

    const dlg = page.locator('[role="dialog"]');

    // Fields by index (from screenshot):
    // text[0] = Nombre, text[1] = Apellido, text[2] = Apodo, text[3] = DNI
    const textInputs = await dlg.locator('input[type="text"]').all();
    if (textInputs.length >= 4) {
      await textInputs[0].fill(n.nombre);
      await textInputs[1].fill(n.apellido);
      await textInputs[2].fill(n.nombre.slice(0, 4));  // Apodo
      await textInputs[3].fill(n.dni);                  // DNI
    }

    // date[0] = Fecha nacimiento, date[1] = Fecha inscripción  
    const dateInputs = await dlg.locator('input[type="date"]').all();
    if (dateInputs.length >= 1) await dateInputs[0].fill(n.nacimiento);
    // date[1] already has today's date

    // select[0] = Sexo, select[1] = Sala
    const selects = await dlg.locator('select').all();
    if (selects.length >= 1) {
      await selects[0].selectOption({ label: n.sexo }).catch(() => {});
    }
    if (selects.length >= 2) {
      // Get all options and find the one matching sala name
      const options = await selects[1].locator('option').allTextContents();
      console.log(`  Sala options: ${options.join(', ')}`);
      const match = options.find(o => o.includes(n.sala));
      if (match) {
        await selects[1].selectOption({ label: match });
        console.log(`  Selected sala: ${match}`);
      } else {
        console.log(`  ⚠️ No sala matching "${n.sala}"`);
      }
    }

    // Medical info text fields (after scrolling)
    // text[4]=Grupo sanguíneo, text[5]=Obra social, text[6]=Alergias, text[7]=Condiciones
    // Need to refetch after scroll
    await dlg.locator('input[placeholder*="A+"]').first().fill('A+').catch(() => {});
    await dlg.locator('input[placeholder*="OSDE"]').first().fill('OSDE 310').catch(() => {});

    // Contact info - scroll down
    // text fields after medical: contacto 1 nombre, contacto 2 nombre
    await dlg.locator('input[placeholder*="Laura López"]').first().fill(n.contactoNombre).catch(() => {});
    
    // Contact relation select (select[2])
    if (selects.length >= 3) {
      await selects[2].selectOption({ label: n.contactoRel }).catch(() => {});
    }

    // Phone
    await dlg.locator('input[type="tel"]').first().fill(n.contactoTel).catch(() => {});

    // Checkbox - autorizado para retiro
    await dlg.locator('input[type="checkbox"]').first().check().catch(() => {});

    await page.screenshot({ path: `${SHOTS}/12-nino-filled-${i}.png`, fullPage: true });

    // Submit - scroll to bottom of dialog and click
    const submitBtn = dlg.locator('button:has-text("Crear"), button:has-text("Guardar"), button:has-text("Registrar"), button[type="submit"]').first();
    await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(500);
    await submitBtn.click({ force: true, timeout: 5000 });
    await sleep(3000);

    // Check if dialog closed (success) or still open (error)
    const stillOpen = await dlg.isVisible().catch(() => false);
    if (stillOpen) {
      // Check for validation errors
      const errorText = await dlg.locator('[class*="error"], [class*="destructive"], .text-red').allTextContents().catch(() => []);
      if (errorText.length) console.log(`  Validation errors: ${errorText.join(', ')}`);
      
      // Screenshot the error state
      await page.screenshot({ path: `${SHOTS}/12-nino-error-${i}.png`, fullPage: true });
      log(`Niño "${n.nombre} ${n.apellido}" — dialog aún abierto (posible error validación)`, false);
      
      await page.keyboard.press('Escape');
      await sleep(1000);
    } else {
      log(`Niño "${n.nombre} ${n.apellido}" — creado OK`);
    }
  }

  await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  await page.screenshot({ path: `${SHOTS}/13-ninos-all.png`, fullPage: true });
  log('Niños final — 13-ninos-all.png');

  // Count niños in the list
  const ninosBody = await page.textContent('body');
  for (const n of ninos) {
    const found = ninosBody.includes(n.nombre) || ninosBody.includes(n.apellido);
    log(`${n.nombre} ${n.apellido} en lista: ${found}`, found);
  }

} catch(e) {
  log(`ERROR: ${e.message}`, false);
  console.error(e.stack);
  if (page) await page.screenshot({ path: `${SHOTS}/error.png` }).catch(() => {});
} finally {
  if (browser) await browser.close();
}

const report = `# E2E Test Results — Mi Nido (Final)
**Fecha:** ${new Date().toISOString()}  
**Frontend:** ${BASE}  
**API:** ${API}

## Resultados

${results.join('\n')}

## Observaciones
${observations.length ? observations.map(o => `- ${o}`).join('\n') : '- Ninguna'}

## Errores de Consola
${consoleErrors.length ? consoleErrors.slice(0, 20).map(e => `- \`${e.slice(0, 200)}\``).join('\n') : '- Ninguno'}

## Screenshots
Directorio: \`${SHOTS}/\`
`;

writeFileSync('/home/mati/projects/mi-nido/e2e-results-final-1.md', report);
console.log('\n✅ Report written');
