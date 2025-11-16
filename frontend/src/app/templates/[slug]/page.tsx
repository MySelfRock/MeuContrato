'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { templatesApi, contractsApi } from '@/lib/api'
import { ContractTemplate, TemplateField } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

export default function CreateContractPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { isAuthenticated, user } = useAuthStore()
  const [template, setTemplate] = useState<ContractTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    loadTemplate()
  }, [slug])

  const loadTemplate = async () => {
    try {
      const response = await templatesApi.getBySlug(slug)
      setTemplate(response.data)

      // Inicializar respostas vazias
      const initialAnswers: Record<string, any> = {}
      response.data.jsonSchema.fields.forEach((field: TemplateField) => {
        initialAnswers[field.id] = ''
      })
      setAnswers(initialAnswers)
    } catch (error) {
      toast.error('Erro ao carregar template')
      router.push('/templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos obrigatórios
    const requiredFields = template?.jsonSchema.fields.filter(
      (field) => field.required
    )
    const missingFields = requiredFields?.filter(
      (field) => !answers[field.id] || answers[field.id].trim() === ''
    )

    if (missingFields && missingFields.length > 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    // Verificar créditos
    if (user && user.credits <= 0 && user.plan !== 'BUSINESS') {
      toast.error('Você não possui créditos suficientes')
      return
    }

    setIsSubmitting(true)

    try {
      // Criar rascunho do contrato
      const contractResponse = await contractsApi.create({
        templateId: template!.id,
        answers,
      })

      toast.success('Contrato criado! Gerando texto...')

      // Gerar texto do contrato
      await contractsApi.generate(contractResponse.data.id)

      toast.success('Contrato gerado com sucesso!')
      router.push(`/dashboard/contracts/${contractResponse.data.id}`)
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar contrato'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: TemplateField) => {
    const baseProps = {
      id: field.id,
      value: answers[field.id] || '',
      onChange: (e: any) => handleInputChange(field.id, e.target.value),
      required: field.required,
      placeholder: field.placeholder,
      disabled: isSubmitting,
    }

    switch (field.type) {
      case 'textarea':
        return <Textarea {...baseProps} rows={4} />
      case 'number':
        return <Input {...baseProps} type="number" />
      case 'date':
        return <Input {...baseProps} type="date" />
      default:
        return <Input {...baseProps} type="text" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/templates">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para templates
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <FileText className="h-12 w-12 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Preencha as informações</CardTitle>
              <CardDescription>
                Campos marcados com * são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {template.jsonSchema.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                </div>
              ))}

              <div className="flex flex-col gap-4 pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando contrato...
                    </>
                  ) : (
                    'Gerar Contrato'
                  )}
                </Button>

                {user && user.credits > 0 && user.plan !== 'BUSINESS' && (
                  <p className="text-sm text-center text-muted-foreground">
                    Isto consumirá 1 crédito. Você tem {user.credits} créditos
                    disponíveis.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
