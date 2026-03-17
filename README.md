# 🏛️ Saint Seiya Rebirth 2 EX — Bot Discord

Bot Discord avec fiches héros, recommandations de build et gestion de collection personnelle.

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `/hero <nom>` | Fiche complète d'un héros (skills, tags, stratégie) |
| `/build <nom>` | Artifacts + Ultimate Powers recommandés, triés selon ta collection |
| `/bonds <nom>` | Bonds d'un héros avec statut actif/incomplet selon ta collection |
| `/faction <nom>` | Liste les héros d'une faction (Sanctuaire / Atlantide / Enfers / Asgard) |
| `/liste` | Tous les héros disponibles dans la base |
| `/collection voir` | Affiche ta collection |
| `/collection ajouter <type> <nom>` | Ajoute un item à ta collection |
| `/collection retirer <type> <nom>` | Retire un item de ta collection |
| `/collection reset` | Réinitialise toute ta collection |

---

## 🚀 Installation

### Étape 1 — Créer le bot Discord

1. Va sur https://discord.com/developers/applications
2. Clique **New Application** → donne un nom (ex: "Seiya Rebirth Bot")
3. Va dans **Bot** → clique **Add Bot**
4. Sous **Token**, clique **Reset Token** → copie le token
5. Sous **Privileged Gateway Intents** → désactive tout (on n'en a pas besoin)
6. Va dans **OAuth2 > URL Generator** :
   - Coche `bot` et `applications.commands`
   - Permissions : `Send Messages`, `Use Slash Commands`, `Embed Links`
   - Copie l'URL générée et ouvre-la pour inviter le bot sur ton serveur

### Étape 2 — Configurer le projet

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

Édite `.env` :
```
DISCORD_TOKEN=ton_token_copié_à_létape_1
CLIENT_ID=ton_application_id  # visible dans "General Information" sur le portail
# GUILD_ID=ton_serveur_id     # optionnel : décommente pour tester sur un seul serveur
```

Pour récupérer le CLIENT_ID : portail développeur → ton application → **General Information** → Application ID.

### Étape 3 — Déployer les commandes

```bash
npm run deploy
```

Tu devrais voir :
```
✅ 6 commandes déployées !
  /hero — Affiche la fiche complète d'un héros
  /build — Recommandations d'artifacts...
  ...
```

### Étape 4 — Lancer le bot en local (test)

```bash
npm start
```

---

## ☁️ Déploiement sur Railway

1. Crée un compte sur https://railway.app
2. Clique **New Project** → **Deploy from GitHub repo**
   - Si tu n'as pas de repo GitHub, clique **Deploy from local** et upload le dossier
3. Dans les **Variables d'environnement** du projet Railway, ajoute :
   - `DISCORD_TOKEN` = ton token
   - `CLIENT_ID` = ton application ID
4. Railway détecte automatiquement `package.json` et lance `npm start`
5. Le bot tourne en continu 🎉

### Persistance des données sur Railway

Railway fournit un volume persistant. La base SQLite `data/collections.db` y sera stockée automatiquement.

---

## 🗂️ Structure du projet

```
seiya-bot/
├── src/
│   ├── index.js          — Point d'entrée du bot
│   ├── commands.js       — Définition des commandes slash
│   ├── embeds.js         — Construction des embeds Discord
│   ├── deploy-commands.js — Script de déploiement des commandes
│   └── data/
│       ├── heroes.js     — Base de données des 29 héros
│       └── db.js         — Gestion des collections (SQLite)
├── data/
│   └── collections.db    — Base SQLite (créée automatiquement)
├── .env                  — Variables d'environnement (ne pas committer !)
├── .env.example          — Template
└── package.json
```

---

## 📝 Ajouter de nouveaux héros

Ouvre `src/data/heroes.js` et ajoute une entrée dans l'objet `DB` en suivant la structure existante.

---

## ❓ Exemples d'utilisation

```
/hero Aiolia
→ Fiche complète d'Aiolia du Lion

/build Kanon
→ Artifacts et UP recommandés pour Kanon, ✅ si tu les possèdes

/bonds Mû
→ Bond "Amis en or" avec Aldébaran — ✅ ACTIF ou ❌ Incomplet

/faction Atlantide
→ Liste tous les héros Atlantide dans la base

/collection ajouter hero Aiolia du Lion
→ Ajoute Aiolia à ta collection

/collection ajouter art Épée sainte
→ Ajoute l'Épée sainte à tes artifacts
```
