'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { userApi, contractsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { ContractInstance, ContractStatus } from '@/types'
import { toast } from 'sonner'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [recentContracts, setRecentContracts] = useState<ContractInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, contractsData] = await Promise.all([
        userApi.stats(),
        contractsApi.list(1, 5),
      ])

      setStats(statsData.data)
      setRecentContracts(contractsData.data)
    } catch (error: any) {
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setIsLoading(false)
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta, {user?.name}!
            </p>
          </div>
          <Link href="/templates">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.stats.totalContracts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Contratos criados no total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Créditos Disponíveis
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.credits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Contratos que você pode gerar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.plan || 'FREE'}</div>
              <p className="text-xs text-muted-foreground">
                {user?.plan === 'FREE'
                  ? '2 contratos por mês'
                  : user?.plan === 'PRO'
                  ? '50 contratos por mês'
                  : 'Contratos ilimitados'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Contracts */}
        <Card>
          <CardHeader>
            <CardTitle>Contratos Recentes</CardTitle>
            <CardDescription>
              Seus últimos contratos criados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum contrato ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro contrato
                </p>
                <Link href="/templates">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Contrato
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/dashboard/contracts/${contract.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-semibold">
                            {contract.template?.name || 'Contrato'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Criado em {formatDate(contract.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(contract.status)}
                        <span className="text-sm text-muted-foreground">
                          {contract.template?.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                <Link href="/dashboard/contracts">
                  <Button variant="outline" className="w-full">
                    Ver todos os contratos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
