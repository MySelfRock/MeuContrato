'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { contractsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { ContractInstance, ContractStatus } from '@/types'
import { toast } from 'sonner'

export default function ContractsListPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [contracts, setContracts] = useState<ContractInstance[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    loadContracts()
  }, [page])

  const loadContracts = async () => {
    try {
      const response = await contractsApi.list(page, 10)
      setContracts(response.data)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      toast.error('Erro ao carregar contratos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Tem certeza que deseja deletar este contrato?')) {
      return
    }

    try {
      await contractsApi.delete(id)
      toast.success('Contrato deletado com sucesso')
      loadContracts()
    } catch (error) {
      toast.error('Erro ao deletar contrato')
    }
  }

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.DRAFT:
        return <Badge variant="secondary">Rascunho</Badge>
      case ContractStatus.GENERATED:
        return <Badge variant="default">Gerado</Badge>
      case ContractStatus.SIGNED:
        return <Badge variant="success">Assinado</Badge>
    }
  }

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.template?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.template?.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Contratos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os seus contratos
            </p>
          </div>
          <Link href="/templates">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contratos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery
                  ? 'Nenhum contrato encontrado'
                  : 'Nenhum contrato ainda'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Tente ajustar sua busca'
                  : 'Comece criando seu primeiro contrato'}
              </p>
              {!searchQuery && (
                <Link href="/templates">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Contrato
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/dashboard/contracts/${contract.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {contract.template?.name || 'Contrato'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{contract.template?.category}</span>
                            <span>•</span>
                            <span>Criado em {formatDate(contract.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(contract.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(contract.id, e)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
