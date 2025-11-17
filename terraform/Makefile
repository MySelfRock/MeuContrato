.PHONY: help init plan apply destroy fmt validate clean

# Variáveis
ENV ?= dev
PLAN_FILE := tfplan-$(ENV).out

help: ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

init: ## Inicializa Terraform
	terraform init

validate: ## Valida configuração
	terraform validate

fmt: ## Formata código
	terraform fmt -recursive

plan: ## Cria plano de execução
	terraform plan -out=$(PLAN_FILE)

apply: ## Aplica plano (usa plano salvo se existir)
	@if [ -f $(PLAN_FILE) ]; then \
		terraform apply $(PLAN_FILE); \
		rm -f $(PLAN_FILE); \
	else \
		terraform apply; \
	fi

destroy: ## Destrói infraestrutura (cuidado!)
	terraform destroy

output: ## Mostra outputs
	terraform output

output-json: ## Mostra outputs em JSON
	terraform output -json

clean: ## Remove arquivos temporários
	rm -f *.tfplan *.tfplan.*
	rm -rf .terraform
	rm -f .terraform.lock.hcl

cost: ## Estima custos (requer Infracost)
	@command -v infracost >/dev/null 2>&1 || { echo "Instale Infracost: https://www.infracost.io/"; exit 1; }
	infracost breakdown --path .

graph: ## Gera visualização da infraestrutura
	terraform graph | dot -Tsvg > graph.svg
	@echo "Grafo salvo em graph.svg"

# Comandos específicos de módulos
s3-only: ## Aplica apenas módulo S3
	terraform apply -target=module.s3

cloudfront-only: ## Aplica apenas módulo CloudFront
	terraform apply -target=module.cloudfront

networking-only: ## Aplica apenas módulo Networking
	terraform apply -target=module.networking

# Comandos de ambiente
dev: ## Aplica para desenvolvimento
	@$(MAKE) ENV=dev apply

staging: ## Aplica para staging
	@$(MAKE) ENV=staging apply

prod: ## Aplica para produção (requer confirmação)
	@echo "⚠️  ATENÇÃO: Deploy em PRODUÇÃO!"
	@read -p "Digite 'prod' para confirmar: " confirm && [ "$$confirm" = "prod" ]
	@$(MAKE) ENV=prod apply

# Comandos úteis
state-list: ## Lista recursos no state
	terraform state list

state-show: ## Mostra recurso específico (use: make state-show RESOURCE=module.s3.aws_s3_bucket.main)
	terraform state show $(RESOURCE)

unlock: ## Remove lock (use: make unlock LOCK_ID=abc123)
	terraform force-unlock $(LOCK_ID)

refresh: ## Atualiza state
	terraform refresh

# Segurança
check: ## Verifica segurança com tfsec
	@command -v tfsec >/dev/null 2>&1 || { echo "Instale tfsec: https://github.com/aquasecurity/tfsec"; exit 1; }
	tfsec .

# Documentação
docs: ## Gera documentação automática dos módulos
	@command -v terraform-docs >/dev/null 2>&1 || { echo "Instale terraform-docs: https://terraform-docs.io/"; exit 1; }
	terraform-docs markdown . > TERRAFORM_DOCS.md
	@echo "Documentação salva em TERRAFORM_DOCS.md"
