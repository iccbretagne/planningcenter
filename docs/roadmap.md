# Roadmap

## Interface utilisateur

- [x] Composants UI partages (Button, Card, Input, Modal, Select, DataTable, CheckboxGroup)
- [x] Sidebar : highlight du departement selectionne (active state)
- [ ] Responsive mobile (sidebar collapsible, grille adaptee)
- [x] Theme ICC (couleurs `icc-violet`, `icc-jaune`, `icc-rouge`, `icc-bleu`)
- [ ] Indicateurs visuels des statuts dans la sidebar (compteurs en service / indispo)
- [ ] Vue recapitulative multi-departements pour un evenement

## Administration

- [x] Page Super Admin : liste des eglises, creation, suppression
- [ ] Onboarding nouvelle eglise (creation + invitation admin)
- [x] Gestion des utilisateurs : attribution des roles depuis l'interface
- [x] Affectation ministere/departements aux roles MINISTER et DEPARTMENT_HEAD
- [x] Gestion des ministeres et departements (CRUD)
- [x] Gestion des membres (ajout, modification, suppression, transfert entre departements)
- [x] Gestion des evenements (creation, modification, suppression, types personnalises)
- [x] Association departements-evenements depuis l'interface

## Planning

- [ ] Vue calendrier des evenements
- [ ] Duplication d'un planning d'un evenement a un autre
- [ ] Historique des modifications (audit log)
- [ ] Verrouillage du planning apres validation
- [x] Export PDF du planning par evenement / departement

## Notifications

- [ ] Notifications email pour rappels de service (J-3, J-1)
- [ ] Integration WhatsApp (API Business)
- [ ] Notifications in-app (badge, toast)

## Statistiques

- [ ] Taux de presence par membre et departement
- [ ] Nombre de services par membre sur une periode
- [ ] Dashboard avec graphiques de tendances

## Technique

- [ ] Tests unitaires (Vitest)
- [ ] Tests d'integration API
- [x] CI/CD (GitHub Actions : typecheck, version check)
- [x] Dependabot (mises a jour automatiques des dependances)
- [x] Affichage de la version dans le footer
- [ ] Deploiement production (Docker multi-stage + reverse proxy)
- [ ] Migrations Prisma (remplacer `db push` par `prisma migrate`)
- [ ] PWA (manifest, service worker, installation mobile)
- [ ] Rate limiting sur les API routes
- [ ] Logs structures (pino ou similaire)
