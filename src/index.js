require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getHero, getAllHeroes, getHeroesByFaction, DB } = require('./data/heroes');
const { connect, addItem, removeItem, getUserCollection, clearUserCollection } = require('./data/db');
const { buildHeroEmbed, buildBuildEmbed, buildCollectionEmbed, buildFactionEmbed, buildBondsEmbed, buildListeEmbed } = require('./embeds');

const ALL_HEROES = Object.keys(DB);
const ALL_ARTS = ["Épée d'Hadès","Trident de Poséidon","Sceptre de Niké","Bouclier d'Athéna","Dague d'or","Perles de prière bouddhistes","Urne d'Athéna","Anneau des Nibelungen","La jarre sacrée","Collier du Roi des Enfers","Boîte scellée","Épée de Balmung","Casque de l'Empereur des mers","Lance longue d'Hilda","Anneau du présage","Épée de Damoclès","Corne de Galar","Brigaman","Bouclier rond de la Balance","Épée de la Balance","Lance longue de la Balance","Fouet en cuivre du Caméléon","Bouclier de la Méduse","Bouclier du Dragon","Flèche d'or du Fantôme","Pomme d'or","Collier d'Athéna","Bâton à trois branches de la Balance","Anneau de Pandore","Lyre d'Apollon","Trident d'Éris","Casque d'Athéna","Épée sainte","Casque de Lucifer","Épée de Dolbar","Épée de Siegfried","Bouclier de Siegfried","Diadème d'Éris","Ceinture d'Abel","Trône du Lotus d'Or","Sceau de perles scellées"];
const ALL_FC = ["Horn Sever","Dragon Shield","Crystal Armor","Phantom Labyrinth","Eagle Eyes","Nebula Defense Array","The Warrior Who's Come Back From Hell","Parry Shield","Battling Cosmo","Golden Arrow Shot","Initial Cloth","Telekinesis.Def","Underground Water Vein","Swift as the wind","Dancing Whip","Galloping White Horse","Strong Warrior","Telekinesis","Atomic Smash","Reverse Waterfall","Lotus","A Drop of Sweet Rain","Dragon Roar","Counter Strike","Pegasus Kick","Nebula Chain","First Strike","True Strike","Piercing Chain","Electric serpent dodge","Unicorn power","Power of breakthrough","Sea snake venom","Golden Armor","Swift Syd","Dragon Without Armor","Crimson Flash","Desperate Guardian","Tidal Energy","Air Defense Wall","Quick-tempered Lion","Excalibur's Messenger","Frost Mage","Crystal Wall","Thorny Rose","Phoenix Flame","Wildfire Rampage","Meikyō Shisui","Serpent Strike","Lion Fist","Golden Arrow","Medusa Shield","Fist of Fury","Glacier Force","June's Protection","Flying Axe Strike","Underworld soul","Power of the cosmos","Bare-handed defense","Operate in secrecy","The wolf and the boy","Shift","Invisible wall","Plan before action","Prepared defense","Soaring dragon soul","The girl's prayer","United as one","Blood rose","Sound Localization","Medusa's Petrification","Ripple Defense","Defensive Stance","The Goddess of Hope","Worm's Bind","Worm Bind","Disguise","Excalibur Inheritance","Moving Fortress","Meteor Strike","Ascetic Practice","Acalanatha Vidyaraja","Dragon Claw","Fire Phoenix","Quick as Thunder","Desperate Outburst","Mist Forest","Aurora Energy","Overwhelming Temple","Mighty Excalibur","Athena's Blessing","Odin Cloth","Maiden among flowers","Another Dimension","Shaka of Virgo","Double-headed dragon punch","Strongest secret technique","Golden archer","Evil power","Libra's defense","Hunt","Power of Sekishiki","The Watcher","Hidden killing intent","Frost spirit","Counterstrike","Deadly Flower","Gemini's might","Goddess's redemption","Freya's Prayer","Proud Dragon's Regret","Dragon Soars to the Sky","Wait and Strike","Golden Guardian","Taurus Physique","Dimensional Power","Strong Attack, Weak Defense","Rebirth and Revival","Illusory Dream","Concealed Killing Intent","Defensive Counterattack","Blazing Flames","Dimensional Wanderer","Flying Net","Triangular Power","Turn Defense into Attack","Charged Counterattack","Golden Lance","The Power of Chakra","A Storm of Gunfire","Assistance from Fellow Disciples","Plot Exposed","Siren's Melody","Unbreakable","Extreme Assault","Dance","Infinite Energy Charge","Ultimate Suppression","Swan Dance","Ice Age","Clash of Wills","Gift of the Two-Headed Dragon","Power of Blizzard and Storm","Nebula Storm","River Crossing Fee","Frost Shield","Sekishiki Meikai Ha","Flash-Freeze Energy","Giant Axe Swing","Star Convergence","Absolute Power","Break Loose","Warrior of Beauty","Ethereal Melody","Styx Ferry","Back to Underworld","Power of Stars","Leo's Fang","Crystal Protector","Crystal Power","Titan's Power","Blood Freeze","Defender"];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  console.log(`📚 ${ALL_HEROES.length} héros chargés`);
  console.log(`🔌 Connexion MongoDB en cours...`);
  try {
    await connect();
    console.log(`✅ MongoDB connecté !`);
  } catch (err) {
    console.error(`❌ Erreur MongoDB :`, err.message);
  }
});

