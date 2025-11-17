.PHONY: help init plan apply destroy ssh status logs output clean

help: ## Mostra esta ajuda
	@echo "MeuContrato POC - Terraform Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Inicializa Terraform
	terraform init

validate: ## Valida configuração
	terraform validate

plan: ## Cria plano de execução
	terraform plan

apply: ## Cria infraestrutura POC
	terraform apply

output: ## Mostra outputs
	terraform output

output-json: ## Mostra outputs em JSON
	terraform output -json

destroy: ## Destrói infraestrutura (CUIDADO!)
	@echo "⚠️  ATENÇÃO: Isso vai destruir toda a infraestrutura POC!"
	@read -p "Digite 'destroy' para confirmar: " confirm && [ "$$confirm" = "destroy" ]
	terraform destroy

ssh: ## Conecta via SSH na instância
	@echo "Conectando via SSH..."
	@ssh -i ~/.ssh/$$(terraform output -raw key_pair_name 2>/dev/null || echo "meucontrato-poc-key").pem ubuntu@$$(terraform output -raw public_ip)

status: ## Verifica status remotamente
	@echo "Verificando status da POC..."
	@ssh -i ~/.ssh/$$(terraform output -raw key_pair_name 2>/dev/null || echo "meucontrato-poc-key").pem ubuntu@$$(terraform output -raw public_ip) "sudo meucontrato-status"

logs: ## Ver logs remotamente
	@echo "Mostrando logs..."
	@ssh -i ~/.ssh/$$(terraform output -raw key_pair_name 2>/dev/null || echo "meucontrato-poc-key").pem ubuntu@$$(terraform output -raw public_ip) "cd /opt/meucontrato && docker-compose logs --tail=50"

restart: ## Reinicia containers remotamente
	@echo "Reiniciando containers..."
	@ssh -i ~/.ssh/$$(terraform output -raw key_pair_name 2>/dev/null || echo "meucontrato-poc-key").pem ubuntu@$$(terraform output -raw public_ip) "cd /opt/meucontrato && docker-compose restart"

url: ## Mostra URL da aplicação
	@echo "URL da Aplicação:"
	@terraform output -raw application_url
	@echo ""

health: ## Testa health check
	@echo "Testando health check..."
	@curl -s $$(terraform output -raw health_url) || echo "Falhou"

# Comandos de setup
create-key: ## Cria par de chaves SSH
	@echo "Criando par de chaves SSH..."
	aws ec2 create-key-pair \
		--key-name meucontrato-poc-key \
		--query 'KeyMaterial' \
		--output text > ~/.ssh/meucontrato-poc-key.pem
	chmod 400 ~/.ssh/meucontrato-poc-key.pem
	@echo "✅ Chave criada em ~/.ssh/meucontrato-poc-key.pem"

delete-key: ## Deleta par de chaves SSH (local e AWS)
	@echo "Deletando par de chaves..."
	aws ec2 delete-key-pair --key-name meucontrato-poc-key
	rm -f ~/.ssh/meucontrato-poc-key.pem
	@echo "✅ Chave deletada"

# Comandos de gerenciamento
clean: ## Remove arquivos temporários
	rm -f *.tfplan *.log

fmt: ## Formata código
	terraform fmt

# Deploy completo
quickstart: ## Deploy rápido (init + plan + apply)
	@echo "🚀 Deploy rápido da POC..."
	$(MAKE) init
	$(MAKE) plan
	$(MAKE) apply
	@echo ""
	@echo "✅ Deploy completo!"
	@echo ""
	$(MAKE) url

# Informações
info: ## Mostra informações da infraestrutura
	@echo "==================================="
	@echo "MeuContrato POC - Informações"
	@echo "==================================="
	@echo ""
	@echo "IP Público: $$(terraform output -raw public_ip)"
	@echo "Instância: $$(terraform output -raw instance_id)"
	@echo "Bucket S3: $$(terraform output -raw s3_bucket_name)"
	@echo ""
	@echo "URLs:"
	@echo "  - Aplicação: $$(terraform output -raw application_url)"
	@echo "  - API: $$(terraform output -raw api_url)"
	@echo "  - Health: $$(terraform output -raw health_url)"
	@echo ""
	@echo "SSH:"
	@terraform output -raw ssh_command
	@echo ""
