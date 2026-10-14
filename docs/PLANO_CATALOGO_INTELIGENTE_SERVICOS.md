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

- [x] Criar seleção e filtros adequados para tela pequena.
- [x] Permitir revisão individual dos serviços selecionados.
- [x] Criar os serviços em lote com feedback por item.
- [x] Atualizar imediatamente catálogo, configuração e agenda.
- [ ] Validar acessibilidade, teclado, rolagem e estados de carregamento.

Implementação da Fase 3:

- Operação → Serviços ganhou o botão “Serviços sugeridos”, com fluxo em tela cheia;
- busca por texto e filtros entre os segmentos da própria unidade, omitindo sugestões já cadastradas;
- seleção múltipla seguida de revisão individual de preço, duração, modalidade, preparação, deslocamento e profissionais;
- integração com o mesmo endpoint transacional da web, com resultado por serviço criado ou ignorado;
- bloqueio de toques repetidos durante o envio e preservação da revisão em caso de erro;
- atualização da lista e dos dados operacionais após importar; a agenda consulta os serviços novamente ao receber foco;
- suporte aos dois temas, áreas seguras, teclado, rolagem e rótulos de acessibilidade.

### Aceite Manual Da Fase 3

1. Com as migrations e o seed das Fases 1–2 aplicados, entrar como gestor no mobile.
2. Abrir Operação → Serviços → Serviços sugeridos.
3. Conferir os filtros da unidade e pesquisar por nome ou especialidade.
4. Selecionar dois serviços, abrir “Revisar selecionados” e preencher preços (incluindo valor com vírgula).
5. Ajustar duração e preparação, escolher modalidade e profissionais e adicionar.
6. Conferir o resultado por item, fechar e verificar os serviços na lista e na agenda.
7. Reabrir e conferir que serviços já importados não reaparecem; testar cadastro manual e edição.
8. Testar erro de conexão e limite do plano: a revisão deve permanecer disponível para correção e nova tentativa.
9. Validar em Android/iOS os dois temas, teclado, leitor de tela e rolagem de uma seleção extensa.

Verificação: `git diff --check` sem problemas. A checagem TypeScript local foi executada, mas não passou devido a dependências não resolvidas e erros existentes em outros arquivos do mobile. Nenhum diagnóstico foi reportado no novo componente `ServicosSugeridos.tsx`. O aceite visual em aparelho permanece pendente.

## Fase 4 — Curadoria E Governança

Status: implementação concluída. Os três testes automatizados passaram; a aplicação da migration no ambiente e o aceite visual não foram realizados nesta execução. A Fase 5 concentra a validação final.

- [x] Criar manutenção administrativa do catálogo global.
- [x] Permitir ativar, desativar e ordenar sugestões sem removê-las.
- [x] Registrar autoria e auditoria de alterações.
- [x] Adicionar imagens específicas e requisitos operacionais por sugestão.
- [x] Medir sugestões mais adotadas sem compartilhar dados entre tenants.

### Implementação Da Fase 4

O painel web do superadmin possui a seção expansível “Catálogo global de serviços”. Permite criar e editar sugestões, definir segmento e especialidades, imagem, ordem, modalidade, duração, preparação, requisitos e recursos necessários. Não há exclusão: a desativação remove a sugestão das consultas para importação, preservando serviços já cadastrados.

As rotas `GET/POST /catalogo/admin` e `PUT /catalogo/admin/:id` exigem autenticação e papel `SUPER_ADMIN` ou `APP_OWNER`. Cada gravação cria um log global com administrador, data e snapshots anterior/novo dentro da mesma transação. A consulta administrativa inclui as últimas 50 alterações e métricas agregadas de adoção, sem nomes, preços, IDs de estabelecimentos ou dados de clientes.

Os requisitos e recursos são copiados nas novas importações; alterações no catálogo não atualizam serviços já importados. O seed preserva registros existentes, inclusive sugestões desativadas ou personalizadas, e utiliza imagens pertinentes aos segmentos para novas sugestões.

A curadoria desta fase fica no painel administrativo web. A seleção e importação mobile continuam utilizando o catálogo global atualizado.

### Aceite Manual Da Fase 4

1. Aplicar a migration `20261013230000_add_catalog_curation`, gerar o Prisma Client e reiniciar o backend com os comandos existentes em `docs/COMANDOS.md`.
2. Entrar como superadmin na web e abrir “Catálogo global de serviços → Gerenciar”.
3. Editar uma sugestão: alterar imagem, ordem, preparação e requisitos/recursos; salvar e conferir a auditoria.
4. Desativar a sugestão e confirmar que deixa de aparecer para novas importações na web e no mobile.
5. Confirmar que serviços já importados preservam os valores anteriores.
6. Reativar e importar em uma unidade compatível; conferir os requisitos e recursos copiados.
7. Executar novamente o seed e confirmar que as alterações administrativas são preservadas.
8. Conferir a classificação de adoção e testar acesso negado com uma conta de gestor ou cliente.

Verificação automática: três testes de autorização, validação e gravação com auditoria passaram no container. Na Fase 5, a consulta de status confirmou as 33 migrations aplicadas no banco `uniflow_abs`. O aceite visual permanece pendente.

