'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { stripeApi } from '@/lib/api'
import { toast } from 'sonner'

const plans = [
  {
    name: 'FREE',
    price: 'R$ 0',
    period: '/mês',
    description: 'Perfeito para começar',
    features: [
      '2 contratos por mês',
      'Todos os templates',
      'Geração com IA',
      'Download em PDF',
      'Suporte por email',
    ],
    notIncluded: [
      'Assinatura digital',
      'API de integração',
      'Suporte prioritário',
    ],
    cta: 'Plano Atual',
    popular: false,
  },
  {
    name: 'PRO',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para profissionais',
    features: [
      '50 contratos por mês',
      'Todos os templates',
      'Geração com IA',
      'Download em PDF',
      'Prioridade na IA',
      'Suporte prioritário',
    ],
    notIncluded: [
      'Assinatura digital',
      'API de integração',
    ],
    cta: 'Fazer Upgrade',
    popular: true,
  },
  {
    name: 'BUSINESS',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para empresas',
    features: [
      'Contratos ilimitados',
      'Todos os templates',
      'Geração com IA',
      'Download em PDF',
      'Assinatura digital integrada',
      'API de integração',
      'Suporte prioritário',
      'Gerenciamento de equipe',
    ],
    notIncluded: [],
    cta: 'Fazer Upgrade',
    popular: false,
  },
]

export default function PlansPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (planName: string) => {
    if (!isAuthenticated()) {
      toast.error('Faça login para fazer upgrade')
      return
    }

    if (planName === 'FREE') {
      toast.info('Você já está no plano Free')
      return
    }

    setLoadingPlan(planName)

    try {
      const response = await stripeApi.createCheckoutSession(planName as 'PRO' | 'BUSINESS')

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error: any) {
      toast.error('Erro ao iniciar checkout')
      console.error(error)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await stripeApi.createPortalSession()

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error: any) {
      toast.error('Erro ao abrir portal de assinatura')
    }
  }

  const getButtonText = (planName: string) => {
    if (!isAuthenticated()) {
      return 'Fazer Login'
    }

    if (user?.plan === planName) {
      return 'Plano Atual'
    }

    if (planName === 'FREE') {
      return 'Downgrade'
    }

    return 'Fazer Upgrade'
  }

  const isButtonDisabled = (planName: string) => {
    return user?.plan === planName || loadingPlan !== null
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Escolha o plano ideal para você</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie contratos profissionais com inteligência artificial.
            Escolha o plano que melhor se adapta às suas necessidades.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 opacity-50">
                      <span className="h-4 w-4 flex-shrink-0">×</span>
                      <span className="text-sm line-through">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={isButtonDisabled(plan.name)}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    getButtonText(plan.name)
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Manage Subscription */}
        {user && user.plan !== 'FREE' && (
          <div className="text-center">
            <Button variant="outline" onClick={handleManageSubscription}>
              Gerenciar Assinatura
            </Button>
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Posso cancelar a qualquer momento?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento.
                  Você continuará tendo acesso até o final do período pago.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Como funcionam os créditos?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cada geração de contrato consome 1 crédito. Os créditos são
                  resetados todo mês. O plano BUSINESS tem créditos ilimitados.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Posso fazer upgrade/downgrade?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim! Você pode fazer upgrade ou downgrade a qualquer momento.
                  As mudanças serão aplicadas imediatamente com ajuste proporcional.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  A assinatura digital funciona para qualquer contrato?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim! Com o plano BUSINESS você pode enviar qualquer contrato
                  gerado para assinatura digital através da integração com ZapSign.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ainda tem dúvidas? Entre em contato conosco!
          </p>
          <Link href="/dashboard">
            <Button variant="ghost">
              <FileText className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
