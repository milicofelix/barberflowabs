# Plano — Catálogo Inteligente De Serviços

## Objetivo

Reduzir o trabalho inicial do proprietário sem criar serviços desnecessários dentro do estabelecimento. O UniFlow ABS mantém um catálogo global de sugestões por segmento e especialidade; o proprietário escolhe somente o que oferece, ajusta preço, duração e profissionais e então cria seus próprios serviços.

O catálogo global nunca participa diretamente da agenda, dos relatórios, do financeiro ou dos limites do plano. Somente o serviço efetivamente adicionado ao estabelecimento passa a fazer parte desses fluxos.

## Princípios

- sugestões globais não pertencem a nenhum estabelecimento;
- preço não é imposto pelo catálogo e deve ser informado pelo responsável;
- serviços importados tornam-se independentes da sugestão original;
- cadastro manual existente continua disponível;
- seleção e criação precisam ser idempotentes e isoladas por tenant;
- web e mobile devem oferecer as mesmas opções.

## Fase 1 — Domínio, Contratos E Seeder

- [x] Criar domínio global de serviços sugeridos.
- [x] Relacionar sugestões com segmento e especialidades.
- [x] Armazenar duração, preparação, modalidade e imagem padrão.
- [x] Criar migration isolada para evolução controlada pelo Prisma.
- [x] Criar seeder idempotente com serviços comuns dos seis segmentos atuais.
- [x] Disponibilizar consulta com filtros por segmento, especialidade e texto.
- [x] Integrar o catálogo ao seed principal sem criar serviços nos estabelecimentos.

### Contrato De Consulta

```http
GET /catalogo/servicos-sugeridos
GET /catalogo/servicos-sugeridos?segmentoIds=1,2
GET /catalogo/servicos-sugeridos?especialidadeIds=3,4&busca=massagem
```

Cada item retorna o segmento, as especialidades e os valores operacionais sugeridos. O endpoint não retorna preço porque esse valor pertence ao estabelecimento.

### Dados Iniciais

O seeder contém 36 sugestões distribuídas entre:

- barbearia;
- salão de beleza;
- manicure e pedicure;
- clínica de estética;
- spa e bem-estar;
- beleza, maquiagem, sobrancelhas e cílios.

### Aceite Manual Da Fase 1

1. Aplicar a migration e gerar novamente o Prisma Client usando os comandos já registrados em `docs/COMANDOS.md`.
2. Executar o seeder específico do catálogo inteligente.
3. Consultar `GET /catalogo/servicos-sugeridos` e confirmar a presença dos seis segmentos.
4. Filtrar por um `segmentoId` e confirmar que não há sugestões de outro segmento.
5. Executar o seed novamente e confirmar que os registros não são duplicados.
6. Confirmar que nenhum registro foi criado na tabela `servicos` de uma unidade somente por executar o seed.

## Fase 2 — Seleção E Criação Em Lote Na Web

- [ ] Adicionar a opção “Serviços sugeridos” ao gerenciamento de serviços.
- [ ] Pré-filtrar pelas classificações do estabelecimento.
- [ ] Permitir busca, seleção múltipla e revisão antes da criação.
- [ ] Solicitar preço e permitir ajustar duração, modalidade e preparação.
- [ ] Vincular especialidades e profissionais durante a criação.
- [ ] Impedir duplicidade e respeitar limites do plano de forma transacional.
- [ ] Manter a opção de cadastro personalizado.

## Fase 3 — Paridade Mobile

- [ ] Criar seleção e filtros adequados para tela pequena.
- [ ] Permitir revisão individual dos serviços selecionados.
- [ ] Criar os serviços em lote com feedback por item.
- [ ] Atualizar imediatamente catálogo, configuração e agenda.
- [ ] Validar acessibilidade, teclado, rolagem e estados de carregamento.

## Fase 4 — Curadoria E Governança

- [ ] Criar manutenção administrativa do catálogo global.
- [ ] Permitir ativar, desativar e ordenar sugestões sem removê-las.
- [ ] Registrar autoria e auditoria de alterações.
- [ ] Adicionar imagens específicas e requisitos operacionais por sugestão.
- [ ] Medir sugestões mais adotadas sem compartilhar dados entre tenants.

## Fase 5 — Aceite Final

- [ ] Validar criação web e mobile com estabelecimentos multissegmento.
- [ ] Validar limites de assinatura e permissões de equipe.
- [ ] Validar ausência de duplicidades em concorrência e repetição de requisição.
- [ ] Validar que alterações futuras no catálogo não modificam serviços já importados.
- [ ] Documentar operação, rollback e critérios de publicação.

## Estado Atual

A Fase 1 foi implementada em 13/10/2026. Migration, geração do Prisma Client, seed, testes e builds não foram executados automaticamente.
