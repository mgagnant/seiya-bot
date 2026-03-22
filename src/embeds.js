const { EmbedBuilder } = require('discord.js');
const { FAC_COLORS, CL_EMOJI, SK_EMOJI } = require('./data/heroes');
const { sortByOwned } = require('./data/db');

// ── HERO EMBED ─────────────────────────────────────────────
function buildHeroEmbed(heroName, hero) {
  const color = FAC_COLORS[hero.fac] || 0x95A5A6;
  const emoji = CL_EMOJI[hero.cl] || '⚔️';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${heroName}`)
    .setDescription(`**${hero.cl}** · ${hero.row} · ${hero.fac}`)
    .setFooter({ text: 'Saint Seiya Rebirth 2 EX · /build pour les recommandations' });
  if (hero.img) embed.setThumbnail(hero.img);

  // Tags
  if (hero.tags && hero.tags.length) {
    embed.addFields({ name: '🏷️ Caractéristiques', value: hero.tags.map(t => `\`${t}\``).join(' '), inline: false });
  }

  // Skills (max 5 pour ne pas dépasser la limite Discord)
  const skills = hero.skills || [];
  const mainSkills = skills.slice(0, 5);
  if (mainSkills.length) {
    const skillText = mainSkills.map(s => {
      const em = SK_EMOJI[s.t] || '▫️';
      return `${em} **${s.n}** *(${s.t})*\n${s.d}`;
    }).join('\n\n');
    embed.addFields({ name: '⚔️ Skills', value: skillText.slice(0, 1024), inline: false });
  }

  if (skills.length > 5) {
    embed.addFields({ name: '...', value: `+${skills.length - 5} skill(s) supplémentaire(s). Utilise \`/build\` pour voir le build complet.`, inline: false });
  }

  // Note
  if (hero.note) {
    embed.addFields({ name: '💡 Stratégie', value: hero.note, inline: false });
  }

  return embed;
}

// ── COMPATIBILITÉ ARTEFACTS / CARTES FC ────────────────────
// Score de compatibilité entre un héros et un artefact/carte
// basé sur les tags du héros, sa classe, sa faction et ses skills

const ART_TAGS = {
  "Épée d'Hadès":          ["burst_ultime","DGT_bruts","AOE"],
  "Trident de Poséidon":   ["ATQ_base","DGT_P","proc","multi_hit","Étourdissement"],
  "Sceptre de Niké":       ["support","buff_ATQ","équipe","soins"],
  "Bouclier d'Athéna":     ["support","bouclier","équipe","protection","tank"],
  "Dague d'or":            ["DGT_P","exécution","après_ultime","burst"],
  "Perles de prière bouddhistes": ["DGT_M","AOE","invocation"],
  "Urne d'Athéna":         ["bannissement","contrôle","interdim"],
  "Anneau des Nibelungen": ["DGT_M","AOE","buff_debuff","Asgard"],
  "La jarre sacrée":       ["DGT_M","soins","support"],
  "Collier du Roi des Enfers": ["VIT_comp","DGT_P","DGT_M"],
  "Boîte scellée":         ["contrôle","drain_rage","zone","DGT_M"],
  "Épée de Balmung":       ["DGT_bruts","AOE","vol_de_vie","après_ultime","Asgard"],
  "Casque de l'Empereur des mers": ["défense","Atlantide","tank"],
  "Lance longue d'Hilda":  ["DGT_M","proc_compétence","Asgard"],
  "Anneau du présage":     ["DGT_M","ATQ_M","cosmos"],
  "Épée de Damoclès":      ["DGT_finaux","exécution","boss","DGT_P"],
  "Corne de Galar":        ["Asgard","invocation","buff"],
  "Brigaman":              ["tank","counter","défense"],
  "Bouclier rond de la Balance": ["bouclier","PV","équipe","tank"],
  "Épée de la Balance":    ["DGT_P","AOE","anti_bouclier"],
  "Lance longue de la Balance": ["DGT_P","counter_CC","projection","tank"],
  "Fouet en cuivre du Caméléon": ["DGT_P","régulier","zone"],
  "Bouclier de la Méduse": ["DGT_M","pétrification","CC","gel"],
  "Bouclier du Dragon":    ["bouclier","PV","tank","Dragon"],
  "Flèche d'or du Fantôme":["DGT_P","anti_soins","ATQ_base","proc","archer"],
  "Pomme d'or":            ["soins","équipe","sustain","support"],
  "Collier d'Athéna":      ["soins","régulier","support"],
  "Bâton à trois branches de la Balance": ["DGT_P","buff","équipe"],
  "Anneau de Pandore":     ["crit","entrée","DGT_P","DGT_M"],
  "Lyre d'Apollon":        ["VIT_ATQ","équipe","buff","invocation","support"],
  "Trident d'Éris":        ["DGT_M","accumulation","burst"],
  "Casque d'Athéna":       ["réduction_DGT","équipe","protection","support","tank"],
  "Épée sainte":           ["DGT_P","holy","ATQ_base"],
  "Casque de Lucifer":     ["défense","Enfers","tank"],
  "Épée de Dolbar":        ["DGT_P"],
  "Épée de Siegfried":     ["DGT_P","Asgard","Dragon"],
  "Bouclier de Siegfried": ["défense","Asgard","tank"],
  "Diadème d'Éris":        ["DGT_M","brûlure"],
  "Ceinture d'Abel":       ["DGT_P","holy","armure"],
  "Trône du Lotus d'Or":   ["DGT_M","soins","bouclier","silence","invocation","support"],
  "Sceau de perles scellées": ["gel","CC","amplification"],
};

