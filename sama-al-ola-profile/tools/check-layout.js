// Layout QA: flags text that overflows its own box, crosses the page margins,
// or collides with another text block on the same page.
//
//   node tools/check-layout.js

const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const issues = await page.evaluate(() => {
    const mm = 96 / 25.4, out = [];
    for (const pg of document.querySelectorAll('.page')) {
      const P = pg.getBoundingClientRect();
      // leaf text blocks: elements that directly contain text
      const blocks = [...pg.querySelectorAll('*')].filter((el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
        getComputedStyle(el).display !== 'inline');
      const boxes = [];
      for (const el of blocks) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        const label = (el.textContent || '').trim().slice(0, 40);
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible')
          out.push(`${pg.id}: overflow inside box — "${label}"`);
        const left = (r.left - P.left) / mm, right = (r.right - P.left) / mm;
        if (left < 17.5 || right > 192.6) out.push(`${pg.id}: outside margins (${left.toFixed(1)}–${right.toFixed(1)} mm) — "${label}"`);
        // detect text wider than its block (e.g. a long word poking out of a grid cell)
        const B = el.getBoundingClientRect();
        if (r.right > B.right + 1.5) out.push(`${pg.id}: text pokes out of its cell by ${((r.right - B.right) / mm).toFixed(1)} mm — "${label}"`);
        boxes.push({ r, label, el });
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (ox > 1 && oy > 1) out.push(`${pg.id}: text collision — "${a.label}" × "${b.label}"`);
      }
    }
    return out;
  });
  await browser.close();
  console.log(issues.length ? issues.join('\n') : 'No layout issues found.');
})();
