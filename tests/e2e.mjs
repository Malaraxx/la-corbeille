// Test de bout en bout dans un vrai navigateur (optionnel).
// Installation une fois : npm i -D playwright && npx playwright install chromium
// Lancement            : npm run e2e
// Joue une partie complète sur index.html, en desktop clair puis en mobile sombre,
// vérifie l'absence d'erreur JavaScript et de défilement horizontal, et enregistre des captures
// dans tests/screenshots/ (ignoré par git).
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Playwright n’est pas installé. Lance : npm i -D playwright && npx playwright install chromium'); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, 'index.html')).href;
const out = join(root, 'tests', 'screenshots');
mkdirSync(out, { recursive: true });

// Les décisions obligatoires arrivent une par une dans une fenêtre : répondre, puis « Continuer ».
async function decide(pg) {
  const o = { timeout: 3000 };
  for (let k = 0; k < 8; k++) {
    if (await pg.$('[data-act=quiet-ok]')) { await pg.click('[data-act=quiet-ok]', o); continue; }
    if (await pg.$('[data-act=chap-ok]')) { await pg.click('[data-act=chap-ok]', o); continue; }
    if (await pg.$('[data-act=dec-ok]')) { await pg.click('[data-act=dec-ok]', o); continue; }
    if (await pg.$('[data-act=life]')) { // une réponse peut être refusée (apport insuffisant) : on essaie les suivantes
      const n = (await pg.$$('[data-act=life]')).length;
      for (let i = 0; i < n && !(await pg.$('[data-act=dec-ok]')); i++) await pg.click(`[data-act=life] >> nth=${i}`, o);
      continue; }
    if (await pg.$('[data-act=ev-pass]')) { await pg.click('[data-act=ev-pass]', o); continue; }
    if (await pg.$('[data-act=ev-choice]')) { // un choix peut être refusé (pas assez d'argent) : on essaie les autres, du dernier au premier
      const n = (await pg.$$('[data-act=ev-choice]')).length;
      for (let i = n - 1; i >= 0 && !(await pg.$('[data-act=dec-ok]')); i--) await pg.click(`[data-act=ev-choice] >> nth=${i}`, o);
      continue; }
    break;
  }
}
// Tout tient sur un écran : la page elle-même ne défile jamais.
async function noScroll(pg, name, where) {
  if (await pg.evaluate('document.documentElement.scrollHeight > window.innerHeight + 1 || document.documentElement.scrollWidth > window.innerWidth + 1')) errors.push(`${name} : la page défile (${where})`);
  const over = await pg.evaluate(`[...document.querySelectorAll('.card')].filter(c => c.scrollHeight > c.clientHeight + 2).map(c => c.className.split(' ').filter(k => k !== 'more').pop())`);
  if (over.length) console.log(`  ${name} · ${where} : défilement interne dans ${over.join(', ')}`);
}

async function step(pg) {
  const o = { timeout: 3000 };
  if (await pg.$('[data-act=skip-anim]')) return pg.click('[data-act=skip-anim]', o);
  if (await pg.$('[data-act=next]')) return pg.click('[data-act=next]', o);
  await decide(pg);
  if (await pg.$('[data-act=achat]:not([disabled])') && Math.random() < .3) await pg.click('[data-act=achat]:not([disabled]) >> nth=0', o);
  await pg.click('[data-act=end]', o);
}

