const { Jimp, loadFont } = require('jimp');
const https = require('https');
const http = require('http');
const path = require('path');

const AVATAR_SIZE = 60;
const PAD = 6;
const HEADER_H = 30;
const HERO_COLS = 10;
const ITEM_SIZE = 50;
const ITEM_COLS = 12;

const FAC_BG = {
  'Sanctuaire':       0x0d2a5eff,
  'Atlantide':        0x052840ff,
  'Asgard':           0x2a0d5eff,
  'Enfers':           0x3d0d0dff,
  'Chevaliers Noirs': 0x111111ff,
};
const CANVAS_BG   = 0x141428ff;
const ART_BG      = 0x1a3a1aff;
const FC_BG       = 0x3a1a3aff;
const SECTION_BG  = 0x0a0a1eff;

const BASE_ART = 'https://raw.githubusercontent.com/mgagnant/seiya-bot/main/assets/artifacts/';
const BASE_FC  = 'https://raw.githubusercontent.com/mgagnant/seiya-bot/main/assets/fc/';

// Mapping nom artefact → fichier image
const ART_IMG = {
  "Épée d'Hadès": "hades_weapon.png",
  "Trident de Poséidon": "poseidon_trident.png",
  "Sceptre de Niké": "athena_scepter.png",
  "Bouclier d'Athéna": "athena_shield.png",
  "Dague d'or": "athena_gold_dagger.png",
  "Perles de prière bouddhistes": "virgo_beads.png",
  "Urne d'Athéna": "athena_pot.png",
  "Anneau des Nibelungen": "hilda_nibelungen.png",
  "La jarre sacrée": "hades_monster_pot.png",
  "Collier du Roi des Enfers": "hades_necklace.png",
  "Boîte scellée": "pandora_box.png",
  "Épée de Balmung": "odin_weapon.png",
  "Casque de l'Empereur des mers": "poseidon_helmet.png",
  "Lance longue d'Hilda": "hilda_spear.png",
  "Anneau du présage": "premonitory_ring.png",
  "Épée de Damoclès": "damocles_sword.png",
  "Corne de Galar": "bridgeman_necklace.png",
  "Brigaman": "libra_shield.png",
  "Bouclier rond de la Balance": "libra_sword.png",
  "Épée de la Balance": "libra_halberd.png",
  "Lance longue de la Balance": "chameleon_whip.png",
  "Fouet en cuivre du Caméléon": "medusa_shield.png",
  "Bouclier de la Méduse": "draco_shield.png",
  "Bouclier du Dragon": "gold_arrow.png",
  "Flèche d'or du Fantôme": "golden_apple.png",
  "Pomme d'or": "athena_necklace.png",
  "Collier d'Athéna": "libra_tri_cudgel.png",
  "Bâton à trois branches de la Balance": "pandora_ring.png",
  "Anneau de Pandore": "abel_lyre.png",
  "Lyre d'Apollon": "alice_trident.png",
  "Trident d'Éris": "athena_helmet.png",
  "Casque d'Athéna": "excalibur.png",
  "Épée sainte": "athena_scepter.png",
};

