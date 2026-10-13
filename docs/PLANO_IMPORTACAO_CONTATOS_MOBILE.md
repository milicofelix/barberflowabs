# Plano — Importacao Assistida De Contatos No Mobile

Status: Fases 1 e 2 implementadas; migration, geracao do Prisma Client, novo build nativo, reinicio e aceite manual pendentes.

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

- [ ] Criar a acao **Importar do celular** na central de clientes e no agendamento assistido.
- [ ] Exibir busca local, selecao individual e selecao dos resultados visiveis.
- [ ] Ignorar contatos sem nome e contatos sem telefone nem e-mail validos.
- [ ] Quando houver varios telefones ou e-mails, permitir escolher quais dados serao usados.
- [ ] Normalizar e remover duplicidades locais antes da simulacao.
- [ ] Limitar o tamanho de cada lote e processar listas grandes de forma paginada, sem travar a interface.
- [ ] Mostrar uma revisao com quantidades de novos, existentes, duplicados, invalidos e conflitos.
- [ ] Exigir confirmacao final antes do envio definitivo.

## Fase 4 — Importacao Idempotente No Backend

- [ ] Proteger as rotas com uma permissao especifica de clientes ou, durante a transicao, `AGENDA_GERENCIAR`.
- [ ] Validar que o operador pertence ao estabelecimento ativo.
- [ ] Repetir normalizacao e deduplicacao no servidor; nunca confiar apenas no aparelho.
- [ ] Gravar em transacoes curtas e lotes limitados, permitindo retomar uma importacao interrompida.
- [ ] Criar ou vincular `ClienteEstabelecimento` sem transformar o contato em membro da equipe.
- [ ] Manter preferencia de comunicacao desativada e origem do consentimento vazia.
- [ ] Retornar o resultado individual de cada item sem revelar informacoes de clientes de outros estabelecimentos.
- [ ] Produzir auditoria com operador, estabelecimento, lote, contagens e erros, evitando armazenar o conteudo integral da agenda.

## Fase 5 — Resultado, Correcao E Uso Na Agenda

- [ ] Exibir resumo final: importados, ja existentes, ignorados e pendentes de correcao.
- [ ] Permitir corrigir nome, telefone ou e-mail somente dos itens com problema e reenviar esses itens.
- [ ] Atualizar imediatamente a busca de clientes do agendamento assistido.
- [ ] Permitir selecionar um cliente recem-importado e continuar o agendamento sem trocar de tela.
- [ ] Impedir que repetir o mesmo lote gere usuarios ou vinculos duplicados.

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
7. Repita o mesmo lote e confirme que nenhum usuario ou vinculo e duplicado.
8. Abra o agendamento assistido e selecione imediatamente um cliente importado.
9. Confira que e-mail e WhatsApp permanecem sem consentimento ate uma autorizacao explicita do cliente.
10. Revogue a permissao no aparelho e confirme que dados ja importados permanecem no estabelecimento, mas nenhuma nova leitura local ocorre.

## Ordem Recomendada

Executar primeiro a Fase 1, pois o contrato atual exige e-mail e muitos contatos reais possuem apenas telefone. Depois seguir Fases 2 e 3 no mobile, Fase 4 no backend e concluir com as Fases 5 e 6. A importacao VCF/seeder nao deve ser removida antes do aceite completo deste fluxo.
