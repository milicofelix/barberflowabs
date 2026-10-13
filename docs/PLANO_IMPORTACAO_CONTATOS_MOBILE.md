# Plano — Importacao Assistida De Contatos No Mobile

Status: Fases 1 a 5 implementadas; novo build nativo e aceite manual pendentes.

## Objetivo

Permitir que gestor, administrador ou atendente autorizado transforme contatos selecionados do celular em clientes do estabelecimento, sem depender de seeder, sem enviar toda a agenda do aparelho ao servidor e sem conceder consentimento de comunicacao automaticamente.

O importador VCF existente permanece como ferramenta administrativa excepcional para migracoes controladas.

## Principios

- A permissao de contatos sera solicitada somente depois de uma acao explicita em **Clientes > Importar do celular**.
- A recusa nao bloqueara o restante do aplicativo; cadastro manual e importacao administrativa continuarao disponiveis.
- Leitura, busca, exclusao de contatos sem nome e selecao inicial acontecerao no dispositivo.
- Apenas contatos confirmados na revisao serao enviados ao backend.
- Nenhum contato sera importado silenciosamente e **Selecionar todos** atuara somente sobre os resultados visiveis e elegiveis.
- A importacao cria o vinculo apenas com o estabelecimento ativo; nao compartilha a carteira entre unidades sem autorizacao.
- Importar um contato nao equivale a consentir com push, e-mail ou WhatsApp. Preferencias de comunicacao nascerao desativadas ate existir consentimento registravel.
- O backend permanecera autoritativo para permissao, normalizacao, deduplicacao, auditoria e isolamento multitenant.

## Fase 1 — Dominio, Identidade E Contratos

- [x] Permitir cliente operacional com nome e ao menos um meio de contato valido: telefone ou e-mail.
- [x] Separar e-mail real de identificador tecnico interno; endereco sintetico nunca podera ser usado para comunicacao.
- [x] Definir telefone canonico no formato E.164 para novos cadastros e importacoes.
- [x] Definir deduplicacao por estabelecimento e correspondencia segura com contas existentes.
- [x] Criar origem `IMPORTACAO_CONTATOS` e registrar lote, operador, data, totais e resultado.
- [x] Criar contrato de simulacao do lote, sem vincular clientes, retornando `NOVO`, `JA_VINCULADO`, `POSSIVEL_DUPLICADO`, `INVALIDO` ou `CONFLITO`.
- [x] Criar contrato idempotente de confirmacao, com uma chave unica por lote e limite de 200 contatos.

### Contratos entregues

- `POST /gestao/clientes/importacoes/simular`: recebe `chaveIdempotencia` e os contatos selecionados; cria somente a auditoria anonimizada do lote e devolve a classificacao individual.
- `POST /gestao/clientes/importacoes/:loteId/confirmar`: revalida os mesmos fingerprints, exige confirmacao para possiveis correspondencias e cria ou vincula os clientes.
- Cada contato possui `referencia`, `nome` e ao menos `telefone` ou `email`.
- O servidor normaliza telefones brasileiros para E.164, limita o lote a 200 itens e nao devolve dados privados de contas encontradas.
- A chave de idempotencia e unica dentro do estabelecimento. Repetir a simulacao ou a confirmacao devolve o lote existente sem duplicar vinculos.
- A auditoria persiste apenas fingerprint, referencia local, resultado e identificador interno quando aplicavel; nomes, telefones e e-mails nao sao copiados para o historico do lote.

### Regras de correspondencia

1. Vinculo ja existente no mesmo estabelecimento: nao duplicar.
2. E-mail real normalizado com correspondencia exata: propor vinculo com a conta existente sem expor dados privados adicionais.
3. Telefone canonico exato: tratar como possivel correspondencia e pedir confirmacao quando houver ambiguidade.
4. Mesmo nome, isoladamente, nunca sera suficiente para unir cadastros.
5. Conflitos nao serao resolvidos automaticamente; permanecerao na revisao.

## Fase 2 — Permissao Nativa E Leitura Local