## Fase 5 — Aceite Final

- [ ] Validar criação web e mobile com estabelecimentos multissegmento.
- [x] Validar limites de assinatura e permissões de equipe com testes automatizados.
- [ ] Validar ausência de duplicidades em concorrência e repetição de requisição.
- [x] Validar que alterações futuras no catálogo não modificam serviços já importados com testes automatizados.
- [x] Documentar operação, rollback e critérios de publicação.

Status: verificações automatizadas executadas; aceite final condicionado aos testes de interface e concorrência com banco real abaixo. Não considerar os itens pendentes como homologados.

### Evidências Executadas

- 11 testes passaram em `servico-sugeridos.spec.ts` e `catalogo-admin.controller.spec.ts`, cobrindo dois segmentos, cópia de requisitos/recursos, profissional de outro tenant, limite de plano, assinatura bloqueada, repetição sem alteração do preço, nome manual existente, sugestões indisponíveis, permissões e auditoria da curadoria.
- Os testes do repositório utilizam transação simulada; não comprovam comportamento concorrente do MySQL.
- `prisma migrate status`: 33 migrations, banco `uniflow_abs` atualizado. Nenhuma migration foi aplicada nesta fase.
- `git diff --check` passou.
- A checagem TypeScript web foi executada; encontrou erros preexistentes em `useSolicitacaoEstabelecimento.ts:150` e `marketplace/marcadores.ts:22`. Nenhum diagnóstico no código alterado do catálogo. Esses erros impedem o aceite de compilação completo.

### Correções Encontradas No Aceite

- Lotes com itens nulos passam a retornar erro de validação em vez de erro interno.
- Importação presencial grava deslocamento zero.
- O status de assinatura é revalidado dentro da transação e segmentos desativados são excluídos da importação.
- A verificação antecipada de capacidade foi removida do controller: a decisão de capacidade e idempotência ocorre dentro da transação protegida pelo lock do estabelecimento.
- A edição manual web salva duração em minutos, calcula slots e preserva modalidade/preparação dos serviços importados.

### Testes Manuais Restantes

1. Em uma unidade com dois segmentos, importar serviços pela web e mobile e confirmar preços, duração, imagens, profissionais e disponibilidade para agenda.
2. Editar na web a duração de um serviço importado e confirmar a nova duração no mobile e na agenda.
3. Usar dois dispositivos/sessões na mesma unidade e importar simultaneamente a mesma sugestão: deve existir um único serviço e a outra operação deve informar que já foi adicionado.
4. Repetir o cenário perto do limite do plano com sugestões diferentes: a soma não pode ultrapassar o limite e o lote recusado não deve criar registros parciais.
5. Alterar/desativar uma sugestão como superadmin e conferir que serviços já importados preservam preço, duração e vínculos.
6. Validar temas, teclado, leitor de tela, fonte ampliada e rolagem no Android/iOS.

### Operação E Recuperação

- Aplicar migrations e gerar o Prisma Client antes de publicar o código; executar o seeder específico somente para incluir sugestões ausentes. Os comandos já estão em `docs/COMANDOS.md`.
- Desativar uma sugestão pelo superadmin para suspender novas adoções, preservando as unidades que já a importaram.
- Para desfazer uma alteração de curadoria, consultar o snapshot anterior na auditoria e restaurar os campos pelo painel; a restauração gera outro log.
- Para desfazer uma importação acidental, excluir os serviços pela gestão da própria unidade somente se não houver vínculos que impeçam exclusão. Serviços utilizados exigem avaliação dos registros dependentes; não apagar dados de agenda ou financeiro para liberar a exclusão.
- Não usar `migrate reset` como rollback. As migrations deste catálogo são aditivas; em caso de regressão, interromper novas importações e corrigir por nova migration, preservando dados e referências existentes.

### Critérios De Publicação

Liberar o aceite final após os testes manuais acima, confirmação das migrations no ambiente alvo e checagem TypeScript completa sem erros. Registrar ambiente, data e responsável pelas validações. Os cenários automatizados devem continuar passando antes da publicação.

## Estado Atual

As Fases 1–4 estão implementadas; o aceite visual mobile e da curadoria permanece pendente. A Fase 4 adiciona uma migration para requisitos/recursos das sugestões. A checagem TypeScript da Fase 3 tem os impedimentos registrados acima; os testes focados de governança da Fase 4 passaram.

A Fase 5 teve sua parte automatizada executada, com correções e 11 testes aprovados. As migrations estão aplicadas no banco local. O aceite final segue pendente de validação visual, concorrência com MySQL real e resolução dos erros de TypeScript registrados acima.

### Ajuste De Usabilidade — Serviços No Mobile

Editar e Excluir passaram a ser botões com ícone, contorno, feedback de toque e altura mínima de 48 pontos. Ficam abaixo do resumo do serviço, com rótulos de acessibilidade que identificam o item. A exclusão continua exigindo confirmação. Validar em aparelho com nomes longos, fonte ampliada e temas claro/escuro.
