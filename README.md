# Projet Master Portfolio

Portfolio technique fullstack réalisé dans le cadre du projet master M2 Cyber.

L'objectif est de construire progressivement une application de portfolio administrable, avec une zone admin sécurisée, une base PostgreSQL, une préproduction déployée automatiquement et, plus tard, une production séparée.

## Stack technique

- Next.js avec App Router
- React
- TypeScript strict
- PostgreSQL
- Prisma 7 avec adapter PostgreSQL
- NextAuth pour l'authentification admin
- Docker et Docker Compose
- Vitest et Testing Library pour les tests
- ESLint et Prettier pour la qualité de code
- GitHub Actions pour la CI/CD
- Cloudflare Tunnel pour l'exposition de la préproduction

## Prérequis

- Node.js 22
- Corepack
- pnpm 10.33.3
- Docker
- Docker Compose

Le projet déclare la version de Node dans `.nvmrc` et la version de pnpm dans `package.json`.

## Démarrage local

Activer pnpm via Corepack :

```bash
corepack enable
```

Installer les dépendances :

```bash
pnpm install
```

Créer le fichier d'environnement local :

```bash
cp .env.example .env
```

Démarrer PostgreSQL :

```bash
docker compose up -d postgres
```

Préparer Prisma et la base :

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed:admin
```

Démarrer l'application :

```bash
pnpm dev
```

L'application est disponible sur `http://localhost:3000`.

## Variables d'environnement

Les variables attendues sont listées dans `.env.example`.

Variables principales :

- `GITHUB_TOKEN` : token GitHub optionnel pour importer et synchroniser les dépôts privés.
- `DATABASE_URL` : URL de connexion PostgreSQL.
- `APP_ENV` : environnement courant (`local`, `preprod`, puis plus tard `production`).
- `NEXTAUTH_URL` : URL publique de l'application.
- `NEXTAUTH_SECRET` : secret utilisé par NextAuth.
- `ADMIN_PSEUDO` : pseudo du compte admin créé par le seed.
- `ADMIN_EMAIL` : e-mail du compte admin créé par le seed.
- `ADMIN_PASSWORD` : mot de passe du compte admin créé par le seed.
- `POSTGRES_PASSWORD` : mot de passe PostgreSQL, utilisé notamment en préproduction.

Ne jamais commiter de vrai secret dans le dépôt.

## Authentification admin

La page de connexion admin est disponible sur :

```text
/admin/login
```

Le formulaire accepte :

- pseudo + mot de passe ;
- e-mail + mot de passe.

Le compte admin local est créé avec :

```bash
pnpm db:seed:admin
```

Le script lit `ADMIN_PSEUDO`, `ADMIN_EMAIL` et `ADMIN_PASSWORD` depuis l'environnement.

## Healthcheck

Le healthcheck est disponible sur :

```text
/api/health
```

Exemple de réponse :

```json
{
  "status": "ok",
  "environment": "preprod",
  "timestamp": "2026-05-17T21:05:55.377Z",
  "uptime": 10
}
```

Ce endpoint sert à vérifier rapidement que l'application répond dans l'environnement ciblé.

## Commandes utiles

Développement :

```bash
pnpm dev
pnpm build
pnpm start
```

Qualité :

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

Prisma :

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed:admin
pnpm db:studio
```

Docker local :

```bash
docker compose up -d
docker compose ps
docker compose logs -f app
docker compose down
```

## Intégration continue

Le workflow GitHub Actions `CI` s'exécute sur les push et pull requests vers `dev` et `main`.

Il vérifie :

- le schéma Prisma ;
- la génération du client Prisma ;
- le formatage Prettier ;
- le lint ESLint ;
- le typage TypeScript ;
- les tests Vitest ;
- le build Next.js ;
- le build de l'image Docker.

Workflow concerné :

```text
.github/workflows/ci.yml
```

## Déploiement préproduction

La préproduction est exposée sur :

```text
https://preprod.justdoeat.org
```

Elle tourne sur une VM Debian dédiée, avec Docker Compose et Cloudflare Tunnel.

Le déploiement préprod est automatique :

```text
push sur dev -> CI verte -> CD Preprod -> déploiement sur la VM
```

Le workflow CD est déclenché après la réussite de la CI sur `dev`.

Workflow concerné :

```text
.github/workflows/cd-preprod.yml
```

Script exécuté sur la VM :

```text
scripts/deploy-preprod.sh
```

Le runner GitHub attendu doit avoir le label :

```text
portfolio-preprod
```

## Commandes préprod utiles

Sur la VM préprod, le projet est attendu dans :

```text
/opt/projet-master-portfolio/preprod
```

Vérifier les conteneurs :

```bash
docker compose -f docker-compose.preprod.yml ps
```

Voir les logs applicatifs :

```bash
docker compose -f docker-compose.preprod.yml logs -f app
```

Redémarrer la préprod manuellement :

```bash
docker compose -f docker-compose.preprod.yml up -d --build
docker compose -f docker-compose.preprod.yml exec -T app pnpm prisma migrate deploy
docker compose -f docker-compose.preprod.yml exec -T app pnpm db:seed:admin
```

Vérifier le tunnel Cloudflare :

```bash
systemctl status cloudflared
journalctl -u cloudflared -f
```

Vérifier le runner GitHub Actions :

```bash
cd /opt/projet-master-portfolio/actions-runner
./svc.sh status
```

## Production

La production n'est pas encore configurée.

Le domaine prévu est :

```text
https://portfolio.justdoeat.org
```

La mise en place production sera traitée dans un ticket séparé, quand le domaine Cloudflare, le tunnel, la VM et la stratégie de déploiement seront prêts.

## Workflow Git conseillé

- `main` : branche stable, destinée à la production plus tard.
- `dev` : branche d'intégration, déployée automatiquement en préproduction.
- branches de tickets : `feat/...`, `fix/...`, `docs/...`.

Flux recommandé :

```text
branche de ticket -> PR vers dev -> CI -> merge -> CD préprod
```

Pour les changements de configuration GitHub Actions qui doivent être connus par GitHub au niveau du dépôt, il peut être nécessaire de les merger aussi sur `main`.
