output "s3_replication_role_arn" {
  description = "ARN da role de replicação S3"
  value       = var.enable_s3_replication ? aws_iam_role.s3_replication[0].arn : ""
}

output "ecs_execution_role_arn" {
  description = "ARN da role de execução ECS"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN da role de task ECS"
  value       = aws_iam_role.ecs_task.arn
}
