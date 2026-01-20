# Parchemins

Application desktop pour pasteurs permettant de dialoguer avec leurs sermons via l'IA.

## Fonctionnalites

- **Indexation automatique** : Scanne vos sermons (PDF, DOCX, ODT, Markdown)
- **Recherche intelligente** : Recherche full-text dans tous vos documents
- **Dialogue IA** : Posez des questions sur vos sermons avec Claude
- **Surveillance en temps reel** : Detection automatique des nouveaux fichiers

## Installation (Windows)

### Telechargement

1. Rendez-vous sur la page [Releases](../../releases)
2. Telechargez le fichier `Parchemins-Setup-X.X.X.exe`

### Avertissement Windows SmartScreen

Comme l'application n'est pas signee numeriquement, Windows affichera un avertissement lors du premier lancement.

**Pour contourner l'avertissement :**

1. Cliquez sur **"Informations complementaires"** (ou "More info")
2. Cliquez sur **"Executer quand meme"** (ou "Run anyway")

Cet avertissement n'apparaitra qu'une seule fois.

### Alternative : Version Portable (ZIP)

Si l'installeur pose probleme :

1. Telechargez le fichier ZIP depuis les Releases
2. Decompressez dans un dossier de votre choix
3. Lancez `Parchemins.exe`

## Configuration

### Cle API Anthropic

1. Creez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. Generez une cle API
3. Dans l'application, allez dans **Parametres** et entrez votre cle

### Dossier de sermons

1. Dans l'application, allez dans **Parametres**
2. Selectionnez le dossier contenant vos sermons
3. L'indexation demarre automatiquement

## Formats supportes

- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- OpenDocument (`.odt`)
- Markdown (`.md`)

## Systeme de credits

L'application utilise un systeme de credits pour les requetes IA :

- 1 credit ≈ 1000 tokens Claude
- Les credits sont deduits a chaque conversation
- Rechargez vos credits dans les parametres

## Problemes connus

### L'application ne demarre pas

- Verifiez que vous avez Windows 10 ou 11 (64-bit)
- Essayez de lancer en tant qu'administrateur

### Les documents ne s'indexent pas

- Verifiez que le dossier est accessible
- Verifiez les permissions de lecture sur les fichiers
- Consultez les logs dans `%APPDATA%/parchemins/logs/`

### Erreur de connexion a Claude

- Verifiez votre cle API dans les parametres
- Verifiez votre connexion internet
- Verifiez que vous avez des credits disponibles

## Developpement

```bash
# Installation des dependances
npm install

# Mode developpement
npm run dev

# Build Windows
npm run build:win

# Tests
npm run test

# Verification TypeScript
npm run typecheck
```

## Licence

MIT
