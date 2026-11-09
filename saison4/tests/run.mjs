// Tests de La Corbeille, Saison 4 — sans dépendance, Node ≥ 18.
//   node saison4/tests/run.mjs             tests rapides
//   node saison4/tests/run.mjs --balance   rapport d'équilibrage (section 14 du cahier des charges)
//   node saison4/tests/run.mjs --seed=42   rejoue une graine précise
// Le moteur est chargé tel quel depuis saison4/src/la-corbeille-s4.html dans un bac à sable `vm`, sans DOM :
// la partie « UI » du script ne s'exécute pas (elle attend un document).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const BALANCE = args.includes('--balance');
const nArg = args.find(a => a.startsWith('--n='));
const seedArg = args.find(a => a.startsWith('--seed='));
const seed = seedArg ? +seedArg.split('=')[1] : (Date.now() % 1e9);

// Hasard des stratégies de test (jamais celui du jeu : le jeu a son propre état ST.rs).
function mulberry(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let R = mulberry(seed);

const html = readFileSync(join(root, 'src', 'la-corbeille-s4.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const ctx = { console, Intl, JSON, Math: Object.assign(Object.create(Math), { random: () => { throw new Error('Math.random appelé dans le moteur'); } }) };
vm.createContext(ctx);
vm.runInContext(js + `;globalThis.T={get ST(){return ST},set ST(v){ST=v},newGame,closeYear,chooseEvent,evById,pickEvent,EVENTS,budget,monthRest,net,real,placed,invTot,envVal,propNet,debtTot,bizVal,
  irCalc,parts,taxOn,apprentiBrut,apprentiNet,SMIC,DOMS,CITIES,serialize,restore,yearNews,tipsFor,where100,payslip,profName,RETIRE_AGE,ASSETS,
  };globalThis.CA={cover,creditCap,debtOf,examOk,askRaise,raiseInfo,peeIn,setPay,payMax,payDiv,divMax,bizHire,bizFire,bizAds,bizSell,bizVal,bizCalc,canBridge,bridgeBiz,bridgeIndep,indepChoices,takeJob,reconvert,RECONV,crowdIn,crowdOffers,indepRate};globalThis.X={};['trade','openEnv','livretMove','buyProp','sellProp','loanQuote','askRaise','setPay','payDiv','shopBuy','casinoPlay','peeIn'].forEach(function(n){ try{ X[n]=eval(n); }catch(e){} });`, ctx);
const T = ctx.T, X = ctx.X; // X : fonctions d'ordre des étapes suivantes, si elles existent

let pass = 0, fail = 0;
function check(c, m) { if (!c) throw new Error(m); }
function test(name, fn) { const t0 = Date.now(); try { fn(); pass++; console.log(`✓ ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); } catch (e) { fail++; console.log(`✗ ${name}\n    ${e.stack.split('\n').slice(0, 3).join('\n    ')}\n    rejouer : node saison4/tests/run.mjs --seed=${seed}`); } }
function scan(o, p = 'ST') { if (typeof o === 'number') { check(Number.isFinite(o), `valeur non finie en ${p}`); return; } if (o && typeof o === 'object') for (const k in o) scan(o[k], `${p}.${k}`); }
// Cahier des charges v2 : tout le monde commence par des études ; l'entreprise vient à la sortie.
const ALL = []; for (const d of T.DOMS.etudes) ALL.push(['etudes', d.k]);
const CITY = Object.keys(T.CITIES);

function setup(path, dk, s, o = {}) {
  const d = T.DOMS[path].find(x => x.k === dk);
  const g = { seed: s, sexe: R() < .5 ? 'h' : 'f', pseudo: 'Test', city: o.city || CITY[Math.floor(R() * CITY.length)], path, dk, home: o.home || ['parents', 'coloc', 'studio'][Math.floor(R() * 3)], jobH: o.jobH ?? [0, 10, 20][Math.floor(R() * 3)], loan: o.loan ?? [0, 12000, 20000][Math.floor(R() * 3)] };
  if (path === 'boite' && d.prof === 'chef') { g.put = Math.min(2400, d.mise); g.honor = Math.min(20000, Math.max(0, Math.ceil((d.mise - 2400) / 500) * 500)); g.love = 0; g.bank = 0; if (g.put + g.honor < d.mise) { g.love = 5000; g.bank = Math.min(30000, d.mise - g.put - g.honor - 5000); } }
  return T.newGame(g);
}
// Joueur de test : prend la décision (au hasard ou « raisonnable »), puis place selon sa stratégie.
function decide(strat) {
  const S = T.ST; if (!S.ev) return; const e = T.evById(S.ev);
  if (e.bet) T.chooseEvent(null, strat === 'none' ? 0 : Math.floor(S.cash * (R() < .5 ? 0 : .05)));
  else T.chooseEvent(R() < .5 ? 'a' : 'b');
}
function invariants(where) {
  const S = T.ST; scan(S);
  const flows = Object.values(S.flow).reduce((a, b) => a + b, 0);
  check(Math.abs(S.cash - flows) < .01, `${where} : caisse ${S.cash.toFixed(2)} ≠ flux ${flows.toFixed(2)}`);
  check(S.livret >= -1e-6, `${where} : Livret A négatif`);
  for (const k in S.env) for (const id in S.env[k].hold) { const h = S.env[k].hold[id]; check(h.v >= 0 && h.b >= -1e-6, `${where} : position négative ${id}`); }
  for (const d of S.debts) check(d.left >= 0, `${where} : dette négative`);
  for (const p of S.props) check(p.left >= 0 && p.val > 0, `${where} : bien incohérent`);
  check(S.hum >= 0 && S.hum <= 100 && S.rep >= 0 && S.rep <= 100, `${where} : jauge hors bornes`);
}
function play(path, dk, s, strat = 'rand', o = {}) {
  setup(path, dk, s, o); let years = 0;
  while (!T.ST.over && years < 60) {
    decide(strat); if (o.each) o.each(T.ST);
    const rs = T.ST.rs; T.budget(); T.net(); T.tipsFor('home'); T.tipsFor('budget'); T.yearNews(); T.where100(); T.profName(); T.payslip();
    check(T.ST.rs === rs, 'une vue a consommé du hasard');
    T.closeYear(); years++; invariants(`${path}/${dk} ${T.ST.year}`);
  }
  check(T.ST.over, `${path}/${dk} : la partie ne finit pas`);
  return T.ST;
}

if (!BALANCE) {
  test('Fiscalité 2026 : barème de l’impôt (F1419)', () => {
    T.newGame({ seed: 1, path: 'etudes', dk: 'com' });
    check(T.irCalc(11600, 1) === 0, 'tranche à 0 %');
    const t = T.irCalc(30000, 1); check(Math.abs(t - ((29579 - 11600) * .11 + (30000 - 29579) * .30)) < .01, 'barème 30 000 € : ' + t);
    const c = T.irCalc(60000, 2); check(Math.abs(c - 2 * T.irCalc(30000, 1)) < .01, 'quotient conjugal');
    const q = T.irCalc(60000, 3), q0 = T.irCalc(60000, 2); check(q0 - q <= 1807 * 2 + .01, 'plafonnement du quotient familial');
  });
  test('Apprentissage 2026 : 43 % du SMIC brut à 20 ans en 1re année', () => {
    check(Math.abs(T.apprentiBrut(20, 1) - 1823.03 * .43) < .01, 'brut'); check(Math.abs(T.apprentiBrut(22, 3) - 1823.03 * .78) < .01, '21-25 ans, 3e année');
    check(Math.abs(T.apprentiNet(T.apprentiBrut(20, 1)) - T.apprentiBrut(20, 1)) < .01, 'net = brut sous 50 % du SMIC');
  });
  test('Retraite à 64 ans (génération 2006, F14043)', () => { check(T.RETIRE_AGE === 64, 'âge légal'); });
  test('Fiscalité des enveloppes', () => {
    T.newGame({ seed: 2, path: 'etudes', dk: 'com' }); const S = T.ST;
    S.env.cto.open = S.year; check(Math.abs(T.taxOn('cto', 1000) - 314) < .01, 'flat tax 31,4 %');
    S.env.pea.open = S.year - 2; check(Math.abs(T.taxOn('pea', 1000) - 314) < .01, 'PEA avant 5 ans');
    S.env.pea.open = S.year - 6; check(Math.abs(T.taxOn('pea', 1000) - 186) < .01, 'PEA après 5 ans : 18,6 %');
    S.env.av.open = S.year - 3; check(Math.abs(T.taxOn('av', 1000) - 300) < .01, 'AV avant 8 ans : 30 %');
    S.env.av.open = S.year - 9; check(Math.abs(T.taxOn('av', 10000) - ((10000 - 4600) * .075 + 10000 * .172)) < .01, 'AV après 8 ans');
  });
  test('Création : chaque domaine démarre avec un budget fini', () => {
    for (const [p, k] of ALL) for (const c of CITY) { setup(p, k, 1 + Math.floor(R() * 1e6), { city: c }); invariants(`${p}/${k}/${c}`); const B = T.budget(); check(Number.isFinite(B.rest), `${p}/${k}`); check(T.ST.ev, `${p}/${k} : pas de décision la 1re année`); }
  });
  test('Parties complètes, un domaine après l’autre (invariants chaque année)', () => {
    for (const [p, k] of ALL) for (let i = 0; i < 3; i++) play(p, k, 1 + Math.floor(R() * 1e9));
  });
  test('Carrière : toutes les actions du joueur, au hasard, pendant des parties complètes', () => {
    const t = ctx.CA; const used = {};
    const each = S => {
      const u = R(), p = S.prof, run = (n, f) => { const r = f(); if (r) used[n] = (used[n] || 0) + 1; };
      if (p === 'chef') { t.setPay(R() * .3 * t.payMax()); if (t.divMax() > 0) run('div', () => t.payDiv(t.divMax() * .5)); if (R() < .25) run('hire', () => t.bizHire()); if (R() < .1) run('ads', () => t.bizAds(S.biz.tre * .1)); if (R() < .04 && t.bizVal() > 0) run('sell', () => t.bizSell()); }
      if (p === 'independant' && R() < .3) run('rate', () => t.indepRate(R() < .5));
      if (p === 'chomage' || p === 'pause') { if (R() < .5) run('take', () => t.takeJob()); else if (R() < .3) run('reconv', () => t.reconvert(t.RECONV[Math.floor(R() * 4)].k)); }
      if (R() < (p === 'independant' ? .12 : .02) && t.canBridge('boite')) { const d = T.DOMS.boite[Math.floor(R() * 6)]; run('bridgeBiz', () => t.bridgeBiz(d.k, Math.min(S.cash, d.mise * S.cpi), Math.ceil(Math.max(0, d.mise * S.cpi - S.cash) / 500) * 500)); }
      if (R() < .02 && t.canBridge('indep')) run('bridgeIndep', () => t.bridgeIndep(t.indepChoices()[0]));
      if (R() < .15) run('crowd', () => t.crowdIn(0, Math.floor(S.cash * .05)));
      const rs = S.rs; t.raiseInfo(); t.crowdOffers(); t.bizCalc && S.biz && t.bizCalc(); check(S.rs === rs, 'une vue de carrière a consommé du hasard');
    };
    for (const [p, k] of ALL) for (let i = 0; i < 8; i++) play(p, k, 1 + Math.floor(R() * 1e9), 'rand', { each });
    check(Object.keys(used).length > 0, 'aucune action jouée');
  });
  test('Carrière : chaque action fonctionne (dirigeant·e, revente, chômage, reconversion, CDD, participation)', () => {
    const t = ctx.CA, S0 = T.newGame({ seed: 11, path: 'boite', dk: 'agence', put: 2000, honor: 0 }); let S = T.ST;
    check(S.prof === 'chef', 'pas de société'); S.biz.tre = 100000; S.biz.hist.push({ y: S.year, net: 50000 });
    check(t.payDiv(10000), 'dividende'); check(t.bizHire(), 'embauche'); check(t.bizFire(), 'licenciement'); check(t.bizAds(5000), 'publicité'); t.setPay(1500); check(S.biz.pay === 1500, 'salaire');
    check(t.bizSell(), 'revente'); check(S.prof === 'pause' && !S.biz, 'après la revente : entre deux projets');
    check(t.crowdIn(0, 500), 'participation');
    check(t.takeJob(), 'CDD de transition'); check(S.prof === 'salarie' && S.job.cdd === S.year + 2, 'CDD de 2 ans');
    T.closeYear(); T.closeYear(); S = T.ST; check(S.prof === 'chomage' && S.cho.left > 0, 'fin du CDD : chômage indemnisé');
    check(t.reconvert(t.RECONV[0].k), 'reconversion'); T.closeYear(); S = T.ST; check(S.prof === 'salarie' && S.job.cdd, 'reconversion : CDD dans le nouveau métier');
    T.closeYear(); T.closeYear(); S = T.ST; check(S.prof === 'chomage', 'fin du second CDD');
    check(t.bridgeIndep('coach'), 'à son compte'); check(T.ST.prof === 'independant', 'indépendant·e'); check(t.indepRate(true), 'tarif');
    T.ST.cash += 0; check(t.bridgeBiz('agence', Math.min(T.ST.cash, 2000), 2000), 'nouvelle société'); check(T.ST.prof === 'chef' && T.ST.biz.bank, 'société avec prêt de création');
    invariants('actions de carrière');
  });
  test('Dettes plafonnées : crédit de trésorerie, prêt étudiant bancaire, surendettement (jamais sous −50 000 € réels)', () => {
    let worst = 0, surend = 0;
    for (const [p, k] of ALL) for (let i = 0; i < 20; i++) {
      setup(p, k, 1 + Math.floor(R() * 1e9), { home: 'studio', jobH: 0, loan: 0 }); let y = 0;
      while (!T.ST.over && y < 60) { decide('rand'); const before = ctx.CA.debtOf('conso'), cap = ctx.CA.creditCap(); T.closeYear(); y++; const S = T.ST;
        const conso = ctx.CA.debtOf('conso'), stu2 = ctx.CA.debtOf('stu2');
        check(conso <= Math.max(before, cap, S.flags.capUsed || 0) + 1, `la banque a prêté au-delà du plafond : ${Math.round(before)} → ${Math.round(conso)} (plafond ${Math.round(cap)})`);
        check(stu2 <= 25000 * S.cpi * 1.04 + 1, `prêt étudiant bancaire ${Math.round(stu2)} au-delà de 25 000 €`);
        worst = Math.min(worst, T.real(T.net())); if (S.surend) surend++; }
    }
    check(worst >= -50000, `patrimoine au plus bas : ${Math.round(worst)} € réels`);
  });
  test('Faillite cohérente : jamais un résultat positif suivi d’une faillite sans explication', () => {
    for (const k of ['com', 'ing']) for (let i = 0; i < 40; i++) {
      setup('etudes', k, 1 + Math.floor(R() * 1e9)); let y = 0;
      while (!T.ST.over && y < 60) { decide('rand'); if (T.ST.prof === 'independant' && ctx.CA.canBridge('boite')) { const d = T.DOMS.boite[i % 5]; ctx.CA.bridgeBiz(d.k, Math.min(T.ST.cash, d.mise * T.ST.cpi), Math.ceil(Math.max(0, d.mise * T.ST.cpi - T.ST.cash) / 500) * 500); } const o = T.closeYear(); y++;
        const f = o.news.find(x => /Faillite/.test(x)); if (f) check(/Deux ans|Trou de/.test(f), 'faillite sans raison : ' + f); }
    }
  });
  test('Études : un budget équilibré existe pour chaque filière en colocation hors Paris', () => {
    for (const [p, k] of ALL) { if (k === 'com') continue; for (const c of CITY) { if (c === 'paris') continue;
      const g = { seed: 3, path: p, dk: k, city: c, home: 'coloc', jobH: 20, loan: 20000 }; T.newGame(g); check(T.monthRest() >= 0, `${k}/${c} : ${Math.round(T.monthRest())} € par mois même au maximum`); } }
    T.newGame({ seed: 3, path: 'etudes', dk: 'com', city: 'lille', home: 'parents', jobH: 20, loan: 20000 }); check(T.monthRest() >= 0, 'école de commerce chez les parents, 20 h de job');
  });
  test('Déterminisme : même graine, même partie', () => {
    const a = JSON.stringify(play('etudes', 'com', 4242, 'rand')); R = mulberry(seed);
    const b0 = mulberry(seed); R = b0; const a2 = JSON.stringify(play('etudes', 'com', 4242, 'rand'));
    R = mulberry(seed); const b2 = JSON.stringify(play('etudes', 'com', 4242, 'rand'));
    check(a2 === b2, 'deux parties identiques divergent');
  });
  test('Sauvegarde : aller-retour identique en cours de partie', () => {
    setup('etudes', 'info', 77); for (let i = 0; i < 6; i++) { decide('rand'); T.closeYear(); }
    const s1 = T.serialize(); T.restore(s1); check(T.serialize() === s1, 'aller-retour différent');
    const r = mulberry(5); R = r; decide('rand'); T.closeYear(); const after = T.serialize();
    T.restore(s1); R = mulberry(5); decide('rand'); T.closeYear(); check(T.serialize() === after, 'la partie rechargée diverge');
    check(T.restore('{pas du json') === null, 'sauvegarde abîmée acceptée');
  });
  test('Événements : jamais deux fois en 5 ans', () => {
    setup('etudes', 'droit', 9); const seen = {};
    while (!T.ST.over) { const id = T.ST.ev; if (id) { check(!(id in seen) || T.ST.year - seen[id] >= 5, `${id} répété en ${T.ST.year}`); seen[id] = T.ST.year; } decide('rand'); T.closeYear(); }
  });
  console.log(`\n${pass} réussi(s), ${fail} échec(s) · graine ${seed}`);
  process.exit(fail ? 1 : 0);
}

// ---------- équilibrage
import('./balance.mjs').then(m => m.run({ T, X, CA: ctx.CA, R: s => (R = mulberry(s)), rnd: () => R(), setup, decide, play, invariants, ALL, CITY, n: nArg ? +nArg.split('=')[1] : 500, seed }));
