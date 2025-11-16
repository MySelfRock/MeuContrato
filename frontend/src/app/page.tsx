import Link from 'next/link'
import { FileText, Zap, Shield, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MeuContrato</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Criar Conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Crie Contratos Profissionais em{' '}
              <span className="text-primary">Minutos</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Use inteligência artificial para gerar contratos juridicamente consistentes.
              Simples, rápido e profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-lg font-medium hover:bg-primary/90"
              >
                Começar Grátis
              </Link>
              <Link
                href="/templates"
                className="border border-input bg-background px-8 py-3 rounded-md text-lg font-medium hover:bg-accent"
              >
                Ver Templates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher MeuContrato?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background p-6 rounded-lg border">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Rápido e Fácil</h3>
              <p className="text-muted-foreground">
                Responda algumas perguntas simples e receba seu contrato pronto em minutos.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Juridicamente Válido</h3>
              <p className="text-muted-foreground">
                Contratos gerados com IA treinada em documentos jurídicos profissionais.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <CheckCircle className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Personalizável</h3>
              <p className="text-muted-foreground">
                Edite e ajuste seu contrato conforme suas necessidades específicas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Templates Disponíveis</h2>
          <p className="text-center text-muted-foreground mb-12">
            Escolha entre diversos modelos profissionais
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              'Prestação de Serviços',
              'Aluguel Residencial',
              'Confidencialidade (NDA)',
              'Parceria Comercial',
              'Compra e Venda',
              'Freelancer',
            ].map((template) => (
              <div
                key={template}
                className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
              >
                <FileText className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{template}</h3>
                <p className="text-sm text-muted-foreground">
                  Contrato profissional pronto para personalizar
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/templates" className="text-primary hover:underline font-medium">
              Ver todos os templates →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl mb-8 opacity-90">
            Crie seu primeiro contrato gratuitamente hoje mesmo
          </p>
          <Link
            href="/signup"
            className="bg-background text-foreground px-8 py-3 rounded-md text-lg font-medium hover:bg-background/90 inline-block"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 MeuContrato. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
