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

// ── BUILD EMBED ────────────────────────────────────────────
function buildBuildEmbed(heroName, hero, userCollection) {
  const color = FAC_COLORS[hero.fac] || 0x95A5A6;
  const ownedArt = new Set(userCollection.artifacts);
  const ownedFC = new Set(userCollection.fc);
  const ownedHeroes = new Set(userCollection.heroes);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔧 Build · ${heroName}`)
    .setDescription(`**${hero.cl}** · ${hero.row} · ${hero.fac}`)
    .setFooter({ text: 'Saint Seiya Rebirth 2 EX · ✅ = dans ta collection' });

  // Artifacts
  const sortedArt = sortByOwned(hero.art, ownedArt);
  const anyArtOwned = sortedArt.some(n => ownedArt.has(n));
  const artText = sortedArt.map((n, i) => {
    const owned = ownedArt.has(n);
    const icon = owned ? '✅' : '⬜';
    const reason = hero.artR[n] || '';
    return `${icon} **${i + 1}.** ${n}\n*${reason}*`;
  }).join('\n');

  embed.addFields({
    name: `🗡️ Artifacts${anyArtOwned ? ' · ✅ Build dispo !' : ''}`,
    value: artText.slice(0, 1024),
    inline: false,
  });

  // Ultimate Powers
  const sortedFC = sortByOwned(hero.fc, ownedFC);
  const anyFCOwned = sortedFC.some(n => ownedFC.has(n));
  const fcText = sortedFC.map((n, i) => {
    const owned = ownedFC.has(n);
    const icon = owned ? '✅' : '⬜';
    const reason = hero.fcR[n] || '';
    return `${icon} **${i + 1}.** ${n}\n*${reason}*`;
  }).join('\n');

  embed.addFields({
    name: `⚡ Ultimate Powers${anyFCOwned ? ' · ✅ Build dispo !' : ''}`,
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
    embed.addFields({ name: '🔗 Bonds', value: bondText.slice(0, 1024), inline: false });
  }

  return embed;
}

// ── COLLECTION EMBED ───────────────────────────────────────
function buildCollectionEmbed(userId, collection) {
  const embed = new EmbedBuilder()
    .setColor(0x378ADD)
    .setTitle('📦 Ta collection')
    .setFooter({ text: `Utilisateur ${userId}` });

  embed.addFields(
    { name: '⚔️ Héros', value: collection.heroes.length ? collection.heroes.join(', ').slice(0, 1024) : '*Aucun héros enregistré*', inline: false },
    { name: '🗡️ Artifacts', value: `${collection.artifacts.length}/41 possédés`, inline: true },
    { name: '⚡ Ultimate Powers', value: `${collection.fc.length}/165 possédés`, inline: true },
  );

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
