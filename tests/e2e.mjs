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

async function step(pg) {
  const o = { timeout: 3000 };
  if (await pg.$('[data-act=skip-anim]')) return pg.click('[data-act=skip-anim]', o);
  if (await pg.$('[data-act=next]')) return pg.click('[data-act=next]', o);
  if (await pg.$('[data-act=life]')) await pg.click('[data-act=life] >> nth=0', o);
  if (await pg.$('[data-act=ev-pass]')) await pg.click('[data-act=ev-pass]', o);
  else { // un choix peut être refusé (pas assez d'argent) : on essaie les autres, du dernier au premier
    const n = (await pg.$$('[data-act=ev-choice]')).length;
    for (let i = n - 1; i >= 0 && (await pg.$('[data-act=ev-choice]')); i--) await pg.click(`[data-act=ev-choice] >> nth=${i}`, o);
  }
  if (await pg.$('.idle [data-act=place]')) await pg.click('.idle [data-act=place]', o);
  await pg.click('[data-act=end]', o);
}

const errors = [];
const browser = await chromium.launch();
for (const [name, viewport, colorScheme] of [['desktop', { width: 1280, height: 900 }, 'light'], ['mobile', { width: 390, height: 844 }, 'dark']]) {
  const ctx = await browser.newContext({ viewport, colorScheme });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(`${name} : ${e.message}`));
  pg.on('console', m => { const where = (m.location() && m.location().url) || ''; if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(where + ' ' + m.text())) errors.push(`${name} : ${m.text()} ${where}`.trim()); });
  pg.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${name} : échec de chargement ${r.url()}`); });
  await pg.goto(url);
  await pg.click('[data-act=arch][data-k=fondatrice]');
  await pg.screenshot({ path: join(out, `${name}-0-depart.png`), fullPage: true });
  await pg.click('[data-act=start]');
  await pg.click('[data-act=enquete]');
  await pg.click('[data-act=prof][data-p="0.8"]');
  await pg.click('.idle [data-act=place]');
  if (await pg.$('[data-act=ev-pass]')) await pg.click('[data-act=ev-pass]');
  await pg.screenshot({ path: join(out, `${name}-1-tour.png`), fullPage: true });
  await pg.click('[data-act=end]');
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: join(out, `${name}-2-animation.png`) });
  if (await pg.$('[data-act=skip-anim]')) await pg.click('[data-act=skip-anim]');
  // L'animation est vérifiée ci-dessus ; on la coupe ensuite pour éviter les courses entre clics et minuteries.
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  let une = false, last = '', same = 0;
  for (let i = 0; i < 800 && (await pg.evaluate('S.phase')) !== 'end'; i++) {
    const where = await pg.evaluate("S.phase+' '+S.year+' '+(S.event?S.event.id:'-')");
    same = where === last ? same + 1 : 0; last = where;
    if (same > 25) { errors.push(`${name} : partie bloquée (${where})`); break; }
    if (!une && (await pg.evaluate("S.phase==='turn'&&!!S.event&&S.year>2032"))) { une = true; await pg.screenshot({ path: join(out, `${name}-2b-une.png`), fullPage: true }); }
    try { await step(pg); } catch { await pg.waitForTimeout(150); } // un clic manqué n'est pas un bug : on réessaie
  }
  if ((await pg.evaluate('S.phase')) !== 'end') errors.push(`${name} : la partie n’est pas allée jusqu’au bout`);
  await pg.click('[data-act=copy]');
  await pg.screenshot({ path: join(out, `${name}-3-fin.png`), fullPage: true });
  if (await pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')) errors.push(`${name} : défilement horizontal`);
  console.log(`✓ ${name} : partie terminée, score ${await pg.evaluate('finalScore().score')}, ${await pg.evaluate('Object.keys(S.ach).length')} succès`);
  await ctx.close();
}
await browser.close();
if (errors.length) { console.error('✗ Erreurs :\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Aucune erreur. Captures dans tests/screenshots/`);
