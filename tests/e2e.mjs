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
  const over = await pg.evaluate(`[...document.querySelectorAll('.card')].filter(c => c.scrollHeight > c.clientHeight + 2).map(c => c.className.split(' ').pop())`);
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
  await pg.click('[data-act=start]');
  // choix du logement
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: join(out, `${name}-1a-logement.png`), fullPage: false });
  await pg.click('.opt.reco');
  await pg.click('[data-act=onb-next]');
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
await browser.close();
if (errors.length) { console.error('✗ Erreurs :\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Aucune erreur. Captures dans tests/screenshots/`);
