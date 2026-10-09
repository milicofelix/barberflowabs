# Etapa 5 - Evolucao Mobile

## Entregas

A navegacao mobile deixa de exibir os modulos provisórios e passa a respeitar o perfil autenticado:

- `BARBER` e `BARBERSHOP_OWNER`: operacao e configuracoes;
- `SUPER_ADMIN` e `APP_OWNER`: administracao da plataforma;
- usuarios nao autenticados: login, cadastro pessoal e cadastro de estabelecimento;
- clientes: descoberta, agendamento e perfil, sem acesso aos modulos de gestao.

O modulo de operacao concentra resumo diario, agenda filtrada por profissional, atualizacao de status, equipe e financeiro. As configuracoes permitem atualizar o perfil publico e os horarios. A administracao permite aprovar ou reprovar estabelecimentos pendentes. O novo onboarding envia tipo, modelo de atendimento, segmentos, especialidades, responsavel e plano para o contrato multissegmento.

## Validacao Manual No Aplicativo

### Responsavel pelo estabelecimento

1. Entre com uma conta `BARBERSHOP_OWNER`.
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