const FC_TAGS = {
  // Physique/ATQ base
  "Lion colérique":        ["DGT_P","berserker","PV_bas","ATQ"],
  "Crocs du Lion":         ["DGT_P","post_crit","multi_hit"],
  "Rapide comme l'éclair": ["VIT_ATQ","ATQ_base"],
  "Cosmos en lutte":       ["rupture","armure","multi_hit","DGT_P"],
  "Attaque puissante, défense faible": ["DGT_infligés","burst","DGT_P","DGT_M"],
  "Poing de la fureur du lion": ["DGT_P","crit"],
  "Syd agile":             ["VIT_ATQ","ATQ_base"],
  "Armure d'Odin":         ["VIT_ATQ","ATQ_base","Asgard","invocation"],
  "Smash atomique":        ["DGT_P","permanent"],
  "Incassable":            ["DGT_P","début"],
  "Première frappe":       ["DGT_P","DGT_M","début"],
  "Héritage d'Excalibur":  ["crit","DGT_crit","Excalibur","DGT_P"],
  // Feu/Brûlure
  "Flamme du Phénix":      ["brûlure","ATQ","DGT_M"],
  "Phénix de feu":         ["brûlure","DGT_M","AOE"],
  "Déchaînement des flammes": ["brûlure","DGT_M"],
  "Flammes ardentes":      ["brûlure","DEF","AOE"],
  "Charge d'énergie infinie": ["DGT_feu","DGT_glace","cumulable"],
  // Glace/Gel
  "Âge glaciaire":         ["gel","réduction_DGT","super_armure"],
  "Esprit du givre":       ["crit","gel","glacial","DGT_glace"],
  "Gel sanguin":           ["anti_soins","gel"],
  "Danse du Cygne":        ["DGT_glace","gel"],
  "Mage de givre":         ["drain_rage","gel"],
  "Énergie aurorale":      ["rage","alliés"],
  "Bouclier de givre":     ["réduction_DGT","gel"],
  "Froid polaire extrême": ["DGT_glace","gel","permanent"],
  "Congélation":           ["gel","DGT_M","AOE","début"],
  // Poison
  "Rose épineuse":         ["poison"],
  "Frappe du Serpent":     ["vol_de_vie","poison"],
  "Fleur mortelle":        ["DGT_bruts","poison"],
  "Guerrier de la beauté": ["poison","anti_soins"],
  "Venin de serpent de mer": ["DGT_continus","poison"],
  "Parfum de rose":        ["poison","permanent"],
  // Dragon/Asgard
  "Dragon sans armure":    ["ATQ","Dragon","DGT_P"],
  "Rugissement du dragon": ["DGT_ATQ_base","Dragon"],
  "Envol de dragon":       ["DEF_vers_DGT_P","Dragon"],
  "Âme du dragon ascendant": ["regen_PV","sustain","Dragon"],
  "Griffe du Dragon":      ["CC","super_armure","Dragon"],
  "Frappe du dragon repenti": ["crit","DGT_crit","Dragon"],
  "Le loup et le garçon":  ["invocation","Asgard"],
  "Prière de Freya":       ["soins","crit_soin","Asgard"],
  "Cadeau du dragon à deux têtes": ["soins","Asgard"],
  "Puissance du blizzard et de la tempête": ["PV_vers_DGT_P","Asgard"],
  // Support/Soins
  "Unis comme les doigts de la main": ["réduction_DGT","support","allié"],
  "La prière de la jeune fille": ["réduction_DGT_M","support","allié"],
  "La Déesse de l'espoir": ["aura","réduction_DGT","support"],
  "Bénédiction d'Athéna":  ["purge","support"],
  "Jeune fille au milieu des fleurs": ["VIT","soins","support"],
  "Veine d'eau souterraine": ["soins_reçus","support"],
  "Protection de June":    ["soins","régulier"],
  "Mur de cristal":        ["bouclier","valeur"],
  "Mur invisible":         ["bouclier","passif"],
  "Acalanatha Vidyaraja":  ["bouclier","durée"],
  // Bannissement/Contrôle
  "Interdimensionnel":     ["rage","bannissement","stabilité"],
  "Voyageur dimensionnel": ["DGT_M","bannissement","vol_de_vie"],
  "Puissance dimensionnelle": ["DGT_skills","bannissement"],
  "Majesté des Gémeaux":   ["ATQ","étourdissement"],
  "Rédemption de la Déesse": ["rage","invincibilité"],
  "Rêve illusoire":        ["VIT_ATQ","sosies"],
  // Archer
  "Tir de flèche d'or":    ["archer","DGT_P"],
  "Flèche d'or":           ["DGT_P","anti_soins","archer"],
  "Archer d'or":           ["réduction_DGT","archer"],
  "Yeux d'aigle":          ["précision","archer"],
  "Puissance des étoiles": ["DGT_crit","archer"],
  // Excalibur
  "Messager d'Excalibur":  ["ATQ","kill","Excalibur"],
  "Puissante Excalibur":   ["DGT","bouclier","Excalibur"],
  "Frappe contre":         ["parade","vol_de_vie","Excalibur"],
  "Guetter avant de frapper": ["réduction_DGT","survie"],
  "Gardien désespéré":     ["protection","allié"],
  // Furtivité/Esquive
  "Opération secrète":     ["DGT","invisible"],
  "Forêt brumeuse":        ["esquive","invisible"],
  "Intention meurtrière":  ["DGT","sans_DGT_reçus"],
  "Volonté meurtrière":    ["esquive","invisible"],
  // Tank/Défense
  "Constitution du Taureau": ["PV","tank"],
  "Position défensive":    ["DEF_P","tank"],
  "Gardien d'or":          ["immunité_mort","tank"],
  "Forteresse mobile":     ["piétinement","tank"],
  "Défense anti-ondes":    ["réduction_DGT_ultime","tank"],
  "Défense à mains nues":  ["réduction_DGT_ATQ_base","tank"],
  // Spéciaux
  "Lueur cramoisie":       ["VIT_ATQ","saignement"],
  "Séquence Sekishiki":    ["DGT_M","AOE"],
  "Puissance de Sekishiki":["DGT_ultime","AOE","DGT_M"],
  "Sekishiki Meikaiha":    ["vol_de_vie","ultime","AOE","DGT_M"],
  "Acuité":                ["DGT_M","purge","ATQ"],
  "Pratique ascétique":    ["stabilité","DEF","DGT_M"],
};

