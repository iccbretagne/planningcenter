# PlanningCenter

Application web multi-église de gestion des plannings de service.
Conçue initialement pour ICC Rennes, pensée pour toute église structurée
en ministères et départements.

## Fonctionnalités

- **Multi-tenant** : chaque église a son propre espace isolé
- Authentification via Google OAuth
- Gestion multi-rôles : Super Admin, Admin église, Secrétariat, Ministre, Responsable département
- Structure personnalisable : ministères, départements, membres par église
- Création d'événements avec sélection des départements concernés
- Saisie des plannings par les responsables de département
- Supervision et modification par les ministres
- Génération automatique du tableau STAR EN SERVICE
- Statuts de service clairs et directs

## Stack technique

- **Frontend** : React + Tailwind CSS
- **Backend** : Node.js + Express
- **Base de données** : MariaDB (base existante)
- **ORM** : Prisma (connecteur MySQL)
- **Auth** : Google OAuth 2.0
- **Hébergement** : Serveur dédié

## Architecture multi-tenant

Chaque église dispose de sa propre base MariaDB isolée.
Un Super Admin gère l'ensemble des églises depuis un tableau de bord dédié.
```
Super Admin
    └── Église A (ex: ICC Rennes)
    │       └── Ministères → Départements → Membres
    └── Église B (ex: ICC Lyon)
    │       └── Ministères → Départements → Membres
    └── Église C ...
```

## Rôles

| Rôle | Périmètre |
|---|---|
| Super Admin | Toutes les églises |
| Admin église | Son église uniquement |
| Secrétariat | Vue globale + génération planning |
| Ministre | Son ministère (lecture + modification) |
| Responsable département | Son/ses département(s) uniquement |

## Statuts des membres

| Statut | Description |
|---|---|
| 🟢 En service | Présent et en service |
| 🎤 En service + Débrief | En service ET animateur du débrief de fin de culte (1 seul par département par événement) |
| 🔴 Indisponible | Absent pour cet événement |
| 🔄 Remplaçant | Remplace un membre indisponible |
| *(vide)* | Non renseigné |

## Schéma de base de données
```sql
-- Tables principales
churches             -- églises (multi-tenant)
users                -- utilisateurs avec rôle par église
ministries           -- ministères par église
departments          -- départements par ministère
members              -- membres par département
events               -- événements par église
event_departments    -- départements concernés par événement
planning             -- statuts membres × événements
```

## Types d'événements

- Culte du dimanche
- Atmosphère de prière
- Parlons la Parole
- Conférence / événement spécial

## Installation
```bash
git clone https://github.com/[ton-compte]/planningcenter
cd planningcenter
npm install
cp .env.example .env
npm run dev
```

## Variables d'environnement
```env
# Base de données
DATABASE_URL=mysql://user:password@localhost:3306/planningcenter

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
SESSION_SECRET=
SUPER_ADMIN_EMAIL=
APP_URL=
```

## Roadmap

- [ ] Tableau de bord Super Admin
- [ ] Onboarding nouvelle église
- [ ] Notifications email / WhatsApp
- [ ] Export PDF du planning STAR
- [ ] Application mobile (PWA)
- [ ] Statistiques de présence
