'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { contractsApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { ContractInstance, ContractStatus } from '@/types'
import { toast } from 'sonner'

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string
  const { isAuthenticated } = useAuthStore()
  const [contract, setContract] = useState<ContractInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    loadContract()
  }, [contractId])

  const loadContract = async () => {
    try {
      const response = await contractsApi.get(contractId)
      setContract(response.data)
    } catch (error) {
      toast.error('Erro ao carregar contrato')
      router.push('/dashboard/contracts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!contract?.generatedText) {
      toast.error('Gere o contrato primeiro')
      return
    }

    setIsGeneratingPDF(true)
    try {
      const response = await contractsApi.generatePDF(contractId)
      toast.success('PDF gerado com sucesso!')

      // Atualizar contrato com URL do PDF
      setContract((prev) =>
        prev ? { ...prev, pdfUrl: response.data.pdfUrl } : null
      )
    } catch (error) {
      toast.error('Erro ao gerar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!contract?.pdfUrl) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const pdfUrl = `${apiUrl}${contract.pdfUrl}`
    window.open(pdfUrl, '_blank')
  }

  const handleRegenerate = async () => {
    if (!confirm('Tem certeza que deseja regerar este contrato? Isto consumirá 1 crédito.')) {
      return
    }

    setIsRegenerating(true)
    try {
      const response = await contractsApi.generate(contractId)
      setContract(response.data)
      toast.success('Contrato regerado com sucesso!')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao regerar contrato'
      toast.error(message)
    } finally {
      setIsRegenerating(false)
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

  if (!contract) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/contracts">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para contratos
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <FileText className="h-12 w-12 text-primary flex-shrink-0" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {contract.template?.name || 'Contrato'}
                  </h1>
                  {getStatusBadge(contract.status)}
                </div>
                <p className="text-muted-foreground">
                  Criado em {formatDateTime(contract.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {contract.generatedText && (
                <>
                  {!contract.pdfUrl && (
                    <Button
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPDF}
                      variant="outline"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        'Gerar PDF'
                      )}
                    </Button>
                  )}

                  {contract.pdfUrl && (
                    <Button onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regerar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-medium">{contract.template?.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{contract.template?.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suas Respostas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.entries(contract.answers as Record<string, any>).map(
                  ([key, value]) => (
                    <div key={key} className="pb-2 border-b last:border-0">
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="font-medium text-sm break-words">
                        {String(value)}
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Text */}
        <Card>
          <CardHeader>
            <CardTitle>Texto do Contrato</CardTitle>
            <CardDescription>
              {contract.generatedText
                ? 'Você pode copiar este texto ou fazer download em PDF'
                : 'Este contrato ainda não foi gerado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contract.generatedText ? (
              <Textarea
                value={contract.generatedText}
                readOnly
                className="min-h-[500px] font-mono text-sm"
              />
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Contrato não gerado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Este contrato está em rascunho e precisa ser gerado
                </p>
                <Button onClick={handleRegenerate} disabled={isRegenerating}>
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Contrato'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