// Profil de compatibilité par héros basé sur classe+tags+skills
function getHeroProfile(hero) {
  const tags = (hero.tags || []).map(t => typeof t === 'object' ? t.l.toLowerCase() : t.toLowerCase());
  const cl = (hero.cl || '').toLowerCase();
  const fac = (hero.fac || '').toLowerCase();
  const skills = (hero.skills || []).map(s => (s.d || '').toLowerCase() + ' ' + (s.n || '').toLowerCase()).join(' ');

  const profile = new Set();

  // Classe
  if (cl === 'combattant') { profile.add('DGT_P'); profile.add('burst'); }
  if (cl === 'mage') { profile.add('DGT_M'); profile.add('ATQ_M'); }
  if (cl === 'support') { profile.add('support'); profile.add('soins'); profile.add('équipe'); }
  if (cl === 'tank') { profile.add('tank'); profile.add('défense'); profile.add('protection'); profile.add('PV'); }
  if (cl === 'archer') { profile.add('archer'); profile.add('DGT_P'); profile.add('ATQ_base'); }

  // Faction
  if (fac === 'asgard') { profile.add('Asgard'); }
  if (fac === 'atlantide') { profile.add('Atlantide'); }
  if (fac === 'enfers') { profile.add('Enfers'); }

  // Tags du héros
  const tagMap = {
    'atq de base': 'ATQ_base', 'atq de base scaling': 'ATQ_base', 'vit atq': 'ATQ_base',
    'multi-hit': 'multi_hit', 'dgt-p': 'DGT_P', 'dgt-m': 'DGT_M',
    'brûlure': 'brûlure', 'gel': 'gel', 'poison': 'poison',
    'bannissement': 'bannissement', 'interdimensionnel': 'bannissement',
    'vol de vie': 'vol_de_vie', 'résurrection': 'survie',
    'invocation': 'invocation', 'invocatrice': 'invocation',
    'bouclier': 'bouclier', 'super armure': 'tank',
    'berserker': 'berserker', 'excalibur': 'Excalibur',
    'esquive': 'esquive', 'invisible': 'invisible',
    'soins': 'soins', 'support': 'support',
  };
  tags.forEach(t => { if (tagMap[t]) profile.add(tagMap[t]); });

  // Skills keywords
  if (skills.includes('gel') || skills.includes('glac')) { profile.add('gel'); profile.add('DGT_glace'); }
  if (skills.includes('brûl') || skills.includes('feu') || skills.includes('flamme')) { profile.add('brûlure'); profile.add('DGT_feu'); }
  if (skills.includes('poison')) { profile.add('poison'); }
  if (skills.includes('banniss') || skills.includes('interdim')) { profile.add('bannissement'); }
  if (skills.includes('invoque') || skills.includes('esprit')) { profile.add('invocation'); }
  if (skills.includes('bouclier')) { profile.add('bouclier'); }
  if (skills.includes('vol de vie')) { profile.add('vol_de_vie'); }
  if (skills.includes('esquive')) { profile.add('esquive'); }
  if (skills.includes('critique') || skills.includes('crit')) { profile.add('crit'); }
  if (skills.includes('dragon')) { profile.add('Dragon'); }
  if (skills.includes('aoe') || skills.includes('tous les ennemis') || skills.includes('zone')) { profile.add('AOE'); }

  return profile;
}

