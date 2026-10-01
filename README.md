# Selector Wars ⚔️

A fully client-side game that teaches CSS specificity the way a browser compares it: inline, ids, classes, elements — lexicographic, never a sum. The interface is Dutch. Selectors, properties, and the `0-1-2-1` notation stay in CSS.

Levels 1–7. Level 1 is Wie wordt er geselecteerd: mark every element a selector hits in a chunk of HTML. Level 7 is `!important`. The home screen starts solo play or two-device play. Two devices can start any level at once; solo play opens the next level with one star. Progress lives in `localStorage`. There is no backend.

## Run

```bash
npm install
npm run dev
```

The dev server listens on port `47231`, under `/css-specificity-game/`.

Published site: https://dverhulst1981.github.io/css-specificity-game/

```bash
npm test
npm run build
```

`npm run build` writes a static site to `dist/`. `dist/404.html` is a copy of `index.html`, so a static host can fall back to the app for routes such as `/pad`.

Open a shared set with the hash `#set=1-5` (or `#set=3` for one level).
