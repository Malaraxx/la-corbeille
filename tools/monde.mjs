// Raconte un monde généré, année par année, sans joueur : pour juger d'un coup d'œil s'il est crédible.
// Usage : node tools/monde.mjs              → un monde au hasard
//         node tools/monde.mjs --seed=42    → toujours le même monde
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedArg = process.argv.find(a => a.startsWith('--seed='));
const seed = seedArg ? +seedArg.split('=')[1] : (Date.now() % 1e9);
const html = readFileSync(join(root, 'src', 'la-corbeille.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const store = {};
const ctx = { console, Intl, JSON, performance: { now: () => 0 }, Math: Object.assign(Object.create(Math), { random: () => 0.5 }), Date: { now: () => seed },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
vm.createContext(ctx);
vm.runInContext(js + ';globalThis.T={get S(){return S},newGame,startTurn,endTurn,nextBilan,answerEvent,answerLife,evDef,themeStage,PHASES,PARTIS,THEMES,Y0,YN};', ctx);
const T = ctx.T;

const f1 = x => x.toFixed(1).replace('.', ',');
const pc = x => (x >= 0 ? '+' : '') + Math.round(x * 100) + ' %';
T.newGame('heritier', []);
console.log(`Monde n° ${seed} · ${T.Y0} → ${T.YN}\n`);
console.log('Année  Phase       Crois.  Infl.  BCE    OAT10  Crédit  PER   Paris   Monde   Événement');
const themesSeen = new Set();
while (T.S.phase !== 'end') {
  const S = T.S;
  if (S.phase !== 'turn') { T.nextBilan(); continue; }
  const y = S.year, f = S.fut[y], m = f.mac, sh = k => f.shock ? f.shock[k] / 100 : 0;
  const tr = (1 + sh('tracker')) * (1 + (S.pending[y]?.tracker ?? f.r.tracker)) - 1, mo = (1 + sh('monde')) * (1 + f.r.monde) - 1;
  let ev = S.event ? T.evDef().view(S.event.p).title.replace(/<[^>]+>/g, '') : '—';
  if (f.elec) { const E = f.elec[f.elec.win]; ev += ` → élu·e : ${E.name} (${T.PARTIS[E.party].n})`; }
  console.log(`${y}   ${T.PHASES[f.phase].n.padEnd(11)} ${f1(m.g).padStart(5)}  ${f1(m.infl).padStart(5)}  ${f1(m.rate).padStart(4)}   ${f1(m.r10).padStart(4)}   ${f1(m.credit).padStart(4)}   ${f1(m.pe).padStart(4)}  ${pc(tr).padStart(6)}  ${pc(mo).padStart(6)}   ${ev}`);
  S.th.forEach((th, i) => { const st = T.themeStage(th, y); if (st && !themesSeen.has(th.k + st) && ['rumeur', 'lancement', 'bulle', 'krach', 'echec'].includes(st)) { themesSeen.add(th.k + st); console.log(`       ↳ ${th.n} : ${st}`); } });
  if (S.life) T.answerLife(S.life.v.choices[0].id);
  if (S.event) T.answerEvent('pass');
  T.endTurn();
}
const p = T.S.pol;
console.log(`\nRègles en ${T.YN} : flat tax ${f1((p.ir + p.ps) * 100)} %, plafond PEA ${p.peaCap.toLocaleString('fr-FR')} €, Livret A plafonné à ${p.livCap.toLocaleString('fr-FR')} €, retraite à ${p.ageLegal} ans.`);
