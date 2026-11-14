// Test de bout en bout de la Saison 4 (Playwright, optionnel, jamais dans package.json).
// Installation une fois : npm i --no-save playwright@1.49.1 && npx playwright install chromium
// Lancement            : npm run e2e:s4                     (partie Standard complète, mobile 390×844 puis desktop 1440×900)
//                        node saison4/tests/e2e.mjs --years=2 (partie courte)
// Échoue sur : erreur JavaScript, défilement horizontal, élément qui sort de l'écran, bouton trop petit pour le pouce (< 40 px),
// NaN ou « Infinity » affichés, partie qui ne finit pas.
// Captures dans saison4/tests/screenshots/ (ignoré par git).
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Playwright n’est pas installé : npm i --no-save playwright@1.49.1 && npx playwright install chromium'); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, 'index.html')).href;
const out = join(root, 'tests', 'screenshots');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const yArg = process.argv.find(a => a.startsWith('--years='));
const MAXY = yArg ? +yArg.split('=')[1] : 99;
const only = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1];

const errors = [], seen = new Set();
function check(c, m) { if (!c) throw new Error(m); }
async function layout(pg, name, where) {
  const r = await pg.evaluate(() => {
    const W = window.innerWidth, H = window.innerHeight, bad = [], small = [], txt = document.body.innerText;
    if (document.querySelector('.shake')) return { bad, small, nan: '' }; // secousse en cours : mesure faussée
    if (document.documentElement.scrollWidth > W + 1) bad.push('page : défilement horizontal');
    const inScrollX = el => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && p.scrollWidth > p.clientWidth) return true; } return false; };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[hidden]') || el.classList.contains('fx') || el.classList.contains('flt') || el.closest('svg')) continue;
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.display === 'none') continue;
      if ((b.right > W + 1 || b.left < -1) && !inScrollX(el)) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} « ${(el.textContent || '').trim().slice(0, 30)} » (${Math.round(b.left)}→${Math.round(b.right)})`);
      if ((el.tagName === 'BUTTON' || el.tagName === 'INPUT') && !el.disabled && b.bottom > 0 && b.top < H && (b.height < 40 || b.width < 40) && el.type !== 'range') small.push(`${el.tagName.toLowerCase()}#${el.id || ''}.${[...el.classList].join('.')} « ${(el.textContent || '').trim().slice(0, 20)} » ${Math.round(b.width)}×${Math.round(b.height)}`);
    }
    const nan = /NaN|Infinity|undefined/.test(txt) ? (txt.match(/.{0,30}(NaN|Infinity|undefined).{0,20}/) || [''])[0] : '';
    return { bad: bad.slice(0, 6), small: small.slice(0, 6), nan };
  });
  const add = (k, m) => { if (!seen.has(k)) { seen.add(k); errors.push(m); } };
  for (const b of r.bad) add(`${name}:${where}:${b}`, `${name} · ${where} : déborde → ${b}`);
  if (name === 'mobile') for (const s of r.small) add(`${name}:small:${s}`, `${name} · ${where} : cible trop petite → ${s}`);
  if (r.nan) add(`${name}:nan:${where}`, `${name} · ${where} : valeur illisible affichée → ${r.nan}`);
}
async function holdOn(pg, sel) {
  const el = pg.locator(sel).first(); try { await el.scrollIntoViewIfNeeded({ timeout: 4000 }); } catch (e) { throw new Error('maintien impossible : ' + sel); }
  const b = await el.boundingBox(); if (!b) throw new Error('introuvable : ' + sel);
  const H = pg.viewportSize().height; check(b.y + b.height / 2 < H && b.y + b.height / 2 > 0, `bouton hors écran : ${sel}`);
  await pg.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await pg.mouse.down(); await pg.waitForTimeout(650); await pg.mouse.up(); await pg.waitForTimeout(120);
}
async function tap(pg, sel) { const el = pg.locator(sel).first(); try { await el.scrollIntoViewIfNeeded({ timeout: 4000 }); await el.click({ timeout: 4000 }); } catch (e) { throw new Error('toucher impossible : ' + sel + ' · ' + e.message.split('\n')[0]); } await pg.waitForTimeout(50); }
async function has(pg, sel) { return !!(await pg.$(sel)); }

