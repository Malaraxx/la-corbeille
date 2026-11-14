// Équilibrage de la Saison 4 (cahier des charges v3, §8) : six bots de stratégie, 300 parties chacun, format Standard (20 ans), secteur Commerce.
//   npm run balance:s4                  (300 parties par bot)
//   npm run balance:s4 -- --n=60        (plus rapide)
//   node saison4/tests/run.mjs --balance --seed=42
// Mondes appariés : la partie n° i de chaque bot rejoue la même graine (même économie, mêmes aléas de départ).
// Sortie : un tableau lisible et saison4/tests/balance-s4.json.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function med(L) { const a = [...L].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; }
function q(L, p) { const a = [...L].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0; }
function share(L, f) { return L.length ? L.filter(f).length / L.length : 0; }
const k = x => (Math.abs(x) >= 1e6 ? (x / 1e6).toFixed(2).replace('.', ',') + ' M€' : Math.round(x / 1000) + ' k€');
const pc = x => Math.round(x * 100) + ' %';
const rx = x => '×' + (Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '∞');
const PRODS = ['cafe', 'cosm', 'vet'], CITIES = ['lille', 'lyon', 'paris', 'bordeaux', 'marseille', 'toulouse', 'nantes'], STARTS = ['com', 'alt', 'ing', 'auto'];

export const BOTS = {
  // Prix proche du marché, promo modérée, stock ajusté, réinvestit 60 % (40 % en dividendes), grandit quand la capacité ou la ville saturent.
  raisonnable: { pos: 'milieu', sup: 'eu', px: 1, promo: .025, promoMin: 1200, order: 1.1, hire: .95, region: 'prudent', div: .4, pay: 'adapt', bank: .5 },
  // Casse les prix, promo forte, s'endette pour grandir vite.
  agressif: { pos: 'milieu', sup: 'eu', px: .92, promo: .055, promoMin: 2000, order: 1.1, hire: .9, region: 'vite', div: 0, pay: 'adapt', bank: 1, borrow: true },
  // Prix haut, qualité haute, petit volume.
  premium: { pos: 'premium', sup: 'fr', px: 1.08, promo: .05, promoMin: 1500, order: 1.05, hire: .95, region: 'prudent', div: .4, pay: 'adapt', bank: .5 },
  // Aucune promo, coûts au minimum, tout en dividendes.
  radin: { pos: 'entree', sup: 'as', px: 1, promo: 0, promoMin: 0, order: 1, hire: 2, region: 'jamais', div: 1, pay: 'min', bank: 0 },
  // Pilote automatique seul.
  auto: { auto: true, bank: .5 },
  // Réglages aléatoires.
  idiot: { idiot: true }
};

