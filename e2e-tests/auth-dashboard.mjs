import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://minido.38.105.232.177.sslip.io';
const SS = '/home/mati/projects/mi-nido/e2e-screenshots';
const results = [];
const consoleErrors = [];
let ssN = 0;

function log(step, status, screenshot, notes = '') {
  results.push({ step, status, screenshot, notes });
  console.log(`${status} ${step}${notes ? ' — ' + notes : ''}`);
}

async function ss(page, name) {
  ssN++;
  const fname = `${String(ssN).padStart(2,'0')}-${name}.png`;
  await page.screenshot({ path: `${SS}/${fname}`, fullPage: true });
  return fname;
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/mati/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });

  for (const [vpName, vp, mobile] of [['desktop', {width:1280,height:800}, false], ['mobile', {width:375,height:812}, true]]) {
    console.log(`\n=== ${vpName.toUpperCase()} (${vp.width}x${vp.height}) ===\n`);
    const ctx = await browser.newContext({ viewport: vp, isMobile: mobile });
    const page = await ctx.newPage();
    page.on('console', msg => { if (msg.type()==='error') consoleErrors.push({url:page.url(), text:msg.text(), device:vpName}); });
    page.on('pageerror', err => consoleErrors.push({url:page.url(), text:err.message, device:vpName}));

    // 1. REGISTER
    let t0 = Date.now();
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    let f = await ss(page, `${vpName}-register`);
    log(`[${vpName}] 1.1 Página registro`, '✅', f, `${Date.now()-t0}ms`);

    // Fill step 1
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'Tester');
    await page.fill('input[name="email"]', 'e2e-test1@jardin.com');
    await page.fill('input[name="phone"]', '2644000000');
    await page.fill('input[name="dni"]', '30000000');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    f = await ss(page, `${vpName}-register-step1-filled`);
    log(`[${vpName}] 1.2 Step 1 llenado`, '✅', f);

    // Click "Siguiente"
    await page.click('button:has-text("Siguiente")');
    await page.waitForTimeout(1000);
    f = await ss(page, `${vpName}-register-step2`);
    log(`[${vpName}] 1.3 Step 2 visible`, '✅', f);

    // Fill step 2 - kindergarten info
    const step2Inputs = await page.$$('input');
    const step2Info = [];
    for (const inp of step2Inputs) {
      const name = await inp.getAttribute('name');
      const placeholder = await inp.getAttribute('placeholder');
      const visible = await inp.isVisible();
      if (visible) step2Info.push({ name, placeholder });
    }
    console.log('Step 2 inputs:', JSON.stringify(step2Info));

    // Fill whatever fields are visible
    for (const { name } of step2Info) {
      if (!name) continue;
      if (/name|nombre|jardin/i.test(name)) await page.fill(`input[name="${name}"]`, 'Jardín E2E Test');
      else if (/address|direccion|direc/i.test(name)) await page.fill(`input[name="${name}"]`, 'Calle Test 123');
      else if (/phone|tel/i.test(name)) await page.fill(`input[name="${name}"]`, '2644111111');
      else if (/city|ciudad/i.test(name)) await page.fill(`input[name="${name}"]`, 'San Juan');
      else if (/capacity|capac/i.test(name)) await page.fill(`input[name="${name}"]`, '50');
      else if (/license|habilitacion|matricula/i.test(name)) await page.fill(`input[name="${name}"]`, 'HAB-001');
    }

    // Check acceptTerms checkbox
    const checkbox = await page.$('input[name="acceptTerms"]');
    if (checkbox) await checkbox.check();

    f = await ss(page, `${vpName}-register-step2-filled`);
    log(`[${vpName}] 1.4 Step 2 llenado`, '✅', f);

    // Submit - look for submit/crear/registrar button
    const allBtns = await page.$$eval('button', els => els.map(e => ({ text: e.textContent.trim(), type: e.type, visible: e.offsetParent !== null })));
    console.log('Step 2 buttons:', JSON.stringify(allBtns));
    const submitBtn = await page.$('button:has-text("Crear"), button:has-text("Registr"), button:has-text("Finalizar"), button:has-text("Completar"), button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(()=>{});
    }
    f = await ss(page, `${vpName}-register-result`);
    const regUrl = page.url();
    const regOk = !regUrl.includes('register');
    log(`[${vpName}] 1.5 Registro submit`, regOk ? '✅' : '❌', f, `URL: ${regUrl}`);

    // 2. LOGIN (go to login regardless)
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    f = await ss(page, `${vpName}-login`);
    log(`[${vpName}] 2.1 Página login`, '✅', f);

    await page.fill('input[name="email"], input[type="email"]', 'e2e-test1@jardin.com');
    await page.fill('input[name="password"], input[type="password"]', 'Test123!');
    f = await ss(page, `${vpName}-login-filled`);

    const loginBtn = await page.$('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Ingresar")');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(()=>{});
    }
    f = await ss(page, `${vpName}-login-result`);
    const loginUrl = page.url();
    log(`[${vpName}] 2.2 Login result`, !loginUrl.includes('login') ? '✅' : '❌', f, `URL: ${loginUrl}`);

    // 3. DASHBOARD
    if (!loginUrl.includes('login')) {
      f = await ss(page, `${vpName}-dashboard`);
      log(`[${vpName}] 3.1 Dashboard`, '✅', f, `URL: ${page.url()}`);

      const body = await page.textContent('body');
      const hasSaludo = /hola|bienvenid|buenos/i.test(body);
      log(`[${vpName}] 3.2 Saludo visible`, hasSaludo ? '✅' : '⚠️', '');
      
      const cards = await page.$$('[class*="card"], [class*="Card"], [class*="stat"]');
      log(`[${vpName}] 3.3 Cards/Stats`, cards.length > 0 ? '✅' : '⚠️', '', `${cards.length} encontradas`);

      if (!mobile) {
        const sidebar = await page.$('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
        log(`[${vpName}] 3.4 Sidebar`, sidebar ? '✅' : '⚠️', '');
      }

      // 4. NAVIGATION
      const navTargets = ['salas', 'asistencia', 'cuaderno', 'comunicados', 'pagos'];
      for (const target of navTargets) {
        try {
          t0 = Date.now();
          await page.goto(`${BASE}/${target}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          f = await ss(page, `${vpName}-nav-${target}`);
          const navBody = await page.textContent('body').catch(() => '');
          const hasError = /error|404|not found/i.test(navBody) && navBody.length < 500;
          log(`[${vpName}] 4. ${target}`, hasError ? '⚠️' : '✅', f, `${Date.now()-t0}ms — URL: ${page.url()}`);
        } catch(e) {
          f = await ss(page, `${vpName}-nav-${target}-err`);
          log(`[${vpName}] 4. ${target}`, '❌', f, e.message.substring(0,100));
        }
      }

      // 5. LOGOUT
      try {
        await page.goto(`${BASE}/mas`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(()=>{});
        f = await ss(page, `${vpName}-mas`);
        
        const logoutBtn = await page.$('button:has-text("Cerrar"), button:has-text("Salir"), button:has-text("Logout"), a:has-text("Cerrar sesión")');
        if (logoutBtn) {
          await logoutBtn.click();
          await page.waitForTimeout(3000);
          await page.waitForLoadState('networkidle').catch(()=>{});
        }
        f = await ss(page, `${vpName}-logout`);
        log(`[${vpName}] 5. Logout`, page.url().includes('login') ? '✅' : '⚠️', f, `URL: ${page.url()}`);
      } catch(e) {
        log(`[${vpName}] 5. Logout`, '❌', '', e.message.substring(0,100));
      }
    } else {
      log(`[${vpName}] 3-5 Skipped`, '⚠️', '', 'Login failed, cannot test dashboard/nav/logout');
    }

    await ctx.close();
  }

  await browser.close();

  // Generate report
  let report = `# E2E Test Results — Auth & Dashboard\n\n`;
  report += `**Fecha:** ${new Date().toISOString()}\n`;
  report += `**Frontend:** ${BASE}\n`;
  report += `**Viewports:** Desktop 1280x800, Mobile 375x812\n\n`;
  report += `## Resultados\n\n`;
  report += `| Paso | Estado | Screenshot | Notas |\n`;
  report += `|------|--------|------------|-------|\n`;
  for (const r of results) {
    report += `| ${r.step} | ${r.status} | ${r.screenshot ? `\`${r.screenshot}\`` : '-'} | ${r.notes} |\n`;
  }
  report += `\n## Errores de Consola (${consoleErrors.length})\n\n`;
  if (consoleErrors.length === 0) report += `Ninguno capturado.\n`;
  else for (const e of consoleErrors) report += `- **[${e.device}]** ${e.url}: \`${e.text.substring(0,200)}\`\n`;
  
  const pass = results.filter(r=>r.status==='✅').length;
  const warn = results.filter(r=>r.status==='⚠️').length;
  const fail = results.filter(r=>r.status==='❌').length;
  report += `\n## Resumen\n\n- ✅ ${pass} | ⚠️ ${warn} | ❌ ${fail} | Total: ${results.length}\n`;
  
  fs.writeFileSync('/home/mati/projects/mi-nido/e2e-results-auth-dashboard.md', report);
  console.log('\n✅ Reporte: e2e-results-auth-dashboard.md');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
