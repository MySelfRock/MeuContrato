variable "name_prefix" {
  type = string
}

variable "s3_bucket_id" {
  type = string
}

variable "s3_bucket_arn" {
  type = string
}

variable "s3_bucket_regional_domain_name" {
  type = string
}

variable "price_class" {
  type    = string
  default = "PriceClass_100"
}

variable "default_ttl" {
  type    = number
  default = 86400
}

variable "max_ttl" {
  type    = number
  default = 31536000
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "certificate_arn" {
  type    = string
  default = ""
}

variable "enable_custom_domain" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