function scoreArtifact(artName, heroProfile, recoList) {
  const artTags = ART_TAGS[artName] || [];
  let score = 0;
  // Bonus massif si dans les recommandés officiels — priorité absolue
  if (recoList.includes(artName)) score += 100;
  for (const tag of artTags) {
    if (heroProfile.has(tag)) score += 2;
  }
  return score;
}

function scoreFCCard(fcName, heroProfile, recoList) {
  const fcTags = FC_TAGS[fcName] || [];
  let score = 0;
  // Bonus massif si dans les recommandées officielles — priorité absolue
  if (recoList.includes(fcName)) score += 100;
  for (const tag of fcTags) {
    if (heroProfile.has(tag)) score += 2;
  }
  return score;
}

function getBestFromCollection(hero, ownedArt, ownedFC) {
  // Utiliser le classement top15/top30 stocké dans heroes.js
  // Parcourir dans l'ordre du classement et garder ceux possédés
  const art15 = hero.art15 || hero.art || [];
  const fc30 = hero.fc30 || hero.fc || [];

  const availableArt = art15
    .filter(a => ownedArt.has(a))
    .slice(0, 3)
    .map(a => ({ name: a, inReco: (hero.art || []).includes(a) }));

  const availableFC = fc30
    .filter(f => ownedFC.has(f))
    .slice(0, 6)
    .map(f => ({ name: f, inReco: (hero.fc || []).includes(f) }));

  return { art: availableArt, fc: availableFC };
}


// ── CATALOGUE DESCRIPTIONS GLOBALES ───────────────────────
const ART_DESC = {
  "Épée d'Hadès": "2×ultime → 50% DGT bruts +4000 AOE",
  "Trident de Poséidon": "ATQ base → 15% chance 40% DGT-P AOE + Étourdi 2s. CD25s",
  "Sceptre de Niké": "Début → +50% ATQ alliés 10s",
  "Bouclier d'Athéna": "Début → Bouclier 120% ATQ+4000 alliés 10s. +10% DEF si actif",
  "Dague d'or": "Après ultime → 160% DGT-P+8000 ennemi PV le plus bas",
  "Perles de prière bouddhistes": "2×ultime → 42% DGT-M+4000 AOE. +15% vs invocations",
  "Urne d'Athéna": "25s → Bannissement ennemi ATQ+ 5s. -15 Rage/s",
  "Anneau des Nibelungen": "2×ultime → 50% DGT-M+5000 AOE 5 coups. 5% purge buffs",
  "La jarre sacrée": "Entrée → DGT-M+5000 + soins alliés réguliers",
  "Collier du Roi des Enfers": "Entrée → +10% VIT comp permanent",
  "Boîte scellée": "15s → Cercle 8s: DGT-M/s + Disparition + -50 Rage/s",
  "Épée de Balmung": "Après ultime → 8 coups 32% DGT bruts+4000 AOE + 10% Vol de vie",
  "Casque de l'Empereur des mers": "Défense aquatique — synergy Atlantide",
  "Lance longue d'Hilda": "Compétence → 50% chance 120% DGT-M+6000 proche. CD10s",
  "Anneau du présage": "ATQ-M boost — DGT-M et cosmos",
  "Épée de Damoclès": "DGT finaux — exécution et boss",
  "Corne de Galar": "Buff Asgard + invocations",
  "Brigaman": "Tank/counter — défense",
  "Bouclier rond de la Balance": "Début → Bouclier 21% PV max+4000 sur 3 alliés 10s",
  "Épée de la Balance": "Après ultime → 60% DGT-P+8000 AOE. +100% DGT-P si bouclier",
  "Lance longue de la Balance": "Si CC subi → 50% DGT-P+4000 + Projection. CD20s",
  "Fouet en cuivre du Caméléon": "Toutes 15s → 3 coups 75% DGT-P+5000 zone avant",
  "Bouclier de la Méduse": "20s → 75% DGT-M+6000 AOE + 50% Pétrification 5s",
  "Bouclier du Dragon": "Début → Bouclier physique 28% PV max+4000 pendant 7s",
  "Flèche d'or du Fantôme": "ATQ base → 70% chance 60% DGT-P+4000 + -75% soins 5s. CD6s",
  "Pomme d'or": "5%/s → soins 8% ATQ/s alliés 5s. PV bas ×4",
  "Collier d'Athéna": "Toutes 20s → soins 50% ATQ 3 alliés PV les plus bas",
  "Bâton à trois branches de la Balance": "Toutes 10s → +15% DGT-P aux 3 alliés ATQ+ 5s",
  "Anneau de Pandore": "Entrée → +20% taux de critique pendant 10s",
  "Lyre d'Apollon": "Entrée → +40% VIT ATQ tous alliés 8s",
  "Trident d'Éris": "Accumule 20% DGT → à 500% ATQ: 110% DGT-M ligne",
  "Casque d'Athéna": "Entrée → -10% DGT-P/M -30% DGT bruts 12s alliés. Porteur -20% DGT ultimes",
  "Épée sainte": "DGT-P holy — synergy ATQ base",
  "Casque de Lucifer": "Défense Enfers",
  "Épée de Dolbar": "DGT-P",
  "Épée de Siegfried": "DGT-P Asgard — SIGNATURE Dragon",
  "Bouclier de Siegfried": "Défense Asgard",
  "Diadème d'Éris": "Brûlure DGT-M",
  "Ceinture d'Abel": "Holy/armure — synergy Pégase divin",
  "Trône du Lotus d'Or": "+2% ATQ/DEF. Soins → bouclier+soins alliés. DGT → DGT-M+Silence 50%",
  "Sceau de perles scellées": "Amplifie Gel/CC — synergy ultime Gel",
};

