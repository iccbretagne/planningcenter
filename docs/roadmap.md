# Roadmap

## Interface utilisateur

- [ ] Composants UI partages (Button, Card, Input, Modal)
- [ ] Sidebar : highlight du departement selectionne (active state)
- [ ] Responsive mobile (sidebar collapsible, grille adaptee)
- [ ] Theme ICC (couleurs `icc-blue`, `icc-gold` definies dans `globals.css`)
- [ ] Indicateurs visuels des statuts dans la sidebar (compteurs en service / indispo)
- [ ] Vue recapitulative multi-departements pour un evenement

## Administration

- [ ] Page Super Admin : liste des eglises, creation, suppression
- [ ] Onboarding nouvelle eglise (creation + invitation admin)
- [ ] Gestion des utilisateurs : attribution des roles depuis l'interface
- [ ] Gestion des ministeres et departements (CRUD)
- [ ] Gestion des membres (ajout, modification, suppression, transfert entre departements)
- [ ] Gestion des evenements (creation, modification, suppression, types personnalises)
- [ ] Association departements-evenements depuis l'interface

## Planning

- [ ] Vue calendrier des evenements
- [ ] Duplication d'un planning d'un evenement a un autre
- [ ] Historique des modifications (audit log)
- [ ] Verrouillage du planning apres validation
- [ ] Export PDF du planning par evenement / departement

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
- [ ] CI/CD (GitHub Actions : lint, test, build)
- [ ] Deploiement production (Docker multi-stage + reverse proxy)
- [ ] Migrations Prisma (remplacer `db push` par `prisma migrate`)
- [ ] PWA (manifest, service worker, installation mobile)
- [ ] Rate limiting sur les API routes
- [ ] Logs structures (pino ou similaire)
