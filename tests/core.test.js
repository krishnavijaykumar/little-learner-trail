// Run with: node tests/core.test.js
// Pulls the pure game logic out of index.html and checks it with thousands of generated questions.
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.split('/*CORE-START*/')[1].split('/*CORE-END*/')[0];
const m = { exports: {} }; new Function('module', src)(m); const C = m.exports;

let n = 0;
for (let seed = 1; seed <= 200; seed++) {
  const r = C.mulberry32(seed);
  C.WORLDS.forEach(w => w.levels.forEach((L, li) => {
    for (const k of [3, 2]) {
      const ctx = { used: {}, k };
      for (let i = 0; i < L.n; i++) {
        const q = C.makeQuestion(w, li, r, ctx); n++;
        const err = C.validateQ(q);
        assert.strictEqual(err, '', `${L.id} seed ${seed}: ${err}`);
        const t = (q.visual.text || '').match(/^(\d+) ([+−]) (\d+) = \?$/);
        if (t) {
          const want = t[2] === '+' ? +t[1] + +t[3] : +t[1] - +t[3];
          assert.strictEqual(q.options[q.answer].v, want, `${L.id}: wrong maths answer`);
        }
      }
    }
  }));
}
assert.strictEqual(C.calcStars(10, 8), 3); assert.strictEqual(C.calcStars(10, 5), 2); assert.strictEqual(C.calcStars(10, 4), 1);
const W = C.WORLDS[0], W2 = C.WORLDS[1];
assert.ok(C.levelOpen(W, 0, {}, false)); assert.ok(!C.levelOpen(W, 1, {}, false)); assert.ok(C.levelOpen(W, 1, { s1: { best: 1 } }, false));
assert.ok(!C.worldOpen(W2, { s8: { best: 1 } }, false)); assert.ok(C.worldOpen(W2, { s8: { best: 2 } }, false));
assert.ok(C.hashPin('1234', 'x') === C.hashPin('1234', 'x') && C.hashPin('1234', 'x') !== C.hashPin('1235', 'x'));
assert.strictEqual(C.sanitize('garbage').v, 1);
console.log(`OK: ${n} generated questions valid across ${C.LEVEL_COUNT} levels`);
