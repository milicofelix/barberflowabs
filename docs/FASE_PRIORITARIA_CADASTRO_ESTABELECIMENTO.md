# Fase Prioritaria — Cadastro E Aprovacao De Estabelecimentos

Status: Fases A, B e C implementadas em 2026-10-11; migration, Prisma Client, reinicio e validacao manual pendentes.

Esta fase entra antes da Fase 2 da Etapa 10. Ela evolui o onboarding existente sem duplicar contas, sem publicar dados nao validados e sem exigir latitude ou longitude do solicitante.

## Diagnostico Do Estado Atual

Ja existem:

- cadastro pessoal de cliente;
- onboarding publico web e mobile em `POST /saas/onboarding`;
- tipos, segmentos e especialidades multissegmento;
- criacao com `reviewStatus = PENDING_REVIEW`;
- aprovacao e reprovacao pelo super admin;
- exclusao dos pendentes dos endpoints publicos;
- notificacao administrativa baseada em log de auditoria.

Precisam ser corrigidos:

- o onboarding sempre tenta criar outro usuario responsavel;
- uma conta de cliente existente nao pode solicitar seu estabelecimento com o mesmo e-mail;
- o responsavel recebe vinculo operacional antes da aprovacao;
- faltam CEP, logradouro, numero, complemento e referencia;
- classificacao ainda permite combinacoes confusas para usuarios leigos;
- telefone e CEP nao possuem comportamento uniforme de mascara;
- nao existe uma central real de notificacoes lidas e nao lidas;
- o solicitante nao acompanha claramente o estado da analise.

## Decisao De Fluxo

O cadastro pessoal continua unico. Toda pessoa entra inicialmente como cliente da plataforma.

Havera duas entradas para o mesmo assistente:

1. usuario nao autenticado escolhe **Cadastrar estabelecimento**, cria ou acessa sua conta e continua;
2. usuario autenticado escolhe **Quero cadastrar meu estabelecimento** em seu perfil.

O estabelecimento sera uma solicitacao vinculada ao usuario. O usuario continua cliente enquanto a solicitacao estiver pendente. O papel `ESTABLISHMENT_OWNER` e o acesso operacional somente serao liberados depois da aprovacao do super admin.

Nao sera usada uma aba misturada ao formulario simples de cadastro pessoal. A separacao reduz erros, mantem o login objetivo e permite um assistente com salvamento de progresso.

## Assistente De Cadastro

### Passo 1 — Conta Do Responsavel

- entrar com conta existente ou criar conta pessoal;
- nome, e-mail, telefone e senha;
- nunca solicitar novamente dados ja confirmados;
- impedir duplicidade de e-mail sem impedir que um cliente vire responsavel.

### Passo 2 — Tipo Do Negocio

Apresentar cards visuais, com selecao unica:

- barbearia;
- salao de beleza;
- manicure e pedicure;
- clinica de estetica;
- spa e bem-estar;
- estudio de beleza;
- profissional autonomo;
- outro.

Cada tipo sugere automaticamente o segmento principal e mostra apenas especialidades compativeis. O usuario confirma os servicos oferecidos sem digitar classificacoes livres.

### Passo 3 — Identificacao Comercial

Obrigatorios:

- nome publico;
- e-mail comercial;
- telefone comercial;
- modelo presencial, domiciliar ou hibrido;
- tipo, segmentos e pelo menos uma especialidade.

O slug sera gerado internamente e nao aparecera como campo editavel.

### Passo 4 — Endereco

Obrigatorios para atendimento presencial ou hibrido:

- CEP;
- logradouro;
- numero;
- bairro;
- cidade;
- UF.

Opcionais:

- complemento;
- ponto de referencia.

Ao receber oito digitos, o frontend consulta `https://viacep.com.br/ws/{cep}/json/` e preenche logradouro, bairro, cidade e UF. CEP inexistente retorna `erro: true`; formato invalido deve ser bloqueado antes da consulta. O endereco continua editavel porque a fonte pode estar desatualizada.

