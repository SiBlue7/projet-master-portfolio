# Deploiement production blue/green

La production passe par un proxy Nginx local expose sur `127.0.0.1:3000`.
Cloudflare Tunnel continue donc de viser `http://localhost:3000`, mais Nginx redirige ensuite vers `app_blue` ou `app_green`.

## Premiere installation

Depuis la VM production :

```bash
cd /opt/projet-master-portfolio/prod
git pull --ff-only origin main
sh scripts/deploy-prod-blue-green.sh
curl http://localhost:3000/api/health?format=json
```

Le script cree le fichier local ignore par Git :

```text
nginx/active-upstream.conf
```

Ce fichier indique a Nginx quelle couleur est active.

## Deploiement suivant

Sur chaque nouveau deploiement :

```bash
cd /opt/projet-master-portfolio/prod
sh scripts/deploy-prod-blue-green.sh
```

Le script :

- recupere `main` ;
- construit la couleur inactive ;
- demarre cette nouvelle couleur ;
- lance les migrations Prisma ;
- verifie `/api/health` ;
- bascule Nginx sans couper le proxy ;
- arrete l'ancienne couleur.

Pour garder l'ancienne couleur active en secours :

```bash
KEEP_OLD=1 sh scripts/deploy-prod-blue-green.sh
```

## Rollback manuel

Si la derniere bascule pose probleme, modifier `nginx/active-upstream.conf` :

```nginx
set $portfolio_upstream app_blue:3000;
```

ou :

```nginx
set $portfolio_upstream app_green:3000;
```

Puis recharger Nginx :

```bash
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
```
