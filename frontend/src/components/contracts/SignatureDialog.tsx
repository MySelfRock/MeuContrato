'use client'

import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signatureApi } from '@/lib/api'
import { toast } from 'sonner'

interface Signer {
  name: string
  email: string
}

interface SignatureDialogProps {
  contractId: string
  onSuccess: () => void
  onCancel: () => void
}

export function SignatureDialog({ contractId, onSuccess, onCancel }: SignatureDialogProps) {
  const [signers, setSigners] = useState<Signer[]>([
    { name: '', email: '' },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addSigner = () => {
    setSigners([...signers, { name: '', email: '' }])
  }

  const removeSigner = (index: number) => {
    if (signers.length === 1) return
    setSigners(signers.filter((_, i) => i !== index))
  }

  const updateSigner = (index: number, field: 'name' | 'email', value: string) => {
    const newSigners = [...signers]
    newSigners[index][field] = value
    setSigners(newSigners)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar signatários
    const validSigners = signers.filter(s => s.name && s.email)
    if (validSigners.length === 0) {
      toast.error('Adicione pelo menos um signatário')
      return
    }

    // Validar emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = validSigners.filter(s => !emailRegex.test(s.email))
    if (invalidEmails.length > 0) {
      toast.error('Verifique os emails informados')
      return
    }

    setIsSubmitting(true)

    try {
      await signatureApi.create(contractId, validSigners)
      toast.success('Solicitação de assinatura enviada com sucesso!')
      onSuccess()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao enviar para assinatura'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Enviar para Assinatura Digital</CardTitle>
          <CardDescription>
            Adicione os signatários que receberão o contrato para assinar
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Signers List */}
            <div className="space-y-4">
              {signers.map((signer, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Signatário {index + 1}</h4>
                    {signers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSigner(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor={`name-${index}`}>Nome completo</Label>
                      <Input
                        id={`name-${index}`}
                        value={signer.name}
                        onChange={(e) =>
                          updateSigner(index, 'name', e.target.value)
                        }
                        placeholder="Nome do signatário"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={signer.email}
                        onChange={(e) =>
                          updateSigner(index, 'email', e.target.value)
                        }
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Signer Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addSigner}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar outro signatário
            </Button>

            {/* Info */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Como funciona?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Os signatários receberão um email com o link para assinar</li>
                <li>• As assinaturas são realizadas através da plataforma ZapSign</li>
                <li>• Você receberá notificações sobre o status das assinaturas</li>
                <li>• O contrato assinado ficará disponível para download</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar para Assinatura'
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