// Mapping nom carte FC → fichier image
const FC_IMG = {
  "Corne de rupture": "Card_small_90000.png",
  "Bouclier du Cosmos du Dragon": "Card_small_90001.png",
  "Armure de Cristal": "Card_small_90002.png",
  "Labyrinthe fantôme": "Card_small_90003.png",
  "Yeux d'aigle": "Card_small_90004.png",
  "Défense rotative": "Card_small_90005.png",
  "Le guerrier revenu des Enfers": "Card_small_90006.png",
  "Bouclier de parade": "Card_small_90007.png",
  "Cosmos en lutte": "Card_small_90008.png",
  "Tir de flèche d'or": "Card_small_91000.png",
  "Armure initiale": "Card_small_91001.png",
  "Défense télékinésique": "Card_small_91002.png",
  "Veine d'eau souterraine": "Card_small_91003.png",
  "Rapide comme le vent": "Card_small_91004.png",
  "Fouet dansant": "Card_small_91005.png",
  "Cheval blanc au galop": "Card_small_91006.png",
  "Puissant guerrier": "Card_small_91007.png",
  "Smash atomique": "Card_small_91009.png",
  "Cascade inversée": "Card_small_91010.png",
  "Lotus": "Card_small_91011.png",
  "Une goutte de pluie douce": "Card_small_91012.png",
  "Rugissement du dragon": "Card_small_91013.png",
  "Contre-attaque": "Card_small_91014.png",
  "Première frappe": "Card_small_91017.png",
  "Frappe précise": "Card_small_91018.png",
  "Chaîne perforante": "Card_small_91019.png",
  "Esquive du serpent électrique": "Card_small_91020.png",
  "Pouvoir de la Licorne": "Card_small_91021.png",
  "Force de rupture": "Card_small_91022.png",
  "Venin de serpent de mer": "Card_small_91023.png",
  "Armure d'Or": "Card_small_92000.png",
  "Syd agile": "Card_small_92001.png",
  "Dragon sans armure": "Card_small_92002.png",
  "Lueur cramoisie": "Card_small_92003.png",
  "Gardien désespéré": "Card_small_92004.png",
  "Énergie des marées": "Card_small_92005.png",
  "Lion colérique": "Card_small_92007.png",
  "Messager d'Excalibur": "Card_small_92008.png",
  "Mage de givre": "Card_small_92009.png",
  "Mur de cristal": "Card_small_92010.png",
  "Rose épineuse": "Card_small_92011.png",
  "Flamme du Phénix": "Card_small_92012.png",
  "Déchaînement des flammes": "Card_small_92013.png",
  "Meikyō Shisui": "Card_small_92014.png",
  "Frappe du Serpent": "Card_small_92015.png",
  "Poing de la fureur du lion": "Card_small_92016.png",
  "Poing de la fureur": "Card_small_92019.png",
  "Force des glaciers": "Card_small_92020.png",
  "Protection de June": "Card_small_92021.png",
  "Frappe de la hache volante": "Card_small_92022.png",
  "Âme des Enfers": "Card_small_92023.png",
  "Puissance du Cosmos": "Card_small_92024.png",
  "Défense à mains nues": "Card_small_92025.png",
  "Opération secrète": "Card_small_92026.png",
  "Le loup et le garçon": "Card_small_92027.png",
  "Transfert": "Card_small_92028.png",
  "Mur invisible": "Card_small_92029.png",
  "Préparation de plan": "Card_small_92030.png",
  "Défense préparée": "Card_small_92031.png",
  "Âme du dragon ascendant": "Card_small_92032.png",
  "La prière de la jeune fille": "Card_small_92033.png",
  "Unis comme les doigts de la main": "Card_small_92034.png",
  "Rose sanguine": "Card_small_92035.png",
  "Acuité sonore": "Card_small_92036.png",
  "Pétrification de Méduse": "Card_small_92037.png",
  "Position défensive": "Card_small_92039.png",
  "La Déesse de l'espoir": "Card_small_92040.png",
  "Étreinte du ver": "Card_small_92041.png",
  "Déguisement": "Card_small_92043.png",
  "Héritage d'Excalibur": "Card_small_93000.png",
  "Forteresse mobile": "Card_small_93001.png",
  "Frappe du météore": "Card_small_93002.png",
  "Pratique ascétique": "Card_small_93003.png",
  "Acalanatha Vidyaraja": "Card_small_93004.png",
  "Griffe du Dragon": "Card_small_93005.png",
  "Phénix de feu": "Card_small_93006.png",
  "Rapide comme l'éclair": "Card_small_93007.png",
  "Éclat désespéré": "Card_small_93008.png",
  "Forêt brumeuse": "Card_small_93009.png",
  "Énergie aurorale": "Card_small_93010.png",
  "Temple écrasant": "Card_small_93011.png",
  "Puissante Excalibur": "Card_small_93012.png",
  "Bénédiction d'Athéna": "Card_small_93013.png",
  "Robe d'Odin": "Card_small_93014.png",
  "Jeune fille au milieu des fleurs": "Card_small_93015.png",
  "Shaka de la Vierge": "Card_small_93017.png",
  "Coup de poing du dragon à deux têtes": "Card_small_93018.png",
  "Technique Suprême": "Card_small_93019.png",
  "Archer d'or": "Card_small_93020.png",
  "Pouvoir maléfique": "Card_small_93021.png",
  "Défense de la Balance": "Card_small_93022.png",
  "Chasse": "Card_small_93023.png",
  "Puissance de Sekishiki": "Card_small_93024.png",
  "Le guetteur": "Card_small_93025.png",
  "Intention meurtrière": "Card_small_93026.png",
  "Esprit du givre": "Card_small_93027.png",
  "Frappe contre": "Card_small_93028.png",
  "Fleur mortelle": "Card_small_93029.png",
  "Majesté des Gémeaux": "Card_small_93030.png",
  "Rédemption de la Déesse": "Card_small_93031.png",
  "Prière de Freya": "Card_small_93032.png",
  "Frappe du dragon repenti": "Card_small_93033.png",
  "Envol de dragon": "Card_small_93034.png",
  "Guetter avant de frapper": "Card_small_93035.png",
  "Gardien d'or": "Card_small_93036.png",
  "Constitution du Taureau": "Card_small_93037.png",
  "Puissance dimensionnelle": "Card_small_93038.png",
  "Attaque puissante, défense faible": "Card_small_93039.png",
  "Renaissance et renouveau": "Card_small_93040.png",
  "Rêve illusoire": "Card_small_93041.png",
  "Volonté meurtrière": "Card_small_93042.png",
  "Contre-attaque défensive": "Card_small_93043.png",
  "Flammes ardentes": "Card_small_93044.png",
  "Voyageur dimensionnel": "Card_small_93045.png",
  "Papillon épris de lumière": "Card_small_93046.png",
  "Puissance triangulaire": "Card_small_93047.png",
  "Passer de la défense à l'attaque": "Card_small_93048.png",
  "Contre-attaque chargée": "Card_small_93049.png",
  "Lance d'or": "Card_small_93050.png",
  "Le pouvoir du Chakra": "Card_small_93051.png",
  "Tempête de coups": "Card_small_93052.png",
  "Aide précieuse des disciples": "Card_small_93053.png",
  "Intrigue dévoilée": "Card_small_93054.png",
  "Mélodie de la Sirène": "Card_small_93055.png",
  "Incassable": "Card_small_93056.png",
  "Assaut extrême": "Card_small_93057.png",
  "Danse": "Card_small_93058.png",
  "Charge d'énergie infinie": "Card_small_93059.png",
  "Suppression ultime": "Card_small_93060.png",
  "Danse du Cygne": "Card_small_93061.png",
  "Âge glaciaire": "Card_small_93062.png",
  "Affrontement des volontés": "Card_small_93063.png",
  "Cadeau du dragon à deux têtes": "Card_small_93064.png",
  "Puissance du blizzard et de la tempête": "Card_small_93065.png",
  "Rame tourbillonnante": "Card_small_93067.png",
  "Fleur toxique": "Card_small_93068.png",
  "Frais de traversée": "Card_small_93069.png",
  "Bouclier de givre": "Card_small_93070.png",
  "Énergie du gel immédiat": "Card_small_93072.png",
  "Déchirure de hache géante": "Card_small_93073.png",
  "Convergence des étoiles": "Card_small_93074.png",
  "Pouvoir ultime": "Card_small_93075.png",
  "Se libérer": "Card_small_93076.png",
  "Mélodie éthérée": "Card_small_93078.png",
  "Barge du Styx": "Card_small_93079.png",
  "Retour aux Enfers": "Card_small_93080.png",
  "Puissance des étoiles": "Card_small_93081.png",
  "Crocs du Lion": "Card_small_93082.png",
  "Protecteur du cristal": "Card_small_93083.png",
  "Puissance du cristal": "Card_small_93084.png",
  "Puissance du Titan": "Card_small_93085.png",
  "Gel sanguin": "Card_small_93086.png",
  "Défenseur": "Card_small_93087.png",
};

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

