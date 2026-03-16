const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let client = null;
let db = null;

async function connect() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('seiya-bot');
  console.log('✅ MongoDB connecté');
  return db;
}

function col() {
  return db.collection('collections');
}

// ── FONCTIONS PUBLIQUES ───────────────────────────────────

async function addItem(userId, type, name) {
  await connect();
  await col().updateOne(
    { userId },
    { $addToSet: { [type]: name } },
    { upsert: true }
  );
}

async function removeItem(userId, type, name) {
  await connect();
  await col().updateOne(
    { userId },
    { $pull: { [type]: name } }
  );
}

async function hasItem(userId, type, name) {
  await connect();
  const doc = await col().findOne({ userId, [type]: name });
  return !!doc;
}

async function getUserItems(userId, type) {
  await connect();
  const doc = await col().findOne({ userId });
  return doc ? (doc[type] || []) : [];
}

async function getUserCollection(userId) {
  await connect();
  const doc = await col().findOne({ userId }) || {};
  return {
    heroes: doc.hero || [],
    artifacts: doc.art || [],
    fc: doc.fc || [],
  };
}

async function clearUserCollection(userId, type = null) {
  await connect();
  if (type) {
    await col().updateOne({ userId }, { $set: { [type]: [] } });
  } else {
    await col().deleteOne({ userId });
  }
}

function sortByOwned(items, ownedSet) {
  return [...items].sort((a, b) => (ownedSet.has(a) ? 0 : 1) - (ownedSet.has(b) ? 0 : 1));
}

module.exports = { connect, addItem, removeItem, hasItem, getUserItems, getUserCollection, clearUserCollection, sortByOwned };
