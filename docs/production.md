# Deploiement en production

Guide de deploiement de PlanningCenter sur un serveur Debian avec Traefik, MariaDB et systemd.

## Prerequis

- Debian 11+ (ou Ubuntu 22.04+)
- Node.js 20+ (via [NodeSource](https://github.com/nodesource/distributions))
- MariaDB 10.11+
- Traefik configure avec terminaison TLS (Let's Encrypt)

## Utilisateur systeme

Creer un utilisateur dedie :

```bash
sudo useradd -r -m -d /opt/planningcenter -s /bin/bash planningcenter
```

## Structure des dossiers

L'application utilise une structure Capistrano-like :

```
/opt/planningcenter/
├── current -> releases/planningcenter-0.1.0   # symlink vers la release active
├── releases/
│   ├── planningcenter-0.1.0/
│   ├── planningcenter-0.0.9/
│   └── ...
└── shared/
    └── .env               # variables d'environnement (persistant)
```

Creer la structure :

```bash
sudo -u planningcenter mkdir -p /opt/planningcenter/{releases,shared}
```

## Variables d'environnement

Creer le fichier `/opt/planningcenter/shared/.env` :

```bash
DATABASE_URL=mysql://planningcenter:MOT_DE_PASSE@localhost:3306/planningcenter
NEXTAUTH_SECRET=GENERER_AVEC_OPENSSL
NEXTAUTH_URL=https://votre-domaine.com
AUTH_TRUST_HOST=true
PORT=3000
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
SUPER_ADMIN_EMAILS=admin@votre-eglise.com
```

Generer le secret NextAuth :

```bash
openssl rand -base64 32
```

`AUTH_TRUST_HOST=true` est obligatoire derriere un reverse proxy (Traefik).

## Base de donnees

Creer la base et l'utilisateur MariaDB :

```sql
CREATE DATABASE planningcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'planningcenter'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE';
GRANT ALL PRIVILEGES ON planningcenter.* TO 'planningcenter'@'localhost';
FLUSH PRIVILEGES;
```

## Deploiement

### Premiere installation

```bash
# 1. Telecharger la release depuis GitHub
cd /opt/planningcenter/releases
VERSION=0.1.0
curl -L -o planningcenter-${VERSION}.tar.gz \
  https://github.com/iccbretagne/planningcenter/archive/refs/tags/v${VERSION}.tar.gz

# 2. Decompresser
tar xzf planningcenter-${VERSION}.tar.gz
rm planningcenter-${VERSION}.tar.gz

# 3. Lier le fichier .env
ln -s /opt/planningcenter/shared/.env /opt/planningcenter/releases/planningcenter-${VERSION}/.env

# 4. Installer les dependances et construire
cd /opt/planningcenter/releases/planningcenter-${VERSION}
npm install --production=false
npm run build

# 5. Appliquer le schema et charger les donnees initiales
npm run db:push
npm run db:seed

# 6. Activer la release
ln -sfn /opt/planningcenter/releases/planningcenter-${VERSION} /opt/planningcenter/current

# 7. Demarrer le service (voir section systemd ci-dessous)
sudo systemctl start planningcenter
```

### Mises a jour

```bash
cd /opt/planningcenter/releases
VERSION=X.Y.Z
curl -L -o planningcenter-${VERSION}.tar.gz \
  https://github.com/iccbretagne/planningcenter/archive/refs/tags/v${VERSION}.tar.gz
tar xzf planningcenter-${VERSION}.tar.gz
rm planningcenter-${VERSION}.tar.gz

ln -s /opt/planningcenter/shared/.env /opt/planningcenter/releases/planningcenter-${VERSION}/.env

cd /opt/planningcenter/releases/planningcenter-${VERSION}
npm install --production=false
npm run build
npm run db:push

ln -sfn /opt/planningcenter/releases/planningcenter-${VERSION} /opt/planningcenter/current
sudo systemctl restart planningcenter
```

## Service systemd

Creer `/etc/systemd/system/planningcenter.service` :

```ini
[Unit]
Description=PlanningCenter
After=network.target mariadb.service

[Service]
Type=simple
User=planningcenter
Group=planningcenter
WorkingDirectory=/opt/planningcenter/current
EnvironmentFile=/opt/planningcenter/shared/.env
ExecStart=/usr/bin/node /opt/planningcenter/current/node_modules/.bin/next start -p 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Activer et demarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable planningcenter
sudo systemctl start planningcenter
```

Commandes utiles :

```bash
sudo systemctl status planningcenter    # statut
sudo journalctl -u planningcenter -f    # logs en temps reel
```

## Configuration Traefik

Ajouter un fichier de configuration dynamique (ex: `/etc/traefik/dynamic/planningcenter.yml`) :

```yaml
http:
  routers:
    planningcenter:
      rule: "Host(`votre-domaine.com`)"
      entryPoints:
        - websecure
      service: planningcenter
      tls:
        certResolver: letsencrypt

  services:
    planningcenter:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:3000"
```

Traefik gere automatiquement le certificat TLS via Let's Encrypt.

## Rollback

Pour revenir a une release precedente :

```bash
# Lister les releases disponibles
ls /opt/planningcenter/releases/

# Repointer le symlink
ln -sfn /opt/planningcenter/releases/planningcenter-VERSION_PRECEDENTE /opt/planningcenter/current

# Redemarrer
sudo systemctl restart planningcenter
```

## OAuth Google en production

Dans la [console Google Cloud](https://console.cloud.google.com/apis/credentials), ajouter l'URI de redirection de production :

```
https://votre-domaine.com/api/auth/callback/google
```

## Checklist de production

- [ ] Variables d'environnement configurees dans `shared/.env`
- [ ] `NEXTAUTH_SECRET` genere avec `openssl rand -base64 32`
- [ ] `AUTH_TRUST_HOST=true` present
- [ ] `NEXTAUTH_URL` pointe vers le domaine de production (HTTPS)
- [ ] Base de donnees creee avec utilisateur dedie
- [ ] Schema applique (`npm run db:push`)
- [ ] Application construite (`npm run build`)
- [ ] Service systemd actif et active au boot
- [ ] Traefik configure avec certificat TLS
- [ ] URI de redirection Google OAuth ajoutee
- [ ] Acces HTTPS fonctionnel
