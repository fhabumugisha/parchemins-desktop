# Product Requirements Document
## Assistant Pastoral v1.0

**Dialoguez avec vos sermons**

---

| Information | Valeur |
|-------------|--------|
| Version | 1.0 |
| Date | 17 janvier 2025 |
| Statut | Draft |
| Délai cible | 2 mois |

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Contexte et problème](#2-contexte-et-problème)
3. [Vision et objectifs](#3-vision-et-objectifs)
4. [Utilisateurs cibles](#4-utilisateurs-cibles)
5. [Périmètre du MVP](#5-périmètre-du-mvp)
6. [Exigences fonctionnelles](#6-exigences-fonctionnelles)
7. [Exigences non fonctionnelles](#7-exigences-non-fonctionnelles)
8. [Architecture technique](#8-architecture-technique)
9. [Interface utilisateur](#9-interface-utilisateur)
10. [Modèle économique](#10-modèle-économique)
11. [Métriques de succès](#11-métriques-de-succès)
12. [Planning et jalons](#12-planning-et-jalons)
13. [Risques et mitigations](#13-risques-et-mitigations)
14. [Hors périmètre (v2+)](#14-hors-périmètre-v2)
15. [Annexes](#15-annexes)

---

## 1. Résumé exécutif

### En une phrase

> **Assistant Pastoral** est une application desktop permettant aux pasteurs de rechercher, analyser et exploiter leurs archives de sermons grâce à l'intelligence artificielle.

### Le problème

Les pasteurs accumulent des centaines de sermons au fil des années, stockés dans différents formats (Word, PDF, Markdown). Retrouver un ancien texte, éviter les répétitions, ou s'inspirer de ses propres réflexions passées devient fastidieux.

### La solution

Une application simple qui indexe automatiquement tous les sermons d'un dossier et permet d'interagir avec ce corpus en langage naturel grâce à l'IA.

### Différenciation

Contrairement aux outils génériques (ChatGPT, recherche Windows), Assistant Pastoral est conçu spécifiquement pour le contexte pastoral : compréhension des références bibliques, du vocabulaire théologique, et des besoins spécifiques de la prédication.

### Chiffres clés du MVP

| Métrique | Cible |
|----------|-------|
| Délai de développement | 2 mois |
| Budget estimé | Temps personnel + API (~50€/mois) |
| Utilisateurs beta | 20 pasteurs |
| Formats supportés | 4 (PDF, DOCX, MD, ODT) |
| Taille corpus cible | 500+ sermons |

---

## 2. Contexte et problème

### 2.1 Situation actuelle

Un pasteur typique produit 40 à 50 sermons par an. Après 10 ans de ministère, cela représente 400 à 500 textes, souvent stockés de manière disparate :

- Fichiers Word dans différents dossiers
- PDF de présentations
- Notes manuscrites numérisées
- Fichiers Markdown pour les plus technophiles

Ces archives constituent une **richesse intellectuelle et spirituelle inexploitée**.

### 2.2 Problèmes identifiés

#### Problème 1 : Recherche inefficace

La recherche Windows/Mac est limitée aux mots-clés exacts. Impossible de chercher « mes sermons sur le pardon » ou « quand ai-je parlé de la parabole du fils prodigue ? ».

#### Problème 2 : Répétitions involontaires

Sans vision globale de ses archives, le pasteur risque de reprendre les mêmes illustrations, les mêmes structures, sans s'en rendre compte.

#### Problème 3 : Richesse dormante

Des années de réflexion théologique restent inaccessibles. Impossible de créer facilement un recueil thématique ou de transformer ses sermons en livre.

#### Problème 4 : Temps de préparation

Chaque nouveau sermon repart de zéro, alors que le pasteur a peut-être déjà traité un thème connexe.

### 2.3 Solutions existantes et limites

| Solution | Limite |
|----------|--------|
| Recherche système (Windows/Mac) | Mots-clés exacts uniquement, pas de compréhension sémantique |
| ChatGPT / Claude web | Pas d'accès aux fichiers locaux, nécessite copier-coller manuel |
| Logiciels bibliques (Logos, etc.) | Orientés étude, pas gestion de sermons personnels |
| Notion / Obsidian | Nécessite migration et organisation manuelle, courbe d'apprentissage |

---

## 3. Vision et objectifs

### 3.1 Vision produit

> **Vision à 3 ans** : Devenir l'outil de référence pour les pasteurs francophones souhaitant valoriser et exploiter leurs archives de prédication, avec une communauté active de plusieurs milliers d'utilisateurs.

### 3.2 Objectifs du MVP

| Objectif | Mesure de succès | Priorité |
|----------|------------------|----------|
| Valider le besoin | 20 pasteurs utilisent l'app régulièrement pendant 1 mois | P0 |
| Prouver la valeur de l'IA | 80% trouvent la recherche IA plus efficace que leur méthode actuelle | P0 |
| Atteindre la stabilité technique | < 1 crash par semaine par utilisateur | P0 |
| Valider le modèle économique | 5 utilisateurs prêts à payer | P1 |
| Recueillir des retours | 50+ suggestions d'amélioration collectées | P1 |

### 3.3 Principes directeurs

- **Simplicité absolue** : Un pasteur non-technique doit pouvoir utiliser l'app en 5 minutes
- **Confidentialité** : Les sermons restent sur l'ordinateur, jamais uploadés
- **Valeur immédiate** : Dès le premier usage, l'utilisateur doit avoir un « wow »
- **Sobriété** : Pas de fonctionnalités superflues, chaque élément a une raison d'être

---

## 4. Utilisateurs cibles

### 4.1 Persona principal

#### 👤 Pasteur Paul — 45 ans

**Contexte** : Pasteur depuis 15 ans dans une église protestante évangélique de taille moyenne (80-120 membres). Prêche chaque dimanche et anime des études bibliques.

**Rapport au numérique** : À l'aise avec Word, utilise une Bible en ligne, stocke ses fichiers sur OneDrive. Pas développeur, mais pas technophobe.

**Frustrations** :
- « Je sais que j'ai déjà prêché sur ce texte, mais impossible de retrouver mon sermon »
- « J'aimerais faire un recueil de mes méditations de Carême, mais c'est trop de travail »
- « Je me répète parfois sans m'en rendre compte »

**Attentes** :
- Un outil simple, qui marche sans configuration complexe
- Pouvoir poser des questions en français naturel
- Garder le contrôle sur ses données

### 4.2 Critères de ciblage MVP

- Pasteurs **protestants francophones** (France, Suisse, Belgique, Québec, Afrique)
- **10+ ans d'archives** de sermons (corpus suffisant pour que l'outil soit utile)
- Utilisant déjà **Word ou équivalent** pour rédiger
- Ayant un **PC Windows ou Mac** relativement récent

### 4.3 Hors cible MVP

- Pasteurs utilisant uniquement le papier (pas de fichiers à indexer)
- Grandes équipes pastorales avec besoins collaboratifs
- Utilisateurs non francophones

---

## 5. Périmètre du MVP

### 5.1 Inclus dans le MVP

| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| Import de dossier | Sélection d'un dossier local contenant les sermons | P0 |
| Indexation automatique | Extraction et indexation du texte de tous les fichiers | P0 |
| Formats supportés | PDF, DOCX, MD, ODT | P0 |
| Recherche IA | Questions en langage naturel sur le corpus | P0 |
| Affichage des résultats | Liste des documents pertinents avec extraits | P0 |
| Consultation de document | Affichage du contenu complet d'un sermon | P0 |
| Résumé automatique | Génération d'un résumé d'un sermon sélectionné | P1 |
| Historique des conversations | Mémorisation des échanges avec l'IA | P1 |
| Synchronisation auto | Détection des nouveaux fichiers ajoutés | P2 |

### 5.2 Exclu du MVP (voir section 14)

- Calendrier liturgique et lectionnaire
- Génération de sermons complets
- Export PDF / création de recueils
- Mode collaboratif / multi-utilisateurs
- Application mobile
- Intégration cloud (Google Drive, OneDrive)

---

## 6. Exigences fonctionnelles

### 6.1 Onboarding (premier lancement)

#### User Story

> En tant que pasteur, je veux pouvoir configurer l'application en moins de 5 minutes pour commencer à l'utiliser immédiatement.

#### Critères d'acceptation

- [ ] Au premier lancement, un écran de bienvenue explique le fonctionnement
- [ ] L'utilisateur peut sélectionner son dossier de sermons via un bouton
- [ ] L'indexation démarre automatiquement avec une barre de progression
- [ ] Un message confirme le nombre de documents indexés
- [ ] L'interface principale s'affiche dès l'indexation terminée

#### Règles métier

- Si le dossier est vide ou ne contient aucun fichier compatible → message d'erreur explicite
- Si un fichier est corrompu → il est ignoré avec notification
- Le chemin du dossier est mémorisé pour les lancements suivants

---

### 6.2 Indexation des documents

#### User Story

> En tant que pasteur, je veux que tous mes sermons soient automatiquement analysés pour pouvoir les rechercher ensuite.

#### Critères d'acceptation

- [ ] Les formats PDF, DOCX, MD et ODT sont supportés
- [ ] Le texte est extrait correctement, y compris les caractères accentués
- [ ] Les métadonnées sont extraites si disponibles (titre, date)
- [ ] L'indexation de 500 documents prend moins de 3 minutes
- [ ] Un indicateur de progression est affiché pendant l'indexation

#### Règles métier

- **Extraction du titre** : première ligne de niveau 1 (#) ou nom du fichier
- **Extraction de la date** : pattern `**Date** :` ou YYYY-MM-DD dans le nom de fichier
- Les fichiers > 50 Mo sont ignorés avec avertissement
- Les sous-dossiers sont inclus récursivement

---

### 6.3 Recherche par IA

#### User Story

> En tant que pasteur, je veux poser des questions en français naturel sur mes sermons pour trouver rapidement ce que je cherche.

#### Critères d'acceptation

- [ ] Je peux taper une question dans un champ de texte
- [ ] La réponse s'affiche en moins de 10 secondes
- [ ] Les documents sources sont cités avec possibilité de cliquer pour voir le contenu
- [ ] Je peux poser des questions de suivi dans la même conversation

#### Exemples de requêtes supportées

- « Trouve mes sermons sur la grâce »
- « Quand ai-je prêché sur Romains 8 ? »
- « Quels thèmes ai-je abordés pour Pâques ? »
- « Résume mon sermon sur le fils prodigue »
- « Ai-je déjà utilisé l'illustration du potier ? »

#### Règles métier

- Chaque requête consomme des crédits IA (à afficher)
- Si crédits insuffisants → proposition d'achat
- Les 5 documents les plus pertinents sont envoyés comme contexte à l'IA
- Limite de 4000 tokens de contexte par requête

---

### 6.4 Consultation des documents

#### User Story

> En tant que pasteur, je veux pouvoir lire le contenu complet d'un sermon depuis l'application.

#### Critères d'acceptation

- [ ] Clic sur un résultat → affichage du contenu complet
- [ ] Le texte est lisible avec mise en forme basique (titres, paragraphes)
- [ ] Possibilité de revenir à la liste des résultats
- [ ] Bouton pour ouvrir le fichier original dans l'application par défaut

---

### 6.5 Gestion des crédits

#### User Story

> En tant que pasteur, je veux savoir combien de requêtes IA il me reste et pouvoir en acheter facilement.

#### Critères d'acceptation

- [ ] Le solde de crédits est affiché en permanence
- [ ] Une alerte s'affiche quand il reste < 10 crédits
- [ ] Un bouton permet d'accéder à la page d'achat
- [ ] Après achat, les crédits sont ajoutés automatiquement

---

## 7. Exigences non fonctionnelles

### 7.1 Performance

| Métrique | Exigence |
|----------|----------|
| Temps de lancement | < 3 secondes |
| Indexation 500 documents | < 3 minutes |
| Recherche locale | < 100 ms |
| Réponse IA | < 15 secondes |
| Mémoire RAM utilisée | < 500 Mo |

### 7.2 Compatibilité

| Plateforme | Version minimale |
|------------|------------------|
| Windows | Windows 10 version 1803+ |
| macOS | macOS 11 Big Sur+ |
| Linux | Ubuntu 20.04+ / Debian 11+ |

### 7.3 Sécurité et confidentialité

- Les fichiers de sermons ne quittent **jamais** l'ordinateur
- Seul le texte des requêtes et le contexte nécessaire transitent vers l'API Claude
- Communications chiffrées en **HTTPS/TLS 1.3**
- La clé API est stockée de manière chiffrée localement
- Aucune télémétrie ni tracking sans consentement explicite

### 7.4 Accessibilité

- Interface en français
- Taille de police ajustable (3 niveaux minimum)
- Contraste suffisant pour lisibilité (WCAG AA)
- Navigation possible au clavier

### 7.5 Fiabilité

- L'application doit fonctionner hors-ligne pour la recherche locale
- Moins d'1 crash par semaine en utilisation normale
- Les données indexées sont persistées (pas de ré-indexation à chaque lancement)

---

## 8. Architecture technique

### 8.1 Stack technologique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework desktop | Electron 28+ | Cross-platform, écosystème riche |
| Interface | React 18 + TypeScript | Productivité, maintenabilité |
| Style | Tailwind CSS | Rapidité de développement |
| Base de données | SQLite + FTS5 | Embarquée, recherche full-text |
| Extraction PDF | pdf-parse | Fiabilité, simplicité |
| Extraction DOCX | mammoth.js | Formats Office bien supportés |
| IA | API Claude (Anthropic) | Qualité, pas de rétention données |

### 8.2 Structure de la base de données

#### Table : documents

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Identifiant unique |
| path | TEXT | Chemin absolu du fichier |
| title | TEXT | Titre extrait ou nom de fichier |
| content | TEXT | Contenu textuel complet |
| date | TEXT | Date du sermon si détectée |
| bible_ref | TEXT | Référence biblique si détectée |
| hash | TEXT | Hash MD5 pour détecter les modifications |
| word_count | INTEGER | Nombre de mots |
| indexed_at | DATETIME | Date d'indexation |

#### Table : conversations

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Identifiant unique |
| title | TEXT | Titre auto-généré |
| created_at | DATETIME | Date de création |
| updated_at | DATETIME | Dernière mise à jour |

#### Table : messages

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PK | Identifiant unique |
| conversation_id | INTEGER FK | Référence conversation |
| role | TEXT | user ou assistant |
| content | TEXT | Contenu du message |
| tokens_used | INTEGER | Tokens consommés |
| created_at | DATETIME | Date du message |

### 8.3 Flux de données

1. **Indexation** : Fichier → Extraction texte → Parsing métadonnées → SQLite + FTS5
2. **Recherche locale** : Query → FTS5 MATCH → Résultats triés par score
3. **Requête IA** : Question → Recherche locale (top 5) → Construction prompt → API Claude → Réponse

### 8.4 Sécurité de la clé API

- Clé stockée dans le keychain système (Keychain macOS, Credential Manager Windows)
- Jamais en clair dans un fichier de configuration
- Option : l'utilisateur fournit sa propre clé API Anthropic

---

## 9. Interface utilisateur

### 9.1 Principes de design

- **Chaleur** : Tons crème, bordeaux, or — évoquant un bureau de pasteur
- **Clarté** : Typographie soignée, lisible, inspirée de l'édition
- **Sobriété** : Pas de distractions, focus sur le contenu
- **Familiarité** : Ressemble à une application de chat moderne

### 9.2 Palette de couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Bordeaux | #722F37 | Titres, accents, boutons primaires |
| Or | #B8860B | Highlights, liens |
| Crème | #FAF7F2 | Fond principal |
| Blanc cassé | #FFFEF9 | Cartes, panneaux |
| Gris chaud | #6B5B4F | Texte secondaire |

### 9.3 Écrans principaux

#### Écran 1 : Accueil / Configuration

- Logo et nom de l'application
- Bouton « Sélectionner mon dossier de sermons »
- Barre de progression pendant l'indexation
- Message de confirmation avec statistiques

#### Écran 2 : Interface principale

- **Panneau gauche** : Liste des documents indexés (scrollable)
- **Panneau central** : Zone de chat (question/réponse)
- **Barre supérieure** : Logo, indicateur de crédits, paramètres
- **Barre inférieure** : Champ de saisie + bouton envoyer

#### Écran 3 : Lecture de document

- Contenu du sermon en pleine page
- Bouton retour
- Bouton « Ouvrir dans l'application par défaut »

#### Écran 4 : Paramètres

- Chemin du dossier (modifiable)
- Gestion de la clé API
- Gestion des crédits
- Taille de police
- À propos / version

---

## 10. Modèle économique

### 10.1 Stratégie tarifaire

> **Modèle retenu** : Licence unique + crédits IA à la consommation

#### Justification

- Les pasteurs ont souvent des budgets limités → éviter l'abonnement
- Transparence sur les coûts → confiance
- L'app reste utile même sans crédits (recherche locale)

### 10.2 Grille tarifaire

| Produit | Prix | Contenu |
|---------|------|---------|
| Licence application | 49 € (unique) | Application complète + mises à jour 1 an |
| Pack Découverte | 5 € | 100 crédits IA (~100 questions) |
| Pack Standard | 15 € | 400 crédits IA |
| Pack Annuel | 99 € | 2000 crédits + licence renouvelée |

### 10.3 Coûts estimés

| Poste | Coût mensuel | Notes |
|-------|--------------|-------|
| API Claude | ~0.003€ / requête | Variable selon usage |
| Infrastructure | ~0€ | Tout est local, pas de serveur |
| Certificat signature code | ~10€/mois | Pour éviter alertes Windows/Mac |
| Site web + paiement | ~30€/mois | Stripe + hébergement |

### 10.4 Projection financière (année 1)

| Scénario | Licences | Crédits | Revenu | Coûts | Marge |
|----------|----------|---------|--------|-------|-------|
| Pessimiste | 50 | 100 packs | 3 450 € | 500 € | 2 950 € |
| Réaliste | 150 | 300 packs | 10 350 € | 1 000 € | 9 350 € |
| Optimiste | 400 | 800 packs | 27 600 € | 2 000 € | 25 600 € |

*Note : Ces projections n'incluent pas le temps de développement personnel.*

---

## 11. Métriques de succès

### 11.1 KPIs du MVP

| Métrique | Cible MVP | Méthode de mesure |
|----------|-----------|-------------------|
| Installations | 50 | Compteur téléchargements |
| Utilisateurs actifs (MAU) | 20 | Télémétrie anonyme opt-in |
| Taux de rétention J7 | > 50% | Utilisateurs revenant après 7 jours |
| NPS (satisfaction) | > 40 | Enquête intégrée |
| Requêtes IA / utilisateur / mois | > 20 | Logs anonymisés |
| Taux de conversion payant | > 10% | Achats / installations |

### 11.2 Critère de validation du MVP

> **Go / No-Go** : Le MVP est validé si **20 pasteurs** utilisent l'application régulièrement (≥ 1x/semaine) pendant **1 mois** ET expriment leur satisfaction (NPS > 30).

### 11.3 Collecte des retours

- **Formulaire intégré** : accessible depuis les paramètres
- **Entretiens** : 5 appels de 30min avec utilisateurs beta
- **Analytics** : événements anonymes (opt-in) sur les fonctionnalités utilisées

---

## 12. Planning et jalons

### 12.1 Vue d'ensemble (8 semaines)

| Semaine | Phase | Livrables |
|---------|-------|-----------|
| S1-S2 | Foundation | Setup projet, architecture, extraction texte |
| S3-S4 | Core | Indexation, recherche locale, base de données |
| S5-S6 | IA | Intégration Claude, interface chat |
| S7 | Polish | UX, gestion erreurs, paramètres |
| S8 | Beta | Tests, corrections, documentation |

### 12.2 Détail par semaine

#### Semaines 1-2 : Foundation

- [ ] Initialisation projet Tauri + React
- [ ] Mise en place CI/CD basique
- [ ] Développement extracteurs (PDF, DOCX, MD, ODT)
- [ ] Tests unitaires extraction
- **Livrable** : CLI capable d'extraire le texte de tous les formats

#### Semaines 3-4 : Core

- [ ] Création schéma SQLite + FTS5
- [ ] Développement indexeur
- [ ] Interface de sélection de dossier
- [ ] Affichage liste des documents
- [ ] Recherche full-text basique
- **Livrable** : Application fonctionnelle en recherche locale

#### Semaines 5-6 : IA

- [ ] Intégration API Claude
- [ ] Construction du prompt avec contexte
- [ ] Interface de chat
- [ ] Gestion des crédits (compteur local)
- **Livrable** : Recherche IA fonctionnelle

#### Semaine 7 : Polish

- [ ] Gestion des erreurs et cas limites
- [ ] Écran de paramètres
- [ ] Ajustement taille de police
- [ ] Amélioration UX (loading states, animations)
- **Livrable** : Application prête pour beta

#### Semaine 8 : Beta

- [ ] Distribution à 10-20 testeurs
- [ ] Collecte et priorisation des bugs
- [ ] Corrections critiques
- [ ] Documentation utilisateur
- **Livrable** : Version 1.0 stable

---

## 13. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Extraction PDF défaillante (scans, formats complexes) | Moyenne | Élevé | Fallback OCR optionnel, message clair à l'utilisateur |
| Coûts API Claude supérieurs aux prévisions | Faible | Moyen | Cache intelligent, limite de tokens, ajustement tarifs |
| Adoption lente (besoin non validé) | Moyenne | Élevé | Beta gratuite, partenariats unions d'Églises, itération rapide |
| Complexité technique Electron | Faible | Moyen | Documentation solide, communauté active |
| Concurrence (Notion AI, etc.) | Moyenne | Moyen | Focus sur niche pastorale, expérience dédiée |
| Bugs bloquants en production | Moyenne | Élevé | Tests automatisés, beta étendue, hotfix rapide |

---

## 14. Hors périmètre (v2+)

### 14.1 Version 2.0 (T+3 mois)

- **Calendrier liturgique** : Suggestions basées sur le temps de l'année
- **Lectionnaire intégré** : Textes du jour avec sermons correspondants
- **Recherche sémantique** : Embeddings pour trouver par concept
- **Export PDF** : Création de recueils thématiques
- **Détection de répétitions** : Alerte sur illustrations/thèmes récurrents

### 14.2 Version 3.0 (T+6 mois)

- **Génération assistée** : Ébauches de sermons dans le style du pasteur
- **Intégration cloud** : Sync Google Drive / OneDrive (optionnel)
- **Mode collaboratif** : Partage au sein d'une équipe pastorale
- **Application mobile** : Consultation en déplacement
- **Multi-langue** : Anglais, espagnol, allemand

### 14.3 Idées backlog

- Intégration avec logiciels bibliques (Logos, Accordance)
- Analyse de style et suggestions d'amélioration
- Transformation sermon → article de blog automatique
- Statistiques d'évolution thématique sur plusieurs années
- Mode « préparation de culte » avec minutage

---

## 15. Annexes

### A. Glossaire

| Terme | Définition |
|-------|------------|
| FTS5 | Full-Text Search 5, extension SQLite pour recherche textuelle |
| Electron | Framework pour créer des applications desktop avec web technologies |
| Embeddings | Représentation vectorielle du texte pour recherche sémantique |
| Token | Unité de texte pour l'IA (~0.75 mot en français) |
| NPS | Net Promoter Score, mesure de satisfaction client |
| MVP | Minimum Viable Product, version minimale fonctionnelle |

### B. Références

- Documentation Electron : https://electronjs.org
- API Claude : https://docs.anthropic.com
- SQLite FTS5 : https://sqlite.org/fts5.html
- React : https://react.dev

### C. Historique du document

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 17/01/2025 | — | Création initiale |

---

*— Fin du document —*
