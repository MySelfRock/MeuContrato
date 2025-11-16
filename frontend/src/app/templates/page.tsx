'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { templatesApi } from '@/lib/api'
import { ContractTemplate } from '@/types'
import { toast } from 'sonner'

export default function TemplatesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    loadTemplates()
  }, [selectedCategory])

  const loadTemplates = async () => {
    try {
      const [templatesData, categoriesData] = await Promise.all([
        templatesApi.list(selectedCategory),
        templatesApi.getCategories(),
      ])

      setTemplates(templatesData.data)
      setCategories(categoriesData.data)
    } catch (error) {
      toast.error('Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Templates de Contratos</h1>
          <p className="text-muted-foreground">
            Escolha um modelo para começar a criar seu contrato
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('')}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p>Carregando templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/templates/${template.slug}`}>
                    <Button className="w-full">Usar este template</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Escolha o template que melhor se adequa ao seu contrato</li>
              <li>Preencha as informações solicitadas no formulário</li>
              <li>Nossa IA gera um contrato profissional em segundos</li>
              <li>Revise, edite se necessário e faça o download em PDF</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
