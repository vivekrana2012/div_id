# ============================================================
#  Divid — Makefile
# ============================================================

.PHONY: help dev down logs build fe-dev be-dev api-spec api-types nginx-site nginx-site-install

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# ---------- Local dev (Docker) ----------

dev: ## Build & run everything locally in Docker
	docker compose up --build

down: ## Stop all services
	docker compose down

logs: ## Tail logs for all services
	docker compose logs -f

build: ## Build Docker images without running
	docker compose build

# ---------- Local dev (bare-metal, hot reload) ----------

fe-dev: ## Run frontend in Vite dev mode (hot reload)
	cd frontend && npm install && npm run dev

be-dev: ## Run backend with Maven spring-boot:run
	cd backend && JAVA_HOME=/Users/viv/Library/Java/JavaVirtualMachines/corretto-25.0.2/Contents/Home ./mvnw spring-boot:run

# ---------- API contract ----------

api-spec: ## Export OpenAPI spec from running backend to docs/api/openapi.yaml
	@mkdir -p docs/api
	curl -sf http://localhost:8080/v3/api-docs.yaml -o docs/api/openapi.yaml
	@echo "Done: docs/api/openapi.yaml updated"

api-types: ## Generate TypeScript types from OpenAPI spec
	cd frontend && npm run generate:api
	@echo "Done: frontend/src/api/schema.d.ts updated"

# ---------- Homelab nginx ----------

nginx-site: ## Generate nginx site config (required: DOMAIN=app.example.com)
	bash scripts/setup-nginx-site.sh --domain "$(DOMAIN)"

nginx-site-install: ## Generate + install nginx site (required: DOMAIN=app.example.com)
	bash scripts/setup-nginx-site.sh --domain "$(DOMAIN)" --install