// ── AUTOCOMPLETE ───────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused().toLowerCase();
    const cmdName = interaction.commandName;
    const subCmd = interaction.options.getSubcommand(false);
    let choices = [];

    if (['hero', 'build', 'bonds'].includes(cmdName)) {
      choices = ALL_HEROES.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
    }
    if (cmdName === 'collection' && ['ajouter', 'retirer'].includes(subCmd)) {
      const type = interaction.options.getString('type');
      if (type === 'hero') choices = ALL_HEROES.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      else if (type === 'art') choices = ALL_ARTS.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      else if (type === 'fc') choices = ALL_FC.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      else choices = ALL_HEROES.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
    }

    await interaction.respond(choices.map(c => ({ name: c, value: c })));
    return;
  }

  // ── COMMANDES ──────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  await interaction.deferReply();

  try {
    if (commandName === 'hero') {
      const nom = interaction.options.getString('nom');
      const result = getHero(nom);
      if (!result) return interaction.editReply(`❌ Héros introuvable : **${nom}**`);
      return interaction.editReply({ embeds: [buildHeroEmbed(result.name, result.data)] });
    }

    if (commandName === 'build') {
      const nom = interaction.options.getString('nom');
      const result = getHero(nom);
      if (!result) return interaction.editReply(`❌ Héros introuvable : **${nom}**`);
      const collection = await getUserCollection(user.id);
      return interaction.editReply({ embeds: [buildBuildEmbed(result.name, result.data, collection)] });
    }

    if (commandName === 'collection') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'voir') {
        const collection = await getUserCollection(user.id);
        return interaction.editReply({ embeds: [buildCollectionEmbed(user.id, collection)] });
      }
      if (sub === 'ajouter') {
        const type = interaction.options.getString('type');
        const nom = interaction.options.getString('nom');
        await addItem(user.id, type, nom);
        const label = { hero: 'héros', art: 'artifact', fc: 'Ultimate Power' }[type];
        return interaction.editReply(`✅ **${nom}** ajouté à ta collection (${label}).`);
      }
      if (sub === 'retirer') {
        const type = interaction.options.getString('type');
        const nom = interaction.options.getString('nom');
        await removeItem(user.id, type, nom);
        const label = { hero: 'héros', art: 'artifact', fc: 'Ultimate Power' }[type];
        return interaction.editReply(`🗑️ **${nom}** retiré de ta collection (${label}).`);
      }
      if (sub === 'reset') {
        await clearUserCollection(user.id);
        return interaction.editReply(`🗑️ Ta collection a été réinitialisée.`);
      }
    }

    if (commandName === 'faction') {
      const fac = interaction.options.getString('nom');
      const heroes = getHeroesByFaction(fac);
      const collection = await getUserCollection(user.id);
      return interaction.editReply({ embeds: [buildFactionEmbed(fac, heroes, collection.heroes)] });
    }

    if (commandName === 'liste') {
      const heroes = getAllHeroes().map(n => ({ name: n, data: DB[n] }));
      return interaction.editReply({ embeds: [buildListeEmbed(heroes)] });
    }

    if (commandName === 'bonds') {
      const nom = interaction.options.getString('nom');
      const result = getHero(nom);
      if (!result) return interaction.editReply(`❌ Héros introuvable : **${nom}**`);
      const collection = await getUserCollection(user.id);
      return interaction.editReply({ embeds: [buildBondsEmbed(result.name, result.data, collection.heroes)] });
    }

  } catch (err) {
    console.error(`Erreur commande ${commandName}:`, err);
    return interaction.editReply(`❌ Une erreur s'est produite. Réessaie.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
