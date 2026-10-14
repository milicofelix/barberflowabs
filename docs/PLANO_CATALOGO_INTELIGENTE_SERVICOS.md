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

- [x] Adicionar a opção “Serviços sugeridos” ao gerenciamento de serviços.
- [x] Pré-filtrar pelas classificações do estabelecimento.
- [x] Permitir busca, seleção múltipla e revisão antes da criação.
- [x] Solicitar preço e permitir ajustar duração, modalidade e preparação.
- [x] Vincular especialidades e profissionais durante a criação.
- [x] Impedir duplicidade e respeitar limites do plano de forma transacional.
- [x] Manter a opção de cadastro personalizado.

Implementado em 13/10/2026:

- o painel web de Serviços mantém o formulário manual e ganhou uma área expansível de sugestões;
- sugestões são filtradas pelos segmentos configurados na unidade e por busca textual;
- cada item selecionado exige preço e permite revisar duração, modalidade, preparação, deslocamento e profissionais;
- a criação em lote copia os dados para serviços independentes e associa somente especialidades válidas para o estabelecimento;
- a referência de origem impede reimportação da mesma sugestão, inclusive após alteração do serviço criado;
- serviços manuais com o mesmo nome são preservados e a sugestão correspondente é ignorada;
- o backend valida tenant, profissionais, modalidade, limite do plano e duplicidade dentro da transação.

### Contrato De Importação

```http
POST /servicos/sugeridos/importar
```

O corpo contém `itens`, com `servicoSugeridoId`, `preco` e os ajustes operacionais opcionais. A resposta separa `criados` e `ignorados`, permitindo repetição segura da requisição.

### Aceite Manual Da Fase 2

1. Aplicar as migrations e gerar novamente o Prisma Client.
2. Entrar como gestor e abrir Gestão → Serviços → Serviços sugeridos.
3. Confirmar que aparecem somente sugestões dos segmentos do estabelecimento.
4. Buscar um serviço, selecionar dois itens, informar preços e escolher profissionais.
5. Adicionar e confirmar que os serviços aparecem na lista normal e continuam editáveis.
6. Repetir a mesma importação e confirmar que nenhum serviço é duplicado.
7. Validar uma conta próxima ao limite do plano e confirmar que o lote inteiro é recusado sem criação parcial.
8. Confirmar que “Novo serviço” continua criando um serviço personalizado normalmente.

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

As Fases 1 e 2 foram implementadas em 13/10/2026. Migrations, geração do Prisma Client, seed, testes e builds não foram executados automaticamente.