- [x] Adicionar `expo-contacts` 57.0.7, compativel com o Expo 57 utilizado pelo projeto.
- [x] Configurar a mensagem de permissao de contatos no iOS e manter somente leitura no Android.
- [x] Implementar estados `NAO_SOLICITADA`, `CONCEDIDA`, `LIMITADA`, `NEGADA`, `BLOQUEADA` e `INDISPONIVEL`.
- [x] Preparar a finalidade para ser apresentada antes do dialogo nativo; nenhuma leitura ou solicitacao ocorre automaticamente.
- [x] Em acesso limitado, respeitar somente os contatos autorizados pelo sistema operacional.
- [x] Expor fallback para cadastro manual e abertura das configuracoes quando a futura interface detectar acesso negado ou bloqueado.
- [x] Ler somente os campos necessarios: nome, telefones e e-mails. Fotos, enderecos, notas e demais dados nao sao solicitados.

### Fundacao mobile entregue

- `contatosDispositivo.ts` encapsula permissao, traducao dos estados, leitura paginada e abertura das configuracoes do aplicativo.
- `useContatosDispositivo.ts` oferece o estado reativo para a interface da Fase 3 sem disparar o pedido de permissao na inicializacao.
- A leitura usa a API moderna `Contact.getAllDetails`, limitada a nome completo, telefones e e-mails e paginada em ate 200 contatos por chamada.
- O acesso limitado do iOS 18 e preservado como `LIMITADA`; o aplicativo nao tenta contornar a selecao feita pelo usuario.
- Na web, o recurso retorna `INDISPONIVEL`, mantendo cadastro manual e futuras alternativas por arquivo.
- O Android bloqueia `WRITE_CONTACTS`, adicionado pelo pacote, porque o UniFlow ABS precisa apenas ler contatos.
- Alteracoes no plugin nativo exigem novo development build ou novo binario; recarregar apenas o JavaScript nao aplica a permissao.

## Fase 3 — Selecao E Revisao No Dispositivo

- [x] Criar a acao **Importar do celular** na central de clientes e no agendamento assistido.
- [x] Exibir busca local, selecao individual e selecao dos resultados visiveis.
- [x] Ignorar contatos sem nome e contatos sem telefone nem e-mail validos.
- [x] Quando houver varios telefones ou e-mails, permitir escolher quais dados serao usados.
- [x] Normalizar e remover duplicidades locais antes da simulacao.
- [x] Limitar o tamanho de cada lote e processar listas grandes de forma paginada, sem travar a interface.
- [x] Mostrar uma revisao com quantidades de novos, existentes, duplicados, invalidos e conflitos.
- [x] Exigir confirmacao final antes do envio definitivo.

### Interface mobile entregue

- A entrada de importacao aparece em **Gestao diaria > Resumo**, que atualmente concentra a operacao de clientes, e tambem na etapa **Cliente** do agendamento assistido.
- A permissao nativa continua sendo solicitada somente depois da explicacao e da confirmacao do operador.
- A lista permanece local durante busca e selecao; somente o lote revisado, limitado a 200 contatos, segue para a simulacao do backend.
- Contatos sem nome ou sem telefone/e-mail sao excluidos, e duplicidades locais pelo dado escolhido nao entram no lote.
- A revisao identifica cada contato e apresenta os totais retornados pelo servidor antes da confirmacao definitiva.
- Ao concluir dentro do agendamento assistido, a busca de clientes e atualizada sem exigir troca de tela.

## Fase 4 — Importacao Idempotente No Backend

- [x] Proteger as rotas com uma permissao especifica de clientes ou, durante a transicao, `AGENDA_GERENCIAR`.
- [x] Validar que o operador pertence ao estabelecimento ativo.
- [x] Repetir normalizacao e deduplicacao no servidor; nunca confiar apenas no aparelho.
- [x] Gravar em transacoes curtas e lotes limitados, permitindo retomar uma importacao interrompida.
- [x] Criar ou vincular `ClienteEstabelecimento` sem transformar o contato em membro da equipe.
- [x] Manter preferencia de comunicacao desativada e sem data de consentimento.
- [x] Retornar o resultado individual de cada item sem revelar informacoes de clientes de outros estabelecimentos.
- [x] Produzir auditoria com operador, estabelecimento, lote, contagens e erros, evitando armazenar o conteudo integral da agenda.

### Backend idempotente entregue