async function run(name, viewport, reduced, years, plan) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: name === 'mobile' });
  const pg = await ctx.newPage(); let n = 0;
  pg.on('pageerror', e => errors.push(`${name} : ${e.message}`));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + (m.location()?.url || ''))) errors.push(`${name} : ${m.text()}`); });
  pg.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${name} : échec de chargement ${r.url()}`); });
  await pg.goto(url + '#graine-' + plan.seed); await pg.waitForTimeout(250);
  const S = label => pg.screenshot({ path: join(out, `${name}${reduced ? '' : '-anim'}-${String(n++).padStart(2, '0')}-${label}.png`) });
  await layout(pg, name, 'titre'); if (reduced) await S('titre');
  await tap(pg, '#t-new');
  await tap(pg, `[data-sx=${plan.sx}]`); await layout(pg, name, 'création · qui'); await tap(pg, '#mk-next');
  await layout(pg, name, 'création · ville'); if (reduced) await S('creation-ville'); await tap(pg, `[data-city=${plan.city}]`);
  await layout(pg, name, 'création · parcours'); if (reduced) await S('creation-parcours'); await tap(pg, `[data-start=${plan.start}]`);
  await layout(pg, name, 'création · logement'); await tap(pg, `[data-home=${plan.home}]`);
  await layout(pg, name, 'création · secteur'); if (reduced) await S('creation-secteur'); await tap(pg, '[data-sector=commerce]');
  await layout(pg, name, 'création · produit'); if (reduced) await S('creation-produit'); await tap(pg, `[data-prod=${plan.prod}]`);
  await layout(pg, name, 'création · financement'); await pg.locator('#f-hon').fill('6000'); await pg.locator('#f-bank').fill(String(plan.bank)); await pg.waitForTimeout(50); if (reduced) await S('creation-financement'); await tap(pg, '#mk-next');
  await layout(pg, name, 'création · récap'); if (reduced) await S('creation-recap');
  await holdOn(pg, '#go'); await pg.waitForTimeout(450);
  let y = 0, quarters = 0, relaunch = 0, comptes = 0;
  while (y < years) {
    if (await has(pg, '#scr-end:not([hidden]) #replay')) break;
    for (let q = 1; q <= 4; q++) {
      const yr = 2026 + y, lab = `T${q}-${yr}`;
      if (!(await has(pg, '#scr-hub:not([hidden])'))) { errors.push(`${name} : pas de tableau de bord en ${lab}`); break; }
      await tap(pg, '.nav [data-nav=biz]'); await layout(pg, name, `tableau de bord ${lab}`);
      if (reduced && (quarters < 2 || quarters % 23 === 5)) await S(`tableau-${lab}`);
      if (await has(pg, '#decide') && (q === 1 || quarters < 3 || y % 5 === 2)) {
        await tap(pg, '#decide'); await pg.waitForTimeout(60); await layout(pg, name, `décisions ${lab}`);
        if (q === 1 && y === 0) { await tap(pg, '[data-sup=eu]'); await tap(pg, '#d-sug'); }
        if (y === 1 && q === 2) { await tap(pg, '[data-tm=emp][data-d="1"]'); }
        if (y === 2 && q === 1) { await tap(pg, '[data-sol="0.3"]'); }
        await pg.waitForTimeout(80); if (reduced && (quarters < 2 || (y === 2 && q === 1))) { await S(`decisions-${lab}`); await pg.locator('#fcast').scrollIntoViewIfNeeded(); await S(`previsionnel-${lab}`); }
        await holdOn(pg, '#dec-go');
      } else if (await has(pg, '#keep')) await tap(pg, '#keep');
      else if (await has(pg, '[data-relaunch]:not([disabled])') && relaunch < 3) { relaunch++; await layout(pg, name, `relance ${lab}`); if (reduced) await S(`relance-${lab}`); await tap(pg, '[data-relaunch]'); await holdOn(pg, '#cf-ok'); await pg.waitForTimeout(420); await tap(pg, '#keep'); }
      else if (await has(pg, '#nb-job')) { await layout(pg, name, `sans entreprise ${lab}`); if (reduced) await S(`sans-entreprise-${lab}`); await tap(pg, '#nb-job'); await pg.waitForTimeout(420); await tap(pg, '#next'); }
      else await tap(pg, '#next');
      await pg.waitForTimeout(reduced ? 60 : 700);
      if (!(await has(pg, '#scr-end:not([hidden]) #end-go'))) { errors.push(`${name} : pas d’écran de résultat en ${lab}`); break; }
      await layout(pg, name, `résultat ${lab}`);
      if (await has(pg, '#why-go')) { await tap(pg, '#why-go'); await layout(pg, name, `pourquoi ${lab}`); if (reduced && (quarters < 3 || quarters % 29 === 7)) await S(`resultat-pourquoi-${lab}`); }
      quarters++; await tap(pg, '#end-go'); await pg.waitForTimeout(reduced ? 60 : 300);
    }
    // fin d'année : la décision de l'année, les comptes, le récap, le bilan
    // sans décision en attente, « Les comptes de … » ouvre directement la clôture ; sinon on décide d'abord à l'Accueil
    if (!(await has(pg, '#af-ok')) && !(await has(pg, '#pr-ok'))) {
      await tap(pg, '.nav [data-nav=home]'); await layout(pg, name, `accueil ${2026 + y}`); if (reduced && (y < 2 || y === 10)) await S(`accueil-${2026 + y}`);
      if (await has(pg, '[data-vs]')) await holdOn(pg, `[data-vs=${y % 2 ? 'a' : 'b'}]`);
      else if (await has(pg, '#bet-ok')) { if (y % 2) await tap(pg, '#bet-box [data-q="100"]'); await holdOn(pg, '#bet-ok'); }
      await pg.waitForTimeout(reduced ? 60 : 800);
      await tap(pg, '#next'); await pg.waitForTimeout(150);
    }
    if (await has(pg, '#af-ok')) { comptes++; await layout(pg, name, `comptes ${2026 + y}`); if (y % 3 === 1 && await has(pg, '#af-d:not([disabled])')) await pg.locator('#af-d').fill(String(Math.floor(+(await pg.locator('#af-d').getAttribute('max')) / 200) * 100)); if (reduced && (y < 2 || y === 4)) await S(`comptes-${2026 + y}`); await holdOn(pg, '#af-ok'); await pg.waitForTimeout(reduced ? 80 : 450); }
    if (!(await has(pg, '#pr-ok'))) { errors.push(`${name} : le récap ne s’ouvre pas en ${2026 + y}`); break; }
    await layout(pg, name, `récap ${2026 + y}`); if (reduced && y < 1) await S(`recap-${2026 + y}`);
    await holdOn(pg, '#pr-ok'); await pg.waitForTimeout(reduced ? 80 : 1200);
    await layout(pg, name, `bilan ${2026 + y}`); if ((reduced && (y < 2 || y % 6 === 5)) || (!reduced && y === 0)) await S(`bilan-${2026 + y}`);
    await tap(pg, '#end-go'); await pg.waitForTimeout(reduced ? 60 : 250); y++;
  }
  if (years >= 20) {
    check(await has(pg, '#replay'), `${name} : pas d’écran de fin après ${y} ans`); check(comptes > 0, `${name} : jamais d’écran « Que fais-tu du résultat ? »`); await layout(pg, name, 'fin'); await S('fin');
    const st = await pg.evaluate(() => { const bad = []; (function scan(o, p) { if (typeof o === 'number' && !Number.isFinite(o)) bad.push(p); else if (o && typeof o === 'object') for (const k in o) scan(o[k], p + '.' + k); })(ST, 'ST'); return { bad, net: net(), real: real(net()), debts: ST.debts.reduce((a, d) => a + d.left, 0), cpi: ST.cpi }; });
    check(!st.bad.length, `${name} : valeurs non finies ${st.bad.slice(0, 3).join(', ')}`);
    check(st.real >= -50000, `${name} : patrimoine final ${Math.round(st.real)} € réels`);
    console.log(`${name} : fin de partie, patrimoine ${Math.round(st.real).toLocaleString('fr-FR')} € de 2026, dettes ${Math.round(st.debts).toLocaleString('fr-FR')} €`);
  } else { await pg.reload(); await pg.waitForTimeout(250); await tap(pg, '#t-cont'); check(await has(pg, '#scr-hub:not([hidden])'), `${name} : la sauvegarde ne recharge pas`); }
  console.log(`${name}${reduced ? '' : ' (animations)'} : ${y} années, ${quarters} trimestres joués, ${comptes} clôtures de comptes, ${relaunch} relance(s)`);
  await browser.close();
}

const t0 = Date.now();
try {
  for (const [name, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
    if (only && only !== name) continue;
    const plan = name === 'mobile' ? { sx: 'f', city: 'paris', start: 'com', home: 'coloc', prod: 'cosm', bank: 8000, seed: 20261114 } : { sx: 'h', city: 'nantes', start: 'auto', home: 'studio', prod: 'cafe', bank: 12000, seed: 4242 };
    await run(name, vp, false, Math.min(1, MAXY), plan);
    await run(name, vp, true, Math.min(20, MAXY), plan);
  }
} catch (e) { errors.push('arrêt : ' + e.message.split('\n')[0]); }
console.log(`${((Date.now() - t0) / 1000).toFixed(0)} s · captures dans saison4/tests/screenshots/`);
if (errors.length) { console.log('✗ ' + errors.length + ' problème(s)\n  ' + errors.slice(0, 40).join('\n  ')); process.exit(1); }
console.log('✓ Aucune erreur, aucun débordement, aucune valeur illisible');