O ViaCEP nao fornece coordenadas geograficas. Latitude e longitude permanecem nulas na solicitacao e serao preenchidas ou validadas posteriormente pelo super admin por meio de um provedor de geocodificacao ainda a escolher.

### Passo 5 — Revisao E Envio

- resumo de todos os dados;
- aceite dos termos e declaracao de veracidade;
- envio idempotente;
- protocolo e estado inicial `PENDING_REVIEW`;
- tela de acompanhamento com data e historico da solicitacao.

## Mascaras E Normalizacao

- CEP exibido como `00000-000` e enviado apenas com oito digitos;
- telefone exibido como `(00) 00000-0000` ou `(00) 0000-0000` e persistido normalizado;
- UF em duas letras maiusculas;
- e-mail sem espacos e normalizado para minusculas;
- slug gerado no backend;
- valores de documento, caso sejam adicionados, sempre normalizados no backend.

As mascaras melhoram a digitacao, mas a validacao definitiva sempre ocorre no backend.

## Modelo E Migration

Criar `SolicitacaoEstabelecimento` separada do estabelecimento operacional, contendo:

- `usuarioId` do solicitante;
- dados comerciais e classificacao;
- endereco estruturado e retorno relevante do ViaCEP;
- status `RASCUNHO`, `PENDING_REVIEW`, `APPROVED`, `REJECTED` ou `CANCELED`;
- motivo, revisor e datas da revisao;
- versao dos termos e data de aceite;
- controle de versao para evitar sobrescrita concorrente.

Na aprovacao, uma transacao deve:

1. validar novamente e bloquear a solicitacao;
2. criar o estabelecimento, unidade, segmentos e especialidades;
3. criar assinatura e configuracoes iniciais;
4. vincular o solicitante como `ESTABLISHMENT_OWNER`;
5. registrar auditoria;
6. marcar a solicitacao como aprovada;
7. criar notificacao para o solicitante.

Solicitacoes reprovadas nao criam estabelecimento operacional nem aparecem no marketplace.

## Sininho E Central De Notificacoes

Criar notificacao propria, sem reutilizar `LogAuditoria` como caixa de entrada:

- destinatario;
- tipo, titulo e mensagem;
- prioridade;
- rota ou acao de destino;
- data de leitura;
- data de expiracao opcional;
- dados adicionais controlados.

O sino aparecera no topo da web e do mobile, com contador de nao lidas. Eventos iniciais:

- nova solicitacao para super admins;
- solicitacao aprovada ou reprovada para o solicitante;
- pedido de correcao cadastral;
- avisos operacionais e de assinatura importantes.

Contratos previstos:

- `GET /notificacoes`
- `GET /notificacoes/nao-lidas/total`
- `PUT /notificacoes/:id/ler`
- `PUT /notificacoes/ler-todas`

## Aprovacao Administrativa

O super admin deve visualizar:

- dados do responsavel;
- tipo, segmentos e especialidades;
- endereco estruturado e link para conferencia externa;
- possiveis duplicidades por nome, telefone e endereco;
- historico de alteracoes;
- acoes de aprovar, solicitar correcao ou reprovar com motivo.

Somente `APPROVED` materializa o estabelecimento e permite sua futura publicacao. A publicacao no marketplace continua condicionada ao perfil operacional minimo: endereco validado, servico, profissional e horario configurados.

## Fases De Implementacao

### Fase A — Dominio E Contratos

- [x] Criar solicitacao, endereco estruturado e notificacao persistente.
- [x] Criar migration e rollback manual.
- [x] Separar solicitacao de estabelecimento operacional.
- [x] Criar APIs autenticadas de rascunho, envio e acompanhamento.

Contratos implementados:

- `GET /solicitacoes-estabelecimento`
- `POST /solicitacoes-estabelecimento`
- `GET /solicitacoes-estabelecimento/configuracao`
- `GET /solicitacoes-estabelecimento/:id`
- `PUT /solicitacoes-estabelecimento/:id`
- `POST /solicitacoes-estabelecimento/:id/enviar`