const FC_DESC = {
  "Lion colérique": "+15% ATQ + Stabilité quand PV < 20%",
  "Crocs du Lion": "DGT-P suppl après CRIT — 15 hits se déclenchent souvent",
  "Rapide comme l'éclair": "+35% VIT ATQ — ATQ base pur, -50% DGT skills ignoré",
  "Cosmos en lutte": "+4% rupture — 15 hits percent armure",
  "Attaque puissante, défense faible": "+25% DGT infligés — burst",
  "Poing de la fureur du lion": "Signature Aiolia — DGT-P sur CRIT",
  "Syd agile": "VIT ATQ permanente",
  "Armure d'Odin": "VIT ATQ x20 charges + taillade ATQ base",
  "Smash atomique": "+3% DGT-P permanent",
  "Incassable": "+5×6% DGT-P début combat",
  "Première frappe": "+15% DGT-P/M 10s début combat",
  "Héritage d'Excalibur": "+10% taux critique +20% DGT critiques",
  "Messager d'Excalibur": "+16% ATQ après kill",
  "Puissante Excalibur": "+25% DGT sur boucliers + brise armure",
  "Frappe contre": "+10% parade + Vol de vie + DGT-P",
  "Flamme du Phénix": "+2% ATQ x5 par Brûlure",
  "Phénix de feu": "Brûlure 3 ennemis + DGT-M 15% toutes 25s",
  "Déchaînement des flammes": "Brûlure 2 ennemis dès 5s + DGT-M 20%",
  "Flammes ardentes": "+12% DEF + DGT Brûlure AOE % PV max",
  "Charge d'énergie infinie": "+35% DGT feu/glace cumulable",
  "Renaissance et renouveau": "+20% ATQ/DEF après résurrection x3",
  "Âge glaciaire": "-10% DGT + dissipe Super Armure via ultime Gel",
  "Esprit du givre": "+30% crit sur gelés / +40% sur glacial",
  "Gel sanguin": "Anti-soins sur gelés x10 cumulable",
  "Danse du Cygne": "+15% DGT glace + purge gel propre",
  "Mage de givre": "50% drain 100 Rage sur gel",
  "Énergie aurorale": "+250 Rage alliés à 15s",
  "Bouclier de givre": "Réduction DGT après gel",
  "Froid polaire extrême": "+X% DGT givre permanent",
  "Congélation": "Début → DGT-M AOE + Gel Xs",
  "Rose épineuse": "+30% effet Poison",
  "Frappe du Serpent": "Vol de vie +8% ATQ par Poison",
  "Fleur mortelle": "DGT bruts 15% PV max sur Poison",
  "Guerrier de la beauté": "Durée Poison + anti-soins ennemi",
  "Venin de serpent de mer": "+10% DGT continus Poison",
  "Parfum de rose": "Tant que sur champ → Poison permanent tous ennemis (non purgeable)",
  "Dragon sans armure": "+8% ATQ -4% DEF — offensif Dragon",
  "Rugissement du dragon": "+12% DGT ATQ base",
  "Envol de dragon": "+25% DEF-P vers DGT-P toutes 2.5s",
  "Âme du dragon ascendant": "Regen 0.8% PV max/s sous 50% PV",
  "Griffe du Dragon": "Renversement + Super Armure quand PV < 30%",
  "Frappe du dragon repenti": "+18% crit +30% DGT crit sous 50% PV",
  "Le loup et le garçon": "+15% DGT invocations",
  "Prière de Freya": "+20% soins +30% crit soin",
  "Cadeau du dragon à deux têtes": "Soin alliés 8% PV quand PV < 55%",
  "Puissance du blizzard et de la tempête": "+5% PV max vers DGT-P",
  "Armure d'Odin": "VIT ATQ x20 charges + taillade ATQ base",
  "Danse": "+4% crit +10% DGT crit x5 cumuls début",
  "Unis comme les doigts de la main": "-80% DGT-P allié < 30% PV",
  "La prière de la jeune fille": "-80% DGT-M allié < 30% PV",
  "La Déesse de l'espoir": "Aura -5% DGT P/M tous alliés",
  "Bénédiction d'Athéna": "Purge débuffs 2 alliés toutes 10s",
  "Jeune fille au milieu des fleurs": "+8% VIT comp/ATQ sur allié soigné",
  "Veine d'eau souterraine": "+20% soins reçus",
  "Protection de June": "Soin 50% ATQ à 10s et 20s",
  "Mur de cristal": "+15% valeur bouclier",
  "Mur invisible": "Bouclier passif permanent — signature défense",
  "Mur de défense aérienne": "Bouclier 140% ATQ si PV < 20%",
  "Acalanatha Vidyaraja": "+25% valeur bouclier + durée +5s",
  "Interdimensionnel": "Rage +100 + Stabilité après Bannissement ultime",
  "Voyageur dimensionnel": "DGT-M % PV max pendant interdim + Vol de vie",
  "Puissance dimensionnelle": "+25% DGT skills + réduction CD",
  "Majesté des Gémeaux": "+15% ATQ + durée étourdissement infligé +40%",
  "Rédemption de la Déesse": "+20% regen Rage + Invincibilité",
  "Rêve illusoire": "+20% VIT ATQ + sosies sous 35% PV",
  "Tir de flèche d'or": "Signature archer Aiolos",
  "Flèche d'or": "50% DGT-P + -80% soins si PV < 20%",
  "Archer d'or": "+12% réduction DGT P/M + VIT comp/ATQ après déplacement",
  "Yeux d'aigle": "Signature précision hors contact",
  "Puissance des étoiles": "DGT CRIT augmentés sur étourdis",
  "Chasse": "+12% VIT comp/ATQ par invocation",
  "Guetter avant de frapper": "Réduction DGT 32% 20s + soin final",
  "Gardien désespéré": "Absorbe 80% DGT allié < 30%",
  "Opération secrète": "+16% DGT en invisibilité",
  "Forêt brumeuse": "+10% esquive + invisible 10s début",
  "Intention meurtrière": "+30% DGT sans prendre DGT",
  "Volonté meurtrière": "+12% esquive + invisibilité après esquive",
  "Constitution du Taureau": "+25% PV max -10% ATQ — tank pur",
  "Position défensive": "+10% DEF-P permanent",
  "Gardien d'or": "Immunité mort 1× + réduction DGT 200% 6s",
  "Forteresse mobile": "Piétinement toutes 15s + étourdissement",
  "Défense anti-ondes": "-20% DGT ultime subi",
  "Défense à mains nues": "-25% DGT ATQ base subi",
  "Lueur cramoisie": "+2.4% VIT ATQ par Saignement x15",
  "Rose sanguine": "+30% Poison — synergy Saignement",
  "Puissance de Sekishiki": "+32% DGT ultime si AOE",
  "Sekishiki Meikaiha": "Vol de vie sur ultime AOE",
  "Pratique ascétique": "Stabilité + DEF bonus",
  "Affrontement des volontés": "+10% ATQ +30% DGT si seul vs ennemi",
  "Énergie des marées": "Rage +250 début — ultime plus vite",
  "Puissance triangulaire": "+18% ATQ + barrière CC toutes 6s",
  "Tempête de coups": "+15% rupture + DGT-P — AOE perce défenses",
  "Cascade inversée": "ATQ += 8% DEF-P après 30s",
  "Passer de la défense à l'attaque": "+12% DEF-P +12% ATQ sous 50% PV permanent",
  "Défense de la Balance": "+12% parade + Super Armure",
  "Lance d'or": "+15% rupture + DGT-P sur DEF ennemi",
  "Frappe de la comète": "250% DGT-P AOE + étourdissement 3s à 20s",
  "Se libérer": "Purge étourdissement + immunité 3s",
  "Puissance absolue": "+VIT comp + DGT après compétences CD x3",
  "Télékinésie": "+3% DGT-M",
  "Acuité sonore": "Brise invisibilité + 100% DGT-M",
  "Suppression ultime": "-20% DGT ultime + drain Rage ennemi",
  "Mélodie de la Sirène": "Debuff DGT cible étourdis — SIGNATURE Sorrento",
  "Mélodie éthérée": "+esquive +Rage par esquive",
  "La rédemption du demi-dieu": "+15% DGT skills après interdim 10s",
};

