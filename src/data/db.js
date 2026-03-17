const fs = require('fs');
const path = require('path');

// /app/data est le volume persistant Railway
// En local, utilise le dossier data/ du projet
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH)
  : path.join(__dirname, '../../../data');

const dbPath = path.join(dataDir, 'collections.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function load() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) { console.error('Erreur lecture collections.json:', e); }
  return {};
}

function save(data) {
  try { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8'); }
  catch (e) { console.error('Erreur écriture collections.json:', e); }
}

function getUser(data, userId) {
  if (!data[userId]) data[userId] = { hero: [], art: [], fc: [] };
  return data[userId];
}

function addItem(userId, type, name) {
  const data = load();
  const user = getUser(data, userId);
  if (!user[type].includes(name)) user[type].push(name);
  save(data);
}

function removeItem(userId, type, name) {
  const data = load();
  const user = getUser(data, userId);
  user[type] = user[type].filter(n => n !== name);
  save(data);
}

function hasItem(userId, type, name) {
  return getUser(load(), userId)[type].includes(name);
}

function getUserItems(userId, type) {
  return getUser(load(), userId)[type] || [];
}

function getUserCollection(userId) {
  const user = getUser(load(), userId);
  return { heroes: user.hero || [], artifacts: user.art || [], fc: user.fc || [] };
}

function clearUserCollection(userId, type = null) {
  const data = load();
  if (!data[userId]) return;
  if (type) data[userId][type] = [];
  else data[userId] = { hero: [], art: [], fc: [] };
  save(data);
}

function sortByOwned(items, ownedSet) {
  return [...items].sort((a, b) => (ownedSet.has(a) ? 0 : 1) - (ownedSet.has(b) ? 0 : 1));
}

console.log(`📁 Collections stockées dans : ${dbPath}`);

module.exports = { addItem, removeItem, hasItem, getUserItems, getUserCollection, clearUserCollection, sortByOwned };
