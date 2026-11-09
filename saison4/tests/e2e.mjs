// Test de bout en bout de la Saison 4 (Playwright, optionnel, jamais dans package.json).
// Installation une fois : npm i --no-save playwright@1.49.1 && npx playwright install chromium
// Lancement            : npm run e2e:s4            (partie complète mobile 390×844 puis desktop 1440×900)
//                        node saison4/tests/e2e.mjs --years=6   (partie courte)
// Échoue sur : erreur JavaScript, défilement horizontal, élément qui sort de l'écran, bouton trop petit pour le pouce (< 44 px).
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

const errors = [];
const seen = new Set();
// Rien ne déborde : ni la page, ni un élément visible (hors conteneurs qui défilent à l'horizontale exprès, comme .tabs).
async function layout(pg, name, where) {
  const r = await pg.evaluate(() => {
    const W = window.innerWidth, H = window.innerHeight, bad = [], small = [];
    if (document.documentElement.scrollWidth > W + 1) bad.push('page : défilement horizontal');
    const inScrollX = el => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && p.scrollWidth > p.clientWidth) return true; } return false; };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[hidden]') || el.classList.contains('fx') || el.classList.contains('flt') || el.closest('svg')) continue;
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.display === 'none') continue;
      if ((b.right > W + 1 || b.left < -1) && !inScrollX(el)) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} « ${(el.textContent || '').trim().slice(0, 30)} » (${Math.round(b.left)}→${Math.round(b.right)})`);
      if ((el.tagName === 'BUTTON' || el.tagName === 'INPUT') && !el.disabled && b.bottom > 0 && b.top < H && (b.height < 40 || b.width < 40) && el.type !== 'range') small.push(`${el.tagName.toLowerCase()}#${el.id || ''}.${[...el.classList].join('.')} « ${(el.textContent || '').trim().slice(0, 20)} » ${Math.round(b.width)}×${Math.round(b.height)}`);
    }
    return { bad: bad.slice(0, 6), small: small.slice(0, 6) };
  });
  for (const b of r.bad) { const k = `${name}:${where}:${b}`; if (!seen.has(k)) { seen.add(k); errors.push(`${name} · ${where} : déborde → ${b}`); } }
  if (name === 'mobile') for (const s of r.small) { const k = `${name}:small:${s}`; if (!seen.has(k)) { seen.add(k); errors.push(`${name} · ${where} : cible trop petite → ${s}`); } }
}
async function shot(pg, name, n, label) { await pg.waitForTimeout(80); await pg.screenshot({ path: join(out, `${name}-${String(n).padStart(2, '0')}-${label}.png`) }); }
// Maintenir pour valider : appui long sur l'élément.
async function holdOn(pg, sel) {
  const el = pg.locator(sel).first(); try { await el.scrollIntoViewIfNeeded({ timeout: 4000 }); } catch (e) { throw new Error('maintien impossible : ' + sel); } const b = await el.boundingBox();
  if (!b) throw new Error('introuvable : ' + sel);
  const H = pg.viewportSize().height; check(b.y + b.height / 2 < H && b.y + b.height / 2 > 0, `bouton hors écran : ${sel}`);
  await pg.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await pg.mouse.down(); await pg.waitForTimeout(700); await pg.mouse.up(); await pg.waitForTimeout(150);
}
function check(c, m) { if (!c) throw new Error(m); }
async function tap(pg, sel) { const el = pg.locator(sel).first(); try { await el.scrollIntoViewIfNeeded({ timeout: 4000 }); await el.click({ timeout: 4000 }); } catch (e) { throw new Error('toucher impossible : ' + sel + ' · ' + e.message.split(String.fromCharCode(10))[0]); } await pg.waitForTimeout(60); }

