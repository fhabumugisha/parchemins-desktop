# Parchemins - Next Version Architecture

## Objectif

Passer d'une app desktop standalone vers un écosystème complet avec:
- Landing page marketing
- Backend avec admin dashboard
- Système de souscription (freemium + abonnement)

---

## Modèle Freemium

| | Gratuit | Abonné |
|--|---------|--------|
| Recherche locale | Illimité | Illimité |
| Indexation sermons | Illimité | Illimité |
| Chat IA | **10 questions/mois** | **Illimité** |
| Prix | 0€ | **5€/mois** |

---

## Architecture cible

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ÉCOSYSTÈME PARCHEMINS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │  Desktop    │  │  Landing    │  │  Backend + Admin            │ │
│  │  Electron   │  │  Next.js    │  │  Next.js API + Supabase     │ │
│  │             │  │             │  │                             │ │
│  │ React       │  │ React       │  │ React (admin pages)         │ │
│  │ TypeScript  │  │ TypeScript  │  │ TypeScript                  │ │
│  │ Tailwind    │  │ Tailwind    │  │ Tailwind                    │ │
│  │ Zustand     │  │             │  │                             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
│         │                │                      │                   │
│         └────────────────┼──────────────────────┘                   │
│                          ▼                                          │
│                   ┌─────────────┐                                   │
│                   │  Supabase   │                                   │
│                   │  PostgreSQL │                                   │
│                   │  Auth       │                                   │
│                   │  Storage    │                                   │
│                   └─────────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stack technique

| Composant | Technologie | Raison |
|-----------|-------------|--------|
| Desktop | Electron + React + TypeScript + Tailwind | Existant |
| Landing page | Next.js | Même stack React/TS/Tailwind, SEO |
| Backend API | Next.js API Routes | Unifié avec landing |
| Admin dashboard | Next.js pages custom | Même stack |
| Base de données | Supabase (PostgreSQL) | Gratuit, Auth inclus |
| Paiements | LemonSqueezy | Abonnements + licences intégrés |
| Hébergement | Vercel | Gratuit, intégration Next.js |

---

## Structure du monorepo

```
parchemins/
├── apps/
│   ├── desktop/                 # Electron (actuel)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   ├── renderer/
│   │   │   ├── preload/
│   │   │   └── shared/
│   │   └── package.json
│   │
│   └── web/                     # Next.js (nouveau)
│       ├── app/
│       │   ├── (marketing)/     # Landing page publique
│       │   │   ├── page.tsx
│       │   │   ├── pricing/
│       │   │   ├── features/
│       │   │   └── layout.tsx
│       │   │
│       │   ├── (admin)/         # Admin dashboard (protégé)
│       │   │   ├── layout.tsx   # Auth guard
│       │   │   ├── dashboard/
│       │   │   │   └── page.tsx
│       │   │   ├── users/
│       │   │   │   └── page.tsx
│       │   │   └── analytics/
│       │   │       └── page.tsx
│       │   │
│       │   └── api/             # Backend API
│       │       ├── chat/
│       │       │   └── route.ts # Proxy Anthropic
│       │       ├── license/
│       │       │   └── validate/
│       │       │       └── route.ts
│       │       └── webhooks/
│       │           └── lemonsqueezy/
│       │               └── route.ts
│       │
│       ├── components/
│       │   ├── marketing/       # Composants landing
│       │   └── admin/           # Composants admin
│       │
│       └── package.json
│
├── packages/
│   └── shared/                  # Code partagé
│       ├── types/
│       ├── constants/
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json
```

---

## Base de données (Supabase)

### Tables

```sql
-- Utilisateurs (synced depuis LemonSqueezy webhooks)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  license_key TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'subscriber')),
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tracking d'usage
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage mensuel (vue matérialisée ou calculée)
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- "2024-01"
  chat_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  UNIQUE(user_id, month)
);

-- Vue pour le dashboard admin
CREATE VIEW admin_stats AS
SELECT
  COUNT(DISTINCT user_id) as active_users,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## Flow de paiement

```
1. Utilisateur ouvre l'app desktop (gratuit)
   ↓
2. Utilise 10 questions gratuites
   ↓
3. Limite atteinte → "Passez illimité pour 5€/mois"
   ↓
