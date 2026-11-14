// Tests de La Corbeille, Saison 4 (moteur trimestriel, cahier des charges v3) — sans dépendance, Node ≥ 18.
//   node saison4/tests/run.mjs             tests du moteur
//   node saison4/tests/run.mjs --balance   équilibrage (§8 : six bots, 300 parties chacun, Commerce, format Standard)
//   node saison4/tests/run.mjs --seed=42   rejoue une graine précise
// Le moteur est chargé tel quel depuis saison4/src/la-corbeille-s4.html dans un bac à sable `vm`, sans DOM.
// Math.random y lève une erreur : tout le hasard du moteur passe par rnd().
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { makePlayer } from './balance.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const BALANCE = args.includes('--balance');
const nArg = args.find(a => a.startsWith('--n='));
const seedArg = args.find(a => a.startsWith('--seed='));
const seed = seedArg ? +seedArg.split('=')[1] : (BALANCE ? 11 : Date.now() % 1e9);

function mulberry(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let R = mulberry(seed);
const rnd = () => R();

const html = readFileSync(join(root, 'src', 'la-corbeille-s4.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const ctx = { console, Intl, JSON, Math: Object.assign(Object.create(Math), { random: () => { throw new Error('Math.random appelé dans le moteur'); } }) };
vm.createContext(ctx);
const NAMES = 'newGame,createBiz,canCreate,playQuarter,runQuarter,forecast,forecastQ,keepDec,autoDec,cleanDec,suggestOrder,launchStock,bizValue,bizVal,ccaVal,affectPreview,bizAffect,primeMax,bizOpen,canOpen,zoneCost,borrowMax,bizBorrow,bizCca,odLimit,monthlyFixed,payNeeded,capacityOf,stockN,stockV,pipeN,payablesV,bfrOf,moqOf,unitCost,pmOf,isCalc,closeYear,yearReady,chooseEvent,evById,pickEvent,EVENTS,budget,monthRest,net,real,debtTot,irCalc,parts,taxOn,takeJob,serialize,restore,yearNews,tipsFor,bizTips,where100,profName,SECTORS,STARTS,CITIES,ROLES,RETIRE_AGE,HONOR_MAX,PAY_MAX_DAYS,IS_LOW,IS_CAP,IS_HIGH,creditCap,debtOf,qi';
vm.runInContext(js + `;globalThis.T={get ST(){return ST},set ST(v){ST=v},${NAMES}};globalThis.HAS=function(n){ try{ return typeof eval(n)!=='undefined'; }catch(e){ return false; } };`, ctx);
const T = ctx.T;
const CITY = Object.keys(T.CITIES), STARTS = Object.keys(T.STARTS), PRODS = Object.keys(T.SECTORS.commerce.prods);

let pass = 0, fail = 0;
function check(c, m) { if (!c) throw new Error(m); }
function test(name, fn) { const t0 = Date.now(); try { fn(); pass++; console.log(`✓ ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); } catch (e) { fail++; console.log(`✗ ${name}\n    ${e.stack.split('\n').slice(0, 3).join('\n    ')}\n    rejouer : node saison4/tests/run.mjs --seed=${seed}`); } }
function scan(o, p = 'ST') { if (typeof o === 'number') { check(Number.isFinite(o), `valeur non finie en ${p}`); return; } if (o && typeof o === 'object') for (const k in o) scan(o[k], `${p}.${k}`); }
const sumv = o => Object.values(o).reduce((a, b) => a + b, 0);
function invariants(where) {
  const S = T.ST; scan(S);
  check(Math.abs(S.cash - sumv(S.flow)) < .02, `${where} : caisse perso ${S.cash.toFixed(2)} ≠ flux ${sumv(S.flow).toFixed(2)}`);
  const B = S.biz;
  if (B) {
    check(Math.abs(B.cash - sumv(B.flow)) < .02, `${where} : trésorerie ${B.cash.toFixed(2)} ≠ Σ BIZ.flow ${sumv(B.flow).toFixed(2)}`);
    for (const l of B.lots) check(l.n >= -1e-9 && l.uc >= 0, `${where} : lot de stock négatif`);
    for (const l of B.pipe) check(l.n > 0, `${where} : commande en route vide`);
    for (const p of B.payables) check(p.a >= 0, `${where} : dette fournisseur négative`);
    check(!B.bank || B.bank.left >= 0, `${where} : prêt négatif`); check(B.cca >= 0, `${where} : compte courant négatif`);
    for (const z in B.zones) check(B.zones[z].N >= 0 && B.zones[z].N <= 4, `${where} : notoriété hors bornes`);
    check(B.cash >= -2 * T.odLimit(B) - 1, `${where} : trésorerie ${Math.round(B.cash)} au-delà du double du découvert autorisé`);
  }
  check(S.livret >= -1e-6, `${where} : Livret A négatif`);
  for (const d of S.debts) check(d.left >= 0, `${where} : dette négative`);
  check(S.hum >= 0 && S.hum <= 100 && S.rep >= 0 && S.rep <= 100, `${where} : jauge hors bornes`);
}
function start(o = {}) {
  T.newGame({ seed: o.seed ?? 1 + Math.floor(R() * 1e9), sexe: R() < .5 ? 'h' : 'f', pseudo: 'Test', city: o.city || CITY[Math.floor(R() * CITY.length)], start: o.start || STARTS[Math.floor(R() * 4)], home: o.home || ['coloc', 'studio', 'parents'][Math.floor(R() * 3)] });
  if (o.biz !== false) T.createBiz({ name: 'Test', prod: o.prod || PRODS[Math.floor(R() * 3)], put: T.ST.cash, honor: o.honor ?? 6000, bank: o.bank ?? 8000, sup: o.sup });
}
function yearEnd(annual) { const S = T.ST; if (S.ev) { const e = T.evById(S.ev); if (e.bet) T.chooseEvent(null, R() < .3 ? Math.floor(S.cash * .05) : 0); else T.chooseEvent(R() < .5 ? 'a' : 'b'); } if (annual) annual(); T.closeYear(); }
// Partie Standard complète avec un bot ; vérifie les invariants à chaque trimestre et les vues pures.
function play(bot, o = {}) {
  const P = makePlayer(T, rnd); start({ ...o, biz: false }); P.setProd(o.prod || PRODS[Math.floor(R() * 3)]); P.create(bot, true);
  let q = 0, worst = Infinity;
  while (!T.ST.over && q < 100) {
    for (let k = 0; k < 4 && T.ST.q <= 4; k++) {
      P.rebound(bot); const d = P.quarter(bot);
      if (T.ST.biz && d) { const rs = T.ST.rs, snap = T.serialize(); T.forecast(d); T.bizValue(T.ST.biz); T.payNeeded(); T.budget(); T.tipsFor('biz'); T.tipsFor('home'); T.yearNews(); T.where100(); check(T.ST.rs === rs && T.serialize() === snap, 'une vue a modifié l’état ou tiré du hasard'); }
      const out = T.playQuarter(d); q++; invariants(`${bot} ${out.y} T${out.q}`); if (o.each) o.each(out);
    }
    yearEnd(() => P.annual(bot)); invariants(`${bot} clôture ${T.ST.year - 1}`); worst = Math.min(worst, T.real(T.net()));
  }
  check(T.ST.over && T.ST.year === 2046 && q === 80, `${bot} : partie Standard incomplète (${q} trimestres, ${T.ST.year})`);
  return { worst, end: T.real(T.net()) };
}

if (!BALANCE) {
  test('Chiffres officiels : barème de l’impôt (F1419), IS 15 % / 25 % (A16250), prêt d’honneur, délais de paiement (L441-10)', () => {
    T.newGame({ seed: 1 });
    check(T.irCalc(11600, 1) === 0, 'tranche à 0 %');
    const t = T.irCalc(30000, 1); check(Math.abs(t - ((29579 - 11600) * .11 + (30000 - 29579) * .30)) < .01, 'barème 30 000 € : ' + t);
    check(Math.abs(T.irCalc(60000, 2) - 2 * T.irCalc(30000, 1)) < .01, 'quotient conjugal');
    check(T.IS_LOW === .15 && T.IS_CAP === 42500 && T.IS_HIGH === .25, 'taux d’IS');
    check(Math.abs(T.isCalc(60000) - (42500 * .15 + 17500 * .25)) < .01, 'IS sur 60 000 € : 10 750 €');
    check(T.HONOR_MAX === 10000 && T.RETIRE_AGE === 64 && T.PAY_MAX_DAYS === 60, 'paramètres officiels');
    for (const k in T.SECTORS.commerce.sup) check(T.SECTORS.commerce.sup[k].pay <= T.PAY_MAX_DAYS, `fournisseur ${k} au-delà de 60 jours`);
  });
  test('Fiscalité des enveloppes', () => {
    T.newGame({ seed: 2 }); const S = T.ST;
    S.env.cto.open = S.year; check(Math.abs(T.taxOn('cto', 1000) - 314) < .01, 'flat tax 31,4 %');
    S.env.pea.open = S.year - 6; check(Math.abs(T.taxOn('pea', 1000) - 186) < .01, 'PEA après 5 ans');
    S.env.av.open = S.year - 3; check(Math.abs(T.taxOn('av', 1000) - 300) < .01, 'AV avant 8 ans');
  });
  test('Plus d’études ni de secteurs hors v3 ni de chiffres fixés d’avance', () => {
    for (const n of ['DOMS', 'INDEP', 'examOk', 'graduate', 'CROUS', 'bizYear', 'BRIDGE']) check(!ctx.HAS(n), `${n} existe encore`);
    check(Object.keys(T.SECTORS).join() === 'commerce,resto,btp,saas', 'les 4 secteurs de la v3');
    for (const k of ['grow', 'mult', 'mar', 'ca']) check(!(k in T.SECTORS.commerce), `paramètre figé « ${k} » dans le Commerce`);
  });
  test('Départ à 22 ans : chaque ville, chaque parcours, chaque produit démarre avec un budget fini, un stock et une décision', () => {
    for (const c of CITY) for (const s of STARTS) for (const p of PRODS) {
      start({ city: c, start: s, prod: p }); const S = T.ST, B = S.biz; invariants(`${c}/${s}/${p}`);
      check(S.age === 22 && S.year === 2026 && S.q === 1, 'départ'); check(B && T.stockN(B) >= T.moqOf(B, 'eu'), 'stock de lancement'); check(Number.isFinite(T.monthRest()), 'budget');
      check(S.ev, 'pas de décision la 1re année'); check(B.pay >= 0 && T.monthRest() >= -1, `${c}/${s} : le salaire de départ ne couvre pas le budget perso (${Math.round(T.monthRest())} €)`);
      if (s === 'com') check(S.debts.some(d => d.k === 'stu' && d.left === 15000), 'prêt étudiant de 15 000 €');
      if (s === 'auto') check(S.flow.depart === 6000, 'autodidacte : 3 000 € de plus');
    }
  });
  test('Parties Standard complètes, six bots (invariants à chaque trimestre, vues pures, jamais sous −50 000 € réels)', () => {
    let worst = 0; for (const b of ['raisonnable', 'agressif', 'premium', 'radin', 'auto', 'idiot']) for (let i = 0; i < 4; i++) worst = Math.min(worst, play(b).worst);
    check(worst >= -50000, `pire moment ${Math.round(worst)} € réels`);
  });
  test('Prévisionnel : une fourchette, jamais une valeur exacte, et le réel y tombe le plus souvent', () => {
    let inR = 0, n = 0;
    for (let i = 0; i < 8; i++) { start({ prod: PRODS[i % 3] }); for (let k = 0; k < 24 && !T.ST.over; k++) { if (T.ST.q > 4) { yearEnd(); continue; } const B = T.ST.biz; if (!B) break; const d = T.keepDec(B), F = T.forecast(d); check(F.caLo <= F.caHi + .01 && (F.caHi - F.caLo > 1 || F.capped), 'fourchette vide sans plafond annoncé'); const o = T.playQuarter(d); if (k >= 4 && o.R) { n++; if (o.R.ca >= F.caLo * .85 && o.R.ca <= F.caHi * 1.15) inR++; } } }
    check(n > 20 && inR / n >= .6, `réel dans la fourchette (±15 %) : ${Math.round(inR / Math.max(1, n) * 100)} % des trimestres`);
  });
  test('« Pourquoi ? » : chaque trimestre est expliqué (ventes, marge, trésorerie), ruptures et saturation chiffrées', () => {
    let rupt = 0;
    for (let i = 0; i < 6; i++) { start({ prod: PRODS[i % 3] }); for (let k = 0; k < 12 && T.ST.biz; k++) { if (T.ST.q > 4) { yearEnd(); continue; } const d = T.keepDec(T.ST.biz); if (k === 2) d.order = 0; const o = T.playQuarter(d); if (!o.R) continue;
      const ks = new Set(o.R.why.map(w => w.k)); check(ks.has('v') && ks.has('m') && ks.has('t'), 'explication incomplète');
      if (o.R.lostStock > 1) { rupt++; check(o.R.why.some(w => /Rupture de stock/.test(w.t)), 'rupture sans explication'); }
      for (const w of o.R.why) check(!/NaN|Infinity|undefined/.test(w.t), 'texte illisible : ' + w.t); } }
    check(rupt > 0, 'aucune rupture provoquée');
  });
  test('Stock et fournisseurs : minimum de commande, délais, paiement, décote, soldes seulement en janvier et juillet', () => {
    start({ prod: 'cafe', sup: 'eu', bank: 20000 }); const B = T.ST.biz;
    const d = T.cleanDec(B, { ...B.dec, sup: 'as', order: 10 }); check(d.order === T.moqOf(B, 'as'), 'minimum de commande');
    const c0 = B.cash, n0 = T.stockN(B); d.order = T.moqOf(B, 'as') * 2; d.soldes = .3;
    check(T.cleanDec(B, d).soldes === .3, 'soldes en T1'); T.playQuarter(d);
    check(T.pipeN(B) > 0 || B.last.why.some(w => /Asie/.test(w.t)), 'Asie : livré au trimestre suivant');
    check(B.flow.achats <= -d.order * T.unitCost(B, 'as', B.pos) + 1, 'Asie : payé à la commande');
    const d2 = T.keepDec(B); d2.soldes = .3; check(T.cleanDec(B, d2).soldes === 0, 'pas de soldes en T2');
    d2.sup = 'eu'; d2.order = T.moqOf(B, 'eu'); T.playQuarter(d2); check(T.payablesV(B) > 0, 'Europe : payé à 45 jours');
    // décote : un lot de plus de 4 trimestres perd la moitié de sa valeur
    B.lots.push({ n: 100, uc: 10, q: 1, age: 3 }); const dd = T.keepDec(B); dd.order = 0; T.playQuarter(dd); const L = B.lots.find(l => l.dep); check(!L || Math.abs(L.uc - 5) < .01, 'décote de 50 %');
    invariants('stock');
  });
  test('Rendements décroissants : doubler la promo ne double pas la notoriété ; le marché d’une zone est fini', () => {
    start({ prod: 'cosm' }); const B = T.ST.biz;
    const run = p => { const C = JSON.parse(JSON.stringify(B)), d = T.cleanDec(C, { ...B.dec, promo: { ville: p, region: 0 }, order: 0 }); const X = { noise: { ville: 1, region: 1 }, late: false, conj: 1, fit: 1 }; T.runQuarter(C, d, X); return C.zones.ville.N; };
    const n0 = run(0), n1 = run(5000), n4 = run(20000); check((n4 - n0) / (n1 - n0) < 2.2 && (n4 - n0) / (n1 - n0) > 1.8, `effet de la promo ×4 : ×${((n4 - n0) / (n1 - n0)).toFixed(2)} (attendu ≈ ×2)`);
    const C = JSON.parse(JSON.stringify(B)); C.zones.ville.N = 4; const d = T.cleanDec(C, { ...B.dec, px: .6, order: 0 }); C.lots = [{ n: 1e7, uc: 1, q: 1.2, age: 0 }]; C.team.emp = 300;
    const r = T.runQuarter(C, d, { noise: { ville: 1, region: 1 }, late: false, conj: 1, fit: 1 }); check(r.D < T.SECTORS.commerce.prods.cosm.mkt * 1.4, `demande ${Math.round(r.D)} au-delà du marché`);
  });
  test('Équipe et complexité : au-delà de 8 personnes sans chef·fe d’équipe, chacun produit moins', () => {
    start({ prod: 'cafe' }); const B = T.ST.biz, d = T.cleanDec(B, B.dec);
    const cap = n => { const C = JSON.parse(JSON.stringify(B)); C.team = { emp: n, com: 0, man: 0, cad: 0 }; return T.capacityOf(C, d); };
    const per8 = (cap(8) - cap(0)) / 8, per16 = (cap(16) - cap(0)) / 16; check(per16 < per8 * .9, 'pas de perte d’efficacité');
    const C = JSON.parse(JSON.stringify(B)); C.team = { emp: 16, com: 0, man: 1, cad: 0 }; check(T.capacityOf(C, d) > cap(16), 'un·e chef·fe d’équipe ne change rien');
  });
  test('Clôture annuelle : IS, prime, dividende (PFU 31,4 %), argent perso et argent de la boîte séparés', () => {
    let tested = 0;
    for (let i = 0; i < 30 && tested < 3; i++) { start({ prod: PRODS[i % 3], bank: 20000 }); let B = T.ST.biz, A = null;
      for (let y = 0; y < 8 && T.ST.biz; y++) { for (let k = 0; k < 4 && T.ST.biz; k++) { const d = T.keepDec(B); d.team.emp = 1; d.time = { c: 30, p: 50, g: 20 }; T.playQuarter(d); }
        if (!T.ST.biz) break; A = T.affectPreview(0, 0); if (A.Y.res > 0 && A.divMax > 0) break; A = null; yearEnd(); B = T.ST.biz; }
      if (!A || !T.ST.biz || T.ST.q !== 5) continue; B = T.ST.biz;
      const pm = T.primeMax(), P = T.affectPreview(pm / 2, 0), D = T.affectPreview(0, A.divMax);
      check(P.is < A.is || A.is === 0, 'la prime ne réduit pas l’IS'); check(Math.abs(D.divNet - A.divMax * (1 - .314)) < .01, 'dividende net de 31,4 %');
      check(Math.abs(A.is - T.isCalc(Math.max(0, A.res - B.lossCarry))) < .01, 'IS');
      const c0 = T.ST.cash, b0 = B.cash, Z = T.bizAffect(0, A.divMax); check(Math.abs(T.ST.cash - c0 - Z.divNet - (B.cca ? 0 : 0)) < 1 || B.flow['compte courant'], 'dividende perso');
      check(B.cash <= b0 - Z.is - Z.div + .01, 'trésorerie après dividende'); invariants('clôture'); tested++; }
    check(tested >= 1, 'aucune année bénéficiaire testée');
  });
  test('Faillite cohérente : message avec sa raison, rebond possible, dettes perso plafonnées', () => {
    let fails = 0;
    for (let i = 0; i < 25; i++) { start({ prod: PRODS[i % 3], bank: 0, honor: 0 }); for (let k = 0; k < 16 && !T.ST.over; k++) { if (T.ST.q > 4) { yearEnd(); continue; }
      const B = T.ST.biz; const d = B ? T.cleanDec(B, { ...B.dec, order: T.moqOf(B, 'eu') * 6, promo: { ville: 20000, region: 0 }, pay: 4000 }) : null; const o = T.playQuarter(d);
      const f = o.N.find(x => /Faillite/.test(x)); if (f) { fails++; check(/cessation de paiements/.test(f) && /découvert/.test(f), 'faillite sans raison : ' + f); check(T.canCreate(), 'pas de rebond possible'); break; } } invariants('faillite'); }
    check(fails > 5, `trop peu de faillites provoquées (${fails})`);
  });
  test('Déterminisme : même graine, même partie ; sauvegarde rechargée à l’identique', () => {
    const go = () => { R = mulberry(77); play('raisonnable', { seed: 4242, prod: 'cafe', city: 'lyon', start: 'com', home: 'coloc' }); return T.serialize(); };
    check(go() === go(), 'deux parties identiques divergent');
    R = mulberry(5); start({ seed: 99 }); for (let k = 0; k < 6; k++) T.playQuarter(T.keepDec(T.ST.biz)); const s1 = T.serialize();
    const after = () => { for (let k = 0; k < 6 && T.ST.biz; k++) { if (T.ST.q > 4) { yearEnd(); continue; } T.playQuarter(T.keepDec(T.ST.biz)); } return T.serialize(); };
    R = mulberry(9); const a = after(); T.restore(s1); check(T.serialize() === s1, 'aller-retour différent'); R = mulberry(9); check(after() === a, 'la partie rechargée diverge');
    check(T.restore('{pas du json') === null, 'sauvegarde abîmée acceptée');
    const old = T.restore(JSON.stringify({ v: 2, hist: [{ n: 1234 }] })); check(old && old.legacy, 'une partie v2 n’est pas reconnue comme ancienne');
  });
  test('Événements de l’année : jamais deux fois en 5 ans', () => {
    start({}); const seen = {};
    while (!T.ST.over) { if (T.ST.q > 4) { const id = T.ST.ev; if (id) { check(!(id in seen) || T.ST.year - seen[id] >= 5, `${id} répété en ${T.ST.year}`); seen[id] = T.ST.year; } yearEnd(); continue; } T.playQuarter(T.ST.biz ? T.keepDec(T.ST.biz) : null); }
  });
  console.log(`\n${pass} réussi(s), ${fail} échec(s) · graine ${seed}`);
  process.exit(fail ? 1 : 0);
}

// ---------- équilibrage
import('./balance.mjs').then(m => m.run({ T, R: s => (R = mulberry(s)), rnd, n: nArg ? +nArg.split('=')[1] : 300, seed }));
