// Report the effective resolution of every placed image.
//
//   node tools/check-resolution.js
//
// Many images in the source profile had been upscaled before they reached us, so the
// pixel count overstates the real detail. NATIVE_FACTOR is how much each stored file was
// enlarged (measured by down/up-sampling each image and finding where detail disappears).
// Effective ppi = real detail pixels per printed inch. Below ~120 ppi looks soft on screen.

const path = require('path');
const { chromium } = require('playwright');

const NATIVE_FACTOR = {
  'villa-al-shehhi': 1.5, 'villa-al-hosani': 3, 'villa-qedaib-exterior': 1.33, 'villa-al-kaabi': 3,
  'villa-faisal-khajeh': 2.5, 'villa-adel-alkatheeri': 1.5, 'kissaki-1': 1.33, 'kissaki-2': 1.33,
  'qedaib-interior': 2.5, 'vip-bedroom-1': 1.33, 'vip-bedroom-2': 1.5, 'vip-dining': 1.5, 'vip-living': 1.33,
  'tamim-tv-unit': 1.5, 'picasso-1': 1, 'picasso-2': 4, 'picasso-3': 2.5, 'picasso-4': 2.5,
  'meridien-0': 3, 'meridien-1': 3, 'meridien-2': 2.5, 'meridien-3': 2.5, 'meridien-4': 3,
  'hitachi-1': 2.5, 'hitachi-2': 2.5, 'hitachi-3': 2.5, 'hitachi-4': 2, 'lucky': 3, 'game-room': 2,
};
const factorFor = (name) => {
  const key = Object.keys(NATIVE_FACTOR).sort((a, b) => b.length - a.length).find((k) => name.startsWith(k));
  return key ? NATIVE_FACTOR[key] : 1;
};

(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'networkidle' });
  const rows = await page.evaluate(() => [...document.querySelectorAll('.ph img')].map((img) => {
    const box = img.parentElement.getBoundingClientRect();
    const s = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    return {
      page: img.closest('.page').id,
      file: img.getAttribute('src').split('/').pop().replace('.jpg', ''),
      boxMm: [box.width * 25.4 / 96, box.height * 25.4 / 96].map((v) => v.toFixed(0)).join('×'),
      storedPpi: 96 / s,
    };
  }));
  await browser.close();
  let soft = 0;
  for (const r of rows) {
    const ppi = r.storedPpi / factorFor(r.file);
    const flag = ppi < 120 ? '  << soft' : '';
    if (flag) soft++;
    console.log(`${r.page}  ${r.file.padEnd(24)} ${r.boxMm.padStart(9)} mm  ${ppi.toFixed(0).padStart(4)} ppi${flag}`);
  }
  console.log(`\n${rows.length} placements, ${soft} below 120 ppi`);
})();