export function makePlayer(T, rnd) {
  const S = () => T.ST;
  let prod = 'cafe';
  function create(bot, first) {
    const s = S(), b = BOTS[bot];
    if (b.idiot) return T.createBiz({ name: 'Test', prod, pos: ['entree', 'milieu', 'premium'][Math.floor(rnd() * 3)], sup: ['fr', 'eu', 'as'][Math.floor(rnd() * 3)], put: s.cash * rnd(), honor: rnd() * 10000, bank: rnd() * 30000 });
    const put = Math.max(0, s.cash - (first ? 0 : 1500 * s.cpi)), honor = 10000 * s.cpi;
    return T.createBiz({ name: 'Test', prod, pos: b.pos || 'milieu', sup: b.sup || 'eu', put, honor, bank: (b.bank || 0) * 2 * (put + honor) });
  }
  function quarter(bot) {
    const s = S(), B = s.biz, b = BOTS[bot];
    if (!B) return null;
    // trésorerie au-delà du découvert : apport en compte courant (sauf le pilote automatique et l'idiot)
    if (!b.auto && !b.idiot && B.cash < -.7 * T.odLimit(B) && s.cash > 0) T.bizCca(Math.min(s.cash * .8, -B.cash));
    if (b.auto) return T.autoDec(B);
    const d = JSON.parse(JSON.stringify(B.dec)), last = B.last, sc = s.cpi, H = B.hist.slice(-4), ca4 = H.reduce((a, h) => a + h.ca, 0), ebe4 = H.reduce((a, h) => a + h.ebe, 0);
    if (b.idiot) {
      d.pos = rnd() < .15 ? ['entree', 'milieu', 'premium'][Math.floor(rnd() * 3)] : d.pos; d.px = .6 + rnd() * .9; d.sup = ['fr', 'eu', 'as'][Math.floor(rnd() * 3)];
      d.order = Math.floor(T.suggestOrder(B, d) * rnd() * 3); for (const z in d.promo) d.promo[z] = Math.floor(rnd() * 12000 * sc); d.soldes = [0, .2, .3, .5][Math.floor(rnd() * 4)];
      for (const r of ['emp', 'com', 'man', 'cad']) if (rnd() < .2) d.team[r] = Math.max(0, d.team[r] + (rnd() < .5 ? -1 : 1));
      const c = Math.floor(rnd() * 100), p = Math.floor(rnd() * (100 - c)); d.time = { c, p, g: 100 - c - p }; d.pay = Math.floor(rnd() * 3500 * sc);
      if (rnd() < .05 && T.canOpen(B, 'region')) T.bizOpen('region');
      return d;
    }
    d.pos = b.pos; d.sup = b.sup; d.px = b.px;
    const lastCa = last ? last.ca : 0;
    for (const z in d.promo) if (B.zones[z].open) d.promo[z] = Math.round(Math.max(b.promoMin * sc, b.promo * lastCa * (z === 'region' ? 1.2 : 1)));
    // équipe : embaucher quand la capacité sature (si la trésorerie suit), structurer au-delà de 8 et de 25 personnes
    const n = d.team.emp + d.team.com + d.team.man + d.team.cad, monthly = T.monthlyFixed(B);
    const H2 = B.hist.slice(-2), sat = H2.length === 2 && H2.every(h => h.util >= b.hire) && last.lostCap > .1 * last.D, idle = H2.length === 2 && H2.every(h => h.util < .4);
    if (sat && B.cash > 3 * monthly) d.team.emp++;
    else if (idle && d.team.emp > 0 && bot !== 'agressif') d.team.emp--;
    if (n + 1 > 8 * (1 + d.team.man)) d.team.man++;
    if (n > 25 && !d.team.cad) d.team.cad = 1;
    if (bot === 'agressif' && d.team.emp >= 3 && d.team.com < Math.floor(d.team.emp / 3)) d.team.com++;
    const st = d.team.emp + d.team.com;
    d.time = st >= 2 ? { c: 45, p: 20, g: 35 } : { c: 40, p: 40, g: 20 };
    d.order = Math.round(T.suggestOrder(B, d) * b.order);
    d.soldes = 0; if ((s.q === 1 || s.q === 3) && B.lots.some(l => l.age >= 2)) d.soldes = .3;
    // salaire : de quoi vivre, puis plus quand la boîte gagne
    if (b.pay === 'min') d.pay = Math.round(1000 * sc);
    else d.pay = Math.round((ebe4 > 150000 * sc ? 3500 : ebe4 > 60000 * sc ? 2500 : ebe4 > 20000 * sc ? 1800 : 1300) * sc);
    d.pay = Math.max(d.pay, T.payNeeded() + 100 * sc);
    // zones
    if (T.canOpen(B, 'region')) {
      const cost = T.zoneCost(B, 'region');
      if (b.region === 'vite' && B.hist.length >= 4 && B.cash > cost * .5) T.bizOpen('region');
      if (b.region === 'prudent' && B.hist.length >= 6 && ebe4 > 0 && B.cash > cost + 3 * monthly) T.bizOpen('region');
    }
    if (b.borrow && T.borrowMax(B) > 10000 * sc && B.cash < 6 * monthly) T.bizBorrow(T.borrowMax(B));
    return d;
  }
  function annual(bot) {
    const s = S(), B = s.biz; if (!B) return;
    const b = BOTS[bot]; let A = T.affectPreview(0, 0);
    if (b.auto) { T.bizAffect(0, 0); return; }
    if (b.idiot) { T.bizAffect(rnd() < .3 ? T.primeMax() * rnd() : 0, A.divMax * rnd()); return; }
    const keep = 4 * T.monthlyFixed(B);
    const div = Math.max(0, Math.min(A.divMax, A.net * b.div, B.cash - A.is - keep));
    T.bizAffect(0, b.div >= 1 ? Math.max(0, Math.min(A.divMax, B.cash - A.is - keep)) : div);
  }
  // Après une faillite : CDD ou chômage, puis relance quand l'épargne le permet (v2 §5).
  function rebound(bot) { const s = S(); if (s.biz || !T.canCreate()) return; if (s.prof === 'chomage' && s.cash < 3000 * s.cpi && rnd() < .5) { T.takeJob(); return; } if (s.cash >= 4000 * s.cpi) create(bot, false); }
  return { create, quarter, annual, rebound, setProd(p) { prod = p; } };
}

