require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getHero, getAllHeroes, getHeroesByFaction, DB } = require('./data/heroes');
const { addItem, removeItem, getUserCollection, clearUserCollection } = require('./data/db');
const { buildHeroEmbed, buildBuildEmbed, buildCollectionEmbed, buildFactionEmbed, buildBondsEmbed, buildListeEmbed } = require('./embeds');

// Listes pour l'autocomplete
const ALL_HEROES = Object.keys(DB);
const ALL_ARTS = ["Épée d'Hadès","Trident de Poséidon","Sceptre de Niké","Bouclier d'Athéna","Dague d'or","Perles de prière bouddhistes","Urne d'Athéna","Anneau des Nibelungen","La jarre sacrée","Collier du Roi des Enfers","Boîte scellée","Épée de Balmung","Casque de l'Empereur des mers","Lance longue d'Hilda","Anneau du présage","Épée de Damoclès","Corne de Galar","Brigaman","Bouclier rond de la Balance","Épée de la Balance","Lance longue de la Balance","Fouet en cuivre du Caméléon","Bouclier de la Méduse","Bouclier du Dragon","Flèche d'or du Fantôme","Pomme d'or","Collier d'Athéna","Bâton à trois branches de la Balance","Anneau de Pandore","Lyre d'Apollon","Trident d'Éris","Casque d'Athéna","Épée sainte","Casque de Lucifer","Épée de Dolbar","Épée de Siegfried","Bouclier de Siegfried","Diadème d'Éris","Ceinture d'Abel","Trône du Lotus d'Or","Sceau de perles scellées"];
const ALL_FC = ["Corne de rupture","Bouclier du Cosmos du Dragon","Armure de Cristal","Labyrinthe fantôme","Yeux d'aigle","Défense rotative","Le guerrier revenu des Enfers","Bouclier de parade","Cosmos en lutte","Tir de flèche d'or","Armure initiale","Défense télékinésique","Veine d'eau souterraine","Rapide comme le vent","Fouet dansant","Cheval blanc au galop","Puissant guerrier","Télékinésie","Smash atomique","Cascade inversée","Lotus","Une goutte de pluie douce","Rugissement du dragon","Contre-attaque","Coup de pied de Pégase","Chaîne de nébuleuse","Première frappe","Frappe précise","Chaîne perforante","Esquive du serpent électrique","Pouvoir de la Licorne","Force de rupture","Venin de serpent de mer","Armure d'Or","Syd agile","Dragon sans armure","Lueur cramoisie","Gardien désespéré","Énergie des marées","Mur de défense aérienne","Lion colérique","Messager d'Excalibur","Mage de givre","Mur de cristal","Rose épineuse","Flamme du Phénix","Déchaînement des flammes","Meikyō Shisui","Frappe du Serpent","Poing de la fureur du lion","Flèche d'or","Bouclier de la Méduse","Poing de la fureur","Force des glaciers","Protection de June","Frappe de la hache volante","Âme des Enfers","Puissance du Cosmos","Défense à mains nues","Opération secrète","Le loup et le garçon","Transfert","Mur invisible","Préparation de plan","Défense préparée","Âme du dragon ascendant","La prière de la jeune fille","Unis comme les doigts de la main","Rose sanguine","Acuité sonore","Pétrification de Méduse","Défense anti-ondes","Position défensive","La Déesse de l'espoir","Étreinte du ver","Étreinte du ver immobilisante","Déguisement","Héritage d'Excalibur","Forteresse mobile","Frappe de la comète","Pratique ascétique","Acalanatha Vidyaraja","Griffe du Dragon","Phénix de feu","Rapide comme l'éclair","Éclat désespéré","Forêt brumeuse","Énergie aurorale","Temple écrasant","Puissante Excalibur","Bénédiction d'Athéna","Armure d'Odin","Jeune fille au milieu des fleurs","Interdimensionnel","Shaka de la Vierge","Coup de poing du dragon à deux têtes","Technique secrète la plus puissante","Archer d'or","Pouvoir maléfique","Défense de la Balance","Chasse","Puissance de Sekishiki","Le guetteur","Intention meurtrière","Esprit du givre","Frappe contre","Fleur mortelle","Majesté des Gémeaux","Rédemption de la Déesse","Prière de Freya","Frappe du dragon repenti","Envol de dragon","Guetter avant de frapper","Gardien d'or","Constitution du Taureau","Puissance dimensionnelle","Attaque puissante, défense faible","Renaissance et renouveau","Rêve illusoire","Volonté meurtrière","Contre-attaque défensive","Flammes ardentes","Voyageur dimensionnel","Papillon épris de lumière","Puissance triangulaire","Passer de la défense à l'attaque","Contre-attaque chargée","Lance d'or","Le pouvoir du Chakra","Tempête de coups","Aide précieuse des disciples","Intrigue dévoilée","Mélodie de la Sirène","Incassable","Assaut extrême","Danse","Charge d'énergie infinie","Suppression ultime","Danse du Cygne","Âge glaciaire","Affrontement des volontés","Cadeau du dragon à deux têtes","Puissance du blizzard et de la tempête","Tempête nébuleuse","Frais de traversée","Bouclier de givre","Sekishiki Meikaiha","Énergie du gel immédiat","Déchirure de hache géante","Convergence des étoiles","Puissance absolue","Se libérer","Guerrier de la beauté","Mélodie éthérée","Barge du Styx","Retour aux Enfers","Puissance des étoiles","Crocs du Lion","Protecteur du cristal","Puissance du cristal","Puissance du Titan","Gel sanguin","Défenseur"];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  console.log(`📚 ${ALL_HEROES.length} héros chargés`);
});

