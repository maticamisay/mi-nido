import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const API = 'http://api-minido.38.105.232.177.sslip.io/api';
const SHOTS = '/home/mati/projects/mi-nido/e2e-screenshots/final';
const results = [];

function log(msg, ok = true) {
  const line = `${ok ? '✅' : '❌'} ${msg}`;
  console.log(line);
  results.push(line);
}

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
  log(`Login page loaded — screenshot: 01-login-page.png`);

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"], input[placeholder*="Email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  
  await emailInput.fill('admin@jardinminido.com');
  await passInput.fill('MiNido2024!');
  await page.screenshot({ path: `${SHOTS}/02-login-filled.png` });
  
  // Click submit
  const submitBtn = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar"), button:has-text("Ingresar")').first();
  await submitBtn.click();
  
  // Wait for navigation
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }).catch(() => {});
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/03-dashboard-after-login.png`, fullPage: true });
  
  const currentUrl = page.url();
  const loginSuccess = !currentUrl.includes('/login');
  log(`Login ${loginSuccess ? 'exitoso' : 'falló'} — URL: ${currentUrl}`, loginSuccess);

  // Check dashboard elements
  const bodyText = await page.textContent('body');
  const hasSaludo = bodyText.includes('Hola') || bodyText.includes('Bienvenid') || bodyText.includes('admin') || bodyText.includes('Dashboard');
  log(`Dashboard tiene saludo/título: ${hasSaludo}`, hasSaludo);

  // ========== 2. DASHBOARD SCREENSHOTS ==========
  console.log('\n=== 2. DASHBOARD ===');
  await page.setViewportSize({ width: 1280, height: 800 });
  await sleep(1000);
  await page.screenshot({ path: `${SHOTS}/04-dashboard-desktop.png`, fullPage: true });
  log('Dashboard desktop 1280x800 — screenshot: 04-dashboard-desktop.png');

  await page.setViewportSize({ width: 375, height: 812 });
  await sleep(1000);
  await page.screenshot({ path: `${SHOTS}/05-dashboard-mobile.png`, fullPage: true });
  log('Dashboard mobile 375x812 — screenshot: 05-dashboard-mobile.png');

  // Check for broken icons (□)
  const brokenIcons = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    let broken = 0;
    for (const el of all) {
      if (el.children.length === 0 && el.textContent && el.textContent.includes('□')) broken++;
    }
    return broken;
  });
  log(`Iconos rotos (□): ${brokenIcons}`, brokenIcons === 0);

  // Back to desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await sleep(500);

  // ========== 3. SALAS ==========
  console.log('\n=== 3. SALAS ===');
  await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/06-salas-initial.png`, fullPage: true });
  log('Página salas inicial — screenshot: 06-salas-initial.png');

  const salas = [
    { nombre: 'Sala Pollitos 🐥', capacidad: '15', edadMin: '0', edadMax: '1', turno: 'mañana', cuota: '45000' },
    { nombre: 'Sala Ositos 🧸', capacidad: '20', edadMin: '1', edadMax: '2', turno: 'mañana', cuota: '50000' },
    { nombre: 'Sala Jirafitas 🦒', capacidad: '18', edadMin: '2', edadMax: '3', turno: 'tarde', cuota: '48000' },
  ];

  for (let i = 0; i < salas.length; i++) {
    const s = salas[i];
    console.log(`Creating sala: ${s.nombre}`);
    
    // Try to find and click "Nueva Sala" or similar button
    const newBtn = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Agregar"), a:has-text("Nueva"), a:has-text("Crear")').first();
    try {
      await newBtn.click({ timeout: 5000 });
      await sleep(1500);
    } catch(e) {
      // Maybe it's a + button or fab
      const plusBtn = page.locator('button:has-text("+"), [aria-label*="add"], [aria-label*="crear"], [aria-label*="nueva"]').first();
      await plusBtn.click({ timeout: 5000 }).catch(() => {});
      await sleep(1500);
    }

    // Take screenshot of the form
    await page.screenshot({ path: `${SHOTS}/07-sala-form-${i}.png`, fullPage: true });

    // Fill form - try common field patterns
    const fields = await page.locator('input, select, textarea').all();
    console.log(`  Found ${fields.length} form fields`);
    
    // Log all field info for debugging
    for (const f of fields) {
      const tag = await f.evaluate(el => el.tagName);
      const type = await f.getAttribute('type') || '';
      const name = await f.getAttribute('name') || '';
      const placeholder = await f.getAttribute('placeholder') || '';
      const label = await f.getAttribute('aria-label') || '';
      console.log(`  Field: ${tag} type=${type} name=${name} placeholder=${placeholder} label=${label}`);
    }

    // Try filling by name/placeholder patterns
    async function tryFill(selectors, value) {
      for (const sel of selectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 1000 })) {
            await el.fill(value);
            return true;
          }
        } catch(e) {}
      }
      return false;
    }

    async function trySelect(selectors, value) {
      for (const sel of selectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 1000 })) {
            await el.selectOption({ label: value }).catch(() => el.selectOption(value).catch(() => {}));
            return true;
          }
        } catch(e) {}
      }
      return false;
    }

    await tryFill(['input[name="nombre"]', 'input[name="name"]', 'input[placeholder*="ombre"]', 'input[placeholder*="ala"]'], s.nombre);
    await tryFill(['input[name="capacidad"]', 'input[name="capacity"]', 'input[placeholder*="apacidad"]'], s.capacidad);
    await tryFill(['input[name="edadMinima"]', 'input[name="edad_min"]', 'input[name="edadMin"]', 'input[name="ageMin"]', 'input[placeholder*="dad mín"]', 'input[placeholder*="Desde"]'], s.edadMin);
    await tryFill(['input[name="edadMaxima"]', 'input[name="edad_max"]', 'input[name="edadMax"]', 'input[name="ageMax"]', 'input[placeholder*="dad máx"]', 'input[placeholder*="Hasta"]'], s.edadMax);
    await tryFill(['input[name="cuota"]', 'input[name="precio"]', 'input[name="fee"]', 'input[placeholder*="uota"]', 'input[placeholder*="recio"]'], s.cuota);
    
    // Turno - could be select or input
    await trySelect(['select[name="turno"]', 'select[name="shift"]'], s.turno);
    await tryFill(['input[name="turno"]', 'input[placeholder*="urno"]'], s.turno);

    await page.screenshot({ path: `${SHOTS}/08-sala-filled-${i}.png`, fullPage: true });

    // Submit
    const saveBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
    try {
      await saveBtn.click({ timeout: 5000 });
      await sleep(3000);
      log(`Sala "${s.nombre}" — formulario enviado`);
    } catch(e) {
      log(`Sala "${s.nombre}" — no se pudo enviar: ${e.message}`, false);
    }
  }

  await page.goto(`${BASE}/salas`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/09-salas-all.png`, fullPage: true });
  log('Todas las salas — screenshot: 09-salas-all.png');

  // ========== 4. NINOS ==========
  console.log('\n=== 4. NIÑOS ===');
  await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/10-ninos-initial.png`, fullPage: true });
  log('Página niños inicial — screenshot: 10-ninos-initial.png');

  const ninos = [
    { nombre: 'Valentina', apellido: 'López', nacimiento: '2024-03-15', sala: 'Sala Pollitos', contactoNombre: 'María López', contactoTel: '1155001122', contactoRel: 'Madre' },
    { nombre: 'Santiago', apellido: 'Rodríguez', nacimiento: '2023-08-20', sala: 'Sala Ositos', contactoNombre: 'Carlos Rodríguez', contactoTel: '1155003344', contactoRel: 'Padre' },
    { nombre: 'Mía', apellido: 'García', nacimiento: '2023-01-10', sala: 'Sala Ositos', contactoNombre: 'Laura García', contactoTel: '1155005566', contactoRel: 'Madre' },
    { nombre: 'Mateo', apellido: 'Fernández', nacimiento: '2022-11-05', sala: 'Sala Jirafitas', contactoNombre: 'Diego Fernández', contactoTel: '1155007788', contactoRel: 'Padre' },
    { nombre: 'Sofía', apellido: 'Martínez', nacimiento: '2022-06-22', sala: 'Sala Jirafitas', contactoNombre: 'Ana Martínez', contactoTel: '1155009900', contactoRel: 'Madre' },
  ];

  for (let i = 0; i < ninos.length; i++) {
    const n = ninos[i];
    console.log(`Creating niño: ${n.nombre} ${n.apellido}`);

    const newBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar"), button:has-text("Nueva"), a:has-text("Nuevo"), a:has-text("Crear"), a:has-text("Agregar")').first();
    try {
      await newBtn.click({ timeout: 5000 });
      await sleep(1500);
    } catch(e) {
      const plusBtn = page.locator('button:has-text("+"), [aria-label*="add"], [aria-label*="crear"], [aria-label*="nuevo"]').first();
      await plusBtn.click({ timeout: 5000 }).catch(() => {});
      await sleep(1500);
    }

    if (i === 0) {
      // Log form fields on first child
      await page.screenshot({ path: `${SHOTS}/11-nino-form.png`, fullPage: true });
      const fields = await page.locator('input, select, textarea').all();
      console.log(`  Found ${fields.length} form fields for niño:`);
      for (const f of fields) {
        const tag = await f.evaluate(el => el.tagName);
        const type = await f.getAttribute('type') || '';
        const name = await f.getAttribute('name') || '';
        const placeholder = await f.getAttribute('placeholder') || '';
        const id = await f.getAttribute('id') || '';
        console.log(`  Field: ${tag} type=${type} name=${name} id=${id} placeholder=${placeholder}`);
      }
    }

    async function tryFill(selectors, value) {
      for (const sel of selectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 1000 })) {
            await el.fill(value);
            return true;
          }
        } catch(e) {}
      }
      return false;
    }

    async function trySelect(selectors, value) {
      for (const sel of selectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 1000 })) {
            await el.selectOption({ label: value }).catch(() => 
              el.selectOption({ value: value }).catch(() => {}));
            return true;
          }
        } catch(e) {}
      }
      return false;
    }

    await tryFill(['input[name="nombre"]', 'input[name="firstName"]', 'input[name="first_name"]', 'input[placeholder*="ombre"]'], n.nombre);
    await tryFill(['input[name="apellido"]', 'input[name="lastName"]', 'input[name="last_name"]', 'input[placeholder*="pellido"]'], n.apellido);
    await tryFill(['input[name="fechaNacimiento"]', 'input[name="birthDate"]', 'input[name="fecha_nacimiento"]', 'input[type="date"]', 'input[placeholder*="acimiento"]'], n.nacimiento);
    
    // Sala - select
    await trySelect(['select[name="salaId"]', 'select[name="sala"]', 'select[name="sala_id"]', 'select[name="room"]', 'select[name="roomId"]'], n.sala);
    
    // Contact info
    await tryFill(['input[name="contactoNombre"]', 'input[name="contactName"]', 'input[name="emergencyContact"]', 'input[placeholder*="ontacto"]', 'input[placeholder*="adre"]', 'input[placeholder*="utor"]'], n.contactoNombre);
    await tryFill(['input[name="contactoTelefono"]', 'input[name="contactPhone"]', 'input[name="telefono"]', 'input[name="phone"]', 'input[placeholder*="eléfono"]', 'input[placeholder*="elular"]'], n.contactoTel);
    await trySelect(['select[name="contactoRelacion"]', 'select[name="relationship"]', 'select[name="parentesco"]'], n.contactoRel);
    await tryFill(['input[name="contactoRelacion"]', 'input[name="relationship"]', 'input[placeholder*="arentesco"]', 'input[placeholder*="elación"]'], n.contactoRel);

    // DNI if required
    await tryFill(['input[name="dni"]', 'input[name="documento"]', 'input[placeholder*="DNI"]', 'input[placeholder*="ocumento"]'], `${40000000 + i * 1111111}`);
    
    // Dirección if required
    await tryFill(['input[name="direccion"]', 'input[name="address"]', 'input[placeholder*="irección"]', 'input[placeholder*="omicilio"]'], `Av. San Martín ${100 + i * 100}, CABA`);

    // Grupo sanguíneo
    await trySelect(['select[name="grupoSanguineo"]', 'select[name="bloodType"]'], 'A+');

    // Obra social
    await tryFill(['input[name="obraSocial"]', 'input[name="healthInsurance"]', 'input[placeholder*="bra social"]'], 'OSDE');

    await page.screenshot({ path: `${SHOTS}/12-nino-filled-${i}.png`, fullPage: true });

    const saveBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
    try {
      await saveBtn.click({ timeout: 5000 });
      await sleep(3000);
      log(`Niño "${n.nombre} ${n.apellido}" — formulario enviado`);
    } catch(e) {
      log(`Niño "${n.nombre} ${n.apellido}" — no se pudo enviar: ${e.message}`, false);
    }
  }

  await page.goto(`${BASE}/ninos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  await page.screenshot({ path: `${SHOTS}/13-ninos-all.png`, fullPage: true });
  log('Todos los niños — screenshot: 13-ninos-all.png');

  // ========== CONSOLE ERRORS ==========
  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(e => console.log(`  ${e}`));
    results.push(`\n### Errores de consola (${consoleErrors.length})`);
    consoleErrors.forEach(e => results.push(`- ${e}`));
  }

} catch(e) {
  log(`ERROR GENERAL: ${e.message}`, false);
  console.error(e);
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

## Screenshots
Directorio: \`${SHOTS}/\`
`;

writeFileSync('/home/mati/projects/mi-nido/e2e-results-final-1.md', report);
console.log('\n✅ Report written to e2e-results-final-1.md');