function fillRect(img, x, y, w, h, color) {
  for (let px = x; px < x + w; px++)
    for (let py = y; py < y + h; py++)
      img.setPixelColor(color, px, py);
}

async function loadImg(url, size) {
  try {
    const buf = await fetchBuffer(url);
    const img = await Jimp.fromBuffer(buf);
    img.resize({ w: size, h: size });
    return img;
  } catch(e) { return null; }
}

async function generateCollectionImage(ownedHeroes, ownedArt, ownedFC, db) {
  const factions = ['Sanctuaire', 'Atlantide', 'Asgard', 'Enfers', 'Chevaliers Noirs'];

  // Héros par faction
  const byFaction = {};
  factions.forEach(f => byFaction[f] = []);
  for (const name of Object.keys(db)) {
    if (!ownedHeroes.has(name)) continue;
    const h = db[name];
    const fac = h.fac || 'Sanctuaire';
    if (byFaction[fac]) byFaction[fac].push({ name, img: h.img });
  }
  const heroSections = factions
    .map(fac => ({ fac, heroes: byFaction[fac] }))
    .filter(s => s.heroes.length > 0);

  const heroColW = AVATAR_SIZE + PAD;
  const itemColW = ITEM_SIZE + PAD;
  const totalW = Math.max(
    HERO_COLS * heroColW + PAD,
    ITEM_COLS * itemColW + PAD
  );

  // Calcul hauteur
  let totalH = PAD;

  // Section héros
  totalH += 32; // titre
  for (const s of heroSections) {
    s.rows = Math.ceil(s.heroes.length / HERO_COLS);
    s.sectionH = HEADER_H + s.rows * heroColW + PAD;
    totalH += s.sectionH + PAD;
  }

  // Section artefacts
  const artList = [...ownedArt].filter(a => ART_IMG[a]);
  const artNoImg = [...ownedArt].filter(a => !ART_IMG[a]);
  const artRows = artList.length ? Math.ceil(artList.length / ITEM_COLS) : 0;
  const artSectionH = ownedArt.size ? (32 + artRows * (ITEM_SIZE + PAD) + PAD) : 0;
  if (ownedArt.size) totalH += artSectionH + PAD;

  // Section FC
  const fcList = [...ownedFC].filter(f => FC_IMG[f]);
  const fcRows = fcList.length ? Math.ceil(fcList.length / ITEM_COLS) : 0;
  const fcSectionH = ownedFC.size ? (32 + fcRows * (ITEM_SIZE + PAD) + PAD) : 0;
  if (ownedFC.size) totalH += fcSectionH + PAD;

  const canvas = new Jimp({ width: totalW, height: totalH, color: CANVAS_BG });

  let font16, font10;
  try { font16 = await loadFont(Jimp.FONT_SANS_16_WHITE); } catch(e) {}
  try { font10 = await loadFont(Jimp.FONT_SANS_10_WHITE); } catch(e) {}

  let y = PAD;

  // ── Titre Héros ──
  fillRect(canvas, 0, y, totalW, 28, SECTION_BG);
  if (font16) canvas.print({ font: font16, x: PAD, y: y + 6, text: `⚔️ Héros  (${ownedHeroes.size})` });
  y += 32;

  // ── Sections héros ──
  for (const { fac, heroes, rows, sectionH } of heroSections) {
    fillRect(canvas, 0, y, totalW, sectionH, FAC_BG[fac] || 0x222233ff);
    if (font16) canvas.print({ font: font16, x: PAD, y: y + 7, text: `${fac}  (${heroes.length})` });
    let col = 0, row = 0;
    for (const hero of heroes) {
      const ax = PAD + col * heroColW;
      const ay = y + HEADER_H + row * heroColW;
      const avatar = await loadImg(hero.img, AVATAR_SIZE);
      if (avatar) canvas.composite(avatar, ax, ay);
      else fillRect(canvas, ax, ay, AVATAR_SIZE, AVATAR_SIZE, 0x444466ff);
      col++;
      if (col >= HERO_COLS) { col = 0; row++; }
    }
    y += sectionH + PAD;
  }

  // ── Section Artefacts ──
  if (ownedArt.size) {
    fillRect(canvas, 0, y, totalW, 28, SECTION_BG);
    if (font16) canvas.print({ font: font16, x: PAD, y: y + 6, text: `🗡️ Artefacts  (${ownedArt.size})` });
    y += 32;
    let col = 0, row = 0;
    for (const art of artList) {
      const ax = PAD + col * itemColW;
      const ay = y + row * (ITEM_SIZE + PAD);
      fillRect(canvas, ax, ay, ITEM_SIZE, ITEM_SIZE, ART_BG);
      const img = await loadImg(BASE_ART + ART_IMG[art], ITEM_SIZE);
      if (img) canvas.composite(img, ax, ay);
      col++;
      if (col >= ITEM_COLS) { col = 0; row++; }
    }
    y += artRows * (ITEM_SIZE + PAD) + PAD * 2;
  }

  // ── Section Cartes FC ──
  if (ownedFC.size) {
    fillRect(canvas, 0, y, totalW, 28, SECTION_BG);
    if (font16) canvas.print({ font: font16, x: PAD, y: y + 6, text: `⚡ Ultimate Powers  (${ownedFC.size})` });
    y += 32;
    let col = 0, row = 0;
    for (const fc of fcList) {
      const ax = PAD + col * itemColW;
      const ay = y + row * (ITEM_SIZE + PAD);
      fillRect(canvas, ax, ay, ITEM_SIZE, ITEM_SIZE, FC_BG);
      const img = await loadImg(BASE_FC + FC_IMG[fc], ITEM_SIZE);
      if (img) canvas.composite(img, ax, ay);
      col++;
      if (col >= ITEM_COLS) { col = 0; row++; }
    }
  }

  const outPath = path.join('/tmp', `col_${Date.now()}.png`);
  await canvas.write(outPath);
  return outPath;
}

module.exports = { generateCollectionImage };