O `POST` reutiliza um rascunho ou uma solicitacao ativa do mesmo usuario para evitar duplicidade. O `PUT` exige a versao atual e rejeita sobrescrita concorrente. O envio valida campos obrigatorios, plano, tipo, modalidade e compatibilidade entre segmentos e especialidades antes de mudar para `PENDING_REVIEW`.

O onboarding antigo permanece temporariamente ativo. Web e mobile migrarao para os novos contratos nas Fases B e C; sua remocao so ocorrera depois da paridade e do aceite manual.

### Fase B — Assistente Web

- [x] Reaproveitar conta autenticada.
- [x] Criar passos guiados, cards de classificacao e mascaras.
- [x] Integrar ViaCEP com tratamento de erro e edicao manual.
- [x] Remover slug, latitude e longitude da responsabilidade do usuario.

O onboarding web agora exige uma conta pessoal autenticada e retorna ao assistente apos login ou cadastro. O fluxo salva o rascunho entre os passos, sugere segmentos conforme o tipo do negocio, limita as especialidades aos segmentos escolhidos e apresenta revisao antes do envio. Solicitacoes ja enviadas exibem protocolo e estado de acompanhamento em vez de permitir nova edicao.

O CEP possui validacao local, timeout de sete segundos, tratamento de CEP inexistente e preenchimento manual como alternativa. Telefone, CEP, UF e e-mail sao formatados na interface e novamente normalizados pelo backend. Slug e coordenadas nao aparecem no formulario.

### Fase C — Assistente Mobile

- [x] Replicar contratos, passos, mascaras e ViaCEP.
- [x] Preservar rascunho entre fechamentos do aplicativo.
- [x] Garantir paridade visual e funcional com a web.

O mobile passou a utilizar a solicitacao autenticada da Fase A e deixou de criar outro usuario responsavel pelo endpoint legado. O retorno apos login ou cadastro preserva o destino do assistente. Os cinco passos, classificacao guiada, mascaras, consulta de CEP, revisao, aceite, protocolo e acompanhamento seguem as mesmas regras da web.

O rascunho e o passo atual tambem sao mantidos no armazenamento local por usuario, solicitacao e versao. Dados locais somente sao restaurados quando ainda correspondem a versao do servidor, evitando sobrescrever uma alteracao mais recente feita em outro dispositivo.

#### Passo A Passo Manual — Fase C

Pre-requisitos:

1. Aplicar a migration da Fase A e gerar o Prisma Client usando os comandos registrados em `docs/COMANDOS.md`.
2. Reiniciar o container da aplicacao para o backend carregar o novo modulo e o Prisma Client atualizado.
3. Iniciar o Expo com o IP correto da maquina e abrir o aplicativo pelo QR Code.
4. Usar uma conta sem solicitacao enviada. Depois do envio, a mesma conta mostrara o acompanhamento e nao iniciara outro rascunho.

Cenario 1 — Entrada sem autenticacao e retorno apos login:

1. Sair da conta no aplicativo.
2. Na tela de login, tocar em **Quero cadastrar meu estabelecimento**.
3. Confirmar que a tela explica que primeiro e necessario acessar uma conta.
4. Tocar em **Entrar ou criar conta**.
5. Entrar com uma conta existente ou criar uma conta pessoal.
6. Confirmar que o aplicativo retorna automaticamente ao assistente de cadastro.
7. Confirmar que nome, e-mail e telefone do responsavel sao os dados da conta atual e que nao existem campos de nova senha ou novo responsavel.

Cenario 2 — Entrada pela conta de cliente existente:

1. Entrar normalmente no aplicativo.
2. Abrir a aba de perfil do usuario.
3. Tocar em **Cadastrar meu estabelecimento**.
4. Confirmar que o mesmo assistente e aberto e que nao e criada outra conta.

Cenario 3 — Tipo, segmentos e especialidades:

1. Avancar pelo passo do responsavel.
2. Selecionar cada card de tipo de negocio e observar a sugestao de segmentos.
3. Selecionar e remover segmentos.
4. Confirmar que somente especialidades pertencentes aos segmentos atuais permanecem selecionadas.
5. Tentar continuar sem segmento ou especialidade e confirmar a mensagem de validacao.
6. Selecionar pelo menos um segmento e uma especialidade e continuar.