- As rotas permanecem temporariamente sob `AGENDA_GERENCIAR`; a policy valida a permissao e o servico confirma novamente que operador e estabelecimento pertencem ao mesmo tenant.
- Reutilizar uma chave idempotente com os mesmos contatos devolve o lote existente; reutiliza-la com conteudo diferente retorna conflito.
- Criacoes concorrentes da mesma simulacao convergem para um unico lote pela chave unica do estabelecimento.
- A confirmacao processa cada contato em uma transacao curta e reserva o item antes de criar usuario ou vinculo, evitando processamento concorrente do mesmo registro.
- Uma confirmacao interrompida pode ser repetida: itens ja importados nao sao refeitos e a contagem final e recalculada pela auditoria persistida.
- Clientes importados recebem vinculo `ClienteEstabelecimento` com origem `IMPORTACAO_CONTATOS`, sem papel de equipe ou permissao operacional.
- Push, e-mail e WhatsApp nascem explicitamente sem consentimento; preferencias positivas preexistentes nunca sao sobrescritas.
- O historico armazena referencia local, fingerprint, classificacao, operador e totais, sem persistir nome, telefone ou e-mail integral no lote.

## Fase 5 — Resultado, Correcao E Uso Na Agenda

- [x] Exibir resumo final: importados, ja existentes, ignorados e pendentes de correcao.
- [x] Permitir corrigir nome, telefone ou e-mail somente dos itens com problema e reenviar esses itens.
- [x] Atualizar imediatamente a busca de clientes do agendamento assistido.
- [x] Permitir selecionar um cliente recem-importado e continuar o agendamento sem trocar de tela.
- [x] Impedir que repetir o mesmo lote gere usuarios ou vinculos duplicados.

### Resultado e continuidade entregues

- O resultado final separa clientes importados, ja existentes, ignorados pelo operador e contatos ainda pendentes de correcao.
- Somente itens `INVALIDO` ou `CONFLITO` liberam edicao de nome, telefone e e-mail; o operador tambem pode ignora-los sem alterar os demais resultados.
- Contatos corrigidos sao simulados em um novo lote, preservando a auditoria e os fingerprints do lote original.
- O backend devolve `clienteId` apenas para itens importados ou ja vinculados ao mesmo estabelecimento, sem expor correspondencias externas durante a simulacao.
- Dentro do agendamento assistido, **Usar na agenda** atualiza a busca, seleciona o cliente e fecha o importador sem trocar de tela.
- Repetir a confirmacao do mesmo lote devolve o resultado persistido e nao recria usuario, vinculo ou preferencia.

## Fase 6 — Privacidade, Seguranca E Aceite

- [ ] Documentar finalidade, base legal e prazo de retencao conforme a politica de privacidade e a LGPD.
- [ ] Garantir exclusao e desvinculacao pela central de clientes conforme as regras de historico e auditoria.
- [ ] Nao registrar nomes, telefones ou e-mails completos em logs tecnicos.
- [ ] Validar limites de lote, abuso, concorrencia, retomada, isolamento multitenant e dispositivos com pouca memoria.
- [ ] Validar iOS e Android com permissao total, limitada, negada e posteriormente revogada.
- [ ] Validar acessibilidade, temas claro/escuro e listas grandes.

## Aceite Manual

1. Entre como gestor autorizado e abra **Clientes > Importar do celular**.
2. Negue a permissao e confirme que o aplicativo continua utilizavel e oferece cadastro manual.
3. Conceda acesso limitado, quando suportado, e confirme que apenas os contatos autorizados aparecem.
4. Pesquise, selecione alguns contatos e confirme que contatos sem nome sao ignorados.
5. Execute a simulacao e confira novos, existentes, duplicados, invalidos e conflitos antes de gravar.
6. Confirme a importacao e verifique que os clientes aparecem somente no estabelecimento ativo.
7. Corrija um item invalido, ignore outro e confirme que o resumo e o novo lote refletem essas escolhas.
8. Repita o mesmo lote e confirme que nenhum usuario ou vinculo e duplicado.
9. No agendamento assistido, toque em **Usar na agenda** e confirme que o cliente fica selecionado sem trocar de tela.
10. Confira que e-mail e WhatsApp permanecem sem consentimento ate uma autorizacao explicita do cliente.
11. Revogue a permissao no aparelho e confirme que dados ja importados permanecem no estabelecimento, mas nenhuma nova leitura local ocorre.

## Ordem Recomendada

As Fases 1 a 5 estao implementadas. Concluir agora a Fase 6 e o aceite manual em dispositivos iOS e Android antes de remover a importacao VCF/seeder usada como contingencia administrativa.