// ── BUILD EMBED ────────────────────────────────────────────
function buildBuildEmbed(heroName, hero, userCollection) {
  const color = FAC_COLORS[hero.fac] || 0x95A5A6;
  const ownedArt = new Set(userCollection.artifacts);
  const ownedFC = new Set(userCollection.fc);
  const ownedHeroes = new Set(userCollection.heroes);
  const desc = `**${hero.cl}** · ${hero.row} · ${hero.fac}`;
  const footer = { text: 'Saint Seiya Rebirth 2 EX · ✅ = dans ta collection' };

  // ── EMBED 1 : Meilleures options ──────────────────────────
  const embed1 = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔧 Build · ${heroName}`)
    .setDescription(desc)
    .setFooter(footer);
  if (hero.img) embed1.setThumbnail(hero.img);

  const anyArtOwned = hero.art.some(n => ownedArt.has(n));
  const artText = hero.art.map((n, i) => {
    const owned = ownedArt.has(n);
    const reason = hero.artR[n] || '';
    return `${owned ? '✅' : '⬜'} **${i + 1}.** ${n}\n*${reason}*`;
  }).join('\n');

  embed1.addFields({
    name: `🗡️ Artefacts · Meilleures options${anyArtOwned ? ' · ✅ Build dispo !' : ''}`,
    value: artText.slice(0, 1024),
    inline: false,
  });

  const anyFCOwned = hero.fc.some(n => ownedFC.has(n));
  const fcText = hero.fc.map((n, i) => {
    const owned = ownedFC.has(n);
    const reason = hero.fcR[n] || '';
    return `${owned ? '✅' : '⬜'} **${i + 1}.** ${n}\n*${reason}*`;
  }).join('\n');

  embed1.addFields({
    name: `⚡ Ultimate Powers · Meilleures options${anyFCOwned ? ' · ✅ Build dispo !' : ''}`,
    value: fcText.slice(0, 1024),
    inline: false,
  });

  // Bonds
  if (hero.bonds && hero.bonds.length) {
    const bondText = hero.bonds.map(b => {
      const active = b.a.every(a => ownedHeroes.has(a));
      const icon = active ? '✅' : '❌';
      const allies = b.a.map(a => ownedHeroes.has(a) ? `✅${a}` : `❌${a}`).join(', ');
      const label = b.combo ? `⚡ **${b.n}** *(Bond Combo)*` : b.passive ? `${icon} **${b.n}** *(passif)*` : `${icon} **${b.n}**`;
      return `${label}\navec ${allies}\n→ ${b.e}`;
    }).join('\n\n');
    embed1.addFields({ name: '🔗 Bonds', value: bondText.slice(0, 1024), inline: false });
  }

  // ── EMBED 2 : Options selon ta collection ─────────────────
  const embed2 = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔧 Build · ${heroName}`)
    .setDescription(desc)
    .setFooter(footer);
  if (hero.img) embed2.setThumbnail(hero.img);

  const best = getBestFromCollection(hero, ownedArt, ownedFC);

  // Artefacts compatibles depuis la collection
  const artAvailText = best.art.length
    ? best.art.map((a, i) => {
        const star = a.inReco ? ' ⭐' : '';
        const reason = a.inReco ? (hero.artR[a.name] || ART_DESC[a.name] || '') : (ART_DESC[a.name] || '');
        return `✅ **${i + 1}.** ${a.name}${star}${reason ? '\n*' + reason + '*' : ''}`;
      }).join('\n')
    : '*Aucun artefact compatible dans ta collection*';

  embed2.addFields({
    name: `🗡️ Artefacts · Options selon ta collection`,
    value: artAvailText.slice(0, 1024),
    inline: false,
  });

  const fcAvailText = best.fc.length
    ? best.fc.map((f, i) => {
        const star = f.inReco ? ' ⭐' : '';
        const reason = f.inReco ? (hero.fcR[f.name] || FC_DESC[f.name] || '') : (FC_DESC[f.name] || '');
        return `✅ **${i + 1}.** ${f.name}${star}${reason ? '\n*' + reason + '*' : ''}`;
      }).join('\n')
    : '*Aucune carte compatible dans ta collection*';

  embed2.addFields({
    name: `⚡ Ultimate Powers · Options selon ta collection`,
    value: fcAvailText.slice(0, 1024),
    inline: false,
  });

  // Bonds
  if (hero.bonds && hero.bonds.length) {
    const bondText = hero.bonds.map(b => {
      const active = b.a.every(a => ownedHeroes.has(a));
      const icon = active ? '✅' : '❌';
      const allies = b.a.map(a => ownedHeroes.has(a) ? `✅${a}` : `❌${a}`).join(', ');
      const label = b.combo ? `⚡ **${b.n}** *(Bond Combo)*` : b.passive ? `${icon} **${b.n}** *(passif)*` : `${icon} **${b.n}**`;
      return `${label}\navec ${allies}\n→ ${b.e}`;
    }).join('\n\n');
    embed2.addFields({ name: '🔗 Bonds', value: bondText.slice(0, 1024), inline: false });
  }

  return [embed1, embed2];
}