// ── AUTOCOMPLETE ───────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused().toLowerCase();
    const cmdName = interaction.commandName;
    const subCmd = interaction.options.getSubcommand(false);

    let choices = [];

    // Pour /hero, /build, /bonds → autocomplete sur les héros
    if (['hero', 'build', 'bonds'].includes(cmdName)) {
      choices = ALL_HEROES.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
    }

    // Pour /collection ajouter/retirer → autocomplete selon le type choisi
    if (cmdName === 'collection' && ['ajouter', 'retirer'].includes(subCmd)) {
      const type = interaction.options.getString('type');
      if (type === 'hero') {
        choices = ALL_HEROES.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      } else if (type === 'art') {
        choices = ALL_ARTS.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      } else if (type === 'fc') {
        choices = ALL_FC.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      } else {
        // Type pas encore sélectionné → proposer les héros par défaut
        choices = ALL_HEROES.filter(n => n.toLowerCase().includes(focused)).slice(0, 25);
      }
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
      if (!result) return interaction.editReply(`❌ Héros introuvable : **${nom}**\nUtilise \`/liste\` pour voir les héros disponibles.`);
      return interaction.editReply({ embeds: [buildHeroEmbed(result.name, result.data)] });
    }

    if (commandName === 'build') {
      const nom = interaction.options.getString('nom');
      const result = getHero(nom);
      if (!result) return interaction.editReply(`❌ Héros introuvable : **${nom}**`);
      const collection = getUserCollection(user.id);
      return interaction.editReply({ embeds: [buildBuildEmbed(result.name, result.data, collection)] });
    }

    if (commandName === 'collection') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'voir') {
        const collection = getUserCollection(user.id);
        return interaction.editReply({ embeds: [buildCollectionEmbed(user.id, collection)] });
      }
      if (sub === 'ajouter') {
        const type = interaction.options.getString('type');
        const nom = interaction.options.getString('nom');
        addItem(user.id, type, nom);
        const label = { hero: 'héros', art: 'artifact', fc: 'Ultimate Power' }[type];
        return interaction.editReply(`✅ **${nom}** ajouté à ta collection (${label}).`);
      }
      if (sub === 'retirer') {
        const type = interaction.options.getString('type');
        const nom = interaction.options.getString('nom');
        removeItem(user.id, type, nom);
        const label = { hero: 'héros', art: 'artifact', fc: 'Ultimate Power' }[type];
        return interaction.editReply(`🗑️ **${nom}** retiré de ta collection (${label}).`);
      }
      if (sub === 'reset') {
        clearUserCollection(user.id);
        return interaction.editReply(`🗑️ Ta collection a été réinitialisée.`);
      }
    }

    if (commandName === 'faction') {
      const fac = interaction.options.getString('nom');
      const heroes = getHeroesByFaction(fac);
      const collection = getUserCollection(user.id);
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
      const collection = getUserCollection(user.id);
      return interaction.editReply({ embeds: [buildBondsEmbed(result.name, result.data, collection.heroes)] });
    }

  } catch (err) {
    console.error(`Erreur commande ${commandName}:`, err);
    return interaction.editReply(`❌ Une erreur s'est produite. Réessaie.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
