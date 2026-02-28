# Architecture

## Stack technique

| Technologie | Version | Role |
|---|---|---|
| Next.js | 15 | Framework fullstack (App Router + Turbopack) |
| React | 19 | UI (Server Components + Client Components) |
| Tailwind CSS | 4 | Styles (PostCSS) |
| NextAuth (Auth.js) | 5 beta | Authentification Google OAuth |
| Prisma | 6 | ORM (connecteur MySQL vers MariaDB) |
| MariaDB | 10.11 | Base de donnees (Docker) |
| Zod | 3 | Validation des donnees cote API |
| TypeScript | 5 | Typage strict |

## Structure du projet

```
planningcenter/
├── prisma/
│   ├── schema.prisma              # Schema BDD (domaine + NextAuth)
│   └── seed.ts                    # Donnees initiales ICC Rennes
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (Montserrat, metadata)
│   │   ├── page.tsx               # Page de connexion (Google OAuth)
│   │   ├── globals.css            # Tailwind v4 (@theme couleurs ICC)
│   │   ├── (auth)/                # Route group : pages authentifiees
│   │   │   ├── layout.tsx         # Auth guard + header + sidebar
│   │   │   └── dashboard/
│   │   │       └── page.tsx       # Vue planning par departement
│   │   └── api/                   # Route handlers (API REST)
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── churches/[churchId]/events/route.ts
│   │       ├── events/[eventId]/route.ts
│   │       ├── departments/[departmentId]/members/route.ts
│   │       └── events/[eventId]/departments/[deptId]/planning/route.ts
│   ├── components/
│   │   ├── EventSelector.tsx      # Selecteur d'evenement (client)
│   │   └── PlanningGrid.tsx       # Grille planning interactive (client)
│   ├── lib/
│   │   ├── prisma.ts              # Singleton Prisma (globalThis pattern)
│   │   ├── auth.ts                # Config NextAuth + helpers (requireAuth, requirePermission)
│   │   ├── api-utils.ts           # ApiError, successResponse, errorResponse
│   │   └── permissions.ts         # Matrice roles-permissions RBAC
│   └── middleware.ts              # Edge middleware (protection routes)
├── docker-compose.yml             # MariaDB locale
├── next.config.ts
├── tsconfig.json                  # Strict, path alias @/*
└── postcss.config.mjs             # @tailwindcss/postcss
```

## Patterns et conventions

### Server vs Client components

- **Server Components** (par defaut) : pages, layouts, chargement de donnees initiales
- **Client Components** (`"use client"`) : interactions utilisateur (EventSelector, PlanningGrid)

Les pages chargent les donnees cote serveur et les passent en props aux composants client.

### API Route handlers

Chaque route suit le meme pattern :

```typescript
export async function GET(request, { params }) {
  try {
    await requireAuth();           // verifier l'authentification
    const { id } = await params;   // extraire les parametres
    // ... logique metier + requete Prisma
    return successResponse(data);  // 200 avec JSON
  } catch (error) {
    return errorResponse(error);   // gestion centralisee des erreurs
  }
}
```

Les erreurs metier utilisent `throw new ApiError(statusCode, message)`.
Les erreurs d'auth (`UNAUTHORIZED`, `FORBIDDEN`) sont gerees automatiquement par `errorResponse`.

### Validation

Les mutations (PUT, POST) valident le body avec Zod avant traitement :

```typescript
const schema = z.object({ ... });
const data = schema.parse(await request.json());
```

### Prisma singleton

Le client Prisma est instancie une seule fois via `globalThis` pour eviter les connexions multiples en developpement (hot reload) :

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Middleware

Le middleware Next.js (`src/middleware.ts`) protege les routes `/dashboard/*` et `/api/*` (sauf `/api/auth/*`).
Il reexporte directement la fonction `auth` de NextAuth qui verifie la session.

### Navigation

La navigation dans le dashboard utilise les query params (`?dept=...&event=...`) plutot que des routes imbriquees.
La sidebar utilise des liens `<a>` vers `/dashboard?dept={id}` et l'EventSelector met a jour les params via `router.push`.

### Auto-save

Le composant PlanningGrid sauvegarde automatiquement les modifications avec un debounce de 1 seconde.
Un indicateur visuel affiche l'etat : sauvegarde en cours, modifications non sauvegardees, ou sauvegarde.

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL de connexion MariaDB | `mysql://planningcenter:planningcenter@localhost:3306/planningcenter` |
| `NEXTAUTH_SECRET` | Secret de chiffrement des sessions | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL publique de l'application | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Client ID Google OAuth | |
| `GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth | |
| `SUPER_ADMIN_EMAILS` | Emails auto-promus Super Admin (virgule) | `admin@example.com,other@example.com` |

## Multi-tenant

Chaque eglise (`Church`) est un tenant isole. Les donnees (ministeres, departements, membres, evenements) sont rattachees a une eglise via `churchId`.

```
Super Admin
├── ICC Rennes
│   └── Ministeres → Departements → Membres
├── ICC Lyon
│   └── Ministeres → Departements → Membres
└── ...
```

Un utilisateur peut avoir des roles differents dans plusieurs eglises via la table `UserChurchRole`.