// ── COLLECTION EMBED ───────────────────────────────────────
function buildCollectionEmbed(userId, collection, section) {
  const embed = new EmbedBuilder()
    .setColor(0x378ADD)
    .setTitle('📦 Ta collection')
    .setFooter({ text: 'Saint Seiya Rebirth 2 EX · ✅ = dans ta collection' });

  const heroCount = collection.heroes.length;
  const artCount = collection.artifacts.length;
  const fcCount = collection.fc.length;

  // Section héros
  if (!section || section === 'heroes') {
    const heroText = heroCount
      ? collection.heroes.join(', ').slice(0, 1024)
      : '*Aucun héros enregistré*';
    embed.addFields({ name: `⚔️ Héros · ${heroCount} possédés`, value: heroText, inline: false });
  }

  // Section artefacts
  if (!section || section === 'artifacts') {
    if (artCount === 0) {
      embed.addFields({ name: `🗡️ Artefacts · 0 possédés`, value: '*Aucun artefact enregistré*', inline: false });
    } else {
      // Grouper par tranches de 1024 chars si nécessaire
      const artText = collection.artifacts.join(', ');
      if (artText.length <= 1024) {
        embed.addFields({ name: `🗡️ Artefacts · ${artCount} possédés`, value: artText, inline: false });
      } else {
        // Découper en chunks
        const chunks = [];
        let current = '';
        for (const a of collection.artifacts) {
          if ((current + ', ' + a).length > 1020) {
            chunks.push(current);
            current = a;
          } else {
            current = current ? current + ', ' + a : a;
          }
        }
        if (current) chunks.push(current);
        embed.addFields({ name: `🗡️ Artefacts · ${artCount} possédés`, value: chunks[0], inline: false });
        for (let i = 1; i < Math.min(chunks.length, 3); i++) {
          embed.addFields({ name: '​', value: chunks[i], inline: false });
        }
      }
    }
  }

  // Section Ultimate Powers
  if (!section || section === 'fc') {
    if (fcCount === 0) {
      embed.addFields({ name: `⚡ Ultimate Powers · 0 possédés`, value: '*Aucune carte enregistrée*', inline: false });
    } else {
      const fcText = collection.fc.join(', ');
      if (fcText.length <= 1024) {
        embed.addFields({ name: `⚡ Ultimate Powers · ${fcCount} possédés`, value: fcText, inline: false });
      } else {
        const chunks = [];
        let current = '';
        for (const f of collection.fc) {
          if ((current + ', ' + f).length > 1020) {
            chunks.push(current);
            current = f;
          } else {
            current = current ? current + ', ' + f : f;
          }
        }
        if (current) chunks.push(current);
        embed.addFields({ name: `⚡ Ultimate Powers · ${fcCount} possédés`, value: chunks[0], inline: false });
        for (let i = 1; i < Math.min(chunks.length, 3); i++) {
          embed.addFields({ name: '​', value: chunks[i], inline: false });
        }
      }
    }
  }

  embed.addFields({ name: '​', value: `Utilisateur ${userId}`, inline: false });
  return embed;
}