const errors = [];
const browser = await chromium.launch();
for (const [name, viewport, colorScheme] of [['desktop', { width: 1280, height: 720 }, 'light'], ['mobile', { width: 390, height: 844 }, 'dark']]) {
  const ctx = await browser.newContext({ viewport, colorScheme });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(`${name} : ${e.message}`));
  pg.on('console', m => { const where = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(where + ' ' + m.text())) errors.push(`${name} : ${m.text()} ${where}`.trim()); });
  pg.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${name} : échec de chargement ${r.url()}`); });
  await pg.goto(url);
  // création du profil
  await pg.click('[data-act=set][data-k=city][data-v=lyon]');
  await pg.click('[data-act=set][data-k=sal][data-v="2"]');
  await pg.click('[data-act=set][data-k=couple][data-v=true]');
  await pg.screenshot({ path: join(out, `${name}-0-depart.png`), fullPage: false });
  await noScroll(pg, name, 'création du profil');
  if (!(await pg.$('.warnbox'))) errors.push(`${name} : avertissement absent de l’écran de départ`);
  await pg.click('.warnbox [data-act=rules]'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(out, `${name}-0b-regles.png`), fullPage: false });
  await pg.keyboard.press('Escape');
  if (await pg.$('#rules')) errors.push(`${name} : Échap ne ferme pas les règles`);
  await pg.click('[data-act=start]');
  // choix du logement
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: join(out, `${name}-1a-logement.png`), fullPage: false });
  await pg.click('.opt.reco');
  await pg.click('[data-act=onb-next]');
  await pg.waitForTimeout(500);
  if (!(await pg.$('[data-act=chap-ok]'))) errors.push(`${name} : pas de carte de chapitre au départ`);
  await pg.screenshot({ path: join(out, `${name}-1e-chapitre.png`), fullPage: false });
  await decide(pg);
  // les quatre onglets
  await pg.waitForTimeout(500);
  await noScroll(pg, name, 'profil');
  await pg.screenshot({ path: join(out, `${name}-1-profil.png`), fullPage: false });
  for (const v of ['portefeuille', 'immo', 'patrimoine']) {
    await pg.click(`[data-act=view][data-view=${v}]`); await pg.waitForTimeout(500); await noScroll(pg, name, v);
    await pg.screenshot({ path: join(out, `${name}-1-${v}.png`), fullPage: false });
    if (v === 'immo') { await pg.click('[data-act=dossier] >> nth=1'); await pg.waitForTimeout(400); await pg.screenshot({ path: join(out, `${name}-1-dossier.png`), fullPage: false }); await pg.click('[data-act=dos-close]'); }
  }
  await pg.click('[data-act=view][data-view=profil]');
  await pg.click('[data-act=end]');
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: join(out, `${name}-2-animation.png`) });
  if (await pg.$('[data-act=skip-anim]')) await pg.click('[data-act=skip-anim]');
  // L'animation est vérifiée ci-dessus ; on la coupe ensuite pour éviter les courses entre clics et minuteries.
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  let une = false, bil = false, last = '', same = 0;
  for (let i = 0; i < 800 && (await pg.evaluate('S.phase')) !== 'end'; i++) {
    const where = await pg.evaluate("S.phase+' '+S.year+' '+(S.event?S.event.id:'-')");
    same = where === last ? same + 1 : 0; last = where;
    if (same > 25) { errors.push(`${name} : partie bloquée (${where})`); break; }
    if (!une && (await pg.evaluate("S.phase==='turn'&&!!S.event&&!S.event.answered&&S.year>2032"))) { une = true; await pg.waitForTimeout(500); await pg.screenshot({ path: join(out, `${name}-2b-une.png`), fullPage: false }); }
    if (!bil && (await pg.evaluate("S.phase==='bilan'&&S.year>2040"))) { bil = true; await pg.waitForTimeout(1000); await noScroll(pg, name, 'bilan'); await pg.screenshot({ path: join(out, `${name}-2c-bilan.png`), fullPage: false }); }
    try { await step(pg); } catch { await pg.waitForTimeout(150); } // un clic manqué n'est pas un bug : on réessaie
  }
  if ((await pg.evaluate('S.phase')) !== 'end') errors.push(`${name} : la partie n’est pas allée jusqu’au bout`);
  await pg.click('[data-act=copy]');
  await pg.screenshot({ path: join(out, `${name}-3-fin.png`), fullPage: false });
  if (await pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')) errors.push(`${name} : défilement horizontal`);
  console.log(`✓ ${name} : partie terminée, score ${await pg.evaluate('finalScore().score')}, ${await pg.evaluate('Object.keys(S.ach).length')} succès`);
  await ctx.close();
}
// Petits écrans : une fenêtre de décision ne dépasse jamais de l'écran et ses boutons restent visibles.
async function modalFits(pg, name) {
  const r = await pg.evaluate(`(() => { const m = document.querySelector('.dmodal'); if (!m) return null; const b = m.getBoundingClientRect();
    const btn = [...m.querySelectorAll('.decision button, .btns button')].filter(x => !x.disabled).pop(); const k = btn && btn.getBoundingClientRect();
    return { top: b.top, bottom: b.bottom, h: innerHeight, btn: k ? k.bottom <= Math.min(b.bottom, innerHeight) + 1 && k.top >= b.top - 1 : true }; })()`);
  if (r && (r.top < -1 || r.bottom > r.h + 1)) errors.push(`${name} : la fenêtre dépasse de l’écran (${Math.round(r.top)} → ${Math.round(r.bottom)} pour ${r.h})`);
  if (r && !r.btn) errors.push(`${name} : le bouton de choix est caché`);
}
// Profil sur mesure : saisir son salaire, son loyer et ses charges, puis les retrouver dans le budget du mois.
for (const [name, viewport] of [['perso-desktop', { width: 1280, height: 720 }], ['perso-mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(`${name} : ${e.message}`));
  await pg.goto(url);
  await pg.click('[data-act=set][data-k=couple][data-v=true]');
  await pg.click('[data-act=custom]');
  for (const [k, v] of [['sal', '2800'], ['salP', '2100'], ['rent', '1150'], ['dep', '2300'], ['car', '250'], ['debt', '180'], ['debtN', '3']]) { await pg.fill(`[data-cu=${k}]`, v); await pg.dispatchEvent(`[data-cu=${k}]`, 'change'); }
  await pg.selectOption('[data-cu=rooms]', '3');
  await noScroll(pg, name, 'profil sur mesure');
  await pg.screenshot({ path: join(out, `${name}-0-profil.png`) });
  await pg.fill('[data-cu=rent]', '9000'); await pg.dispatchEvent('[data-cu=rent]', 'change');
  if (!(await pg.$('[data-act=start][disabled]'))) errors.push(`${name} : un budget dans le rouge laisse commencer`);
  await pg.fill('[data-cu=rent]', '1150'); await pg.dispatchEvent('[data-cu=rent]', 'change');
  await pg.click('[data-act=start]');
  await pg.screenshot({ path: join(out, `${name}-1-logement.png`) });
  await pg.click('[data-act=onb-next]');
  await decide(pg);
  const txt = await pg.evaluate(`document.querySelector('.budget').innerText`);
  if (!/4\s?900/.test(txt) || !/1\s?150/.test(txt) || !/Autre crédit/.test(txt)) errors.push(`${name} : budget du mois sans la saisie (${txt.replace(/\s+/g, ' ')})`);
  await pg.screenshot({ path: join(out, `${name}-2-budget.png`) });
  // annuler le dernier ordre
  const c0 = await pg.evaluate('S.cash');
  await pg.click('[data-act=achat]:not([disabled]) >> nth=0');
  if (!(await pg.$('[data-act=undo]'))) errors.push(`${name} : pas de bouton pour annuler le dernier ordre`);
  else { await pg.click('[data-act=undo]'); if (Math.abs((await pg.evaluate('S.cash')) - c0) > 0.5) errors.push(`${name} : l’annulation ne rend pas l’argent`); }
  if (!(await pg.$('.tuto'))) errors.push(`${name} : pas de premiers pas la première année`);
  console.log(`✓ ${name} : profil sur mesure saisi et repris dans le budget`);
  await ctx.close();
}
for (const [name, viewport, colorScheme] of [['petit-1280x600', { width: 1280, height: 600 }, 'light'], ['petit-360x640', { width: 360, height: 640 }, 'dark']]) {
  const ctx = await browser.newContext({ viewport, colorScheme, reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(`${name} : ${e.message}`));
  await pg.goto(url);
  await pg.click('[data-act=start]'); await modalFits(pg, name + ' logement');
  await pg.screenshot({ path: join(out, `${name}-logement.png`) });
  await pg.click('.opt.reco'); await pg.click('[data-act=onb-next]');
  let inv = false, quiet = false, life = false;
  for (let i = 0; i < 40 && !(inv && quiet && life) && (await pg.evaluate('S.phase')) !== 'end'; i++) {
    if (await pg.$('[data-act=next]')) { await pg.click('[data-act=next]'); continue; }
    if (!quiet && await pg.$('[data-act=quiet-ok]')) { quiet = true; await modalFits(pg, name + ' années calmes'); await pg.screenshot({ path: join(out, `${name}-calmes.png`) }); }
    if (!inv && await pg.$('#ev-amt')) { inv = true; await modalFits(pg, name + ' investir'); await pg.screenshot({ path: join(out, `${name}-decision.png`) }); }
    if (!life && await pg.$('.dmodal.life [data-act=life]')) { life = true; await modalFits(pg, name + ' vie perso'); await pg.screenshot({ path: join(out, `${name}-vie.png`) }); }
    if (await pg.$('.dmodal')) await modalFits(pg, name + ' ' + await pg.evaluate("S.year+' '+(S.event?S.event.id:'')"));
    await decide(pg);
    await pg.click('[data-act=end]');
  }
  await pg.click('[data-act=view][data-view=profil]').catch(() => {});
  await pg.screenshot({ path: join(out, `${name}-profil.png`) });
  console.log(`✓ ${name} : fenêtres vérifiées (investir ${inv ? 'vue' : 'absente'}, vie perso ${life ? 'vue' : 'absente'}, années calmes ${quiet ? 'vues' : 'absentes'})`);
  await ctx.close();
}
await browser.close();
if (errors.length) { console.error('✗ Erreurs :\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Aucune erreur. Captures dans tests/screenshots/`);
