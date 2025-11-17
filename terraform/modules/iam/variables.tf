variable "name_prefix" {
  type = string
}

variable "s3_bucket_arn" {
  type = string
}

variable "s3_replica_bucket_arn" {
  type    = string
  default = ""
}

variable "enable_s3_replication" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