Cenario 4 — Dados comerciais e mascaras:

1. Informar nome publico, e-mail e telefone comercial.
2. Confirmar a mascara de telefone `(00) 00000-0000` ou `(00) 0000-0000`.
3. Selecionar atendimento presencial, domiciliar e hibrido, conferindo as opcoes.
4. Selecionar um plano.
5. Tentar continuar com e-mail ou telefone invalido e confirmar que o passo e bloqueado.
6. Corrigir os dados e continuar.
7. Confirmar que nenhum campo solicita slug, latitude ou longitude.

Cenario 5 — ViaCEP e preenchimento manual:

1. Para atendimento presencial ou hibrido, informar um CEP valido com oito digitos.
2. Tocar no icone de busca e confirmar o preenchimento de logradouro, bairro, cidade e UF.
3. Alterar manualmente um dos campos preenchidos e confirmar que a edicao e permitida.
4. Informar numero, complemento e ponto de referencia.
5. Testar um CEP inexistente e confirmar a mensagem sem apagar a possibilidade de preenchimento manual.
6. Tentar continuar sem os campos obrigatorios e confirmar o bloqueio.
7. Voltar ao passo comercial, escolher atendimento domiciliar e confirmar que o endereco deixa de ser obrigatorio.

Cenario 6 — Persistencia do rascunho:

1. Preencher parcialmente um dos passos e aguardar pelo menos um segundo.
2. Fechar completamente o aplicativo, sem enviar a solicitacao.
3. Abrir o aplicativo novamente com a mesma conta.
4. Retornar ao cadastro do estabelecimento.
5. Confirmar que o passo e os valores digitados foram restaurados.
6. Alterar um dado, avancar e repetir o fechamento para confirmar tambem o rascunho salvo no backend.

Cenario 7 — Revisao e envio:

1. Conferir tipo, nome, contato, segmentos, especialidades e endereco no resumo.
2. Tentar enviar sem marcar a declaracao e confirmar o bloqueio.
3. Marcar a declaracao de veracidade e aceite dos termos.
4. Tocar em **Enviar para analise** apenas uma vez.
5. Confirmar a exibicao do protocolo, do estado **Em analise** e da data de envio.
6. Fechar e abrir o aplicativo e confirmar que a tela continua exibindo o acompanhamento, sem criar novo rascunho.

Cenario 8 — Protecao da publicacao:

1. Voltar para a busca publica e para o mapa.
2. Pesquisar pelo nome informado no cadastro.
3. Confirmar que a solicitacao pendente nao aparece como estabelecimento publico.
4. Confirmar que a conta continua com perfil de cliente enquanto aguarda a aprovacao administrativa.

Resultado esperado: todos os cenarios acima funcionam igualmente em Android e iOS. Qualquer divergencia deve ser registrada com plataforma, passo, dados utilizados, mensagem apresentada e captura de tela.

### Fase D — Revisao E Notificacoes

- [x] Evoluir o painel do super admin.
- [x] Implementar aprovacao transacional e pedido de correcao.
- [x] Criar sino, contador e central web/mobile.
- [x] Notificar solicitante e administradores em cada mudanca relevante.

O painel administrativo passou a consultar diretamente as solicitacoes criadas pelas Fases A–C. A aprovacao materializa, em uma unica transacao, o estabelecimento, a matriz, a assinatura de teste, segmentos, especialidades, comissao e formas de pagamento iniciais; somente depois promove o solicitante a responsavel. Correcao e reprovacao nao criam registros operacionais.

Uma chave unica por usuario protege o ciclo ativo contra rascunhos concorrentes. A migration consolida duplicidades antigas, preservando a solicitacao pendente mais relevante e cancelando apenas rascunhos ativos excedentes. A solicitacao aprovada guarda o estabelecimento gerado para garantir rastreabilidade e idempotencia.

Contratos administrativos implementados:

- `GET /admin/solicitacoes-estabelecimento`
- `GET /admin/solicitacoes-estabelecimento/:id`
- `PUT /admin/solicitacoes-estabelecimento/:id/aprovar`
- `PUT /admin/solicitacoes-estabelecimento/:id/solicitar-correcao`
- `PUT /admin/solicitacoes-estabelecimento/:id/reprovar`

