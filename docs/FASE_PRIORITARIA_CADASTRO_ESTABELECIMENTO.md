# Fase Prioritaria — Cadastro E Aprovacao De Estabelecimentos

Status: Fase A implementada em 2026-10-11; migration, Prisma Client, reinicio e validacao manual pendentes.

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

- [ ] Reaproveitar conta autenticada.
- [ ] Criar passos guiados, cards de classificacao e mascaras.
- [ ] Integrar ViaCEP com tratamento de erro e edicao manual.
- [ ] Remover slug, latitude e longitude da responsabilidade do usuario.

### Fase C — Assistente Mobile

- [ ] Replicar contratos, passos, mascaras e ViaCEP.
- [ ] Preservar rascunho entre fechamentos do aplicativo.
- [ ] Garantir paridade visual e funcional com a web.

### Fase D — Revisao E Notificacoes

- [ ] Evoluir o painel do super admin.
- [ ] Implementar aprovacao transacional e pedido de correcao.
- [ ] Criar sino, contador e central web/mobile.
- [ ] Notificar solicitante e administradores em cada mudanca relevante.

### Fase E — Aceite

- [ ] Validar cadastro novo e solicitacao por cliente existente.
- [ ] Validar todos os tipos de estabelecimento.
- [ ] Confirmar que pendentes e reprovados nao aparecem publicamente.
- [ ] Confirmar promocao para responsavel somente apos aprovacao.
- [ ] Validar mascaras, CEP inexistente, falha do ViaCEP e preenchimento manual.

## Dependencias E Limites

- O ViaCEP deve ser usado para conveniencia, nao como prova de existencia do estabelecimento.
- A integracao deve ter timeout e permitir preenchimento manual quando indisponivel.
- Geocodificacao exige outro provedor e decisao sobre custo, termos e privacidade.
- CNPJ e comprovacao documental devem ser decididos juridicamente antes de serem obrigatorios.
- Nenhum dado pendente deve alimentar busca publica ou mapa.

Nenhuma migration, geracao do Prisma Client, teste, build ou integracao externa foi executada automaticamente nesta fase.
