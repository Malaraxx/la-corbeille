// Petit outil : déroule une partie et affiche l'essentiel année par année.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../src/la-corbeille-s4.html', import.meta.url), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const ctx = { console, Intl, JSON, Math }; vm.createContext(ctx);
vm.runInContext(js + ';globalThis.T={get ST(){return ST},newGame,closeYear,chooseEvent,evById,budget,net,real,profName,DOMS};', ctx);
const T = ctx.T; const [path, dk, city] = (process.argv[2] || 'travail/vente/lille').split('/'); const seed = +(process.argv[3] || 7);
T.newGame({ seed, path, dk, city, home: 'coloc', fund: 'pret', loan: 15000, honor: 5000, put: 2400, love: 2000, bank: 10000 });
const f = n => Math.round(n).toLocaleString('fr-FR');
while (!T.ST.over) { const S = T.ST; if (S.ev) { const e = T.evById(S.ev); T.chooseEvent(e.bet ? null : 'a', 0); }
  const B = T.budget(); if (S.age < 34) console.log(S.year, S.age, T.profName().padEnd(34), 'in', f(B.tin), 'reste', f(B.rest), 'net', f(T.net()), 'réel', f(T.real(T.net())), 'hum', S.hum, S.couple === null ? '' : 'cpl' + S.couple, 'k' + S.kids, S.home);
  T.closeYear(); }
console.log('FIN', T.ST.age, 'net', f(T.net()), 'réel 2026', f(T.real(T.net())), 'cpi', T.ST.cpi.toFixed(2));
