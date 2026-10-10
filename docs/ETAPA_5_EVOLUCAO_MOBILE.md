# Etapa 5 - Evolucao Mobile

## Entregas

A navegacao mobile deixa de exibir os modulos provisórios e passa a respeitar o perfil autenticado:

- `ESTABLISHMENT_MEMBER` e `ESTABLISHMENT_OWNER`: operacao e configuracoes;
- `SUPER_ADMIN` e `APP_OWNER`: administracao da plataforma;
- usuarios nao autenticados: login, cadastro pessoal e cadastro de estabelecimento;
- clientes: descoberta, agendamento e perfil, sem acesso aos modulos de gestao.

O modulo de operacao concentra resumo diario, agenda filtrada por profissional, atualizacao de status, equipe e financeiro. As configuracoes permitem atualizar o perfil publico e os horarios. A administracao permite aprovar ou reprovar estabelecimentos pendentes. O novo onboarding envia tipo, modelo de atendimento, segmentos, especialidades, responsavel e plano para o contrato multissegmento.

## Validacao Manual No Aplicativo

### Responsavel pelo estabelecimento

1. Entre com uma conta `ESTABLISHMENT_OWNER`.
2. Confirme que as abas **Operacao** e **Ajustes** estao visiveis.
3. Em **Operacao > Resumo**, confira os indicadores diarios.
4. Em **Agenda**, altere a data, filtre por profissional e atualize o status de um atendimento.
5. Em **Equipe**, cadastre um profissional e confirme sua exibicao na lista.
6. Em **Financeiro**, registre uma receita e uma despesa.
7. Em **Ajustes**, altere dados publicos, antecedencia e horarios de funcionamento; salve e reabra a tela.

### Administrador da plataforma

1. Entre com uma conta `SUPER_ADMIN` ou `APP_OWNER`.
2. Confirme que a aba **Admin** esta visivel.
3. Confira os totais da plataforma e a lista de pendencias.
4. Aprove ou reprove um cadastro de teste e confirme que a lista foi atualizada.

### Novo cadastro multissegmento

1. Saia da conta e, na tela de login, toque em **Quero cadastrar meu estabelecimento**.
2. Informe os dados do negocio e escolha o tipo e o modelo de atendimento.
3. Selecione ao menos um segmento e uma especialidade correspondente.
4. Informe os dados do responsavel, uma senha com pelo menos seis caracteres e um plano.
5. Envie o cadastro e confirme a mensagem de encaminhamento para revisao.
6. Entre como administrador, aprove o cadastro e depois valide o acesso do responsavel.

### Isolamento por perfil

1. Entre como cliente e confirme que **Operacao**, **Ajustes** e **Admin** nao aparecem.
2. Entre como profissional/responsavel e confirme que **Admin** nao aparece.
3. Entre como administrador e confirme que a administracao usa somente os endpoints globais autorizados.

## Observacao De Execucao

Nenhum teste, build, lint, typecheck, formatador, migration, seed, instalacao de dependencia ou reinicio de servico foi executado nesta etapa, conforme a politica do projeto. A verificacao funcional permanece manual e deve ser feita somente quando solicitada.

## Ajustes De Tema E Disponibilidade

O aplicativo agora oferece tema escuro e claro. O botao flutuante no topo alterna entre sol e lua, e a escolha fica salva no aparelho.

Validacao manual sugerida:

1. Abra o aplicativo e toque no icone de sol ou lua no canto superior direito.
2. Percorra login, descoberta, agendamento, perfil, operacao, configuracoes e administracao.
3. Confirme que fundos, cartoes, campos, textos e navegacao acompanham o tema escolhido.
4. Feche e abra novamente o Expo Go e confirme que o tema escolhido foi preservado.
5. Crie um agendamento com um profissional, data e horario conhecidos.
6. Volte ao fluxo de agendamento, escolha o mesmo estabelecimento, profissional e data.
7. Confirme que o horario aparece riscado como **Ocupado** e nao responde ao toque.
8. Se um servico ultrapassar o fim do expediente, confirme que o slot aparece como **Indisponivel**.

O endpoint de ocupacao agora formata os horarios explicitamente no fuso `America/Sao_Paulo`, evitando a diferenca entre o horario gravado e o horario exibido pelo dispositivo.

### Revisao De Contraste E Menu

- textos secundarios de profissionais, horarios, avaliacoes, configuracoes, filtros e confirmacoes usam as cores semanticas do tema;
- cartoes de agendamentos e o formulario de denuncia acompanham os modos claro e escuro;
- o menu inferior exibe apenas icones maiores, com versao preenchida no item ativo;
- os nomes das abas continuam disponiveis para leitores de tela, mas nao ocupam espaco visual.

No modo claro, valide especialmente as descricoes dos profissionais, os dias de funcionamento, os filtros do marketplace, o resumo do agendamento e os agendamentos anteriores.

## Equipes, Escalas, Recursos E Permissoes

A operacao mobile agora permite:

- vincular usuarios existentes ao estabelecimento como gestor, recepcionista ou profissional;
- conceder permissoes separadas para equipe, escalas, recursos, agenda, financeiro e configuracoes;
- associar opcionalmente o membro ao seu perfil profissional;
- configurar os dias e o periodo da escala individual de cada profissional;
- cadastrar recursos e sua capacidade simultanea;
- programar e remover indisponibilidades de recursos por manutencao ou outro motivo.

No backend, as permissoes passam a proteger as rotas operacionais. Donos do estabelecimento continuam com acesso integral e contas antigas com indicador `membro do estabelecimento` conservam o acesso enquanto ainda nao possuem um vinculo detalhado. Depois que um vinculo e criado, suas permissoes passam a prevalecer.

O motor de agenda rejeita periodos fora da escala individual e ignora recursos indisponiveis ao calcular a capacidade. Se nenhuma escala individual existir, permanece valida a configuracao geral do estabelecimento para preservar compatibilidade.

A migration `20261010010000_add_team_capacity_management` foi criada, mas nao aplicada. A validacao manual das Etapas 1 a 7 foi pulada conforme solicitado, e nenhum teste ou build foi executado.
