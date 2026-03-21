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
  const profile = getHeroProfile(hero);

  // Artefacts : recommandés officiels en premier, puis compatibles par score
  const scoredArt = [...ownedArt]
    .map(a => ({ name: a, score: scoreArtifact(a, profile, hero.art || []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // FC : recommandées officielles en premier, puis compatibles par score
  const scoredFC = [...ownedFC]
    .map(f => ({ name: f, score: scoreFCCard(f, profile, hero.fc || []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return { art: scoredArt, fc: scoredFC };
}

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
      return `${icon} **${b.n}**\navec ${allies}\n→ ${b.e}`;
    }).join('\n\n');
    embed1.addFields({ name: '🔗 Bonds', value: bondText.slice(0, 1024), inline: false });
  }

  // ── EMBED 2 : Options selon ta collection ─────────────────
  const embed2 = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔧 Build · ${heroName}`)
    .setDescription(desc)
    .setFooter(footer);

  const best = getBestFromCollection(hero, ownedArt, ownedFC);

  // Artefacts compatibles depuis la collection
  const artAvailText = best.art.length
    ? best.art.map((a, i) => {
        // Vérifier si c'est dans les recommandés officiels
        const isReco = hero.art.includes(a.name);
        const reason = isReco ? (hero.artR[a.name] || '') : `Compatibilité: ${a.score > 0 ? 'bonne' : 'générale'}`;
        return `✅ **${i + 1}.** ${a.name}${isReco ? ' ⭐' : ''}\n*${reason}*`;
      }).join('\n')
    : '*Aucun artefact dans ta collection*';

  embed2.addFields({
    name: `🗡️ Artefacts · Options selon ta collection`,
    value: artAvailText.slice(0, 1024),
    inline: false,
  });

  // Cartes FC compatibles depuis la collection
  const fcAvailText = best.fc.length
    ? best.fc.map((f, i) => {
        const isReco = hero.fc.includes(f.name);
        const reason = isReco ? (hero.fcR[f.name] || '') : `Compatibilité: ${f.score > 0 ? 'bonne' : 'générale'}`;
        return `✅ **${i + 1}.** ${f.name}${isReco ? ' ⭐' : ''}\n*${reason}*`;
      }).join('\n')
    : '*Aucune carte dans ta collection*';

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
      return `${icon} **${b.n}**\navec ${allies}\n→ ${b.e}`;
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
