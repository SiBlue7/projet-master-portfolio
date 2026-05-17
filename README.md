# Projet Master Portfolio

Portfolio technique fullstack pour centraliser la présentation, la
documentation d'exécution et le suivi de projets.

## Stack initiale

- Next.js avec App Router
- React
- TypeScript strict
- PostgreSQL
- Prisma 7 avec adapter PostgreSQL
- NextAuth pour les futurs tickets d'authentification
- Docker et Docker Compose
- Vitest et Testing Library pour les tests unitaires/composants
- ESLint et Prettier pour la qualité de code

## Démarrage local

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed:admin
pnpm dev
```

L'application sera disponible sur `http://localhost:3000`.

## Commandes utiles

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm prisma:validate
pnpm db:seed:admin
```

## Notes de cadrage

Ce premier socle ne contient pas encore les fonctionnalités métier. Les prochains
tickets pourront ajouter progressivement l'authentification, l'espace admin, les
projets, les règles de visibilité, les runbooks, la synchronisation GitHub et
l'observabilité.

## Intégration continue

Le workflow GitHub Actions [CI](.github/workflows/ci.yml) s'exécute sur les push
et pull requests vers `dev` et `main`.

Il vérifie :

- le schéma Prisma et la génération du client ;
- le formatage Prettier ;
- le lint ESLint ;
- le typage TypeScript ;
- les tests Vitest ;
- le build Next.js ;
- le build de l'image Docker.
