const { SlashCommandBuilder } = require('discord.js');

module.exports = [

  new SlashCommandBuilder()
    .setName('hero')
    .setDescription("Affiche la fiche complète d'un héros")
    .addStringOption(opt => opt.setName('nom').setDescription('Nom du héros').setRequired(true).setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('build')
    .setDescription("Recommandations d'artifacts et Ultimate Powers pour un héros")
    .addStringOption(opt => opt.setName('nom').setDescription('Nom du héros').setRequired(true).setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('bonds')
    .setDescription("Affiche les bonds d'un héros selon ta collection")
    .addStringOption(opt => opt.setName('nom').setDescription('Nom du héros').setRequired(true).setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('collection')
    .setDescription('Affiche ou modifie ta collection personnelle')
    .addSubcommand(sub => sub.setName('voir').setDescription('Voir ta collection'))
    .addSubcommand(sub =>
      sub.setName('ajouter').setDescription("Ajouter un item à ta collection")
        .addStringOption(opt => opt.setName('type').setDescription("Type d'item").setRequired(true)
          .addChoices({ name: 'Héros', value: 'hero' }, { name: 'Artifact', value: 'art' }, { name: 'Ultimate Power', value: 'fc' }))
        .addStringOption(opt => opt.setName('nom').setDescription("Nom de l'item").setRequired(true).setAutocomplete(true))
    )
    .addSubcommand(sub =>
      sub.setName('retirer').setDescription("Retirer un item de ta collection")
        .addStringOption(opt => opt.setName('type').setDescription("Type d'item").setRequired(true)
          .addChoices({ name: 'Héros', value: 'hero' }, { name: 'Artifact', value: 'art' }, { name: 'Ultimate Power', value: 'fc' }))
        .addStringOption(opt => opt.setName('nom').setDescription("Nom de l'item").setRequired(true).setAutocomplete(true))
    )
    .addSubcommand(sub => sub.setName('reset').setDescription('Réinitialiser ta collection')),

  new SlashCommandBuilder()
    .setName('faction')
    .setDescription("Liste tous les héros d'une faction")
    .addStringOption(opt => opt.setName('nom').setDescription('Faction').setRequired(true)
      .addChoices({ name: 'Sanctuaire', value: 'Sanctuaire' }, { name: 'Atlantide', value: 'Atlantide' }, { name: 'Enfers', value: 'Enfers' }, { name: 'Asgard', value: 'Asgard' })),

  new SlashCommandBuilder()
    .setName('liste')
    .setDescription('Liste tous les héros disponibles dans la base'),

].map(cmd => cmd.toJSON());
