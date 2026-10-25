// Export index.html to an A4 PDF with Chromium (via Playwright).
//
//   node tools/export-pdf.js [output.pdf]
//
// Fonts are static TrueType files, so Chromium embeds them as real (subset)
// TrueType fonts. Images are embedded at their native resolution — nothing is
// upscaled. Links (email, phone, website) stay clickable in the PDF.

const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const out = path.resolve(root, process.argv[2] || 'Sama-Al-Ola-Company-Profile.pdf');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) =>
      img.complete ? null : new Promise((resolve) => { img.onload = img.onerror = resolve; })));
  });

  const broken = await page.evaluate(() =>
    [...document.images].filter((img) => !img.naturalWidth).map((img) => img.getAttribute('src')));
  if (broken.length) throw new Error('Images failed to load: ' + broken.join(', '));

  await page.pdf({
    path: out,
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: false,   // bookmarks are written by tools/finalize-pdf.py
  });
  await browser.close();
  console.log('Wrote ' + out);
})().catch((err) => { console.error(err); process.exit(1); });
