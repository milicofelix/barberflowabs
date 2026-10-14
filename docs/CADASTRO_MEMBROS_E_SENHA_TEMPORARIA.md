# Cadastro De Membros Com Conta E Senha Temporária

Implementação em 14/10/2026. Aceite manual e execução das migrations ficam com o usuário. Nenhum teste, build, typecheck, lint, migration, seed ou reinício foi executado nesta entrega.

## Fluxo No Mobile

Em Gestão diária → Equipe, o gestor pode manter um perfil profissional sem login, vincular uma conta existente da unidade ou cadastrar uma nova conta para um membro.

1. Selecionar o perfil profissional, por exemplo Juliana Sales. Sem vínculo existente e sem conta selecionada, o formulário abre “Cadastrar nova conta”.
2. Definir o papel e as permissões, por exemplo Agenda e Escalas.
3. Preencher e-mail e senha temporária com pelo menos seis caracteres. O nome vem do perfil profissional escolhido. Sem perfil profissional, o nome também é solicitado.
4. “Adicionar membro” fica disponível com os campos válidos. A conta e o vínculo de equipe são persistidos na mesma transação.
5. Informar as credenciais à pessoa. Esta entrega não envia e-mail nem WhatsApp automaticamente.
6. No primeiro login, mobile e web mostram a troca obrigatória de senha antes das telas operacionais. A nova senha deve ser diferente da temporária.

O e-mail não é exigido para criar somente um perfil profissional ou configurar sua escala. Ele é necessário para criar uma conta que possa entrar no sistema e exercer as permissões atribuídas. A senha temporária é definida no formulário; não existe uma senha universal fixa.

## Contratos E Regras

- `POST /equipe/com-conta`: autenticado, exige `EQUIPE_GERENCIAR`; recebe `email`, `senhaTemporaria`, `papel`, `permissoes`, `profissionalId` opcional e `nome` quando não há perfil profissional.
- Unidade e operador vêm da sessão. O perfil deve pertencer à mesma unidade e não pode estar vinculado a outro membro.
- Conta criada com `ESTABLISHMENT_MEMBER`, `membroEstabelecimento: true` e `trocarSenhaObrigatoria: true`. O papel operacional GESTOR não transforma o membro em dono da unidade nem superadmin.
- E-mail existente gera conflito sem alterar a senha ou transferir a conta. O gestor pode selecionar uma conta já disponível na unidade. Vincular uma conta externa existente exige outro fluxo; este cadastro não faz transferência automática.
- Senha armazenada somente como hash bcrypt. O retorno e a auditoria de cadastro não incluem senha nem hash.
- `POST /auth/alterar-senha`: autenticado, recebe `senhaAtual` e `novaSenha`, verifica a senha atual e atualiza hash/pendência juntos. Emite uma nova sessão sem a pendência.
- Sessões pendentes só podem usar a troca de senha entre os endpoints protegidos. Login e refresh mantêm a indicação da pendência. Depois da troca, tokens temporários anteriores não podem operar nem ser renovados.
- O responsável principal mantém o acesso total protegido já implementado.

## Preparação Do Banco

Nova migration: `20261014230000_add_member_temporary_password`.

Adiciona `usuarios.trocarSenhaObrigatoria`, com valor padrão `false`. Contas anteriores mantêm seu comportamento. Não cria contas ou altera senhas já cadastradas.

Executar os comandos “Aplicar migrations pendentes” e “Gerar o Prisma Client” já registrados em [COMANDOS.md](COMANDOS.md). Depois recarregar o backend com o comando de reinício já documentado, caso ainda esteja usando a versão anterior. Nenhum reset ou seed é necessário.

## Aceite Pelo Usuário

- [ ] No mobile, selecionar um perfil profissional sem vínculo, preencher e-mail/senha temporária e selecionar Agenda/Escalas. Conferir a habilitação do botão e a criação do membro.
- [ ] Reabrir a equipe e conferir conta, perfil e permissões; verificar que não foram criados perfis duplicados.
- [ ] Acessar mobile com a nova conta, trocar a senha e conferir as áreas permitidas. Sair e entrar com a nova senha; a temporária deve deixar de funcionar.
- [ ] Repetir o primeiro acesso na web com outra conta temporária; conferir a troca obrigatória antes das páginas operacionais.
- [ ] Conferir senha atual incorreta, nova senha igual à temporária, confirmação divergente e falha de conexão, com mensagens e nova tentativa.
- [ ] Tentar cadastrar e-mail existente: deve informar conflito e preservar a conta anterior.
- [ ] Conferir que um profissional sem conta continua disponível para configuração de escala e atendimento.
- [ ] Conferir que o responsável principal mantém seu acesso protegido e que um membro sem permissão de equipe não pode criar contas.

Foram adicionados testes direcionados de criação da conta, isolamento de unidade, conflito de e-mail, troca de senha e restrições da sessão temporária. Esses testes não foram executados. Não há resultado de homologação ou teste em aparelho nesta entrega.