4. Clic → Ouvre navigateur → LemonSqueezy checkout
   ↓
5. Paiement réussi → LemonSqueezy génère licence
   ↓
6. Webhook → Backend → Crée user dans Supabase
   ↓
7. Email avec licence envoyé à l'utilisateur
   ↓
8. Utilisateur entre licence dans l'app
   ↓
9. App valide via API backend → status "active"
   ↓
10. Accès illimité tant que abonnement actif
```

---

## API Endpoints

### POST /api/chat
Proxy vers Anthropic avec validation licence.

```typescript
// Request
{
  "licenseKey": "PARCH-XXXX-XXXX-XXXX",
  "message": "Résume mon sermon sur la grâce",
  "conversationHistory": [...]
}

// Response
{
  "response": "Voici le résumé...",
  "tokensUsed": 1234,
  "remaining": 8  // null si abonné
}
```

### POST /api/license/validate
Valide une licence et retourne le status.

```typescript
// Request
{
  "licenseKey": "PARCH-XXXX-XXXX-XXXX"
}

// Response
{
  "valid": true,
  "status": "active",
  "plan": "subscriber",
  "email": "user@example.com"
}
```

### POST /api/webhooks/lemonsqueezy
Reçoit les événements LemonSqueezy (subscription_created, subscription_updated, etc.)

---

## Admin Dashboard

### Pages

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Vue d'ensemble (users, usage, coûts) |
| `/admin/users` | Liste des utilisateurs, filtres, recherche |
| `/admin/users/[id]` | Détail utilisateur, historique usage |
| `/admin/analytics` | Graphiques usage, revenus, coûts |

### Métriques clés

- Nombre d'utilisateurs (free vs paid)
- MRR (Monthly Recurring Revenue)
- Coût Anthropic ce mois
- Marge (revenus - coûts)
- Churn rate
- Questions IA par jour/semaine/mois

---

## Évolution progressive

### Phase 1: MVP Beta (1-2 semaines)
- [ ] Limite locale (10 questions/mois)
- [ ] Intégration LemonSqueezy (abonnement)
- [ ] Validation licence côté client
- [ ] Clé API Anthropic dans l'app (beta fermée)

### Phase 2: Backend minimal (2-3 semaines)
- [ ] Setup Next.js + Supabase
- [ ] API proxy Anthropic
- [ ] Webhooks LemonSqueezy
- [ ] Landing page simple

### Phase 3: Admin + Analytics (2-3 semaines)
- [ ] Dashboard admin
- [ ] Tracking usage détaillé
- [ ] Analytics et graphiques
- [ ] Gestion utilisateurs

### Phase 4: Production (ongoing)
- [ ] Monitoring et alertes
- [ ] Optimisations performance
- [ ] Features additionnelles selon feedback

---

## Coûts estimés

### MVP / Beta
| Service | Coût |
|---------|------|
| Vercel | Gratuit |
| Supabase | Gratuit |
| LemonSqueezy | 0% |
| Domaine | ~10€/an |
| **Total** | **~0€/mois** |

### Production (estimé 100 users)
| Service | Coût |
|---------|------|
| Vercel | ~20€/mois |
| Supabase | ~25€/mois |
| LemonSqueezy | 5% des revenus |
| Anthropic | Variable (~0.01€/question) |
| Domaine | ~10€/an |
| **Total** | **~50€/mois + variable** |

---

## Décisions techniques

### Pourquoi Next.js ?
- Même stack que desktop (React + TypeScript + Tailwind)
- SSR pour SEO (landing page)
- API Routes intégrées
- Déploiement simple sur Vercel

### Pourquoi Supabase ?
- PostgreSQL robuste
- Auth inclus (si besoin futur)
- Dashboard admin basique inclus
- Tier gratuit généreux
- Row Level Security

### Pourquoi LemonSqueezy ?
- Gestion abonnements native
- Génération de licences intégrée
- API de validation
- Gestion TVA automatique
- Webhooks fiables

### Pourquoi monorepo ?
- Code partagé (types, constantes)
- Cohérence des versions
- Un seul repo à maintenir
- Déploiements coordonnés

---

## Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [LemonSqueezy API](https://docs.lemonsqueezy.com/api)
- [Anthropic API](https://docs.anthropic.com/)
- [Vercel Deployment](https://vercel.com/docs)