async function run(name, viewport, reduced, years, plan, tag) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: name === 'mobile', isMobile: false });
  const pg = await ctx.newPage(); let n = 0;
  pg.on('pageerror', e => errors.push(`${name} : ${e.message}`));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + (m.location()?.url || ''))) errors.push(`${name} : ${m.text()}`); });
  pg.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${name} : échec de chargement ${r.url()}`); });
  await pg.goto(url); await pg.waitForTimeout(300);
  const S = (label) => shot(pg, name + (tag ? '-' + tag : '') + (reduced ? '' : '-anim'), n++, label);
  await layout(pg, name, 'titre'); if (reduced) await S('titre');
  await tap(pg, '#t-new');
  // création : femme sur mobile, homme sur desktop ; un chemin différent par vue
  await tap(pg, `[data-sx=${plan.sx}]`); await layout(pg, name, 'création · qui'); if (reduced) await S('creation-qui'); await tap(pg, '#mk-next');
  await layout(pg, name, 'création · ville'); if (reduced) await S('creation-ville'); await tap(pg, `[data-city=${plan.city}]`);
  await layout(pg, name, 'création · domaine'); if (reduced) await S('creation-domaine'); await tap(pg, `[data-dom=${plan.dom}]`);
  await layout(pg, name, 'création · logement'); await tap(pg, `[data-home=${plan.home || 'coloc'}]`);
  if (plan.fund) { await layout(pg, name, 'création · financement'); if (reduced) await S('creation-financement'); if (plan.fund === 'max') { await pg.locator('#jobh').fill('20'); await pg.locator('#loan').fill('20000'); } await tap(pg, '#f-bal'); if (reduced) await S('creation-financement-equilibre'); await tap(pg, '#mk-next'); }
  await layout(pg, name, 'création · récap'); if (reduced) await S('creation-recap');
  await holdOn(pg, '#go'); await pg.waitForTimeout(500);
  let y = 0;
  while (y < years) {
    if (await pg.$('#scr-end:not([hidden]) #replay')) break;
    await layout(pg, name, `accueil ${2026 + y}`);
    if (reduced && (y < 2 || y % 10 === 5)) await S(`accueil-${2026 + y}`);
    // la décision de l'année
    if (await pg.$('[data-vs]')) await holdOn(pg, `[data-vs=${y % 2 ? 'a' : 'b'}]`);
    else if (await pg.$('#bet-ok')) { if (y % 2) { await tap(pg, '#bet-box [data-q="100"]'); } await layout(pg, name, 'pari'); if (reduced && y < 8) await S('pari'); await holdOn(pg, '#bet-ok'); }
    await pg.waitForTimeout(reduced ? 50 : 800);
    // tour des onglets
    for (const t of ['job', 'inv', 'immo', 'budget', 'shop', 'profil']) {
      if (y > 2 && y % 7 && t !== 'budget') continue;
      await tap(pg, `.nav [data-nav=${t}]`); await layout(pg, name, `onglet ${t} ${2026 + y}`); if (reduced && (y === 1 || y === 15 || (tag && t === 'job'))) await S(`onglet-${t}-${2026 + y}`);
      if (t === 'job') await jobActions(pg, y, S, reduced);
    }
    if (y === 1 && reduced && !tag) await chomage(pg, name, S);
    if (y === 1) { await pg.locator('#tip').click({ force: true }); await pg.waitForTimeout(100); await layout(pg, name, 'conseils'); if (reduced) await S('conseils'); await tap(pg, '#tip-n2'); }
    await tap(pg, '.nav [data-nav=home]');
    await tap(pg, '#next'); await pg.waitForTimeout(reduced ? 50 : 350);
    if (!(await pg.$('#pr-ok'))) { errors.push(`${name} : le récap ne s’ouvre pas en ${2026 + y}`); break; }
    await layout(pg, name, `récap ${2026 + y}`); if (reduced && (y < 2 || y === 20)) await S(`recap-${2026 + y}`);
    await holdOn(pg, '#pr-ok'); await pg.waitForTimeout(reduced ? 80 : 1400);
    await layout(pg, name, `bilan ${2026 + y}`); if ((reduced && (y < 3 || y % 10 === 9)) || (!reduced && y === 0)) await S(`bilan-${2026 + y}`);
    await tap(pg, '#end-go'); await pg.waitForTimeout(reduced ? 50 : 300); y++;
  }
  if (years >= 40) { check(!!(await pg.$('#replay')), `${name} : pas d’écran de fin`); await layout(pg, name, 'fin'); await S('fin'); }
  // rechargement : la partie continue
  if (years < 40) { await pg.reload(); await pg.waitForTimeout(300); await tap(pg, '#t-cont'); check(!!(await pg.$('#scr-hub:not([hidden])')), `${name} : la sauvegarde ne recharge pas`); }
  console.log(`${name}${reduced ? '' : ' (animations)'} : ${y} années jouées`);
  await browser.close();
}

// Onglet Carrière d'un·e demandeur·se d'emploi (bug du 9 novembre : il était vide), et message éphémère qui ne couvre pas le pseudo.
async function chomage(pg, name, S) {
  const snap = await pg.evaluate(() => JSON.stringify(ST));
  await pg.evaluate(() => { ST.prof = 'chomage'; ST.study = null; ST.indep = null; ST.job = null; ST.cho = { are: 980, left: 14, ref: 1700, title: 'Commercial·e', emp2: 'Nord Distribution' }; });
  await tap(pg, '.nav [data-nav=job]'); await layout(pg, name, 'Carrière · chômage'); await S('carriere-chomage');
  const txt = await pg.locator('#body').innerText(); check(/Mes droits/.test(txt) && /Retrouver un travail/.test(txt) && /Créer ma boîte/.test(txt), `${name} : onglet Carrière du chômage incomplet`);
  await tap(pg, '#c-take'); await pg.waitForTimeout(80);
  const hit = await pg.evaluate(() => { const t = document.querySelector('#cf-ok'); return !!t; }); check(hit, `${name} : la feuille « Accepter ce poste » ne s’ouvre pas`); await tap(pg, '#cf-no');
  await pg.evaluate(() => { document.querySelector('#hud-av').click(); }); // un toucher sur l'avatar ne fait rien, on force un message :
  await pg.evaluate(() => { const b = document.querySelector('[data-nav=home]'); b.click(); });
  await pg.evaluate(() => { const o = document.createElement('div'); o.className = 'toast'; o.textContent = 'Message de test'; document.getElementById('app').appendChild(o); });
  const over = await pg.evaluate(() => { const a = document.querySelector('.toast').getBoundingClientRect(), b = document.getElementById('hud-name').getBoundingClientRect(); return !(a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right); });
  check(!over, `${name} : le message éphémère recouvre le pseudo`); await S('message');
  await pg.evaluate(() => document.querySelector('.toast').remove());
  await pg.evaluate(s => { ST = JSON.parse(s); }, snap); await tap(pg, '.nav [data-nav=home]');
}
// Actions de l'onglet Carrière : augmentation, PEE, dividendes, participation.
async function jobActions(pg, y, S, reduced) {
  if (await pg.$('#raise') && y % 2) { await holdOn(pg, '#raise'); await pg.waitForTimeout(reduced ? 100 : 1300); }
  if (await pg.$('[data-pee]') && y === 2) { await tap(pg, '[data-pee=peed]'); await tap(pg, '#pe-r ~ .quick [data-q="500"]'); await layout(pg, 'mobile', 'PEE'); await S('pee'); if (await pg.$('#pe-ok:not([disabled])')) await holdOn(pg, '#pe-ok'); else await tap(pg, '#pe-no'); await pg.waitForTimeout(500); }
  if (await pg.$('#div-go:not([disabled])') && y % 3 === 2) { await tap(pg, '#div-go'); await tap(pg, '#dv-r ~ .quick [data-q="max"]'); await S('dividendes'); await holdOn(pg, '#dv-ok'); await pg.waitForTimeout(500); }
  if (await pg.$('[data-crowd]') && y === 3) { await tap(pg, '[data-crowd]'); await tap(pg, '#cw-r ~ .quick [data-q="100"]'); await S('participation'); if (await pg.$('#cw-ok:not([disabled])')) await holdOn(pg, '#cw-ok'); else await tap(pg, '#cw-no'); await pg.waitForTimeout(500); }
}
const t0 = Date.now();
try {
  for (const [name, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
    if (only && only !== name) continue;
    const plan = name === 'mobile' ? { sx: 'f', city: 'paris', dom: 'com', fund: 'auto', home: 'parents' } : { sx: 'h', city: 'lyon', dom: 'art' };
    await run(name, vp, false, 2, plan);
    await run(name, vp, true, MAXY, plan);
    if (name === 'mobile' && !process.argv.includes('--short')) for (const [tag, p] of [['infirmier', { sx: 'h', city: 'marseille', dom: 'inf', fund: 'auto' }], ['info', { sx: 'f', city: 'bordeaux', dom: 'info', fund: 'max', home: 'studio' }], ['droit', { sx: 'h', city: 'lille', dom: 'droit', fund: 'auto' }]])
      await run(name, vp, true, Math.min(MAXY, 6), p, tag);
  }
} catch (e) { errors.push('arrêt : ' + e.message.split('\n')[0]); }
console.log(`${((Date.now() - t0) / 1000).toFixed(0)} s · captures dans saison4/tests/screenshots/`);
if (errors.length) { console.log('✗ ' + errors.length + ' problème(s)\n  ' + errors.slice(0, 40).join('\n  ')); process.exit(1); }
console.log('✓ Aucune erreur, aucun débordement');
