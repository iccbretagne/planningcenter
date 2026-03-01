# Changelog

Toutes les modifications notables de ce projet sont documentees ici.
Format inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Ce projet suit [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publie]

## [v0.3.1] - 2026-03-01

### Ajoute

- Changement de ministere lors de l'edition d'un departement (Select ministere + validation scope)

## [v0.3.0] - 2026-03-01

### Ajoute

- Permission `departments:manage` pour le role MINISTER (gestion des departements de son ministere)
- Chargement du `ministryId` dans la session utilisateur
- Scoping des departements par ministere pour les Ministres (page admin + API)
- Verification du scope ministere dans les API departments (POST/PATCH/PUT/DELETE)
- Icone bulle de discussion pour le statut EN_SERVICE_DEBRIEF

### Corrige

- Contraste EN_SERVICE_DEBRIEF : couleur jaune remplacee par violet (PlanningGrid, MonthlyPlanningView, StarView)
- Couleurs jaunes remplacees par violet dans la vue STAR evenement
- Overflow de la liste departements sur la page admin evenement (scroll vertical)

## [v0.2.1] - 2026-03-01

### Corrige

- Bus error au build : import dynamique de `cookies` dans `getCurrentChurchId()` (evite le chargement de `next/headers` au niveau module)

## [v0.2.0] - 2026-03-01

### Ajoute

- Bootstrap SUPER_ADMIN : les utilisateurs declares dans `SUPER_ADMIN_EMAILS` peuvent creer la premiere eglise sans role prealable
- Auto-promotion : creation d'une eglise assigne automatiquement tous les SUPER_ADMIN existants
- Selecteur d'eglise : dropdown dans le header pour les utilisateurs multi-eglises, persistance via cookie
- Helper `isSuperAdmin()` pour verifier le statut Super Admin par email
- Helper `getCurrentChurchId()` pour resoudre l'eglise active (cookie avec fallback)
- Endpoint POST `/api/current-church` pour changer d'eglise courante
- Composant `ChurchSwitcher` (dropdown masque si une seule eglise)
- Auto-generation du slug d'eglise depuis le nom (avec possibilite de modification manuelle)

## [v0.1.0] - 2026-02-28

### Ajoute

- Schema Prisma complet : eglises, utilisateurs, roles, ministeres, departements, membres, evenements, plannings
- Authentification Google OAuth via NextAuth v5
- Systeme RBAC avec 5 roles et matrice de permissions
- Dashboard de planning avec grille interactive et auto-save
- Vue mensuelle du planning
- Sidebar unifiee avec 3 sections accordion (Departements, Evenements, Administration)
- Interface admin : CRUD eglises, utilisateurs, ministeres, departements, membres, evenements
- API REST complete avec validation Zod
- Middleware de protection des routes
- Seed de donnees ICC Rennes (7 ministeres, departements, membres, evenements)
- Architecture multi-tenant par eglise
- Composants UI : Button, Input, Select, Modal, DataTable, BulkActionBar
- Export PDF des plannings
- Page evenements avec selecteur et vue par departement
- Auto-promotion Super Admin par email (`SUPER_ADMIN_EMAILS`)
- Affectation ministere/departements aux roles MINISTER et DEPARTMENT_HEAD depuis l'interface admin
- Composant `CheckboxGroup` pour la selection multiple de departements
- Endpoint PATCH `/api/users/[userId]/roles` pour modifier les affectations
- Badges enrichis affichant le ministere/departements associes avec bouton d'edition
- Helper `requireAnyPermission()` pour verifier plusieurs permissions
- Helper `getUserDepartmentScope()` pour le filtrage par departement selon le role
- Permission `members:manage` accordee aux roles MINISTER et DEPARTMENT_HEAD
- CI GitHub Actions : typecheck et validation de version sur tags
- Dependabot : mises a jour hebdomadaires npm et GitHub Actions (minor/patch uniquement)
- Affichage de la version dans le footer (depuis `package.json`)
- Script `typecheck` dans package.json
- Guide de deploiement production (Debian, Traefik, systemd)

### Corrige

- Cascade de suppression des roles avec departements associes (FK constraint MySQL)
- Permissions des liens sidebar admin (alignees avec les permissions des pages)
