# Changelog

Toutes les modifications notables de ce projet sont documentees ici.
Format inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Ce projet suit [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publie]

### Ajoute

- Affectation ministere/departements aux roles MINISTER et DEPARTMENT_HEAD depuis l'interface admin
- Composant `CheckboxGroup` pour la selection multiple de departements
- Endpoint PATCH `/api/users/[userId]/roles` pour modifier les affectations
- Badges enrichis affichant le ministere/departements associes avec bouton d'edition
- Helper `requireAnyPermission()` pour verifier plusieurs permissions
- Helper `getUserDepartmentScope()` pour le filtrage par departement selon le role
- Permission `members:manage` accordee aux roles MINISTER et DEPARTMENT_HEAD
- CI GitHub Actions : typecheck et validation de version sur tags
- Dependabot : mises a jour hebdomadaires npm et GitHub Actions
- Affichage de la version dans le footer (depuis `package.json`)
- Script `typecheck` dans package.json

### Corrige

- Cascade de suppression des roles avec departements associes (FK constraint MySQL)
- Permissions des liens sidebar admin (alignees avec les permissions des pages)

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
