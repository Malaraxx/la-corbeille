// Construit saison4/index.html (GitHub Pages) à partir de saison4/src/la-corbeille-s4.html (format « artifact » Claude, sans squelette).
// Usage : node saison4/tools/build.mjs          → écrit saison4/index.html
//         node saison4/tools/build.mjs --check  → échoue si saison4/index.html n'est pas à jour
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src', 'la-corbeille-s4.html');
const OUT = join(root, 'index.html');
const MARK = '<main class="app" id="app">';

export function build(src) {
  const i = src.indexOf(MARK);
  if (i < 0) throw new Error(`Marqueur introuvable dans la source : ${MARK}`);
  const head = src.slice(0, i).trim();
  const body = src.slice(i).trim();
  return `<!doctype html>
<!-- Fichier GÉNÉRÉ par saison4/tools/build.mjs depuis saison4/src/la-corbeille-s4.html. Ne pas modifier à la main. -->
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="La Corbeille, Saison 4 : une vie de 20 ans à la retraite. Études, boulot ou boîte, placements, immobilier, fiscalité 2026.">
<meta property="og:title" content="La Corbeille · Saison 4">
<meta property="og:description" content="Tu as 20 ans. Bâtis ton patrimoine sans rater ta vie.">
<meta property="og:type" content="website">
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
    if (cur !== out) { console.error('✗ saison4/index.html n’est pas à jour : lance « npm run build:s4 ».'); process.exit(1); }
    console.log('✓ saison4/index.html est à jour.');
  } else {
    writeFileSync(OUT, out);
    console.log(`✓ saison4/index.html généré (${(out.length / 1024).toFixed(0)} Ko).`);
  }
}
