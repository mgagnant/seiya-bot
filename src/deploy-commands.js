require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Déploiement des commandes slash...');

    // Si GUILD_ID défini → déploiement instantané sur un serveur (test)
    // Sinon → déploiement global (peut prendre 1h)
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    const data = await rest.put(route, { body: commands });
    console.log(`✅ ${data.length} commandes déployées !`);
    console.log(data.map(c => `  /${c.name} — ${c.description}`).join('\n'));

  } catch (err) {
    console.error('❌ Erreur déploiement:', err);
  }
})();
