# ─────────────────────────────────────────────────────────────────────────────
# NEXUS Platform — Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: up down build logs shell-backend shell-db migrate makemigrations \
        createsuperuser seed test lint format frontend-install \
        prod-up prod-down prod-build clean prune help

# ─── Couleurs ─────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
GREEN := \033[0;32m
YELLOW:= \033[0;33m
RESET := \033[0m

# ─── Dev — Containers ─────────────────────────────────────────────────────────

## Démarrer tous les services en arrière-plan
up:
	@echo "$(GREEN)Starting NEXUS services...$(RESET)"
	docker-compose up -d
	@echo "$(GREEN)Services running. Visit http://localhost$(RESET)"

## Démarrer avec les logs visibles
up-logs:
	docker-compose up

## Arrêter tous les services
down:
	@echo "$(YELLOW)Stopping NEXUS services...$(RESET)"
	docker-compose down

## Arrêter et supprimer les volumes
down-v:
	@echo "$(YELLOW)Stopping NEXUS services and removing volumes...$(RESET)"
	docker-compose down -v

## Build les images Docker
build:
	@echo "$(CYAN)Building Docker images...$(RESET)"
	docker-compose build

## Build sans cache
build-no-cache:
	docker-compose build --no-cache

## Afficher les logs en temps réel
logs:
	docker-compose logs -f

## Logs d'un service spécifique: make logs-s SERVICE=backend
logs-s:
	docker-compose logs -f $(SERVICE)

## Status des services
ps:
	docker-compose ps

## Restart d'un service: make restart SERVICE=backend
restart:
	docker-compose restart $(SERVICE)

# ─── Dev — Shells ─────────────────────────────────────────────────────────────

## Shell Django (manage.py shell)
shell-backend:
	docker-compose exec backend python manage.py shell

## Shell bash dans le backend
bash-backend:
	docker-compose exec backend bash

## Shell PostgreSQL
shell-db:
	docker-compose exec db psql -U nexus_user -d nexus_db

## Shell Redis CLI
shell-redis:
	docker-compose exec redis redis-cli

# ─── Dev — Django ─────────────────────────────────────────────────────────────

## Appliquer les migrations
migrate:
	@echo "$(CYAN)Running database migrations...$(RESET)"
	docker-compose exec backend python manage.py migrate

## Créer les migrations
makemigrations:
	docker-compose exec backend python manage.py makemigrations

## Créer un superutilisateur
createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

## Charger les données de démonstration
seed:
	@echo "$(CYAN)Seeding demo data...$(RESET)"
	docker-compose exec backend python manage.py seed_data

## Collecter les fichiers statiques
collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

## Vérification Django
check:
	docker-compose exec backend python manage.py check

## Afficher les URLs enregistrées
show-urls:
	docker-compose exec backend python manage.py show_urls

# ─── Dev — Tests ──────────────────────────────────────────────────────────────

## Lancer les tests backend
test:
	@echo "$(CYAN)Running backend tests...$(RESET)"
	docker-compose exec backend python manage.py test --verbosity=2

## Tests avec coverage
test-coverage:
	docker-compose exec backend coverage run manage.py test
	docker-compose exec backend coverage report
	docker-compose exec backend coverage html

## Tests frontend
test-frontend:
	docker-compose exec frontend npm run test

# ─── Dev — Code Quality ───────────────────────────────────────────────────────

## Lint Python (flake8 + black check)
lint:
	docker-compose exec backend flake8 .
	docker-compose exec backend black --check .
	docker-compose exec backend isort --check-only .

## Formater le code Python
format:
	docker-compose exec backend black .
	docker-compose exec backend isort .

## Lint frontend
lint-frontend:
	docker-compose exec frontend npm run lint

# ─── Dev — Frontend ───────────────────────────────────────────────────────────

## Installer les dépendances npm
frontend-install:
	docker-compose exec frontend npm install

## Ajouter un package npm: make npm-add PKG=axios
npm-add:
	docker-compose exec frontend npm install $(PKG)

# ─── Production ───────────────────────────────────────────────────────────────

## Démarrer en production
prod-up:
	@echo "$(GREEN)Starting NEXUS in PRODUCTION mode...$(RESET)"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

## Arrêter la production
prod-down:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

## Build production
prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# ─── Setup initial ────────────────────────────────────────────────────────────

## Configuration initiale complète (première fois)
setup:
	@echo "$(CYAN)Setting up NEXUS for the first time...$(RESET)"
	cp -n .env.example .env || true
	$(MAKE) build
	$(MAKE) up
	@echo "$(YELLOW)Waiting for services to be ready...$(RESET)"
	sleep 10
	$(MAKE) migrate
	$(MAKE) seed
	@echo "$(GREEN)NEXUS is ready! Visit http://localhost$(RESET)"

# ─── Nettoyage ────────────────────────────────────────────────────────────────

## Supprimer les containers et images buildées
clean:
	docker-compose down --rmi local -v --remove-orphans

## Nettoyer toutes les ressources Docker inutilisées
prune:
	docker system prune -f

# ─── Aide ─────────────────────────────────────────────────────────────────────

## Afficher l'aide
help:
	@echo ""
	@echo "$(CYAN)NEXUS Platform — Commandes disponibles$(RESET)"
	@echo "────────────────────────────────────────────"
	@grep -E '^## ' Makefile | sed 's/^## /  /'
	@echo ""
