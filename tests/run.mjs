// Tests de La Corbeille — sans dépendance, Node ≥ 18.
//   node tests/run.mjs             tests rapides (≈ 40 s)
//   node tests/run.mjs --full      plus de parties (≈ 4 min)
//   node tests/run.mjs --balance   rapport d’équilibrage (≈ 8 min, avertissements seulement)
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
  buyProp,sellProp,reneg,canReneg,answerEvent,answerLife,evDef,LIFE,EVT,net,tradable,ORDER,ENVS,META,EQUITY,STOCKS,THEMES,PRESETS,GOALS,ACH,ADV,PHASES,GOOD,Y0,get YN(){return YN},get A0(){return A0},setA0,age,AY,gTxt,
  eligEnvs,peaCap,envTotal,turnReady,finalScore,placeIdle,rebalance,dry,alloc,eqShare,irr,invData,coups,epilogue,shareText,genYear,peekR,hv,ev,conseils,rappels,pct,f1,
  homeOptions,recoHome,onbHome,onbNext,onbView,budgetTable,kidsCost,rpOf,PRESETS,EPARGNES,SALAIRES,coefOf,BIENS,dossierHtml,acheter,achatState,ACHATS,migrate,bestRental,bestBuy,buyHome,moveTo,propQuote,coussin,yearlySave,monthlySpend,CITIES,loanLeft,
  halfYear,bizCalc,bizForecast,setBud,budgetModal,budDue,bizBad,psRate,psFRate,ctoRate,avRate,wdCalc,pvImmoTax,applyProg,PROG,BUD0,setRent,rentExp,vacP,runPlans,moveCity,immoTab,bizSellPart,bizPlan,statusName,bizCreate,bizSell,bizRaise,bizDiv,bizHire,bizPay,bizLeave,bizStake,bizOffer,canRaise,DOMS,
  halfYear,buyHomeKeep,ifiTax,benchRef,biography,threadEnds,chapOf,boot,endView,envTotal,custErr,custLeft,custDefaults,homeName,startSave,turnView,bilanView,endView,introView,moneyBar,profilTab,portefeuilleTab,immoTab,patrimoineTab,animHtml,toastsHtml,advHtml,spark,save,load,legacyGame,U};`, ctx);
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
const BIEN_IDS = Object.keys(T.BIENS);
const randomPolicy = {
  life: (id, ch) => pickR(ch),
  event: (S, v) => {
    if (v.invest && R() < .5) {
      const as = v.invest.assets.filter(a => T.META[a].k === 'special' || T.tradable(a));
      if (as.length) { const a = pickR(as), envs = T.eligEnvs(a); return ['invest', a, Math.floor(S.cash * R() * .5) + 1, pickR(envs)]; }
    }
    if (v.choices && v.choices.length && R() < .7) return ['choice', pickR(v.choices).id];
    return null;
  },
  port: S => {
    if (R() < .25) { const ids = Object.keys(T.ACHATS); T.acheter(pickR(ids)); }
    if (R() < .04) T.moveTo(T.bestRental());
    if (R() < .03) { const b = T.bestBuy(); if (b && b.ok) T.buyHome(b.type, b.n); }
    for (const e of STOCK_ENVS) for (const id of T.ENVS[e].el) {
      if (!T.tradable(id)) continue;
      if (R() < .05) T.buyIn(e, id, S.cash * R() * .4);
      if (R() < .04 && T.ev(e, id) > 0) T.sellIn(e, id, T.ev(e, id) * R());
    }
    if (R() < .1) T.withdraw(R() < .5 ? 'pea' : 'av', S.acc.pea.cash * R());
    if (R() < .05) T.livIn(Math.min(S.cash, 5000));
    if (R() < .05) T.buyProp(pickR(BIEN_IDS), R() < .5 ? 'cash' : 'credit', pickR([15, 20, 25]));
    for (const p of S.props) if (T.canReneg(p) && R() < .5) T.reneg(p.uid);
    if (R() < .03 && S.props.length) T.sellProp(S.props[0].uid);
    if (R() < .3) T.placeIdle(R(), []);
    if (R() < .05) for (const p of S.props) T.setRent(p.uid, pickR([-.1, 0, .1, .2]));
    if (R() < .03) { const e = pickR(['pea', 'av', 'cto']); (S.plans || (S.plans = {}))[e + ':monde'] = { e, id: 'monde', a: Math.floor(R() * 5000) }; }
    if (!S.biz && R() < .03) T.bizCreate(pickR(Object.keys(T.DOMS)));
    if (S.biz && S.biz.alive && S.biz.role === 'own') {
      if (R() < .3) T.bizPay(pickR(['zero', 'smic', 'avant', 'haut']));
      if (R() < .2) T.bizHire(R() < .6 ? 1 : -1);
      if (R() < .2) T.bizRaise();
      if (R() < .2) T.bizDiv();
      if (R() < .03) T.bizSell(R() < .5 ? 'vente' : 'fermeture');
      if (R() < .3) { T.setBud('mk', pickR([0, .05, .1, .15, .2])); T.setBud('pr', pickR([0, .05, .1, .15])); T.setBud('px', pickR([-.05, 0, .05, .1])); }
    } else if (S.biz && S.biz.alive && R() < .05) T.bizSell('vente');
  },
};

// Joue une partie complète, un tour par an. hooks.afterPort(S) permet d'insérer des vérifications pendant le tour.
function play(arch, goals, pol, hooks = {}) {
  T.newGame(arch, goals);
  let guard = 0;
  while (T.S.phase !== 'end' && guard++ < 200) {
    const S = T.S;
    if (S.phase === 'turn') {
      if (hooks.render) { const r0 = S.rng, h1 = T.turnView(); check(S.rng === r0, `l’affichage du tour ${S.year} consomme du hasard`); check(T.turnView() === h1, `affichage non déterministe en ${S.year}`); T.toastsHtml(); }
      if (S.life) { const ch = S.life.v.choices.map(c => c.id); T.answerLife(pol.life(S.life.id, ch)); for (const c of ch) if (!S.life.answered) T.answerLife(c); check(S.life.answered, `vie perso ${S.life.id} sans réponse possible`); }
      if (S.event) {
        const v = T.evDef().view(S.event.p);
        let done = false;
        if (!S.lock && pol.event) { const a = pol.event(S, v); if (a) done = !T.answerEvent(...a); }
        if (!done) T.answerEvent('pass');
        check(S.event.answered, `événement ${S.event.id} sans réponse`);
      }
      if (!S.lock && pol.port) pol.port(S);
      if (hooks.afterPort && !S.lock) hooks.afterPort(S);
      if (hooks.render) { for (const v of ['profil', 'portefeuille', 'immo', 'boite', 'patrimoine']) { T.U.view = v; T.turnView(); } T.U.view = 'profil'; }
      check(T.turnReady(), 'tour non clôturable');
      T.endTurn();
    } else {
      if (hooks.render) { T.bilanView(); T.U.anim = { i: 0 }; T.animHtml(); T.U.anim = null; }
      T.nextBilan();
    }
  }
  check(guard < 200, 'boucle infinie');
  if (hooks.render) { T.endView(); T.coups(); T.epilogue(); T.shareText(); }
  return T.S;
}

function cashIdentity(S) {
  let sum = 0;
  for (const k in S.lg.lines) { const L = S.lg.lines[k]; if (L.env === 'liv' || L.env === 'cto' || L.env === 'biz') for (const f of L.flows) sum += f.a; }
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

// Génère n mondes sans joueur et renvoie leurs statistiques annuelles.
function worlds(n) {
  const a = { tr: [], mo: [], infl: [], credit: [], crises: 0, rec: 0, years: 0, lille: [], paris: [] };
  for (let i = 0; i < n; i++) {
    T.newGame('heritier', []);
    const S = T.S; S.fut = {}; S.wPrev = null; S.flags = {};
    let hl = 1, hp = 1;
    for (let y = T.Y0; y <= T.YN; y++) {
      const f = T.genYear(y), sh = k => f.shock ? f.shock[k] / 100 : 0;
      a.tr.push((1 + sh('tracker')) * (1 + f.r.tracker) - 1); a.mo.push((1 + sh('monde')) * (1 + f.r.monde) - 1);
      a.infl.push(f.mac.infl); a.credit.push(f.mac.credit);
      if (f.phase === 'crise') a.crises++; if (f.phase === 'recession') a.rec++; a.years++;
      hl *= 1 + f.mac.gB.lille; hp *= 1 + f.mac.gB.paris;
      S.wPrev = S.w; S.w = { ...f.mac };
    }
    a.lille.push(Math.pow(hl, 1 / 51) - 1); a.paris.push(Math.pow(hp, 1 / 51) - 1);
  }
  return a;
}
const mean = x => x.reduce((s, v) => s + v, 0) / x.length;
const sd = x => { const m = mean(x); return Math.sqrt(mean(x.map(v => (v - m) ** 2))); };
const geo = x => Math.exp(mean(x.map(v => Math.log(1 + v)))) - 1;
const med = a => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
const pc = v => (v * 100).toFixed(1).replace('.', ',') + ' %';

// =====================================================================
console.log(`La Corbeille · tests ${FULL ? 'complets' : 'rapides'} · graine ${seed}\n`);

test('Formats : pas de « −0 % »', () => {
  check(T.f1(-0.04) === '0,0' && T.f1(-1.25) === '−1,3' && T.pct(-0.004, 0) === '0 %' && T.pct(-0.0004) === '0,0 %' && T.pct(0.05) === '+5,0 %' && T.pct(-0.05, 0) === '−5 %', 'pct mal formaté');
});

test('TRI : cas connus', () => {
  const near = (a, b) => Math.abs(a - b) < 1e-4;
  check(near(T.irr([{ t: 2000, a: -100 }, { t: 2010, a: 200 }]), Math.pow(2, .1) - 1), 'x2 en 10 ans ≠ 7,18 %');
  check(near(T.irr([{ t: 2000, a: -100 }, { t: 2001, a: 5 }, { t: 2002, a: 5 }, { t: 2003, a: 105 }]), .05), 'obligation 5 % ≠ 5 %');
  check(T.irr([{ t: 2000, a: -100 }]) === -1, 'perte totale ≠ −100 %');
  check(T.irr([{ t: 2000, a: -100 }, { t: 2000.2, a: 100 }]) === null, 'durée < 6 mois devrait donner null');
});

test('Monde généré : ordres de grandeur réalistes', () => {
  const a = worlds(FULL ? 600 : 150);
  const gt = geo(a.tr), gm = geo(a.mo), inf = mean(a.infl), cr = a.crises / (a.years / 51), rc = a.rec / a.years;
  console.log(`    Bourse de Paris ${pc(gt)}/an (écart-type ${pc(sd(a.tr))}) · ETF Monde ${pc(gm)}/an · inflation ${inf.toFixed(1).replace('.', ',')} % · ${cr.toFixed(1).replace('.', ',')} crises par partie · ${pc(rc)} d’années de récession · immobilier Lille ${pc(med(a.lille))}/an, Paris ${pc(med(a.paris))}/an`);
  check(gt > .035 && gt < .075, `Bourse de Paris hors cible : ${pc(gt)}/an`);
  check(gm > .045 && gm < .085, `ETF Monde hors cible : ${pc(gm)}/an`);
  check(sd(a.tr) > .14 && sd(a.tr) < .25, `volatilité hors cible : ${pc(sd(a.tr))}`);
  check(inf > 1.5 && inf < 3, `inflation moyenne hors cible : ${inf.toFixed(2)} %`);
  check(Math.max(...a.infl) > 5, 'jamais d’épisode inflationniste');
  check(cr >= 2 && cr <= 6, `nombre de crises par partie hors cible : ${cr.toFixed(1)}`);
  check(rc > .06 && rc < .22, `part des années de récession hors cible : ${pc(rc)}`);
  check(Math.min(...a.credit) >= .8 && Math.max(...a.credit) < 10, 'taux de crédit irréaliste');
  check(med(a.paris) > 0 && med(a.paris) < .06 && med(a.lille) > 0, 'immobilier irréaliste');
});

test('Onglets : notes, conseils, budget, portefeuille, immobilier et patrimoine, sans hasard à l’affichage', () => {
  let n = 0, elections = 0;
  for (let g = 0; g < (FULL ? 40 : 12); g++) {
    T.newGame(pickR(Object.keys(T.PRESETS)), []); let prevHead = null;
    while (T.S.phase !== 'end') {
      const S = T.S;
      if (S.phase === 'turn') {
        n++; if (S.event && S.event.id === 'election') elections++;
        check(S.page && S.page.notes.length >= 1, `page vide en ${S.year}`);
        check(S.page.head && S.page.head.t, `pas de gros titre en ${S.year}`);
        check(S.page.head.t !== prevHead || S.year <= T.Y0 + 1, `même gros titre deux ans de suite en ${S.year} : ${S.page.head.t}`); prevHead = S.page.head.t;
        const r0 = S.rng, html = T.moneyBar() + T.profilTab() + T.portefeuilleTab() + T.immoTab() + T.patrimoineTab(); check(S.rng === r0, 'l’affichage consomme du hasard');
        const cs = T.conseils(); check(cs.length >= 1 && cs.length <= 3, `${cs.length} conseils en ${S.year}`);
        for (const c of cs) if (c.btn) check(['view', 'tip-tab', 'reneg'].includes(c.btn.act), `bouton de conseil inconnu : ${c.btn.act}`);
        check(!/−0 %|−0,0 %|NaN|undefined/.test(html), `valeur mal formatée dans le carnet de ${S.year}`);
        const E = S.fut[S.year].elec; if (E) check(E.A.nom !== E.B.nom, `homonymes à la présidentielle de ${S.year}`);
        if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id);
        if (S.event) T.answerEvent('pass');
        T.placeIdle(.6, []); T.endTurn();
      } else T.nextBilan();
    }
  }
  console.log(`    ${n} pages · ${elections} présidentielles en Une`);
  check(elections > 0, 'aucune présidentielle');
});

test('Création du profil et choix du logement, pour chaque salaire, épargne, ville et situation', () => {
  let buys = 0, n = 0, explained = 0, parents = 0;
  T.S = null; const intro = T.introView(); check(intro.includes('Crée ton profil') && intro.includes('Ton salaire net par mois'), 'écran de création absent');
  for (let sal = 0; sal < T.SALAIRES.length; sal++) for (let cap = 0; cap < T.EPARGNES.length; cap++) for (const city of Object.keys(T.CITIES)) for (const couple of [false, true]) {
    T.newGame({ city, sal, cap, couple }, [], true); const S = T.S; n++;
    if (!couple) { // jeune diplômé·e seul·e : deux ou trois ans chez ses parents, sans fenêtre de logement
      check(!S.onb && S.home.type === 'parents' && [T.Y0 + 2, T.Y0 + 3].includes(S.flags.parentsUntil) && T.age(T.Y0) === 20, `départ chez les parents raté (${sal}, ${cap}, ${city})`);
      T.turnView(); parents++; continue;
    }
    check(S.onb && !T.turnReady() && S.city === city && !!S.me.partner === couple && S.cash === T.EPARGNES[cap].v && Math.abs(S.revenu - T.SALAIRES[sal].m * 12) < 1, `profil mal créé (${sal}, ${cap}, ${city}, ${couple})`);
    check(S.coef > 0 && S.coef === T.coefOf({ city, sal, cap, couple }), 'coefficient absent');
    const opts = T.homeOptions(), reco = T.recoHome(opts);
    check(reco && reco.ok, `pas d’option conseillée (${sal}, ${cap}, ${city}, ${couple})`);
    check(opts.every(o => o.ok || o.why), 'option impossible sans explication'); if (opts.some(o => !o.ok)) explained++;
    T.onbView(); check(!T.onbHome(opts.indexOf(reco)), 'option conseillée refusée'); if (reco.kind === 'buy') buys++;
    const placed = T.envTotal('pea') + T.envTotal('av') + T.envTotal('cto') + S.liv;
    T.onbNext(); check(S.onb === null && T.turnReady() !== undefined, 'accueil non terminé');
    check(T.envTotal('pea') + T.envTotal('av') + T.envTotal('cto') + S.liv === placed && placed === 0, 'de l’argent a été placé à la place du joueur');
    check(cashIdentity(S) < 1 && S.cash > -0.5, 'argent créé ou perdu pendant l’accueil');
    T.turnView();
  }
  console.log(`    ${n} profils · ${parents} départs chez les parents · ${buys} achats conseillés dès le départ`);
  check(buys > 0 && buys < n && explained > 0, 'le conseil logement ne dépend pas du profil');
});

test('Immobilier : dossier de crédit pour y vivre ou pour louer, dans chaque ville', () => {
  T.newGame({ city: 'lyon', sal: 3, cap: 2, couple: true }, []); const S = T.S; S.cash += 3e6; S.start += 3e6; S.story.chap = 1; // carte du chapitre 1 déjà vue
  for (const t of Object.keys(T.BIENS).filter(k => !T.BIENS[k].hide)) {
    T.U.dossier = { t, use: T.BIENS[t].k === 'bur' ? 'loc' : 'rp' }; T.U.city = T.BIENS[t].v; T.U.view = 'immo'; const h = T.turnView();
    check(h.includes('Réponse de la banque'), `dossier absent pour ${t}`);
    if (T.BIENS[t].v !== 'lyon' && T.BIENS[t].k === 'rp') check(T.dossierHtml().includes('il faudrait habiter'), `achat pour y vivre hors de ta ville accepté (${t})`);
  }
  check(!T.buyProp('lyonbureaux', 'cash', 20, 'rp') && S.props.at(-1).use === 'loc', 'des bureaux ne peuvent être que loués');
  check(!T.buyProp('maison', 'cash', 20, 'loc') && S.props.at(-1).use === 'loc' && S.home.type !== 'maison', 'achat pour louer mal enregistré');
  T.U.dossier = null; T.U.city = null; T.U.view = 'profil';
  check(cashIdentity(S) < 1, 'argent créé ou perdu par les achats immobiliers');
});

test('Logement : loyer réel, PTZ, durée du crédit, déménagements', () => {
  T.newGame('infirmier', []); let S = T.S; S.cash += 10000; S.start += 10000;
  const q = T.propQuote('t2rp', 25, 'rp'); check(q.z > 0 && q.n === 25, 'PTZ absent pour un premier achat modeste');
  check(T.propQuote('t2rp', 15, 'rp').ann > T.propQuote('t2rp', 25, 'rp').ann, 'un crédit plus court devrait coûter plus par mois');
  check(!T.buyProp('t2rp', 'credit', 25), 'achat avec PTZ refusé');
  const rp = S.props[0]; check(rp.loan.z && rp.loan.z.p > 0 && T.loanLeft(rp) > rp.loan.p, 'PTZ non enregistré');
  check(S.home.own && S.home.type === 't2rp', 'résidence principale non habitée');
  T.sellProp(rp.uid); check(!S.home.own && T.BIENS[S.home.type], 'pas relogé après la vente');
  T.newGame('ingenieure', []); S = T.S; S.cash += 1e6; S.start += 1e6;
  check(T.moveTo('coloc') === null && S.home.type === 'coloc', 'colocation refusée à une célibataire');
  check(T.moveTo('rpparis') !== null, 'loyer parisien accepté sans revenus suffisants');
  const before = T.yearlySave(); T.moveTo('studio'); check(T.yearlySave() !== before, 'le loyer ne change pas l’épargne');
  check(cashIdentity(S) < 1, 'argent créé ou perdu en déménageant');
});

test('Budget : ce qui est annoncé est ce qui arrive (locataire, propriétaire, bailleur, enfants, retraite)', () => {
  const num = x => +x.replace(/[\s  ]/g, '');
  let years = 0, worst = 0;
  for (let g = 0; g < (FULL ? 60 : 16); g++) {
    const sp = { city: pickR(Object.keys(T.CITIES)), sal: Math.floor(R() * 5), cap: Math.floor(R() * 3), couple: R() < .5 };
    if (g % 2) { const c = T.custDefaults(sp); c.sal = Math.round(c.sal * (.7 + R() * .8)); c.rent = Math.round(c.rent * (.6 + R() * .8)); c.rooms = 1 + Math.floor(R() * 4); c.car = R() < .3 ? 0 : c.car; if (R() < .5) { c.debt = 150; c.debtN = 1 + Math.floor(R() * 8); } c.dep = Math.max(sp.couple ? 1350 : 900, Math.round(c.dep * .9)); if (T.custLeft(c, sp.couple) > 0) sp.cust = c; }
    T.newGame(sp, []);
    while (T.S.phase !== 'end') { const S = T.S; if (S.phase !== 'turn') { T.nextBilan(); continue; }
      if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id);
      if (S.event) T.answerEvent('pass');
      if (R() < .1) { const b = T.bestBuy(); if (b && b.ok) T.buyHome(b.type, b.n); }
      if (R() < .04 && S.props.length) T.sellProp(S.props[0].uid);
      if (R() < .04) T.buyProp(pickR(Object.keys(T.BIENS).filter(k => !T.BIENS[k].hide)), 'credit', 20, 'loc');
      const rows = [...T.budgetTable().matchAll(/<td class="n[^"]*">(−?)([\d\s  ]+) €<\/td>/g)].map(m => (m[1] ? -1 : 1) * num(m[2])), tot = rows.pop();
      check(Math.abs(rows.reduce((x, y) => x + y, 0) - tot) <= 3, `budget du mois : les lignes ne font pas le total en ${S.year}`);
      const pred = T.yearlySave(); T.endTurn(); years++;
      const b = S.bilans[0]; worst = Math.max(worst, Math.abs(b.save - pred));
      check(Math.abs(b.save - pred) < 1, `annoncé ${Math.round(pred / 12)} €/mois, réel ${Math.round(b.save / 12)} €/mois en ${b.y}`);
      if (T.rpOf && S.props.some(p => p.use === 'rp' || (!p.use && T.BIENS[p.type].k === 'rp'))) check(b.flows.logement === 0 && b.flows.rp === 0, `un propriétaire voit un loyer dans son bilan en ${b.y}`);
    }
  }
  console.log(`    ${years} années · écart max ${worst.toFixed(2)} €`);
});

test('Profil sur mesure : saisie contrôlée, budget de départ fidèle, difficulté calculée', () => {
  const st = { city: 'lyon', sal: 2, cap: 1, couple: true, goals: [] }, c = T.custDefaults(st); st.cust = c; st.custom = true;
  check(!T.custErr(st), 'valeurs par défaut refusées : ' + T.custErr(st));
  check(Math.abs(T.custLeft(c, true) * 12 - T.startSave({ city: 'lyon', sal: 2, cap: 1, couple: true })) < 300, 'les valeurs par défaut ne redonnent pas l’épargne de la fourchette');
  check(T.custErr({ ...st, cust: { ...c, rent: 9000 } }).includes('dépassent'), 'budget dans le rouge accepté');
  check(!T.custErr({ ...st, couple: false, cust: { ...c, salP: 0, dep: 500 } }) && /manger/.test(T.custErr({ ...st, couple: false, cust: { ...c, salP: 0, dep: 200 } })), 'plancher des dépenses de ses propres chiffres');
  check(T.custErr({ ...st, cust: { ...c, debt: 200, debtN: 0 } }).includes('années'), 'crédit sans durée accepté');
  check(T.custErr({ ...st, cust: { ...c, sal: 100 } }).includes('salaire'), 'salaire trop bas accepté');
  const cu = { sal: 2800, salP: 2100, rent: 1150, rooms: 3, dep: 2300, car: 250, debt: 180, debtN: 3 };
  T.newGame({ city: 'lyon', sal: 2, cap: 1, couple: true, cust: cu }, []);
  const S = T.S, num = x => +x.replace(/[\s  ]/g, ''), rows = [...T.budgetTable().matchAll(/<td>([^<]+)(?:<small>[^<]*<\/small>)?<\/td><td class="n[^"]*">(−?)([\d\s  ]+) €<\/td>/g)].map(m => [m[1], (m[2] ? -1 : 1) * num(m[3])]);
  const get = l => (rows.find(r => r[0].startsWith(l)) || [])[1];
  check(get('Revenus du foyer') === 4900 && get('Dépenses courantes') === -2300 && get('Loyer') === -1150 && get('Voiture') === -250 && get('Autre crédit') === -180, 'budget du mois différent de la saisie : ' + JSON.stringify(rows));
  check(T.homeName() === 'Ton T3 actuel' && S.home.type === 'perso', 'logement actuel non repris');
  check(Math.abs(S.coef - T.coefOf({ city: 'lyon', sal: 2, cap: 1, couple: true, cust: cu })) < 1e-9 && S.coef !== T.coefOf({ city: 'lyon', sal: 2, cap: 1, couple: true }), 'difficulté non calculée sur la saisie');
  for (let i = 0; i < 4; i++) { if (S.life) for (const ch of S.life.v.choices) if (!S.life.answered) T.answerLife(ch.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); }
  check(!T.budgetTable().includes('Autre crédit'), 'l’autre crédit court après son terme');
  check(cashIdentity(S) < 1, 'argent créé ou perdu avec un profil sur mesure');
});

test('Se faire du bien : coût réel, effet sur le moral, effet émoussé', () => {
  T.newGame('heritier', []); const S = T.S; S.cash += 50000; S.start += 50000; S.me.humeur = 50; S.me.relation = 50;
  const c = T.achatState('vacances').c, cash = S.cash;
  check(!T.acheter('vacances') && Math.abs(S.cash - (cash - c)) < 1 && S.me.humeur > 50 && S.me.relation > 50, 'vacances mal comptées');
  check(T.acheter('vacances'), 'deux fois les mêmes vacances la même année');
  check(!T.achatState('famille'), 'sortie en famille proposée sans enfant');
  S.year++; check(T.achatState('vacances').f < 1, 'effet non émoussé l’année suivante');
  check(cashIdentity(S) < 1, 'argent créé ou perdu par les achats');
});

test('Migration : une partie de la version 3.1 se recharge avec un logement', () => {
  T.newGame('heritier', []); const o = JSON.parse(JSON.stringify(T.S));
  delete o.home; delete o.city; delete o.buyHist; delete o.page; delete o.me.kids; delete o.me.car; delete o.idx.t2rp; delete o.drift.b_t2rp; o.gaz = { head: { t: 'Ancien titre', c: '' } }; o.me.enfants = 2;
  T.S = T.migrate(o); const S = T.S;
  check(S.home && S.city === 'lille' && S.idx.t2rp && S.me.kids.length === 2 && S.page.head.t === 'Ancien titre', 'migration incomplète');
  T.turnView(); T.endTurn(); T.nextBilan(); scanNumbers(T.S);
});

test('Parties aléatoires : invariants, rendu et identité de caisse', () => {
  const N = FULL ? 120 : 15;
  let checked = 0, worst = 0;
  for (const arch of Object.keys(T.PRESETS)) for (let g = 0; g < N; g++) {
    const goals = [pickR(Object.keys(T.GOALS)), pickR(Object.keys(T.GOALS))];
    const S = play(arch, goals, randomPolicy, { render: true });
    endInvariants(S);
    if (!S.log.some(l => l.r.startsWith('Divorce'))) { const err = cashIdentity(S); worst = Math.max(worst, err); checked++; check(err < 1, `identité de caisse rompue : écart ${err.toFixed(2)} € (${arch})`); }
  }
  console.log(`    ${checked} parties vérifiées au centime · écart max ${worst.toFixed(4)} €`);
});

test('Rééquilibrage : aperçu pur, conservation de l’argent, aperçu = exécution', () => {
  const N = FULL ? 40 : 8;
  let n = 0;
  const hook = S => {
    if (R() > .3) return;
    const p = pickR([0, .2, .5, .8, 1, R()]);
    const cash0 = S.cash, before = T.net(), snap = JSON.stringify(S);
    const d = T.dry(() => T.rebalance(p));
    check(JSON.stringify(T.S) === snap, 'l’aperçu (dry) a modifié l’état');
    let tax = 0;
    if (R() < .5) T.placeIdle(p, []);
    else { const r = T.rebalance(p); tax = r.tax; check(Math.abs(r.after - d.after) < 1e-9, 'aperçu ≠ exécution'); }
    const err = Math.abs(T.net() + tax - before);
    check(err < 2, `argent créé ou détruit : ${err.toFixed(2)} €`);
    check(S.cash > -0.5 || cash0 < -0.5, `compte courant négatif après répartition (avant : ${cash0.toFixed(0)}, après : ${S.cash.toFixed(0)}, faillite : ${!!S.flags.faillite})`);
    n++;
  };
  for (const arch of Object.keys(T.PRESETS)) for (let g = 0; g < N; g++) play(arch, [], randomPolicy, { afterPort: hook });
  console.log(`    ${n} opérations contrôlées`);
});

test('Déterminisme : même graine, même partie', () => {
  // newGame tire sa graine de Date.now() et Math.random() : on les fige pour rejouer deux fois la même partie.
  const once = () => { const a = R; let k = 7; ctx.Math.random = () => (k = (k * 16807) % 2147483647) / 2147483647; T.newGame('ingenieure', ['fire']);
    for (let i = 0; i < 25; i++) { const S = T.S; if (S.life) T.answerLife(S.life.v.choices[0].id); if (S.event) T.answerEvent('pass'); T.placeIdle(.7, []); T.endTurn(); T.nextBilan(); }
    ctx.Math.random = a; return JSON.stringify(T.S); };
  check(once() === once(), 'deux parties à graine égale divergent');
});

test('Sauvegarde : l’état survit à un aller-retour JSON, ancienne version close proprement', () => {
  T.newGame('fondatrice', ['rp35', 'serein']);
  for (let i = 0; i < 6; i++) { const S = T.S; if (S.life) T.answerLife(S.life.v.choices[0].id); if (S.event) T.answerEvent('pass'); T.placeIdle(.6, []); T.endTurn(); T.nextBilan(); }
  T.save();
  const restored = T.load();
  check(restored && restored.v === 3, 'chargement impossible');
  check(JSON.stringify(restored) === JSON.stringify(T.S), 'état différent après rechargement');
  T.S = restored; T.turnView();
  store['la-corbeille-v2'] = JSON.stringify({ v: 2, year: 2013, phase: 'turn', cash: 1000, liv: 500, acc: { cto: { hold: { tracker: { v: 2000, b: 1000 } }, cash: 0 }, pea: { hold: {}, cash: 100 }, av: { hold: {}, cash: 0 } }, props: [{ type: 'logement', loan: { p: 40000 } }], idx: { logement: { price: 100000 } } });
  const L = T.legacyGame();
  check(L && Math.round(L.net) === 63600 && L.year === 2013, 'ancienne partie mal résumée');
  T.S = null; T.U.legacy = L; check(T.introView().includes('Nouvelle saison'), 'message de clôture absent'); T.U.legacy = null;
  delete store['la-corbeille-v2'];
});

// Joueur qui n'investit jamais : tout reste sur le compte courant ; il peut acheter sa résidence principale et se faire plaisir.
function playNoInvest(arch, owner, onYear) {
  T.newGame(arch, []);
  let guard = 0;
  while (T.S.phase !== 'end' && guard++ < 200) {
    const S = T.S;
    if (S.phase !== 'turn') { T.nextBilan(); continue; }
    // Les flux de janvier déjà passés (imprévu payé au début du tour) n'arrivent au repère qu'au bilan : on part du compte d'avant.
    const b0 = S.bench.trk, c0 = S.cash - S.yearExt - (S.yearProp || 0);
    if (S.life) { const ids = S.life.v.choices.map(c => c.id), pref = ['cash', '0', 'non', 'job'].filter(x => ids.includes(x)); for (const c of [...pref, ...ids]) if (!S.life.answered) T.answerLife(c); }
    if (S.event) T.answerEvent('pass');
    if (!S.lock) {
      if (owner && !T.rpOf()) { const b = T.bestBuy(); if (b && b.ok) T.buyHome(b.type, b.n); }
      if (R() < .5) T.acheter(pickR(Object.keys(T.ACHATS)));
    }
    T.endTurn();
    if (onYear) onYear(S, b0, c0);
  }
  return T.S;
}
const INVESTED = S => T.envTotal('cto') + T.envTotal('pea') + T.envTotal('av') + S.liv;

test('Score : un joueur qui n’a jamais investi n’est jamais classé au-dessus d’« Épargnant équilibré »', () => {
  const n = FULL ? 160 : 40, top = ['Légende de la Corbeille', 'Investisseur avisé', 'Loup de la Corbeille', 'Sage de la Corbeille'];
  let checked = 0, zero = 0;
  for (let i = 0; i < n; i++) {
    const S = playNoInvest(pickR(Object.keys(T.PRESETS)), i % 2 === 0);
    if (INVESTED(S) > 1) continue; // une décision de vie a placé de l'argent : la partie ne compte pas
    const fs = T.finalScore(); checked++;
    if (fs.mt === 0) zero++;
    check(!top.includes(fs.title) && fs.mt <= 1, `jamais investi mais classé « ${fs.title} » (patrimoine ${Math.round(T.net())} €, repère ${Math.round(T.benchRef().trk)} €)`);
  }
  check(checked >= n / 2, `trop peu de parties sans placement (${checked})`);
  console.log(`    ${checked} parties sans placement, ${zero} classées « à la traîne » côté argent`);
});

test('Score : le repère ETF Monde d’un propriétaire suit ses flux de vie et d’immobilier, sans plancher à zéro', () => {
  let years = 0, maxErr = 0, neg = 0;
  for (let i = 0; i < (FULL ? 60 : 16); i++) {
    playNoInvest(pickR(Object.keys(T.PRESETS)), true, (S, b0, c0) => {
      if (S.phase !== 'bilan' || INVESTED(S) > 1 || S.me.ruined) return; // ruiné : le repère a sa propre règle (plancher à zéro)
      // Sans placement, l'argent qui bouge sur le compte courant est exactement ce que reçoit le repère.
      const r = S.lastR.monde, y = S.bilans[0].y, ret = S.me.retireYear != null && y >= S.me.retireYear, e0 = (b0 > 0 ? b0 * (1 + r) : b0) + (S.cash - c0), exp = ret && e0 < 0 ? 0 : e0, err = Math.abs(S.bench.trk - exp);
      maxErr = Math.max(maxErr, err); years++; if (S.bench.trk < 0) neg++;
      check(err < 1, `repère incohérent en ${S.bilans[0].y} : ${S.bench.trk.toFixed(2)} au lieu de ${exp.toFixed(2)}`);
      check(Math.abs(S.hist[S.hist.length - 1].trk - T.benchRef().trk) < 1, 'courbe du repère sans l’immobilier');
    });
    const S = T.S;
    // Le Livret A rapporte toujours au moins autant que le compte courant : un joueur sans placement ne peut pas battre ce repère.
    if (INVESTED(S) <= 1) check(T.benchRef().liv > T.net() - 1, `un joueur sans placement bat le repère Livret A (${Math.round(T.net())} > ${Math.round(T.benchRef().liv)})`);
  }
  check(years > 100, 'trop peu d’années vérifiées');
  console.log(`    ${years} années · écart max ${maxErr.toFixed(4)} € · ${neg} années avec un repère négatif`);
});

test('Histoire : une partie d’avant la 3.7 se recharge avec sa famille et ses fils', () => {
  T.newGame({ city: 'lille', sal: 2, cap: 1, couple: true }, []);
  for (let i = 0; i < 12; i++) { const S = T.S; if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); }
  const old = JSON.parse(JSON.stringify(T.S)); delete old.story; old.flags.pretAmi = { y: old.year + 1, a: 11000 };
  T.boot({ S: old }); const S = T.S;
  check(S.story && S.story.chap === T.chapOf(S.year) + 1 && !S.flags.pretAmi, 'histoire non créée à la migration');
  check(Object.values(S.story.th).every(t => t.due >= S.year), 'fil migré dans le passé');
  T.turnView();
  for (let i = 0; i < 6; i++) { if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); }
  check(cashIdentity(S) < 1 || S.me.ruptures, 'argent créé ou perdu après migration'); // un divorce partage le patrimoine
});

test('Histoire : textes jamais répétés, présidentielles rares, fils conclus, deux moments par chapitre', () => {
  let games = 0, win = 0, elec = 0, beats = 0, threads = 0;
  for (let g = 0; g < (FULL ? 60 : 16); g++) {
    T.newGame({ city: pickR(Object.keys(T.CITIES)), sal: Math.floor(R() * 5), cap: Math.floor(R() * 3), couple: R() < .5 }, []);
    const seen = new Set(); let el = 0;
    while (T.S.phase !== 'end') {
      const S = T.S; if (S.phase === 'bilan') { T.nextBilan(); continue; }
      const see = (v, k) => { const key = v.title + '|' + v.body; check(!seen.has(key), `texte répété en ${S.year} (${k}) : ${v.title}`); seen.add(key); win++; };
      if (S.event) { const v = T.evDef().view(S.event.p); see(v, S.event.id); if (S.event.id === 'election') el++;
        if (v.choices && v.choices.length && R() < .6) T.answerEvent('choice', pickR(v.choices).id); if (!S.event.answered) T.answerEvent('pass'); }
      if (S.life) { see(S.life.v, S.life.id); const ch = S.life.v.choices.map(c => c.id); T.answerLife(pickR(ch)); for (const c of ch) if (!S.life.answered) T.answerLife(c); }
      if (S.cash > 3000 && R() < .5) T.buyIn('cto', 'monde', Math.floor(S.cash * .5));
      if (R() < .2) { const k = Object.keys(T.ACHATS); T.acheter(pickR(k)); }
      T.endTurn();
    }
    const st = T.S.story; games++; elec += el;
    check(el <= 3, `${el} présidentielles en fenêtre dans une partie`);
    for (const id in st.th) { const t = st.th[id]; threads++; check(t.end && (t.beats > 0 || t.endT), `fil « ${t.k} » ouvert en ${t.open} sans suite ni fin`); }
    const lastCh = T.chapOf(Math.min(T.S.year, T.YN));
    for (let c = 0; c <= lastCh; c++) check(st.beats.filter(b => b.ch === c).length >= 2, `chapitre ${c + 1} avec moins de deux moments racontés`);
    beats += st.beats.length;
    const bio = T.biography(); check(bio.length === lastCh + 1 && bio.every(b => b.t.length > 40), 'biographie incomplète');
    T.endView();
    check(cashIdentity(T.S) < 1 || T.S.me.ruptures, 'argent créé ou perdu par l’histoire');
  }
  console.log(`    ${games} parties · ${(win / games).toFixed(1)} fenêtres par partie · ${(elec / games).toFixed(1)} présidentielles en fenêtre · ${(beats / games).toFixed(1)} moments racontés · ${threads} fils conclus`);
});

test('Monde du jour : même graine, même monde, quels que soient les choix', () => {
  const world = (pol) => { T.newGame({ city: 'lyon', sal: 2, cap: 1, couple: true, seed: 424242 }, []); const S = T.S;
    while (S.phase !== 'end') { if (S.phase !== 'turn') { T.nextBilan(); continue; }
      if (S.life) { const ch = S.life.v.choices.map(c => c.id); T.answerLife(pol ? ch[ch.length - 1] : ch[0]); for (const c of ch) if (!S.life.answered) T.answerLife(c); }
      if (S.event) T.answerEvent('pass'); if (pol && S.cash > 2000) T.buyIn('cto', 'monde', S.cash / 2); T.endTurn(); }
    return JSON.stringify(Object.values(S.fut).map(f => [f.phase, Math.round(f.mac.infl * 1000), f.elec ? f.elec.win + f.elec.A.name : '', f.cause || '']).concat(S.th.map(t => t.k + t.start))); };
  check(world(false) === world(true), 'deux joueurs avec la même graine ne vivent pas le même monde');
  check(T.S.wseed === 424242, 'graine du monde perdue');
});

test('Contenu : SCPI, obligations d’entreprise, location meublée, IFI', () => {
  T.newGame({ city: 'bordeaux', sal: 3, cap: 2, couple: false }, []); const S = T.S; S.cash += 3e6; S.start += 3e6;
  check(!T.buyIn('cto', 'scpi', 10000) && Math.abs(S.acc.cto.hold.scpi.v - 9200) < 1, 'frais d’entrée de la SCPI absents');
  check(!T.buyIn('av', 'corp', 10000), 'obligations d’entreprise refusées en assurance-vie');
  check(!T.buyProp('mrst2', 'cash', 20, 'loc', true) && S.props.at(-1).meuble, 'location meublée non enregistrée');
  check(!T.buyProp('bdxt2', 'cash', 20, 'loc'), 'achat à Bordeaux refusé');
  check(T.ifiTax() === 0, 'IFI sur un petit patrimoine immobilier');
  for (let i = 0; i < 6; i++) T.buyProp('parisbureaux', 'cash', 20, 'loc');
  check(T.ifiTax() > 5000, 'IFI absent au-delà de 1,3 million');
  if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass');
  T.endTurn(); const b = S.bilans[0];
  check(b.flows.ifi > 0 && b.notes.some(n => n.includes('fortune immobilière')), 'IFI non prélevé au bilan');
  check(cashIdentity(S) < 1, 'argent créé ou perdu par le nouveau contenu');
});

test('Immobilier : nouvelle résidence principale en gardant l’ancienne pour la louer', () => {
  T.newGame({ city: 'lille', sal: 4, cap: 2, couple: true }, []); const S = T.S; S.cash += 200000; S.start += 200000;
  check(!T.buyHome('t2rp', 20) && T.rpOf().type === 't2rp', 'achat du T2 en résidence principale refusé');
  const e = T.buyHomeKeep('maison');
  check(!e, 'achat de la maison en gardant le T2 refusé : ' + e);
  const rp = T.rpOf(), t2 = S.props.find(p => p.type === 't2rp');
  check(rp && rp.type === 'maison' && S.home.type === 'maison', 'la maison n’est pas devenue la résidence principale');
  check(t2 && t2.use === 'loc' && t2.loan, 'le T2 n’est pas devenu un bien locatif avec son crédit');
  if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass');
  T.endTurn(); check(S.bilans[0].flows.loyers > 0, 'le T2 ne rapporte aucun loyer');
  check(cashIdentity(S) < 1, 'argent créé ou perdu en changeant de résidence principale');
});

test('Immobilier : apport au choix, de « frais seuls » à 90 %', () => {
  T.newGame({ city: 'lyon', sal: 3, cap: 1, couple: true }, []); const S = T.S;
  const q0 = T.propQuote('lyont2', 25, 'rp', 0), q5 = T.propQuote('lyont2', 25, 'rp', .5), qd = T.propQuote('lyont2', 25, 'rp');
  check(Math.abs(q0.apport - q0.frais) < 1 && q0.L === q0.price && q5.L < qd.L && q0.eff > q5.eff, 'apport mal pris en compte');
  check(q0.r > qd.r, 'pas de surcoût de taux sous 10 % d’apport');
  const dc = q0.apport + 1 - S.cash; S.cash += dc; S.start += dc;
  const e = T.buyHome('lyont2', 25, 0); check(!e || /effort/.test(e), 'achat avec frais seuls refusé pour une autre raison : ' + e);
  check(cashIdentity(S) < 1, 'argent créé ou perdu avec un apport réduit');
});

test('Point de juillet : le semestre ne change ni le monde ni l’argent de l’année', () => {
  for (let g = 0; g < 6; g++) {
    T.newGame({ city: 'lyon', sal: 3, cap: 2, couple: g % 2 === 0, seed: 1000 + g }, []); const S = T.S;
    for (let i = 0; i < 6 + g; i++) { if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); if (S.cash > 3000) { T.buyIn('pea', 'monde', 2000); T.buyIn('cto', 'scpi', 1000); } T.endTurn(); T.nextBilan(); }
    if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass');
    const snap = JSON.stringify(S), pred = T.yearlySave();
    T.endTurn(); const A = { net: T.net(), px: S.px.monde, save: S.bilans[0].save, start: S.bilans[0].netStart };
    T.S = JSON.parse(snap); T.halfYear(); check(T.S.half === 1 && T.S.cash >= JSON.parse(snap).cash, 'juillet sans versement');
    T.endTurn(); const B = T.S;
    check(Math.abs(T.net() - A.net) < 1 && Math.abs(B.px.monde - A.px) < 1e-6, `juillet change le résultat de l’année (${Math.round(T.net())} au lieu de ${Math.round(A.net)})`);
    check(Math.abs(B.bilans[0].save - pred) < 1 && Math.abs(B.bilans[0].netStart - A.start) < 1, 'budget ou bilan faussés par juillet');
    check(cashIdentity(B) < 1 || B.me.ruptures, 'argent créé ou perdu en juillet');
  }
});

test('Carrière : créer sa boîte, la piloter, la vendre, sans créer ni perdre d’argent', () => {
  let fails = 0, sold = 0, n = 0;
  for (let g = 0; g < 24; g++) {
    const dom = Object.keys(T.DOMS)[g % 5];
    T.newGame({ city: 'lille', sal: 2, cap: g % 3 === 0 ? 0 : 1, couple: g % 2 === 1, seed: 500 + g }, []); let S = T.S;
    const n0 = T.net(), c0 = S.cash, sal0 = S.revenu, er = T.bizCreate(dom);
    if (er) { check(g % 3 === 0 && /apport/.test(er), `création refusée à tort (${dom}) : ${er}`); continue; }
    n++; S = T.S;
    check(Math.abs(T.net() - n0) < 1 && S.cash < c0 + .5 && S.salRef === sal0 && S.revenu === S.biz.payV, `création mal comptée (${dom})`);
    check(T.bizCreate('conseil'), 'deux boîtes en même temps');
    T.U.view = 'boite'; T.turnView(); T.U.bizConf = 'sell'; T.turnView(); T.U.bizConf = null;
    for (let i = 0; i < 14 && S.phase !== 'end'; i++) {
      if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id);
      if (S.event) T.answerEvent('pass');
      const B = S.biz;
      if (B && B.alive && B.role === 'own') {
        check(S.revenu === B.payV, 'salaire du dirigeant différent de ce que verse la boîte');
        if (B.hist.length) { if (B.red && B.staff) T.bizHire(-1); T.bizPay(B.red ? 'zero' : B.tre > 60000 ? 'avant' : 'smic'); if (B.tre > 150000) T.bizDiv(); if (!T.canRaise() && B.tre < 50000) T.bizRaise(); }
      }
      T.turnView(); T.endTurn(); T.bilanView(); T.nextBilan(); S = T.S;
      scanNumbers(S); check(T.bizStake() >= 0 && (!S.biz || S.biz.share > 0), 'part de boîte négative');
      check(cashIdentity(S) < 1 || S.me.ruptures, `argent créé ou perdu avec la boîte (${dom}, ${S.year})`);
    }
    const past = S.bizPast || [];
    if (past.some(x => x.txt === 'en faillite')) { fails++; check(S.salRef == null && S.revenu > 0, 'pas de retour à l’emploi après la faillite'); }
    else if (S.biz && S.biz.alive && S.biz.role === 'own') {
      const ref = S.salRef, r = T.bizSell('vente'); sold++;
      check(!r.err && !S.biz && Math.abs(S.revenu - Math.round(ref)) < 1 && cashIdentity(S) < 1 + (S.me.ruptures ? 1e12 : 0), 'vente mal comptée');
    }
    const S2 = JSON.parse(JSON.stringify(T.S)); check(JSON.stringify(S2) === JSON.stringify(T.S), 'sauvegarde de la boîte');
    T.invData(); T.endView;
  }
  // rejoindre une start-up
  T.newGame({ city: 'lyon', sal: 3, cap: 1, couple: false, seed: 77 }, []); const S = T.S, r0 = S.revenu;
  S.life = { id: 'startupJob', sname: 'Orbital', answered: false }; S.life.v = T.LIFE.startupJob.view();
  T.answerLife('oui');
  check(S.biz && S.biz.role === 'emp' && Math.abs(S.revenu - .8 * r0) < 1 && S.salRef === r0, 'embauche en start-up mal appliquée');
  T.endTurn(); T.nextBilan(); check(T.S.biz.share > 0 || !T.S.biz, 'actions non acquises');
  console.log(`    ${n} créations · ${fails} faillites en 14 ans · ${sold} ventes`);
});

test('Homme ou femme : textes accordés, départ à 20 ans, fin à 75 ans', () => {
  for (const g of ['f', 'm', null]) {
    T.newGame({ city: 'lille', sal: 2, cap: 1, couple: false, g, seed: 31 }, ['rp35', 'fire']); const S = T.S;
    check(S.me.g === g && T.age(T.Y0) === 20 && T.YN === T.Y0 + 55, 'âge de départ ou fin de partie faux');
    const html = T.gTxt(T.turnView(), S.me.g);
    check(!html.includes('‧'), 'marqueur d’accord visible');
    const t = T.gTxt('Tu restes seul‧e, fatigué‧e.', g);
    check(t === (g === 'f' ? 'Tu restes seule, fatiguée.' : g === 'm' ? 'Tu restes seul, fatigué.' : 'Tu restes seul·e, fatigué·e.'), 'accord faux : ' + t);
    check(T.GOALS.rp35.d.includes(String(T.Y0 + 15)) && T.GOALS.fire.d.includes(String(T.Y0 + 35)), 'objectifs non recalés sur l’âge');
    let guard = 0; while (S.phase !== 'end' && guard++ < 200) { if (S.phase === 'turn') { if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); } else T.nextBilan(); }
    check(T.S.phase === 'end' && T.S.year === T.Y0 + 55, 'la partie ne s’arrête pas à 75 ans');
    const fs = T.finalScore(); check(g !== 'f' || !/Épargnant |Investisseur|Loup|Naufragé /.test(fs.title), 'titre non accordé : ' + fs.title);
    check(!T.gTxt(T.endView(), g).includes('‧') && !T.shareText().includes('‧'), 'marqueur visible en fin de partie');
  }
  // une partie d'avant la 3.13 garde ses 25 ans et sa fin en 2076
  T.newGame('heritier', []); const old = JSON.parse(JSON.stringify(T.S)); delete old.a0; T.boot({ S: old });
  check(T.A0 === 25 && T.YN === 2076 && T.S.a0 === 25 && T.age(T.Y0) === 25, 'ancienne partie mal rechargée');
  T.setA0(20);
});

test('Changer de ville : résidence vendue ou louée, nouveau loyer, argent juste', () => {
  for (const how of ['vendre', 'louer']) {
    T.newGame({ city: 'marseille', sal: 3, cap: 2, couple: true, seed: 90 }, []); const S = T.S;
    S.cash = S.start = 400000; const er0 = T.buyProp('mrsmaison', 'credit', 25, 'rp', false, .5); check(!er0, 'achat de la maison refusé : ' + er0);
    T.U.view = 'immo'; T.U.city = 'lille'; const r0 = S.rng, h = T.immoTab(); check(S.rng === r0 && h.includes('Déménager à Lille'), 'bouton de déménagement absent ou impur');
    const r = T.moveCity('lille', how);
    check(typeof r === 'object' && S.city === 'lille' && !S.home.own && T.CITIES.lille && S.home.type !== 'perso', `déménagement raté (${how}) : ${JSON.stringify(r)}`);
    check(how === 'louer' ? S.props.length === 1 && S.props[0].use === 'loc' : S.props.length === 0, 'ancienne résidence mal traitée');
    check(T.moveCity('paris', how) === 'Un changement de ville par an, c’est déjà beaucoup.', 'deux déménagements la même année');
    check(cashIdentity(S) < 1, 'argent créé ou perdu en déménageant de ville');
    T.endTurn(); T.nextBilan(); if (T.S.life) for (const c of T.S.life.v.choices) if (!T.S.life.answered) T.answerLife(c.id); if (T.S.event) T.answerEvent('pass');
    const car = T.S.me.car; check(typeof T.moveCity('paris', how) === 'object' && T.S.city === 'paris' && !T.S.me.car, 'voiture gardée à Paris');
    check(cashIdentity(T.S) < 1 || T.S.me.ruptures, 'argent créé ou perdu en partant à Paris'); void car;
  }
});

test('Ta boîte : céder des parts, plan social, offre de rachat ; statuts de carrière', () => {
  T.newGame({ city: 'lyon', sal: 2, cap: 2, couple: false, g: 'f', seed: 404 }, []); let S = T.S;
  check(T.statusName() === 'Chargée d’affaires'.replace('ée', '‧e').replace('Charg‧e', 'Chargé‧e') || /Charg/.test(T.statusName()), 'statut de départ');
  check(!T.bizCreate('ecom'), 'création refusée'); check(/^Fondatrice de /.test(T.statusName()), 'statut de fondatrice : ' + T.statusName());
  check(T.bizSellPart(.25).err, 'cession avant le premier bilan');
  for (let i = 0; i < 3; i++) { if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); S = T.S; }
  if (S.biz && S.biz.alive) {
    const sh = S.biz.share, c0 = S.cash, r = T.bizSellPart(.25);
    check(!r.err && Math.abs(S.biz.share - sh * .75) < 1e-9 && S.cash > c0 && cashIdentity(S) < 1, 'cession de parts mal comptée');
    let k = 0; while (!T.bizSellPart(.25).err && k < 10) k++; check(S.biz.share >= .3 - 1e-9 && k < 10 && cashIdentity(S) < 1, 'on peut descendre sous 30 %');
    S.biz.staff = 4; const t0 = S.biz.tre; check(!T.bizPlan() && S.biz.staff === 2 && S.biz.tre < t0, 'plan social');
    S.event = { id: 'rachat', p: { who: 'un fonds d’investissement', prem: 1.3, name: S.biz.name, v: S.biz.share * S.biz.val }, answered: false }; const v = T.evDef().view(S.event.p);
    check(v.choices.length === 3 && !T.answerEvent('choice', 'tout') && !S.biz && cashIdentity(S) < 1, 'offre de rachat');
  }
  T.newGame({ city: 'lyon', sal: 2, cap: 1, couple: false, g: 'm', seed: 405 }, []); S = T.S; S.me.rank = 1;
  S.life = { id: 'promo', answered: false }; S.life.v = T.LIFE.promo.view(); T.answerLife('oui'); check(S.me.rank === 2 && T.statusName() === 'Directeur', 'promotion : ' + T.statusName());
  S.me.g = null; check(T.statusName() === 'Directeur·rice', 'statut inclusif');
});

test('Loyers réglables et versements automatiques', () => {
  T.newGame({ city: 'lille', sal: 3, cap: 2, couple: false, seed: 61 }, []); let S = T.S; S.cash = S.start = 1500000;
  check(!T.buyProp('lille', 'cash') && !T.buyProp('paris', 'cash') && !T.buyProp('bureaux', 'cash'), 'achats refusés');
  for (const p of S.props.filter(p => p.type !== 'paris')) {
    const e = l => T.rentExp(p, l), m = e(0);
    check(m >= e(.2) && m >= e(-.1) * .99 && Math.abs(e(.1) / m - 1) < .06 && T.vacP({ ...p, rl: .2 }) > T.vacP(p), `équilibre des loyers faux (${p.type})`);
  }
  const par = S.props.find(p => p.type === 'paris'), lil = S.props.find(p => p.type === 'lille');
  check(T.setRent(par.uid, .1) && !T.setRent(par.uid, -.1) && !T.setRent(lil.uid, .2) && lil.rl === .2, 'réglage des loyers');
  S.plans = { 'pea:monde': { e: 'pea', id: 'monde', a: 2000 }, 'liv:livret': { e: 'liv', id: 'livret', a: 1500 } };
  const v0 = S.acc.pea.vers;
  for (let i = 0; i < 3; i++) { if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); S = T.S; }
  check(S.acc.pea.vers - v0 >= 6000 - 1 && S.liv >= 4500 - 1 && cashIdentity(S) < 1, `versements automatiques non faits (${S.acc.pea.vers - v0}, ${S.liv})`);
  check(S.page.notes.some(n => /versements automatiques/.test(n.t)), 'versements absents des notes');
  S.cash = 50; check(T.runPlans().every(t => /sauté/.test(t)), 'versement sans argent');
});

test('Fiscalité 2026 : 31,4 % au compte-titres, 18,6 % au PEA, 30 % pour l’assurance-vie, 17,2 % pour l’immobilier', () => {
  T.newGame({ city: 'lille', sal: 2, cap: 2, couple: false, seed: 800 }, []); const S = T.S, eq = (a, b) => Math.abs(a - b) < 1e-9;
  check(eq(T.ctoRate(), .314) && eq(T.psRate(), .186) && eq(T.avRate(), .30) && eq(T.psFRate(), .172), 'taux 2026 faux');
  // retraits : PEA de plus de 5 ans au seul taux de 18,6 %, assurance-vie de moins de 8 ans à 30 %
  for (const e of ['pea', 'av']) { S.acc[e].open = S.year - (e === 'pea' ? 6 : 3); S.acc[e].vers = 1000; S.acc[e].cash = 2000; }
  const tot = e => T.envTotal(e), w = e => T.wdCalc(e, 2000), gain = e => 2000 * (1 - 1000 / tot(e));
  check(eq(w('pea').tax, gain('pea') * .186), 'PEA de plus de 5 ans mal taxé');
  check(eq(w('av').tax, gain('av') * .30), 'assurance-vie de moins de 8 ans mal taxée');
  check(eq(T.pvImmoTax(10000, 3), 10000 * (.19 + .172)), 'plus-value immobilière mal taxée');
  // l'Union populaire relève les deux taux d'un point ; un programme d'avant la 3.14 garde l'écart de 1,4 point
  T.applyProg(T.PROG.gauche()); check(eq(S.pol.ps, .196) && eq(S.pol.psF, .182), 'programme de gauche mal appliqué');
  T.applyProg({ ps: .2 }); check(eq(S.pol.ps, .214) && eq(S.pol.psF, .2), 'ancien programme mal converti');
  // partie d'avant la 3.14 : un seul taux, la hausse de 2026 ne touche que le compte-titres et le PEA
  const old = JSON.parse(JSON.stringify(S)); old.pol.ps = .172; delete old.pol.psF; T.boot({ S: old });
  check(eq(T.S.pol.ps, .186) && eq(T.S.pol.psF, .172), 'migration des prélèvements sociaux');
});

test('Prévisionnel : imposé la première année, puis seulement quand la boîte va mal', () => {
  let calm = 0;
  for (const dom of Object.keys(T.DOMS)) for (const seed of [701, 702]) {
    T.newGame({ city: 'lille', sal: 2, cap: 2, couple: false, seed }, []); let S = T.S;
    check(!T.bizCreate(dom), 'création ' + dom);
    check(T.budDue(), `pas de prévisionnel la première année (${dom})`);
    if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); S = T.S;
    if (!S.biz || !S.biz.alive || S.phase !== 'turn' || S.half) continue;
    check(T.budDue() === T.bizBad(), `prévisionnel ouvert sans raison (${dom})`);
    if (!T.budDue()) calm++;
    S.biz.hist[S.biz.hist.length - 1].res = -1; check(T.budDue(), `pas de prévisionnel après une perte (${dom})`);
  }
  check(calm > 0, 'le prévisionnel s’ouvre toujours, même quand tout va bien');
});

test('Budget de ta boîte : prévisionnel pur, leviers, prévu contre réalisé', () => {
  for (const dom of Object.keys(T.DOMS)) {
    T.newGame({ city: 'lille', sal: 2, cap: 2, couple: false, seed: 700 }, []); let S = T.S;
    check(!T.bizCreate(dom), 'création ' + dom);
    const r0 = S.rng, F = T.bizForecast(), h = T.budgetModal(); check(S.rng === r0 && T.bizForecast().res === F.res && h.includes('Valider mon budget'), 'prévisionnel impur ou fenêtre absente');
    check(Math.abs(F.ca - F.ops - F.pay - F.tax - F.res) < 1e-6, 'les lignes ne tombent pas juste');
    // passer la première année, puis jouer les leviers sur l'année suivante
    if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass'); T.endTurn(); T.nextBilan(); S = T.S;
    if (!S.biz || !S.biz.alive) continue;
    const base = T.bizForecast(T.BUD0), mk = T.bizForecast({ ...T.BUD0, mk: .15 }), px = T.bizForecast({ ...T.BUD0, px: .1 }), pr = T.bizForecast({ ...T.BUD0, pr: .15 });
    check(mk.ca > base.ca && mk.mk > base.mk, `le commercial ne fait pas croître (${dom})`);
    check(pr.res < base.res, `l’investissement ne coûte rien cette année (${dom})`);
    check(T.DOMS[dom].el > 1 ? px.ca < base.ca * 1.1 : px.ca > base.ca, `élasticité-prix fausse (${dom})`);
    check(T.setBud('mk', .3), 'budget hors grille accepté');
    T.setBud('pr', .15); const K0 = S.biz.K ?? .25;
    if (S.life) for (const c of S.life.v.choices) if (!S.life.answered) T.answerLife(c.id); if (S.event) T.answerEvent('pass');
    const yr = S.year, fc = T.bizForecast(); T.endTurn(); const bz = T.S.bilans[0].biz;
    check(!T.S.biz || T.S.biz.K > K0, 'le capital produit ne monte pas');
    if (bz) { check(Math.abs(bz.fc.ca - fc.ca) < 1e-6 && Math.abs(bz.why.cyc + bz.why.hit + bz.why.alea - (bz.R.ca - bz.fc.ca)) < 1e-6, 'écart prévu-réalisé mal décomposé'); T.bilanView(); }
    check(cashIdentity(T.S) < 1, 'argent créé ou perdu avec le budget'); void yr;
  }
  // forecast = réalité quand l'économie est celle supposée, sans aléa ni coup dur
  T.newGame({ city: 'lyon', sal: 2, cap: 2, couple: false, seed: 701 }, []); T.bizCreate('conseil'); const S = T.S;
  const F = T.bizForecast(), A = T.bizCalc(S.biz, { phase: S.w.phase, z: 0, hit: false, infl: S.w.infl / 100 });
  check(Math.abs(F.res - A.res) < 1e-6, 'prévisionnel différent du calcul réel à hypothèses égales');
});

test('Profils tout faits et immobilier multi-villes', () => {
  for (const a of Object.keys(T.PRESETS)) { const v = T.EPARGNES[T.PRESETS[a].cap].v; T.newGame(a, ['famille']); check(T.S.cash === v && T.S.start === v, `capital de départ faux pour ${a}`); T.turnView(); }
  T.newGame('heritier', []); T.S.cash = 3e6; T.S.start = 3e6;
  check(!T.buyProp('paris', 'cash') && !T.buyProp('lyon', 'cash') && !T.buyProp('maison', 'cash'), 'achat comptant refusé');
  check(T.buyProp('rpparis', 'cash'), 'deux résidences principales acceptées');
  check(T.S.flags.twoRent && T.S.flags.rpYear === T.Y0, 'objectifs immobiliers non suivis');
});

// =====================================================================
if (BALANCE) {
  console.log('\nRapport d’équilibrage (avertissements seulement)\n');
  const warn = (ok, label, val, target) => console.log(`${ok ? '  OK  ' : ' WARN '} ${label.padEnd(52)} ${String(val).padStart(10)}   cible ${target}`);
  const choose = map => (id, ch) => { const w = map[id]; return w && ch.includes(w) ? w : (id === 'retraite' ? ch[Math.min(1, ch.length - 1)] : ch[0]); };
  const BAL = { diner: 'rdv', promo: 'oui', vacances: 'oui', mariage: 'oui', enfant: 'non', sport: 'oui', ami: 'non', weekend: 'partir', burnout: 'arret', rupture: 'ok', panique: 'tenir', rencontre: 'oui', logement: 'louer', panne: 'reparer', fire: 'non', licenciement: 'chercher', startupJob: 'non' };
  const MONEY = { ...BAL, diner: 'diner', vacances: 'non', mariage: 'non', sport: 'non', weekend: 'ecrans', rencontre: 'non' };
  const peaMonde = S => { const room = T.peaCap() - S.acc.pea.vers, a = Math.min(S.cash + S.acc.pea.cash, Math.max(0, room) + S.acc.pea.cash); if (a > 1) T.buyIn('pea', 'monde', a); if (S.cash > 1) T.buyIn('cto', 'monde', S.cash); };
  const run = (arch, pol, n = 100) => { const r = []; for (let i = 0; i < n; i++) { const S = play(arch, [], pol); r.push({ real: T.finalScore().real, score: T.finalScore().score, ratio: T.benchRef().trk > 1000 ? T.net() / T.benchRef().trk : 1 }); } return r; };

  const passive = run('heritier', { life: choose(BAL), port: peaMonde });
  const career = run('heritier', { life: choose(MONEY), port: peaMonde });
  // Joueur qui suit Sophie : ses conseils de l'onglet Profil (boutons) et son avis sur les événements quand elle en donne un
  // (acheter 10 % du patrimoine si elle y croit, vendre une bulle si elle s'en méfie). Sinon il place selon un profil équilibré.
  const sophieEv = (S, v) => {
    const A = S.event && S.event.adv, so = A && A.list.find(x => x.w === 'sophie'); if (!so) return null;
    if (!so.buy) return v.choices && v.choices.some(c => c.id === 'vendre') ? ['choice', 'vendre'] : null;
    if (!T.tradable(A.a)) return null;
    const envs = T.eligEnvs(A.a), e = envs.includes('pea') && T.peaCap() - S.acc.pea.vers > 1000 ? 'pea' : envs.includes('av') ? 'av' : 'cto';
    const amt = Math.floor(T.net() * .1), have = S.cash + (e === 'cto' ? 0 : S.acc[e].cash);
    if (have < amt && T.ev(e, 'monde') > 0) T.sellIn(e, 'monde', Math.min(T.ev(e, 'monde'), amt - have));
    const got = Math.floor(Math.min(amt, S.cash + (e === 'cto' ? 0 : S.acc[e].cash)));
    return got > 0 ? ['invest', A.a, got, e] : null; };
  const sophie = { life: choose(BAL), event: sophieEv, port: S => {
    if (S.profile == null) S.profile = .6;
    for (const c of T.conseils()) { const b = c.btn; if (!b) continue;
      else if (b.act === 'reneg') T.reneg(b.u);
      else if (b.k === 'prof' && S.profile !== b.p) { S.profile = b.p; T.rebalance(b.p); }
      else if (b.k === 'sell') T.sellIn(b.e, b.id, T.ev(b.e, b.id));
      else if (b.act === 'tip-tab' && b.tab === 'liv') T.livIn(Math.min(S.cash, 4 * T.monthlySpend())); }
    T.placeIdle(S.profile, []); } };
  const r0 = run('heritier', sophie), calm = run('heritier', { life: choose(BAL), port: S => T.placeIdle(.6, []) });
  const greens = f => f.rows.slice(0, 4).filter(r => { if (r.v === 'en pertes') return false; const x = parseFloat(String(r.v).replace(',', '.').replace('−', '-')), th = parseFloat(r.r.slice(2).replace(',', '.').replace(' ', '')); return r.r.startsWith('<') ? x < th : x > th; }).length;
  const dip = useFiche => (S, v) => { const f = S.event && S.event.fiche; if (!f) return null;
    if (['bulle', 'themeBulle'].includes(S.event.id)) return (!useFiche || greens(f) <= 1) && v.choices && v.choices.length ? ['choice', 'vendre'] : null;
    if (!T.tradable(f.a) || (useFiche && greens(f) < 3)) return null;
    const amt = Math.floor(T.net() * .15); if (S.cash < amt && T.ev('cto', 'monde') > 0) T.sellIn('cto', 'monde', amt - S.cash);
    return ['invest', f.a, Math.min(amt, Math.floor(S.cash)), 'cto']; };
  const ctoPassive = S => { if (S.cash > 1) T.buyIn('cto', 'monde', S.cash); };
  const naive = run('heritier', { life: choose(BAL), event: dip(false), port: ctoPassive });
  // Pour juger Sophie à armes égales : l'acheteur naïf a le même profil que son élève (80 % d'actions, placés de la même façon).
  const naiveSame = run('heritier', { life: choose(BAL), event: dip(false), port: S => { S.profile = .8; T.placeIdle(.8, []); } });
  const fiche = run('heritier', { life: choose(BAL), event: dip(true), port: ctoPassive });

  const pr = med(passive.map(x => x.ratio));
  warn(pr >= .85 && pr <= 1, 'Passif PEA / repère ETF Monde sans frais', pr.toFixed(2), '0,85 – 1');
  const g0 = med(r0.map(x => x.real)) / med(calm.map(x => x.real)), gn = med(r0.map(x => x.real)) / med(naiveSame.map(x => x.real));
  warn(g0 >= 1, 'Élève de Sophie / passif à 60 % d’actions', '×' + g0.toFixed(2), '≥ ×1,0');
  warn(gn >= 1.15, 'Élève de Sophie / acheteur naïf (même profil)', '×' + gn.toFixed(2), '≥ ×1,15');
  const fr = med(fiche.map(x => x.real)) / med(naive.map(x => x.real));
  warn(fr >= 1.15, 'Lecteur de fiches / acheteur naïf de paniques', '×' + fr.toFixed(2), '≥ ×1,15');
  warn(med(career.map(x => x.score)) < med(passive.map(x => x.score)), 'Score carriériste < score équilibré', `${med(career.map(x => x.score))} < ${med(passive.map(x => x.score))}`, 'vrai');
  // Entrepreneur : crée sa boîte dès le départ (un domaine sur cinq), la pilote simplement, place le reste comme le passif.
  let bizI = 0, bizFail = 0;
  const founder = S => {
    if (S.year === T.Y0 && !S.biz && !S.bizPast) T.bizCreate(Object.keys(T.DOMS)[bizI++ % 5]);
    const B = S.biz;
    if (B && B.alive && B.role === 'own' && B.hist.length) {
      const D = T.DOMS[B.dom], h = B.hist[B.hist.length - 1], sc = D.sc * S.defl, cap = D.cpp * (B.staff + 1) * S.defl, avant = S.salRef * 1.45;
      if (B.red) for (let i = Math.ceil(B.staff / 2); i > 0; i--) T.bizHire(-1);
      if (!B.red && h.ca >= .85 * cap && B.tre >= sc) T.bizHire(1);
      if (!T.canRaise() && B.tre < 2 * sc) T.bizRaise();
      T.bizPay(B.red ? 'zero' : B.tre > 1.5 * avant && h.res > 0 ? 'avant' : B.tre > .5 * avant ? 'smic' : 'zero');
      if (h.res > 0 && B.tre > 3 * sc) T.bizDiv();
    }
    peaMonde(S);
  };
  const ent = []; for (let i = 0; i < 100; i++) { play('heritier', [], { life: choose(BAL), port: founder }); ent.push(T.finalScore().real); if ((T.S.bizPast || []).some(x => x.txt === 'en faillite')) bizFail++; }
  const er = med(ent) / med(passive.map(x => x.real)), e90 = ent.sort((a, b) => a - b)[90] / passive.map(x => x.real).sort((a, b) => a - b)[90];
  warn(er >= .75 && er <= 1.33, 'Entrepreneur / salarié passif (médiane)', '×' + er.toFixed(2), '0,75 – 1,33');
  warn(e90 >= 1.3, 'Entrepreneur / salarié passif (90e centile)', '×' + e90.toFixed(2), '≥ ×1,3');
  warn(bizFail >= 15 && bizFail <= 50, 'Entrepreneurs dont la boîte a fait faillite', bizFail + ' %', '15 – 50 %');
  const p10 = passive.map(x => x.real).sort((a, b) => a - b)[Math.floor(passive.length * .1)];
  warn(p10 > 0, `Patrimoine au 10e centile, joueur passif (€ de ${T.Y0})`, Math.round(p10 / 1000) + ' k€', '> 0');

  const S0 = {};
  for (const a of Object.keys(T.PRESETS)) S0[a] = med(run(a, { life: choose({ ...BAL, logement: 'acheter' }), port: S => T.placeIdle(.6, []) }, 100).map(x => x.score));
  for (const a of Object.keys(T.PRESETS)) { const q = S0[a] / S0.heritier; warn(q >= .75 && q <= 1.33, `Score médian ${a} / héritier`, q.toFixed(2), '0,75 – 1,33'); }

  const goalRate = (arch, goal, lifeMap, port, n = 80) => { let hit = 0; for (let i = 0; i < n; i++) { play(arch, [goal], { life: choose(lifeMap), port }); if (T.finalScore().gl[0].st === 1) hit++; } return hit / n; };
  const LOVE = { ...BAL, enfant: 'oui', logement: 'acheter', vacances: 'oui', promo: 'non' };
  const rpSmart = S => { if (!S.props.some(p => T.BIENS[p.type].k === 'rp')) { const b = T.bestBuy(); if (b && b.ok) T.buyHome(b.type, b.n); } T.placeIdle(.6, []); };
  const g1r = goalRate('heritier', 'rp35', LOVE, rpSmart); warn(g1r >= .8, 'Objectif « propriétaire avant 35 ans » (héritier)', Math.round(g1r * 100) + ' %', '≥ 80 %');
  const g2 = goalRate('infirmier', 'famille', LOVE, S => T.placeIdle(.6, [])); warn(g2 >= .4, 'Objectif « fonder une famille » (infirmier)', Math.round(g2 * 100) + ' %', '≥ 40 %');
  const g3 = goalRate('heritier', 'famille', LOVE, S => T.placeIdle(.6, [])); warn(g3 >= .25, 'Objectif « fonder une famille » (héritier)', Math.round(g3 * 100) + ' %', '≥ 25 %');
  const g4 = goalRate('heritier', 'fire', { ...BAL, fire: 'stop' }, S => T.placeIdle(.8, [])); warn(g4 >= .25 && g4 <= .7, 'Objectif « libre à 55 ans » (héritier)', Math.round(g4 * 100) + ' %', '25 – 70 %');
  const g5 = goalRate('heritier', 'rentier', BAL, S => { for (let k = 0; k < 2; k++) if (S.props.filter(p => T.BIENS[p.type].k !== 'rp').length < 2) T.buyProp('lille', 'credit'); T.placeIdle(.6, []); }); warn(g5 >= .7, 'Objectif « rentier immobilier » (héritier)', Math.round(g5 * 100) + ' %', '≥ 70 %');
  const g6 = goalRate('heritier', 'million', BAL, S => T.placeIdle(.8, [])); warn(g6 >= .15 && g6 <= .6, 'Objectif « transmettre 2,5 millions » (héritier)', Math.round(g6 * 100) + ' %', '15 – 60 %');

  const adv = {}, ach = {}; const NR = 150;
  for (let i = 0; i < NR; i++) { const S = play(pickR(Object.keys(T.PRESETS)), [], randomPolicy); for (const w in S.advRec) { adv[w] = adv[w] || { n: 0, ok: 0 }; adv[w].n += S.advRec[w].n; adv[w].ok += S.advRec[w].ok; } for (const id in S.ach) ach[id] = (ach[id] || 0) + 1; }
  const rate = w => adv[w] ? adv[w].ok / adv[w].n : 0;
  warn(rate('sophie') >= .7, 'Fiabilité de Sophie (doit être la meilleure)', Math.round(rate('sophie') * 100) + ' %', '≥ 70 %');
  warn(rate('kevin') <= .6, 'Fiabilité de Kévin (pile ou face)', Math.round(rate('kevin') * 100) + ' %', '≤ 60 %');
  for (const a of T.ACH) { const p = (ach[a.id] || 0) / NR; warn(p <= .6, `Succès « ${a.n} » (joueur aléatoire)`, Math.round(p * 100) + ' %', '≤ 60 %'); }
}

console.log(`\n${fail ? '✗' : '✓'} ${pass} réussi${pass > 1 ? 's' : ''}, ${fail} échec${fail > 1 ? 's' : ''}`);
process.exit(fail ? 1 : 0);