export function run({ T, R, rnd, n, seed }) {
  const P = makePlayer(T, rnd);
  function game(bot, i) {
    R(seed * 7919 + i);
    const g = { seed: 1 + Math.floor(rnd() * 1e9), sexe: i % 2 ? 'f' : 'h', pseudo: 'Test', city: CITIES[i % CITIES.length], start: STARTS[i % 4], home: ['coloc', 'studio', 'parents'][i % 3] };
    T.newGame(g); P.setProd(PRODS[i % 3]); R(seed * 104729 + i * 31 + Object.keys(BOTS).indexOf(bot)); P.create(bot, true);
    let min = Infinity, y = 0, crashes = 0, maxCa = 0, bad = false;
    while (!T.ST.over && y < 30) {
      for (let qq = 0; qq < 4; qq++) { P.rebound(bot); const d = P.quarter(bot); const o = T.playQuarter(d); if (o && o.R) maxCa = Math.max(maxCa, o.R.ca * 4 / T.ST.cpi); }
      const S = T.ST; if (S.ev) { const e = T.evById(S.ev); if (e.bet) T.chooseEvent(null, rnd() < .3 ? Math.floor(S.cash * .05) : 0); else T.chooseEvent(rnd() < .5 ? 'a' : 'b'); }
      P.annual(bot); if (T.ST.ecoY.crash) crashes++; T.closeYear(); y++;
      const nr = T.real(T.net()); if (!Number.isFinite(nr)) bad = true; min = Math.min(min, nr);
    }
    return { end: T.real(T.net()), min, fail: !!T.ST.flags.everFail, fails: T.ST.flags.fails || 0, crashes, maxCa, bad, alive: !!T.ST.biz };
  }
  const t0 = Date.now(), out = {}, names = Object.keys(BOTS);
  console.log(`Équilibrage Saison 4 · Commerce · format Standard (20 ans) · ${n} parties par bot · graine ${seed}\n`);
  for (const b of names) { out[b] = []; for (let i = 0; i < n; i++) out[b].push(game(b, i)); }
  const rows = names.map(b => { const L = out[b], E = L.map(x => x.end); return { bot: b, med: med(E), p10: q(E, .1), p95: q(E, .95), best: Math.max(...E), fail: share(L, x => x.fail), alive: share(L, x => x.alive), min: Math.min(...L.map(x => x.min)), ca: med(L.map(x => x.maxCa)) }; });
  console.log('Bot'.padEnd(12), 'Médiane'.padStart(10), '10e c.'.padStart(10), '95e c.'.padStart(10), 'Meilleure'.padStart(10), 'Faillite ≥1'.padStart(12), 'Boîte vivante'.padStart(14), 'Pire moment'.padStart(12), 'CA max (méd.)'.padStart(14));
  for (const r of rows) console.log(r.bot.padEnd(12), k(r.med).padStart(10), k(r.p10).padStart(10), k(r.p95).padStart(10), k(r.best).padStart(10), pc(r.fail).padStart(12), pc(r.alive).padStart(14), k(r.min).padStart(12), k(r.ca).padStart(14));
  const M = Object.fromEntries(rows.map(r => [r.bot, r]));
  // Le meilleur bot selon la conjoncture : parties avec au moins deux krachs contre les autres (mêmes mondes pour tous les bots).
  const rough = i => out.raisonnable[i].crashes >= 2, bestIn = f => { let bb = '', bv = -Infinity; for (const b of names) { const v = med(out[b].filter((_, i) => f(i)).map(x => x.end)); if (v > bv) { bv = v; bb = b; } } return bb; };
  const bestRough = bestIn(rough), bestCalm = bestIn(i => !rough(i)), byProd = PRODS.map((p, j) => bestIn(i => i % 3 === j));
  const all = names.flatMap(b => out[b]), best = Math.max(...all.map(x => x.end)), anyBad = all.some(x => x.bad), worst = Math.min(...all.map(x => x.min));
  const C = [
    ['Médiane raisonnable / médiane idiot', '≥ ×3', rx(M.raisonnable.med / Math.max(1, M.idiot.med)), M.idiot.med <= 0 ? M.raisonnable.med > 0 : M.raisonnable.med / M.idiot.med >= 3],
    ['Aucun bot ne domine partout : meilleur par conjoncture (calme / ≥ 2 krachs) · par produit (café / cosmétiques / vêtements)', 'change', `${bestCalm} / ${bestRough} · ${byProd.join(' / ')}`, bestCalm !== bestRough || new Set(byProd).size > 1],
    ['auto / raisonnable', '×0,5 à ×0,8', rx(M.auto.med / M.raisonnable.med), M.auto.med / M.raisonnable.med >= .5 && M.auto.med / M.raisonnable.med <= .8],
    ['Écart de médiane entre secteurs (raisonnable)', '≤ ×1,5', 'un seul secteur (étape A)', null],
    ['Faillite au moins une fois (raisonnable)', '20 à 40 %', pc(M.raisonnable.fail), M.raisonnable.fail >= .2 && M.raisonnable.fail <= .4],
    ['Faillite (agressif)', '50 à 75 %', pc(M.agressif.fail), M.agressif.fail >= .5 && M.agressif.fail <= .75],
    ['Patrimoine médian à la fin, euros de 2026 (raisonnable)', '250 à 700 k€', k(M.raisonnable.med), M.raisonnable.med >= 25e4 && M.raisonnable.med <= 7e5],
    ['Top 5 % SaaS / médiane SaaS', '≥ ×5', 'SaaS à l’étape E', null],
    ['Pire partie (pire moment)', '≥ −50 k€', k(worst), worst >= -5e4],
    [`Meilleure partie sur ${all.length}, sans NaN`, '> 10 M€', k(best) + (anyBad ? ' · NaN !' : ''), best > 1e7 && !anyBad]
  ];
  console.log('\nCibles (cahier des charges v3, §8)');
  for (const [lab, cib, val, ok] of C) console.log(`${ok === null ? '  …  ' : ok ? '  OK ' : ' WARN'}  ${lab}
         ${String(val).padEnd(40)} cible ${cib}`);
  console.log(`\n${((Date.now() - t0) / 1000).toFixed(0)} s`);
  const file = join(dirname(fileURLToPath(import.meta.url)), 'balance-s4.json');
  writeFileSync(file, JSON.stringify({ date: new Date().toISOString().slice(0, 10), seed, n, sector: 'commerce', format: 'standard', bots: rows, targets: C.map(([label, target, value, ok]) => ({ label, target, value, ok })) }, null, 1));
  console.log('Fichier : saison4/tests/balance-s4.json');
  return { rows, C };
}
