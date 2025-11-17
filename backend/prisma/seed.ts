import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Contrato de Prestação de Serviços',
    slug: 'prestacao-servicos',
    category: 'Serviços',
    description: 'Contrato padrão para prestação de serviços profissionais',
    jsonSchema: {
      fields: [
        {
          id: 'contractor_name',
          label: 'Nome do Contratante',
          type: 'text',
          required: true,
          placeholder: 'Nome completo ou razão social'
        },
        {
          id: 'contractor_document',
          label: 'CPF/CNPJ do Contratante',
          type: 'text',
          required: true
        },
        {
          id: 'contractor_address',
          label: 'Endereço do Contratante',
          type: 'text',
          required: true
        },
        {
          id: 'provider_name',
          label: 'Nome do Prestador',
          type: 'text',
          required: true
        },
        {
          id: 'provider_document',
          label: 'CPF/CNPJ do Prestador',
          type: 'text',
          required: true
        },
        {
          id: 'provider_address',
          label: 'Endereço do Prestador',
          type: 'text',
          required: true
        },
        {
          id: 'service_description',
          label: 'Descrição dos Serviços',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva detalhadamente os serviços a serem prestados'
        },
        {
          id: 'payment_value',
          label: 'Valor do Pagamento',
          type: 'text',
          required: true,
          placeholder: 'R$ 0,00'
        },
        {
          id: 'payment_terms',
          label: 'Forma de Pagamento',
          type: 'textarea',
          required: true,
          placeholder: 'Ex: Pagamento em 3 parcelas mensais'
        },
        {
          id: 'start_date',
          label: 'Data de Início',
          type: 'date',
          required: true
        },
        {
          id: 'duration',
          label: 'Prazo de Duração',
          type: 'text',
          required: true,
          placeholder: 'Ex: 6 meses, indeterminado'
        }
      ]
    },
    aiPromptBase: `Você é um advogado especializado em contratos de prestação de serviços.
Gere um contrato de prestação de serviços completo e profissional incluindo:
- Qualificação das partes
- Objeto do contrato
- Obrigações do contratante e do contratado
- Valor e forma de pagamento
- Prazo de vigência
- Cláusulas de rescisão
- Confidencialidade (se aplicável)
- Multas e penalidades
- Foro competente

Use linguagem jurídica adequada, seja claro e objetivo.`
  },
  {
    name: 'Contrato de Aluguel Residencial',
    slug: 'aluguel-residencial',
    category: 'Imobiliário',
    description: 'Contrato de locação residencial completo',
    jsonSchema: {
      fields: [
        {
          id: 'landlord_name',
          label: 'Nome do Locador (Proprietário)',
          type: 'text',
          required: true
        },
        {
          id: 'landlord_document',
          label: 'CPF/CNPJ do Locador',
          type: 'text',
          required: true
        },
        {
          id: 'tenant_name',
          label: 'Nome do Locatário (Inquilino)',
          type: 'text',
          required: true
        },
        {
          id: 'tenant_document',
          label: 'CPF do Locatário',
          type: 'text',
          required: true
        },
        {
          id: 'property_address',
          label: 'Endereço Completo do Imóvel',
          type: 'textarea',
          required: true
        },
        {
          id: 'property_description',
          label: 'Descrição do Imóvel',
          type: 'textarea',
          required: true,
          placeholder: 'Ex: Apartamento com 2 quartos, 1 banheiro, sala, cozinha'
        },
        {
          id: 'rent_value',
          label: 'Valor do Aluguel Mensal',
          type: 'text',
          required: true
        },
        {
          id: 'due_date',
          label: 'Dia de Vencimento',
          type: 'number',
          required: true,
          placeholder: 'Ex: 10'
        },
        {
          id: 'deposit_value',
          label: 'Valor do Depósito Caução',
          type: 'text',
          required: false
        },
        {
          id: 'contract_duration',
          label: 'Prazo do Contrato',
          type: 'text',
          required: true,
          placeholder: 'Ex: 30 meses'
        },
        {
          id: 'start_date',
          label: 'Data de Início',
          type: 'date',
          required: true
        }
      ]
    },
    aiPromptBase: `Você é um advogado especializado em contratos de locação imobiliária.
Gere um contrato de aluguel residencial completo incluindo:
- Qualificação das partes
- Descrição do imóvel
- Finalidade da locação (residencial)
- Valor do aluguel e reajustes
- Forma e prazo de pagamento
- Responsabilidades do locador e locatário
- Benfeitorias e conservação
- Multa por atraso
- Rescisão antecipada
- Foro competente

Siga a Lei do Inquilinato (Lei 8.245/91).`
  },
  {
    name: 'Termo de Confidencialidade (NDA)',
    slug: 'nda',
    category: 'Confidencialidade',
    description: 'Acordo de não divulgação de informações confidenciais',
    jsonSchema: {
      fields: [
        {
          id: 'disclosing_party',
          label: 'Parte Reveladora (quem compartilha a informação)',
          type: 'text',
          required: true
        },
        {
          id: 'disclosing_document',
          label: 'CPF/CNPJ da Parte Reveladora',
          type: 'text',
          required: true
        },
        {
          id: 'receiving_party',
          label: 'Parte Receptora (quem recebe a informação)',
          type: 'text',
          required: true
        },
        {
          id: 'receiving_document',
          label: 'CPF/CNPJ da Parte Receptora',
          type: 'text',
          required: true
        },
        {
          id: 'purpose',
          label: 'Finalidade do Compartilhamento',
          type: 'textarea',
          required: true,
          placeholder: 'Ex: Avaliação de parceria comercial'
        },
        {
          id: 'confidential_info',
          label: 'Tipo de Informação Confidencial',
          type: 'textarea',
          required: true,
          placeholder: 'Ex: Dados técnicos, financeiros, estratégias de negócio'
        },
        {
          id: 'duration',
          label: 'Prazo de Confidencialidade',
          type: 'text',
          required: true,
          placeholder: 'Ex: 5 anos'
        },
        {
          id: 'signature_date',
          label: 'Data de Assinatura',
          type: 'date',
          required: true
        }
      ]
    },
    aiPromptBase: `Você é um advogado especializado em proteção de informações e propriedade intelectual.
Gere um Termo de Confidencialidade (NDA) completo incluindo:
- Qualificação das partes
- Definição de informação confidencial
- Obrigações de confidencialidade
- Exceções à confidencialidade
- Prazo de vigência
- Consequências do descumprimento
- Devolução de materiais
- Penalidades
- Foro competente

Use linguagem jurídica rigorosa para máxima proteção.`
  },
  {
    name: 'Contrato de Parceria Comercial',
    slug: 'parceria-comercial',
    category: 'Negócios',
    description: 'Acordo de parceria entre empresas ou profissionais',
    jsonSchema: {
      fields: [
        {
          id: 'partner_a_name',
          label: 'Nome do Parceiro A',
          type: 'text',
          required: true
        },
        {
          id: 'partner_a_document',
          label: 'CPF/CNPJ do Parceiro A',
          type: 'text',
          required: true
        },
        {
          id: 'partner_b_name',
          label: 'Nome do Parceiro B',
          type: 'text',
          required: true
        },
        {
          id: 'partner_b_document',
          label: 'CPF/CNPJ do Parceiro B',
          type: 'text',
          required: true
        },
        {
          id: 'partnership_purpose',
          label: 'Objeto da Parceria',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva o objetivo e escopo da parceria'
        },
        {
          id: 'responsibilities_a',
          label: 'Responsabilidades do Parceiro A',
          type: 'textarea',
          required: true
        },
        {
          id: 'responsibilities_b',
          label: 'Responsabilidades do Parceiro B',
          type: 'textarea',
          required: true
        },
        {
          id: 'revenue_split',
          label: 'Divisão de Receitas/Lucros',
          type: 'text',
          required: true,
          placeholder: 'Ex: 50% para cada parte'
        },
        {
          id: 'duration',
          label: 'Prazo da Parceria',
          type: 'text',
          required: true
        },
        {
          id: 'start_date',
          label: 'Data de Início',
          type: 'date',
          required: true
        }
      ]
    },
    aiPromptBase: `Você é um advogado especializado em contratos comerciais e parcerias.
Gere um contrato de parceria comercial completo incluindo:
- Qualificação das partes
- Objeto e finalidade da parceria
- Responsabilidades de cada parte
- Divisão de receitas, custos e lucros
- Propriedade intelectual
- Exclusividade (se aplicável)
- Confidencialidade
- Prazo e renovação
- Rescisão
- Resolução de conflitos
- Foro competente`
  },
  {
    name: 'Contrato de Compra e Venda',
    slug: 'compra-venda',
    category: 'Comercial',
    description: 'Contrato de compra e venda de bens ou produtos',
    jsonSchema: {
      fields: [
        {
          id: 'seller_name',
          label: 'Nome do Vendedor',
          type: 'text',
          required: true
        },
        {
          id: 'seller_document',
          label: 'CPF/CNPJ do Vendedor',
          type: 'text',
          required: true
        },
        {
          id: 'buyer_name',
          label: 'Nome do Comprador',
          type: 'text',
          required: true
        },
        {
          id: 'buyer_document',
          label: 'CPF/CNPJ do Comprador',
          type: 'text',
          required: true
        },
        {
          id: 'product_description',
          label: 'Descrição do Bem/Produto',
          type: 'textarea',
          required: true
        },
        {
          id: 'sale_value',
          label: 'Valor Total da Venda',
          type: 'text',
          required: true
        },
        {
          id: 'payment_terms',
          label: 'Condições de Pagamento',
          type: 'textarea',
          required: true
        },
        {
          id: 'delivery_terms',
          label: 'Condições de Entrega',
          type: 'textarea',
          required: true
        },
        {
          id: 'warranty',
          label: 'Garantia',
          type: 'text',
          required: false,
          placeholder: 'Ex: 90 dias'
        }
      ]
    },
    aiPromptBase: `Você é um advogado especializado em contratos de compra e venda.
Gere um contrato de compra e venda completo incluindo:
- Qualificação das partes
- Objeto da venda
- Preço e condições de pagamento
- Prazo e forma de entrega
- Garantias
- Vícios e defeitos
- Inadimplemento
- Rescisão
- Foro competente

Siga o Código Civil Brasileiro.`
  },
  {
    name: 'Contrato para Freelancer',
    slug: 'freelancer',
    category: 'Serviços',
    description: 'Contrato específico para trabalhos freelance e autônomos',
    jsonSchema: {
      fields: [
        {
          id: 'client_name',
          label: 'Nome do Cliente',
          type: 'text',
          required: true
        },
        {
          id: 'client_document',
          label: 'CPF/CNPJ do Cliente',
          type: 'text',
          required: true
        },
        {
          id: 'freelancer_name',
          label: 'Nome do Freelancer',
          type: 'text',
          required: true
        },
        {
          id: 'freelancer_document',
          label: 'CPF do Freelancer',
          type: 'text',
          required: true
        },
        {
          id: 'project_description',
          label: 'Descrição do Projeto',
          type: 'textarea',
          required: true
        },
        {
          id: 'deliverables',
          label: 'Entregas Esperadas',
          type: 'textarea',
          required: true
        },
        {
          id: 'project_value',
          label: 'Valor do Projeto',
          type: 'text',
          required: true
        },
        {
          id: 'payment_schedule',
          label: 'Cronograma de Pagamento',
          type: 'textarea',
          required: true
        },
        {
          id: 'deadline',
          label: 'Prazo de Entrega',
          type: 'date',
          required: true
        },
        {
          id: 'revisions',
          label: 'Número de Revisões Incluídas',
          type: 'number',
          required: true,
          placeholder: 'Ex: 2'
        }
      ]
    },
    aiPromptBase: `Você é um advogado especializado em contratos para freelancers e trabalho autônomo.
Gere um contrato de freelancer completo incluindo:
- Qualificação das partes
- Escopo do projeto
- Entregas e prazos
- Valor e forma de pagamento
- Revisões
- Propriedade intelectual (transferência de direitos)
- Confidencialidade
- Rescisão
- Responsabilidades
- Foro competente

Proteja ambas as partes de forma equilibrada.`
  }
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar templates existentes (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    await prisma.contractTemplate.deleteMany({});
    console.log('🗑️  Templates existentes removidos');
  }

  // Criar templates
  for (const template of templates) {
    await prisma.contractTemplate.create({
      data: template
    });
    console.log(`✅ Template criado: ${template.name}`);
  }

  console.log('✨ Seed concluído com sucesso!');
  console.log(`📄 ${templates.length} templates criados`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
