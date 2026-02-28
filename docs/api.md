# API

Toutes les routes API sont des [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) dans `src/app/api/`.

Toutes les routes (sauf `/api/auth/*`) necessitent une session NextAuth valide.

## Format des reponses

**Succes** : JSON avec les donnees directement dans le body.

**Erreur** :
```json
{ "error": "Message d'erreur" }
```

Codes HTTP utilises : `200`, `400`, `401`, `403`, `404`, `500`.

---

## Authentification

### `GET/POST /api/auth/[...nextauth]`

Gere par NextAuth. Inclut :

- `GET /api/auth/signin` — page de connexion
- `GET /api/auth/callback/google` — callback OAuth Google
- `GET /api/auth/session` — session courante
- `POST /api/auth/signout` — deconnexion

---

## Evenements

### `GET /api/churches/[churchId]/events`

Liste les evenements d'une eglise, tries par date croissante.

**Parametres** : `churchId` — ID de l'eglise (cuid)

**Reponse** :
```json
[
  {
    "id": "clx...",
    "title": "Culte du 02/03/2026",
    "type": "CULTE",
    "date": "2026-03-02T10:00:00.000Z",
    "churchId": "clx...",
    "createdAt": "2026-02-28T...",
    "eventDepts": [
      {
        "id": "clx...",
        "eventId": "clx...",
        "departmentId": "clx...",
        "department": {
          "id": "clx...",
          "name": "Choristes",
          "ministryId": "clx...",
          "createdAt": "..."
        }
      }
    ]
  }
]
```

### `GET /api/events/[eventId]`

Detail d'un evenement avec ses departements et ministeres.

**Parametres** : `eventId` — ID de l'evenement (cuid)

**Reponse** :
```json
{
  "id": "clx...",
  "title": "Culte du 02/03/2026",
  "type": "CULTE",
  "date": "2026-03-02T10:00:00.000Z",
  "churchId": "clx...",
  "eventDepts": [
    {
      "id": "clx...",
      "department": {
        "id": "clx...",
        "name": "Choristes",
        "ministry": {
          "id": "clx...",
          "name": "Louange"
        }
      }
    }
  ]
}
```

**Erreur** : `404` si l'evenement n'existe pas.

---

## Departements

### `GET /api/departments/[departmentId]/members`

Liste les membres d'un departement, tries par nom.

**Parametres** : `departmentId` — ID du departement (cuid)

**Reponse** :
```json
[
  {
    "id": "clx...",
    "firstName": "Marie",
    "lastName": "Dupont",
    "departmentId": "clx...",
    "createdAt": "..."
  }
]
```

---

## Planning

### `GET /api/events/[eventId]/departments/[deptId]/planning`

Recupere le planning d'un departement pour un evenement.
Retourne tous les membres du departement avec leur statut.

**Parametres** :
- `eventId` — ID de l'evenement (cuid)
- `deptId` — ID du departement (cuid)

**Reponse** :
```json
{
  "eventDepartment": {
    "id": "clx...",
    "eventId": "clx...",
    "departmentId": "clx..."
  },
  "members": [
    {
      "id": "clx...",
      "firstName": "Marie",
      "lastName": "Dupont",
      "departmentId": "clx...",
      "createdAt": "...",
      "status": "EN_SERVICE",
      "planningId": "clx..."
    },
    {
      "id": "clx...",
      "firstName": "Jean",
      "lastName": "Martin",
      "departmentId": "clx...",
      "createdAt": "...",
      "status": null,
      "planningId": null
    }
  ]
}
```

**Erreur** : `404` si le lien evenement-departement n'existe pas.

### `PUT /api/events/[eventId]/departments/[deptId]/planning`

Met a jour le planning d'un departement pour un evenement.
Cree le lien evenement-departement s'il n'existe pas.

**Parametres** :
- `eventId` — ID de l'evenement (cuid)
- `deptId` — ID du departement (cuid)

**Body** (valide par Zod) :
```json
{
  "plannings": [
    { "memberId": "clx...", "status": "EN_SERVICE" },
    { "memberId": "clx...", "status": "EN_SERVICE_DEBRIEF" },
    { "memberId": "clx...", "status": null }
  ]
}
```

Valeurs possibles pour `status` : `"EN_SERVICE"`, `"EN_SERVICE_DEBRIEF"`, `"INDISPONIBLE"`, `"REMPLACANT"`, `null`.

**Regle metier** : un seul membre par departement par evenement peut avoir le statut `EN_SERVICE_DEBRIEF`.

**Reponse** : tableau des plannings upserted.

**Erreurs** :
- `400` si plus d'un `EN_SERVICE_DEBRIEF`
- `400` si le body ne passe pas la validation Zod

---

## Utilisateurs et roles

### `POST /api/users/[userId]/roles`

Ajoute un role a un utilisateur.

**Body** :
```json
{
  "churchId": "clx...",
  "role": "MINISTER",
  "ministryId": "clx...",
  "departmentIds": ["clx...", "clx..."]
}
```

- `ministryId` : optionnel, utilise si `role` = `MINISTER`
- `departmentIds` : optionnel, utilise si `role` = `DEPARTMENT_HEAD`

**Reponse** : `201` avec le role cree (inclut `church`, `ministry`, `departments`).

### `PATCH /api/users/[userId]/roles`

Modifie l'affectation d'un role existant (ministere ou departements).

**Body** :
```json
{
  "roleId": "clx...",
  "ministryId": "clx...",
  "departmentIds": ["clx...", "clx..."]
}
```

- `ministryId` : `string | null` pour MINISTER
- `departmentIds` : `string[]` pour DEPARTMENT_HEAD (remplace les assignations existantes)

**Reponse** : `200` avec le role mis a jour.

**Erreur** : `404` si le role n'appartient pas a l'utilisateur.

### `DELETE /api/users/[userId]/roles`

Supprime un role d'un utilisateur. Supprime en cascade les `UserDepartment` associes.

**Body** :
```json
{
  "churchId": "clx...",
  "role": "DEPARTMENT_HEAD"
}
```

**Reponse** : `200` avec `{ "success": true }`.
