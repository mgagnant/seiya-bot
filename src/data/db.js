const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjdjqhmprsoaalmjygvx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function supabase(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve([]); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getRow(userId) {
  const rows = await supabase('GET', `/rest/v1/collections?user_id=eq.${userId}&select=*`);
  if (rows && rows.length > 0) return rows[0];
  return { user_id: userId, heroes: [], artifacts: [], fc: [] };
}

async function saveRow(row) {
  await supabase('POST', '/rest/v1/collections', row);
}

async function addItem(userId, type, name) {
  const row = await getRow(userId);
  if (!row[type]) row[type] = [];
  if (!row[type].includes(name)) row[type].push(name);
  await saveRow(row);
}

async function removeItem(userId, type, name) {
  const row = await getRow(userId);
  if (!row[type]) return;
  row[type] = row[type].filter(n => n !== name);
  await saveRow(row);
}

async function hasItem(userId, type, name) {
  const row = await getRow(userId);
  return (row[type] || []).includes(name);
}

async function getUserItems(userId, type) {
  const row = await getRow(userId);
  return row[type] || [];
}

async function getUserCollection(userId) {
  const row = await getRow(userId);
  return { heroes: row.heroes || [], artifacts: row.artifacts || [], fc: row.fc || [] };
}

async function clearUserCollection(userId, type = null) {
  const row = await getRow(userId);
  if (type) row[type] = [];
  else { row.heroes = []; row.artifacts = []; row.fc = []; }
  await saveRow(row);
}

function sortByOwned(items, ownedSet) {
  return [...items].sort((a, b) => (ownedSet.has(a) ? 0 : 1) - (ownedSet.has(b) ? 0 : 1));
}

console.log('📦 Collections stockées sur Supabase');

module.exports = { addItem, removeItem, hasItem, getUserItems, getUserCollection, clearUserCollection, sortByOwned };