// ── FACTION EMBED ──────────────────────────────────────────
function buildFactionEmbed(fac, heroes, userHeroes) {
  const color = FAC_COLORS[fac] || 0x95A5A6;
  const owned = new Set(userHeroes);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🏛️ Faction : ${fac}`)
    .setDescription(`${heroes.length} héros complets dans la base`)
    .setFooter({ text: 'Saint Seiya Rebirth 2 EX · ✅ = dans ta collection' });

  const heroText = heroes.map(n => `${owned.has(n) ? '✅' : '⬜'} ${n}`).join('\n');
  embed.addFields({ name: 'Héros', value: heroText.slice(0, 1024) || '*Aucun*', inline: false });

  return embed;
}

// ── BONDS EMBED ────────────────────────────────────────────
function buildBondsEmbed(heroName, hero, userHeroes) {
  const color = FAC_COLORS[hero.fac] || 0x95A5A6;
  const owned = new Set(userHeroes);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔗 Bonds · ${heroName}`)
    .setFooter({ text: 'Saint Seiya Rebirth 2 EX · ✅ actif / ❌ incomplet' });

  const bonds = [...(hero.bonds || []), ...(hero.combos || [])];

  if (!bonds.length) {
    embed.setDescription('Aucun bond enregistré pour ce héros.');
    return embed;
  }

  bonds.forEach(b => {
    const active = b.a.every(a => owned.has(a));
    const icon = active ? '✅ ACTIF' : '❌ Incomplet';
    const allies = b.a.map(a => `${owned.has(a) ? '✅' : '❌'} ${a}`).join('\n');
    embed.addFields({
      name: `${icon} · ${b.n}`,
      value: `${allies}\n→ **${b.e}**`,
      inline: false,
    });
  });

  return embed;
}

// ── LISTE EMBED ────────────────────────────────────────────
function buildListeEmbed(heroes) {
  const embed = new EmbedBuilder()
    .setColor(0x378ADD)
    .setTitle('📋 Héros disponibles dans la base')
    .setDescription(`${heroes.length} héros complets enregistrés`)
    .setFooter({ text: 'Saint Seiya Rebirth 2 EX · Utilise /hero <nom> pour la fiche complète' });

  // Grouper par faction
  const byFac = {};
  heroes.forEach(({ name, data }) => {
    if (!byFac[data.fac]) byFac[data.fac] = [];
    byFac[data.fac].push(name);
  });

  Object.entries(byFac).forEach(([fac, names]) => {
    embed.addFields({ name: `🏛️ ${fac}`, value: names.join(', ').slice(0, 1024), inline: false });
  });

  return embed;
}

module.exports = { buildHeroEmbed, buildBuildEmbed, buildCollectionEmbed, buildFactionEmbed, buildBondsEmbed, buildListeEmbed };
