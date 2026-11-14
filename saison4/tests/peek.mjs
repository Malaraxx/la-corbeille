// Petit outil : déroule une partie Standard avec un bot et affiche l'essentiel trimestre par trimestre.
//   node saison4/tests/peek.mjs                      (raisonnable, café, Lille, graine 7)
//   node saison4/tests/peek.mjs premium/cosm/lyon 42
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { makePlayer } from './balance.mjs';
const html = readFileSync(new URL('../src/la-corbeille-s4.html', import.meta.url), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const ctx = { console, Intl, JSON, Math }; vm.createContext(ctx);
vm.runInContext(js + ';globalThis.T={get ST(){return ST},newGame,createBiz,autoDec,suggestOrder,canOpen,bizOpen,zoneCost,borrowMax,bizBorrow,affectPreview,bizAffect,primeMax,canCreate,takeJob,playQuarter,evById,chooseEvent,closeYear,net,real,monthlyFixed,payNeeded,odLimit,bizCca,bizValue};', ctx);
const T = ctx.T; const [bot = 'raisonnable', prod = 'cafe', city = 'lille'] = (process.argv[2] || '').split('/').map(x => x || undefined); const seed = +(process.argv[3] || 7);
let a = seed; const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const P = makePlayer(T, rnd); T.newGame({ seed, city, start: 'auto', home: 'coloc' }); P.setProd(prod); P.create(bot, true);
const f = n => Math.round(n).toLocaleString('fr-FR');
while (!T.ST.over) {
  for (let q = 0; q < 4; q++) { P.rebound(bot); const o = T.playQuarter(P.quarter(bot)), r = o.R, B = T.ST.biz;
    console.log(`${o.y} T${o.q}`, r ? `CA ${f(r.ca)} · résultat ${f(r.res)} · tréso ${f(r.cash1)} · demande ${f(r.D)} · vendu ${f(r.sold)} · capacité ${r.cap}` : T.ST.prof, B ? `· équipe ${B.team.emp}/${B.team.com}/${B.team.man} · zones ${Object.keys(B.zones).filter(z => B.zones[z].open).join('+')}` : '', o.N.length ? '· ' + o.N.join(' | ').slice(0, 90) : ''); }
  const S = T.ST; if (S.ev) { const e = T.evById(S.ev); T.chooseEvent(e.bet ? null : 'a', 0); } P.annual(bot); T.closeYear();
  console.log(`   → patrimoine ${f(T.net())} € (${f(T.real(T.net()))} € de 2026)`);
}
console.log('FIN', T.ST.age, 'ans · patrimoine réel', f(T.real(T.net())));
