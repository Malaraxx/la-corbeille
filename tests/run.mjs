// Tests de La Corbeille — sans dépendance, Node ≥ 18.
//   node tests/run.mjs             tests rapides (≈ 30 s)
//   node tests/run.mjs --full      plus de parties (≈ 3 min)
//   node tests/run.mjs --balance   rapport d'équilibrage (≈ 5 min, avertissements seulement)
//   node tests/run.mjs --seed=42   rejoue une graine précise
//
// Le moteur est chargé tel quel depuis src/la-corbeille.html dans un bac à sable `vm` :
// pas de DOM, mais toutes les fonctions de rendu (turnView, bilanView, endView…) sont appelées
// pour vérifier qu'elles produisent du HTML sans planter.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const FULL = args.includes('--full');
const BALANCE = args.includes('--balance');
const seedArg = args.find(a => a.startsWith('--seed='));
let seed = seedArg ? +seedArg.split('=')[1] : (Date.now() % 1e9);

// ---------- PRNG déterministe partagé par le jeu et les stratégies de test
function mulberry(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = mulberry(seed);

// ---------- chargement du moteur
const html = readFileSync(join(root, 'src', 'la-corbeille.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const store = {};
const ctx = {
  console, Intl, JSON, performance: { now: () => 0 },
  Math: Object.assign(Object.create(Math), { random: R }),
  Date: { now: () => 1 },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
};
vm.createContext(ctx);
vm.runInContext(js + `;globalThis.T={get S(){return S},set S(v){S=v},newGame,startTurn,endTurn,nextBilan,buyIn,sellIn,livIn,livOut,withdraw,
  buyProp,sellProp,reneg,canReneg,answerEvent,answerLife,evDef,LIFE,net,tradable,ORDER,ENVS,META,EQUITY,ARCH,GOALS,ACH,ADV,H,HIST_YEARS,hv,ev,
  eligEnvs,peaCap,envTotal,turnReady,finalScore,placeIdle,rebalance,dry,alloc,eqShare,irr,invData,coups,epilogue,shareText,
  turnView,bilanView,endView,introView,allocSec,invSec,animHtml,toastsHtml,advHtml,spark,save,load,U};`, ctx);
const T = ctx.T;

// ---------- mini framework
let pass = 0, fail = 0;
function check(cond, msg) { if (!cond) throw new Error(msg); }
function test(name, fn) {
  const t0 = Date.now();
  try { fn(); pass++; console.log(`✓ ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); }
  catch (e) { fail++; console.log(`✗ ${name}\n    ${e.message}\n    rejouer : node tests/run.mjs --seed=${seed}`); }
}
const pickR = a => a[Math.floor(R() * a.length)];
function scanNumbers(o, path = 'S') {
  if (typeof o === 'number') { check(Number.isFinite(o), `valeur non finie en ${path}`); return; }
  if (o && typeof o === 'object') for (const k in o) scanNumbers(o[k], `${path}.${k}`);
}

// ---------- stratégies de jeu
const STOCK_ENVS = ['cto', 'pea', 'av'];
const randomPolicy = {
  life: (id, ch) => pickR(ch),
  event: (S, v) => {
    if (v.invest && R() < .5) {
      const as = v.invest.assets.filter(a => T.META[a].k === 'special' || T.tradable(a));
      const a = as[0], envs = T.eligEnvs(a);
      return ['invest', a, Math.floor(S.cash * R() * .5) + 1, pickR(envs)];
    }
    if (v.choices && v.choices.length && R() < .7) return ['choice', pickR(v.choices).id];
    return null;
  },
  port: S => {
    for (const e of STOCK_ENVS) for (const id of T.ENVS[e].el) {
      if (!T.tradable(id)) continue;
      if (R() < .1) T.buyIn(e, id, S.cash * R() * .4);
      if (R() < .07 && T.ev(e, id) > 0) T.sellIn(e, id, T.ev(e, id) * R());
    }
    if (R() < .2) T.withdraw(R() < .5 ? 'pea' : 'av', S.acc.pea.cash * R());
    if (R() < .1) T.livIn(Math.min(S.cash, 5000));
    if (R() < .1) T.buyProp(pickR(['logement', 'bureaux', 'maison']), R() < .5 ? 'cash' : 'credit');
    for (const p of S.props) if (T.canReneg(p) && R() < .5) T.reneg(p.uid);
    if (R() < .05 && S.props.length) T.sellProp(S.props[0].uid);
    if (R() < .3) T.placeIdle(R(), []);
  },
};

// Joue une partie complète. hooks.afterPort(S) permet d'insérer des vérifications pendant le tour.
function play(arch, goals, pol, hooks = {}) {
  T.newGame(arch, goals);
  let guard = 0;
  while (T.S.phase !== 'end' && guard++ < 300) {
    const S = T.S;
    if (S.phase === 'turn') {
      if (hooks.render) { T.turnView(); T.toastsHtml(); }
      if (S.life) { const ch = S.life.v.choices.map(c => c.id); T.answerLife(pol.life(S.life.id, ch)); }
      const v = T.evDef().view(S.event.p);
      let done = false;
      if (!S.lock && pol.event) { const a = pol.event(S, v); if (a) done = !T.answerEvent(...a); }
      if (!done) T.answerEvent('pass');
      check(S.event.answered, `événement ${S.event.id} sans réponse`);
      if (!S.lock && pol.port) pol.port(S);
      if (hooks.afterPort && !S.lock) hooks.afterPort(S);
      if (hooks.render) { T.turnView(); T.allocSec(); T.invSec(); }
      check(T.turnReady(), 'tour non clôturable');
      T.endTurn();
    } else {
      if (hooks.render) { T.bilanView(); T.U.anim = { i: 0 }; T.animHtml(); T.U.anim = null; }
      T.nextBilan();
    }
  }
  check(guard < 300, 'boucle infinie');
  if (hooks.render) { T.endView(); T.coups(); T.epilogue(); T.shareText(); }
  return T.S;
}

function cashIdentity(S) {
  let sum = 0;
  for (const k in S.lg.lines) { const L = S.lg.lines[k]; if (L.env === 'liv' || L.env === 'cto') for (const f of L.flows) sum += f.a; }
  for (const e of ['pea', 'av']) for (const f of S.lg.env[e]) sum += f.a;
  for (const p of S.lg.props) for (const f of p.flows) sum += f.a;
  for (const p of S.props) for (const f of (p.flows || [])) sum += f.a;
  return Math.abs(S.cash - (S.start + (S.extTot || 0) + sum));
}

function endInvariants(S) {
  scanNumbers(S);
  for (const e of STOCK_ENVS) {
    for (const k in S.acc[e].hold) check(S.acc[e].hold[k].v > -0.01, `position négative ${e}:${k}`);
    check(S.acc[e].cash > -0.01, `liquidités négatives dans ${e}`);
  }
  check(S.liv > -0.01, 'Livret A négatif');
  check(S.acc.pea.vers <= T.peaCap() + 1, 'plafond PEA dépassé');
  const left = S.liv + T.envTotal('cto') + T.envTotal('pea') + T.envTotal('av');
  check(!S.flags.faillite || left < 100, `fausse faillite : ${left.toFixed(0)} € encore placés`);
  const fs = T.finalScore();
  check(Number.isFinite(fs.score), 'score non fini');
}

// =====================================================================
console.log(`La Corbeille · tests ${FULL ? 'complets' : 'rapides'} · graine ${seed}\n`);

test('TRI : cas connus', () => {
  const near = (a, b) => Math.abs(a - b) < 1e-4;
  check(near(T.irr([{ t: 2000, a: -100 }, { t: 2010, a: 200 }]), Math.pow(2, .1) - 1), 'x2 en 10 ans ≠ 7,18 %');
  check(near(T.irr([{ t: 2000, a: -100 }, { t: 2001, a: 5 }, { t: 2002, a: 5 }, { t: 2003, a: 105 }]), .05), 'obligation 5 % ≠ 5 %');
  check(T.irr([{ t: 2000, a: -100 }]) === -1, 'perte totale ≠ −100 %');
  check(T.irr([{ t: 2000, a: -100 }, { t: 2000.2, a: 100 }]) === null, 'durée < 6 mois devrait donner null');
});

test('Parties aléatoires : invariants, rendu et identité de caisse', () => {
  const N = FULL ? 150 : 25;
  let checked = 0, worst = 0;
  for (const arch of Object.keys(T.ARCH)) for (let g = 0; g < N; g++) {
    const goals = [pickR(Object.keys(T.GOALS)), pickR(Object.keys(T.GOALS))];
    const S = play(arch, goals, randomPolicy, { render: true });
    endInvariants(S);
    if (!S.log.some(l => l.r.startsWith('Divorce'))) { const err = cashIdentity(S); worst = Math.max(worst, err); checked++; check(err < 1, `identité de caisse rompue : écart ${err.toFixed(2)} € (${arch})`); }
  }
  console.log(`    ${checked} parties vérifiées au centime · écart max ${worst.toFixed(4)} €`);
});

test('Rééquilibrage : aperçu pur, conservation de l’argent, aperçu = exécution', () => {
  const N = FULL ? 60 : 12;
  let n = 0;
  const hook = S => {
    const p = pickR([0, .2, .5, .8, 1, R()]);
    const before = T.net(), snap = JSON.stringify(S);
    const d = T.dry(() => T.rebalance(p));
    check(JSON.stringify(T.S) === snap, 'l’aperçu (dry) a modifié l’état');
    let tax = 0;
    if (R() < .5) T.placeIdle(p, []);
    else { const r = T.rebalance(p); tax = r.tax; check(Math.abs(r.after - d.after) < 1e-9, 'aperçu ≠ exécution'); }
    const err = Math.abs(T.net() + tax - before);
    check(err < 2, `argent créé ou détruit : ${err.toFixed(2)} €`);
    check(S.cash > -0.5, 'compte courant négatif après répartition');
    n++;
  };
  for (const arch of Object.keys(T.ARCH)) for (let g = 0; g < N; g++) play(arch, [], randomPolicy, { afterPort: hook });
  console.log(`    ${n} opérations contrôlées`);
});

test('Sauvegarde : l’état survit à un aller-retour JSON en cours de partie', () => {
  T.newGame('fondatrice', ['rp35', 'serein']);
  for (let i = 0; i < 6; i++) { const S = T.S; if (S.life) T.answerLife(S.life.v.choices[0].id); T.answerEvent('pass'); T.placeIdle(.6, []); T.endTurn(); T.nextBilan(); }
  T.save();
  const restored = T.load();
  check(restored && restored.v === 2, 'chargement impossible');
  check(JSON.stringify(restored) === JSON.stringify(T.S), 'état différent après rechargement');
  T.S = restored; T.turnView();
});

test('Écran de départ et personnages', () => {
  T.S = null; check(T.introView().includes('Choisis ton personnage'), 'écran de départ absent');
  for (const a of Object.keys(T.ARCH)) { T.newGame(a, ['famille']); check(T.S.cash === T.ARCH[a].cash && T.S.start === T.ARCH[a].cash, `capital de départ faux pour ${a}`); T.turnView(); }
});

// =====================================================================
if (BALANCE) {
  console.log('\nRapport d’équilibrage (avertissements seulement)\n');
  const med = a => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
  const warn = (ok, label, val, target) => console.log(`${ok ? '  OK  ' : ' WARN '} ${label.padEnd(52)} ${String(val).padStart(10)}   cible ${target}`);
  const choose = map => (id, ch) => { const w = map[id]; return w && ch.includes(w) ? w : (id === 'retraite' ? ch[Math.min(1, ch.length - 1)] : ch[0]); };
  const BAL = { diner: 'rdv', promo: 'oui', vacances: 'oui', mariage: 'oui', enfant: 'non', sport: 'oui', ami: 'non', weekend: 'partir', burnout: 'arret', rupture: 'ok', panique: 'tenir', rencontre: 'oui', maison: 'non', fire: 'non' };
  const MONEY = { ...BAL, diner: 'diner', vacances: 'non', mariage: 'non', sport: 'non', weekend: 'ecrans', rencontre: 'non' };
  const peaTracker = S => { const room = T.peaCap() - S.acc.pea.vers, a = Math.min(S.cash + S.acc.pea.cash, Math.max(0, room) + S.acc.pea.cash); if (a > 1) T.buyIn('pea', 'tracker', a); if (S.cash > 1) T.buyIn('cto', 'tracker', S.cash); };
  const run = (arch, pol, n = 150) => { const r = []; for (let i = 0; i < n; i++) { const S = play(arch, [], pol); let at2025 = null; for (const h of S.hist) if (h.x === 2025) at2025 = h.net; r.push({ real: T.finalScore().real, score: T.finalScore().score, ratio: S.bench.trk > 1000 ? T.net() / S.bench.trk : 1, at2025 }); } return r; };

  const passive = run('heritier', { life: choose(BAL), port: peaTracker });
  const career = run('heritier', { life: choose(MONEY), port: peaTracker });
  const NEXT = {}; T.HIST_YEARS.forEach((y, i) => NEXT[y] = T.HIST_YEARS[i + 1] || 2026);
  const sellAll = () => { for (const e of STOCK_ENVS) for (const id of T.ORDER) if (T.META[id].k !== 'special' && T.ev(e, id) > 0) T.sellIn(e, id, T.ev(e, id)); };
  const oracle = run('heritier', { life: choose(BAL), port: S => {
    if (S.year > 2024) { sellAll(); peaTracker(S); return; }
    const to = NEXT[S.year]; let best = null, bv = Math.pow(1.03, to - S.year);
    for (const k of ['tracker', 'telecom', 'luxe', 'banque', 'petro', 'aero', 'pharma', 'or', 'oat']) { let v = 1; for (let y = S.year; y < to; y++) v *= 1 + T.H[k][y - 2000] / 100; if (v > bv) { bv = v; best = k; } }
    sellAll(); for (const e of ['pea', 'av']) if (S.acc[e].cash > 0 && !(e === 'pea' && S.year - S.acc.pea.open < 5)) T.withdraw(e, S.acc[e].cash);
    if (!best) { T.livIn(Math.min(S.cash, 22950)); if (S.cash > 1) T.buyIn('av', 'euros', S.cash); return; }
    if (T.eligEnvs(best).includes('pea')) { const a = Math.min(S.cash + S.acc.pea.cash, T.peaCap() - S.acc.pea.vers + S.acc.pea.cash); if (a > 1) T.buyIn('pea', best, a); }
    if (S.cash > 1) T.buyIn('cto', best, S.cash);
  } });
  const greens = f => f.rows.slice(0, 4).filter(r => { if (r.v === 'en pertes') return false; const x = parseFloat(String(r.v).replace(',', '.').replace('−', '-')), th = parseFloat(r.r.slice(2).replace(',', '.')); return r.r.startsWith('<') ? x < th : x > th; }).length;
  const dip = useFiche => (S, v) => { const f = S.event.fiche; if (!f) return null;
    if (S.event.id === 'bulle') return (!useFiche || greens(f) <= 1) && v.choices && v.choices.length ? ['choice', 'vendre'] : null;
    if (!T.tradable(f.a) || (useFiche && greens(f) < 3)) return null;
    const amt = Math.floor(T.net() * .15); if (S.cash < amt && T.ev('cto', 'tracker') > 0) T.sellIn('cto', 'tracker', amt - S.cash);
    return ['invest', f.a, Math.min(amt, Math.floor(S.cash)), 'cto']; };
  const ctoPassive = S => { if (S.cash > 1) T.buyIn('cto', 'tracker', S.cash); };
  const naive = run('heritier', { life: choose(BAL), event: dip(false), port: ctoPassive });
  const reader = run('heritier', { life: choose(BAL), event: dip(true), port: ctoPassive });

  const r25 = med(oracle.map(x => x.at2025)) / med(passive.map(x => x.at2025));
  warn(r25 <= 2.6, 'Oracle historique / passif (patrimoine 2025)', '×' + r25.toFixed(2), '≤ ×2,6');
  const pr = med(passive.map(x => x.ratio));
  warn(pr >= .75 && pr <= .95, 'Passif PEA / repère Tracker sans frictions (2050)', pr.toFixed(2), '0,75 – 0,95');
  const fr = med(reader.map(x => x.real)) / med(naive.map(x => x.real));
  warn(fr >= 1.15, 'Lecteur de fiches / acheteur naïf de paniques', '×' + fr.toFixed(2), '≥ ×1,15');
  warn(med(career.map(x => x.score)) < med(passive.map(x => x.score)), 'Score carriériste < score équilibré', `${med(career.map(x => x.score))} < ${med(passive.map(x => x.score))}`, 'vrai');
  const p10 = passive.map(x => x.real).sort((a, b) => a - b)[Math.floor(passive.length * .1)];
  warn(p10 > 0, 'Patrimoine au 10e centile, joueur passif (€ de 2000)', Math.round(p10 / 1000) + ' k€', '> 0');

  // personnages : scores médians après coefficient
  const S0 = {};
  for (const a of Object.keys(T.ARCH)) S0[a] = med(run(a, { life: choose({ ...BAL, maison: 'credit' }), port: S => T.placeIdle(.6, []) }, 120).map(x => x.score));
  for (const a of Object.keys(T.ARCH)) { const q = S0[a] / S0.heritier; warn(q >= .75 && q <= 1.33, `Score médian ${a} / héritier`, q.toFixed(2), '0,75 – 1,33'); }

  // objectifs atteignables par un joueur qui les vise
  const goalRate = (arch, goal, lifeMap, port, n = 100) => { let hit = 0; for (let i = 0; i < n; i++) { const S = play(arch, [goal], { life: choose(lifeMap), port }); if (T.finalScore().gl[0].st === 1) hit++; } return hit / n; };
  const LOVE = { ...BAL, enfant: 'oui', maison: 'credit', vacances: 'oui', promo: 'non' };
  const rpSmart = S => { if (!S.props.some(p => p.type === 'maison')) { if (S.liv > 0) T.livOut(S.liv); if (T.buyProp('maison', 'credit')) { T.livIn(Math.min(S.cash, 22950)); return; } } T.placeIdle(.6, []); };
  const g1 = goalRate('heritier', 'rp35', LOVE, rpSmart); warn(g1 >= .8, 'Objectif « propriétaire avant 35 ans » (héritier)', Math.round(g1 * 100) + ' %', '≥ 80 %');
  const g2 = goalRate('infirmier', 'famille', LOVE, S => T.placeIdle(.6, [])); warn(g2 >= .5, 'Objectif « fonder une famille » (infirmier)', Math.round(g2 * 100) + ' %', '≥ 50 %');
  const g3 = goalRate('heritier', 'famille', LOVE, S => T.placeIdle(.6, [])); warn(g3 >= .25, 'Objectif « fonder une famille » (héritier)', Math.round(g3 * 100) + ' %', '≥ 25 %');
  const g4 = goalRate('heritier', 'fire', { ...BAL, fire: 'stop' }, S => T.placeIdle(.8, [])); warn(g4 >= .25 && g4 <= .7, 'Objectif « libre à 55 ans » (héritier)', Math.round(g4 * 100) + ' %', '25 – 70 %');
  const g5 = goalRate('heritier', 'rentier', BAL, S => { if (S.props.filter(p => p.type !== 'maison').length < 2) T.buyProp('logement', 'credit'); T.placeIdle(.6, []); }); warn(g5 >= .7, 'Objectif « rentier immobilier » (héritier)', Math.round(g5 * 100) + ' %', '≥ 70 %');

  // conseillers et succès sur joueurs aléatoires
  const adv = {}, ach = {}; const NR = 200;
  for (let i = 0; i < NR; i++) { const S = play(pickR(Object.keys(T.ARCH)), [], randomPolicy); for (const w in S.advRec) { adv[w] = adv[w] || { n: 0, ok: 0 }; adv[w].n += S.advRec[w].n; adv[w].ok += S.advRec[w].ok; } for (const id in S.ach) ach[id] = (ach[id] || 0) + 1; }
  const rate = w => adv[w] ? adv[w].ok / adv[w].n : 0;
  warn(rate('sophie') >= .7, 'Fiabilité de Sophie (doit être la meilleure)', Math.round(rate('sophie') * 100) + ' %', '≥ 70 %');
  warn(rate('kevin') <= .6, 'Fiabilité de Kévin (pile ou face)', Math.round(rate('kevin') * 100) + ' %', '≤ 60 %');
  for (const a of T.ACH) { const p = (ach[a.id] || 0) / NR; warn(p <= .6, `Succès « ${a.n} » (joueur aléatoire)`, Math.round(p * 100) + ' %', '≤ 60 %'); }
}

console.log(`\n${fail ? '✗' : '✓'} ${pass} réussi${pass > 1 ? 's' : ''}, ${fail} échec${fail > 1 ? 's' : ''}`);
process.exit(fail ? 1 : 0);