A central persistente de notificacoes está disponível nos cabecalhos autenticados da web e nas telas principais do mobile, com contador, leitura individual e coletiva. As decisoes administrativas geram notificacao para o solicitante e auditoria da operacao.

#### Passo A Passo Manual — Fase D

1. Aplicar a migration e gerar o Prisma Client pelos comandos já documentados em `docs/COMANDOS.md`; reiniciar a aplicacao.
2. Enviar uma solicitacao com uma conta de cliente e confirmar o sino do super admin.
3. Abrir **Admin SaaS** na web e confirmar responsável, classificacao, endereco e link de conferencia.
4. Solicitar correcao com motivo e confirmar que o cliente recebe a notificacao e volta a editar o mesmo cadastro.
5. Reenviar e aprovar; confirmar que o estabelecimento, a matriz e a assinatura foram criados uma unica vez e que a conta virou responsavel.
6. Repetir com uma solicitacao destinada à reprovacao e confirmar que nenhum estabelecimento foi materializado.
7. Na web e no mobile, abrir o sino, ler uma notificacao e usar **Marcar todas como lidas**; confirmar o contador zerado.
8. Confirmar que uma solicitacao pendente continua ausente do marketplace e que uma aprovada só será publicada depois da configuracao operacional minima.

### Fase E — Aceite

- [ ] Validar cadastro novo e solicitacao por cliente existente.
- [ ] Validar todos os tipos de estabelecimento.
- [x] Confirmar que pendentes e reprovados nao aparecem publicamente.
- [x] Confirmar promocao para responsavel somente apos aprovacao.
- [ ] Validar mascaras, CEP inexistente, falha do ViaCEP e preenchimento manual.

#### Resultado Do Aceite Técnico — 12/10/2026

O aceite foi iniciado contra o ambiente local e encontrou dois defeitos, corrigidos durante a verificacao:

1. a retomada do cadastro falhava porque o `upsert` do Prisma recebia `data` em vez de `create`;
2. um estabelecimento aprovado podia responder pelo perfil público antes de possuir servico, profissional e horario.

Depois da correcao e reinicio do servico, foi confirmado:

- rotas de solicitacao, administracao e notificacao registradas pelo backend;
- solicitacao real `#1` aprovada e vinculada ao estabelecimento `#24`;
- solicitante promovido de cliente para `ESTABLISHMENT_OWNER` somente na aprovacao;
- criacao transacional de matriz, assinatura trial, segmento, especialidade, comissao e formas de pagamento;
- notificacoes de envio e aprovacao persistidas para o solicitante;
- rascunho concorrente `#2` consolidado como cancelado;
- perfil aprovado, mas ainda sem servico, profissional e horario, retornando `404` na API pública;
- filtros públicos exigindo `APPROVED` e configuração operacional mínima.

Os tres itens ainda desmarcados exigem interacao manual completa nas interfaces. Devem ser executados em web, Android e iOS antes de encerrar a fase:

1. cadastro partindo de uma conta recém-criada e de outra conta cliente já existente;
2. um ciclo para cada um dos oito tipos de estabelecimento e três modelos de atendimento;
3. máscaras e cenários de CEP válido, inexistente, indisponibilidade do ViaCEP e preenchimento manual.

O reinicio do container `app` foi executado apenas para carregar as correcoes encontradas no aceite. Nenhum build, migration, seed ou suíte automatizada foi executado.

## Dependencias E Limites

- O ViaCEP deve ser usado para conveniencia, nao como prova de existencia do estabelecimento.
- A integracao deve ter timeout e permitir preenchimento manual quando indisponivel.
- Geocodificacao exige outro provedor e decisao sobre custo, termos e privacidade.
- CNPJ e comprovacao documental devem ser decididos juridicamente antes de serem obrigatorios.
- Nenhum dado pendente deve alimentar busca publica ou mapa.

Nenhuma migration, geracao do Prisma Client, build ou suíte automatizada foi executada nesta fase.
