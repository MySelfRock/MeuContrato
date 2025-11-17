# ============================================
# Outputs - MeuContrato POC
# ============================================

output "instance_id" {
  description = "ID da instância EC2"
  value       = aws_instance.poc.id
}

output "public_ip" {
  description = "IP público da instância"
  value       = var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip
}

output "public_dns" {
  description = "DNS público da instância"
  value       = aws_instance.poc.public_dns
}

output "s3_bucket_name" {
  description = "Nome do bucket S3"
  value       = aws_s3_bucket.poc.id
}

output "s3_bucket_arn" {
  description = "ARN do bucket S3"
  value       = aws_s3_bucket.poc.arn
}

# ============================================
# URLs de Acesso
# ============================================

output "application_url" {
  description = "URL da aplicação"
  value       = "http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}"
}

output "api_url" {
  description = "URL da API"
  value       = "http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}/api"
}

output "health_url" {
  description = "URL do health check"
  value       = "http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}/health"
}

# ============================================
# Comandos Úteis
# ============================================

output "ssh_command" {
  description = "Comando para conectar via SSH"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}"
}

output "useful_commands" {
  description = "Comandos úteis para gerenciar a POC"
  value = {
    ssh                = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}"
    status             = "sudo meucontrato-status"
    logs               = "cd /opt/meucontrato && docker-compose logs -f"
    restart            = "cd /opt/meucontrato && docker-compose restart"
    stop               = "cd /opt/meucontrato && docker-compose stop"
    start              = "cd /opt/meucontrato && docker-compose start"
    rebuild            = "cd /opt/meucontrato && docker-compose up -d --build"
  }
}

# ============================================
# Informações de Deploy
# ============================================

output "deployment_info" {
  description = "Informações completas do deploy"
  value = {
    instance_id   = aws_instance.poc.id
    instance_type = var.instance_type
    public_ip     = var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip
    region        = var.aws_region
    s3_bucket     = aws_s3_bucket.poc.id

    urls = {
      application = "http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}"
      api         = "http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}/api"
      health      = "http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}/health"
    }
  }
}

# ============================================
# Próximos Passos
# ============================================

output "next_steps" {
  description = "Próximos passos após o deploy"
  value = {
    step1 = "Aguardar 5-10 minutos para o provisionamento completar"
    step2 = "Acessar via SSH: ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}"
    step3 = "Verificar status: sudo meucontrato-status"
    step4 = "Acessar aplicação: http://${var.use_elastic_ip ? aws_eip.poc[0].public_ip : aws_instance.poc.public_ip}"
    step5 = "Ver logs: cd /opt/meucontrato && docker-compose logs -f"
  }
}

# ============================================
# Custo Estimado
# ============================================

output "estimated_cost" {
  description = "Custo mensal estimado"
  value = {
    ec2_t3_micro     = var.instance_type == "t3.micro" ? "$0.00 (free tier) ou $7.50/mês" : "Varia"
    s3_storage_10gb  = "$0.23/mês"
    elastic_ip       = var.use_elastic_ip ? "$0.00 (em uso) ou $3.60/mês (não associado)" : "N/A"
    data_transfer    = "$0-5/mês (primeiros 100GB grátis)"
    total_monthly    = "$0-15/mês (dentro do free tier)"
    note             = "Custo real pode variar. Free tier válido por 12 meses."
  }
}
