// Rapport d'équilibrage de la Saison 4 (cahier des charges v2, §8).
//   npm run balance:s4                (500 parties par filière)
//   npm run balance:s4 -- --n=100     (plus rapide)
//   node saison4/tests/run.mjs --balance --seed=42
// Chaque stratégie rejoue les mêmes mondes (graine de partie identique, partie n° i) : les écarts mesurent les choix, pas la chance.
// Mesures qui attendent une étape à venir (paliers, placements) : « à venir ».

function med(L) { const a = [...L].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; }
function pctOf(L, f) { return L.length ? L.filter(f).length / L.length : 0; }
const k = x => Math.round(x / 1000) + ' k€';
const pc = x => Math.round(x * 100) + ' %';

export function run({ T, CA, R, rnd, setup, ALL, CITY, n, seed }) {
  // Le joueur « raisonnable » : budget étudiant équilibré, se lance à son compte à la sortie et y reste ; après une faillite,
  // CDD de transition puis nouveau projet. Le « créateur » fait pareil, puis crée une société (domaine voisin de sa filière)
  // à 32 ans avec deux fois la mise : il mesure le moteur de société, celui de la v1 tant que l'étape « Création » n'est pas faite.
  // Le joueur « tout en salaire » : se verse le salaire maximum, jamais de dividende, ne place rien.
  const strat = {
    raisonnable(S) { strat.createur(S, false); },
    createur(S, create = true, divs = true) {
      const BR = { com: 'ecom', ing: 'tech', inf: 'food', droit: 'agence', info: 'tech', art: 'btp' };
      if (create && S.prof === 'independant' && S.age >= 32 && !S.flags.wasChef && CA.canBridge('boite')) { const b = T.DOMS.boite.find(x => x.k === BR[S.dk]); if (S.cash > b.mise * S.cpi * 2) CA.bridgeBiz(b.k, b.mise * S.cpi * 2, 0); }
      if (S.prof === 'chef' && divs) { if (S.biz.hist.length && CA.divMax() > 0) CA.payDiv(CA.divMax() * .5); }
      if ((S.prof === 'chomage' || S.prof === 'pause') && !S.cho?.reconv) {
        const b = T.DOMS.boite.find(x => x.k === S.dk);
        if (b && CA.canBridge('boite') && S.cash > b.mise * S.cpi * .3) CA.bridgeBiz(b.k, Math.min(S.cash * .8, b.mise * S.cpi), Math.ceil(Math.max(0, b.mise * S.cpi - S.cash * .8) / 500) * 500);
        else if (!b && CA.canBridge('indep')) CA.bridgeIndep(CA.indepChoices()[0]);
        else if (CA.canBridge('poste') && S.cash < 3000 * S.cpi) CA.takeJob();
      }
    },
    salaire(S) { strat.createur(S, true, false); if (S.prof === 'chef') CA.setPay(CA.payMax()); }
  };
  function balanced(g) { let lo = 0, hi = 20000; for (let j = 0; j < 14; j++) { const m = (lo + hi) / 2; T.newGame({ ...g, loan: m }); if (T.monthRest() >= 0) hi = m; else lo = m; } return Math.ceil(hi / 500) * 500; }
  function game(dk, i, s) {
    R(seed * 7919 + i); const city = CITY[i % CITY.length], home = ['parents', 'coloc', 'studio'][i % 3];
    const g = { seed: 1 + Math.floor(rnd() * 1e9), sexe: i % 2 ? 'f' : 'h', pseudo: 'Test', city, path: 'etudes', dk, home, jobH: 10 };
    g.loan = balanced(g); T.newGame(g);
    let min = Infinity, y = 0, chef = false;
    while (!T.ST.over && y < 60) {
      const S = T.ST; if (S.ev) { const e = T.evById(S.ev); if (e.bet) T.chooseEvent(null, rnd() < .3 ? Math.floor(S.cash * .05) : 0); else T.chooseEvent(rnd() < .5 ? 'a' : 'b'); }
      strat[s](T.ST); if (T.ST.prof === 'chef') chef = true;
      T.closeYear(); y++; min = Math.min(min, T.real(T.net()));
    }
    return { end: T.real(T.net()), min, fail: !!T.ST.flags.everFail, chef, surend: !!T.ST.flags.surend };
  }
  console.log(`Équilibrage Saison 4 · ${n} parties par filière · graine ${seed}\n`);
  const rows = [], all = { raisonnable: [], salaire: [], createur: [] };
  for (const [, dk] of ALL) {
    const A = [], B = [], C = []; for (let i = 0; i < n; i++) { A.push(game(dk, i, 'raisonnable')); B.push(game(dk, i, 'salaire')); C.push(game(dk, i, 'createur')); }
    all.raisonnable.push(...A); all.salaire.push(...B); all.createur.push(...C);
    rows.push({ dk, med: med(A.map(x => x.end)), crMed: med(C.map(x => x.end)), crFail: pctOf(C.filter(x => x.chef), x => x.fail), salMed: med(B.map(x => x.end)), fail: pctOf(A, x => x.fail), mil: pctOf(A, x => x.end >= 1e6), min: Math.min(...A.map(x => x.min)), surend: pctOf(A, x => x.surend) });
  }
  console.log('Filière'.padEnd(8), 'Médiane à 64 ans'.padStart(17), 'Avec société'.padStart(13), 'Sa faillite'.padStart(12), 'Tout en salaire'.padStart(16), 'Faillite ≥ 1'.padStart(13), 'Millionnaire'.padStart(13), 'Pire moment'.padStart(12), 'Surendetté'.padStart(11));
  for (const r of rows) console.log(r.dk.padEnd(8), k(r.med).padStart(17), k(r.crMed).padStart(13), pc(r.crFail).padStart(12), k(r.salMed).padStart(16), pc(r.fail).padStart(13), pc(r.mil).padStart(13), k(r.min).padStart(12), pc(r.surend).padStart(11));
  const A = all.raisonnable, m = med(A.map(x => x.end)), meds = rows.map(r => r.med).filter(x => x > 0);
  const spread = meds.length === rows.length ? Math.max(...meds) / Math.min(...meds) : Infinity;
  const C = all.createur.filter(x => x.chef), ratioSal = med(all.salaire.map(x => x.end)) / Math.max(1, med(C.map(x => x.end)));
  const checks = [
    ['Patrimoine médian à 64 ans (euros de 2026)', '400 à 900 k€', k(m), m >= 4e5 && m <= 9e5],
    ['Écart entre filières (médianes)', '≤ ×1,6', spread === Infinity ? 'une médiane ≤ 0' : '×' + spread.toFixed(2).replace('.', ','), spread <= 1.6],
    ['Faillite au moins une fois (créateurs de société)', '25 à 45 %', pc(pctOf(C, x => x.fail)), pctOf(C, x => x.fail) >= .25 && pctOf(C, x => x.fail) <= .45],
    ['Tout en salaire, rien placé / créateur raisonnable', '< ×0,5', '×' + ratioSal.toFixed(2).replace('.', ','), ratioSal < .5],
    ['Atteindre le palier 4', '3 à 10 %', 'à venir (étape 4)', null],
    ['Patrimoine minimum (pire moment de la pire partie)', '≥ −50 k€', k(Math.min(...A.map(x => x.min))), Math.min(...A.map(x => x.min)) >= -5e4],
    ['Millionnaire en euros de 2026', '10 à 20 %', pc(pctOf(A, x => x.end >= 1e6)), pctOf(A, x => x.end >= 1e6) >= .1 && pctOf(A, x => x.end >= 1e6) <= .2]
  ];
  console.log('\nCibles (cahier des charges v2, §8)');
  for (const [lab, cib, val, ok] of checks) console.log(`${ok === null ? '  …  ' : ok ? '  OK ' : ' WARN'}  ${lab.padEnd(52)} ${val.padStart(18)}   cible ${cib}`);
  console.log('\nLes WARN sont attendus tant que les étapes « Création et moteur d’entreprise » et « Croissance » ne sont pas faites : ce rapport sert de point de départ.');
}
