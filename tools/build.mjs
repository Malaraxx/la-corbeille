// Construit index.html (GitHub Pages) à partir de src/la-corbeille.html (format « artifact » Claude, sans squelette).
// Usage : node tools/build.mjs          → écrit index.html
//         node tools/build.mjs --check  → échoue si index.html n'est pas à jour
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src', 'la-corbeille.html');
const OUT = join(root, 'index.html');
const MARK = '<div class="wrap" id="app"></div>';

export function build(src) {
  const i = src.indexOf(MARK);
  if (i < 0) throw new Error(`Marqueur introuvable dans la source : ${MARK}`);
  const head = src.slice(0, i).trim();
  const body = src.slice(i).trim();
  return `<!doctype html>
<!-- Fichier GÉNÉRÉ par tools/build.mjs depuis src/la-corbeille.html. Ne pas modifier à la main. -->
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Simulateur de gestion de patrimoine au tour par tour, de 2000 à 2050 : krachs, PEA, assurance-vie, immobilier, objectifs de vie.">
<meta property="og:title" content="La Corbeille">
<meta property="og:description" content="50 ans de marchés en tour par tour. Bats mon score.">
<meta property="og:type" content="website">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = build(readFileSync(SRC, 'utf8'));
  if (process.argv.includes('--check')) {
    const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (cur !== out) { console.error('✗ index.html n’est pas à jour : lance « npm run build ».'); process.exit(1); }
    console.log('✓ index.html est à jour.');
  } else {
    writeFileSync(OUT, out);
    console.log(`✓ index.html généré (${(out.length / 1024).toFixed(0)} Ko).`);
  }
}
