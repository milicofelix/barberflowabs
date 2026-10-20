# ADR 0001 - Evolucao Para Plataforma Multissegmento

- Status: substituido pelo ADR 0002 em 2026-10-10
- Data: 2026-10-09
- Decisores: equipe Barber Flow ABS
- Nome escolhido para o produto: UniFlow ABS
- Status do rebranding: bloqueado ate validacao juridica

## Contexto

O produto atual foi construido para barbearias, mas sua base de autenticacao, multi-tenancy, catalogo, profissionais, agenda, marketplace, assinatura e gestao pode atender outros negocios de beleza, estetica e bem-estar.

Continuar o roadmap mobile antigo antes de generalizar o dominio criaria telas e contratos dependentes de `Barbearia`, `BARBER` e regras especificas de barbearia. Essas entregas precisariam ser refeitas durante a expansao para saloes, clinicas de estetica, esmalterias, spas e profissionais autonomos.

## Decisao

O sistema evoluira de forma incremental para uma plataforma SaaS multissegmento. Nao sera criado um projeto novo e nao havera reescrita integral.

Durante a transicao:

- `UniFlow ABS` sera o nome de trabalho escolhido para a transicao.
- `Barber Flow ABS` continua sendo o nome publico ate a aprovacao de uma nova marca.
- Entidades, tabelas e campos legados como `Barbearia` e `barbeariaId` serao preservados enquanto existirem consumidores dependentes deles.
- Novos conceitos de estabelecimento, segmento, especialidade e modelo de atendimento serao introduzidos por compatibilidade.
- Renomes fisicos de tabelas, campos, pacotes e rotas ocorrerao somente com migration e plano de descontinuacao proprios.
- SaaS operacional e marketplace continuarao desacoplados: um estabelecimento pode usar a gestao sem exposicao publica.
- Regras especificas de segmento serao configuradas, evitando copias de controllers, telas ou motores de agenda.

## Roadmap Mobile Legado

O roadmap mobile anterior fica congelado no checkpoint da Fase 3. A partir desta decisao:

- correcoes de defeito, seguranca e compatibilidade continuam permitidas;
- funcionalidades novas dependentes do dominio antigo nao devem ser iniciadas;
- area operacional, configuracoes, administracao e onboarding mobile serao retomados no roadmap multissegmento;
- o mapa nativo sera reavaliado junto ao marketplace multissegmento.

## Identidade

`UniFlow ABS` foi escolhido pelo responsavel do produto, mas a diligencia preliminar encontrou conflitos relevantes: dominios diretos ocupados, aplicativos com `uniFLOW` nas lojas e registros em vigor para `UNIFLOW` no INPI. A escolha fica registrada, mas o rebranding permanece bloqueado ate analise juridica das classes e do risco de colidencia.

Nenhum rebranding definitivo pode ocorrer antes de:

1. pesquisa fonetica e por radicais nas classes adequadas do INPI;
2. analise juridica de colidencia e registrabilidade;
3. verificacao de dominio principal e alternativas aceitaveis;
4. verificacao de nome e identificadores na App Store e Google Play;
5. aprovacao explicita do nome comercial.

## Consequencias Positivas

- Preserva os investimentos feitos nas Fases 1 a 3.
- Reduz implementacao duplicada no mobile.
- Permite migracoes pequenas e reversiveis.
- Mantem o produto atual executavel durante a transicao.
- Cria uma fronteira clara entre compatibilidade legada e dominio novo.

## Custos E Riscos

- Havera um periodo com nomenclatura interna antiga e linguagem publica nova.
- Adaptadores e aliases temporarios exigirao prazo de remocao documentado.
- Migracoes precisam preservar isolamento multi-tenant e dados existentes.
- Adiar indefinidamente a remocao do legado aumentaria complexidade; cada compatibilidade deve possuir criterio de saida.

## Alternativas Rejeitadas

### Continuar todas as fases antigas

Rejeitada porque ampliaria o volume de telas e contratos que depois precisariam ser generalizados.

### Reescrever do zero

Rejeitada porque descartaria recursos estaveis e aumentaria risco, prazo e custo sem necessidade tecnica demonstrada.

### Renomear todo o dominio imediatamente

Rejeitada porque acoplaria banco, API, web e mobile em uma unica mudanca de alto risco.
