const { Jimp, loadFont } = require('jimp');
const https = require('https');
const http = require('http');
const path = require('path');

const AVATAR_SIZE = 60;
const PAD = 6;
const HEADER_H = 30;
const COLS = 10;

const FAC_BG = {
  'Sanctuaire':       0x0d2a5eff,
  'Atlantide':        0x052840ff,
  'Asgard':           0x2a0d5eff,
  'Enfers':           0x3d0d0dff,
  'Chevaliers Noirs': 0x111111ff,
};
const CANVAS_BG = 0x141428ff;

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 8000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302)
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function generateCollectionImage(ownedHeroes, db) {
  const factions = ['Sanctuaire', 'Atlantide', 'Asgard', 'Enfers', 'Chevaliers Noirs'];

  const byFaction = {};
  factions.forEach(f => byFaction[f] = []);

  for (const name of Object.keys(db)) {
    if (!ownedHeroes.has(name)) continue;
    const h = db[name];
    const fac = h.fac || 'Sanctuaire';
    if (byFaction[fac]) byFaction[fac].push({ name, img: h.img });
  }

  const sections = factions
    .map(fac => ({ fac, heroes: byFaction[fac] }))
    .filter(s => s.heroes.length > 0);

  if (!sections.length) return null;

  const colW = AVATAR_SIZE + PAD;
  const totalW = COLS * colW + PAD;

  let totalH = PAD;
  for (const s of sections) {
    s.rows = Math.ceil(s.heroes.length / COLS);
    s.sectionH = HEADER_H + s.rows * colW + PAD;
    totalH += s.sectionH + PAD;
  }

  const canvas = new Jimp({ width: totalW, height: totalH, color: CANVAS_BG });

  let font;
  try { font = await loadFont(Jimp.FONT_SANS_16_WHITE); } catch(e) {}

  let y = PAD;

  for (const { fac, heroes, rows, sectionH } of sections) {
    const bgColor = FAC_BG[fac] || 0x222233ff;

    // Fond section
    for (let px = 0; px < totalW; px++)
      for (let py = 0; py < sectionH; py++)
        canvas.setPixelColor(bgColor, px, y + py);

    // Header
    if (font)
      canvas.print({ font, x: PAD, y: y + 7, text: `${fac}  (${heroes.length})` });

    // Avatars
    let col = 0, row = 0;
    for (const hero of heroes) {
      const ax = PAD + col * colW;
      const ay = y + HEADER_H + row * colW;
      try {
        const buf = await fetchBuffer(hero.img);
        const avatar = await Jimp.fromBuffer(buf);
        avatar.resize({ w: AVATAR_SIZE, h: AVATAR_SIZE });
        canvas.composite(avatar, ax, ay);
      } catch(e) {
        for (let px = 0; px < AVATAR_SIZE; px++)
          for (let py = 0; py < AVATAR_SIZE; py++)
            canvas.setPixelColor(0x444466ff, ax + px, ay + py);
      }
      col++;
      if (col >= COLS) { col = 0; row++; }
    }

    y += sectionH + PAD;
  }

  const outPath = path.join('/tmp', `col_${Date.now()}.png`);
  await canvas.write(outPath);
  return outPath;
}

module.exports = { generateCollectionImage };
