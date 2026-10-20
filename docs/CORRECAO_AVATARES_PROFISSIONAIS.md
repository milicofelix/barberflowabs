# Correção De Avatares Profissionais — 15/10/2026

## Causa Encontrada No Código

As fotos demonstrativas `profissional-1.jpg` a `profissional-6.jpg` ainda eram tratadas como imagens válidas pelo mobile, atribuídas por seeds e publicadas na galeria global. Corrigir somente o botão “Usar padrão” não resolvia as referências já salvas. O seletor de agendamento priorizava a URL persistida, mesmo quando a profissional tinha sexo feminino cadastrado.

Não houve consulta à base para inspecionar o registro individual da Juliana. O sexo não é inferido pelo nome: a correção utiliza exclusivamente o valor cadastrado.

## Implementação

- Regra compartilhada no core substitui os caminhos demonstrativos conhecidos por silhuetas, usando o sexo cadastrado. Caminhos de fotos enviadas, como `/midias/arquivos/...`, são preservados.
- Backend aplica essa regra na criação, edição, listagem para agendamento, especialistas públicos e detalhe do estabelecimento. O mobile e os seletores web também a aplicam na apresentação.
- Mobile deixa de importar as seis fotos demonstrativas no resolvedor de imagens de profissionais. A ausência de imagem não usa mais o antigo `avatar.png`.
- Seeds passam a criar silhuetas. A atualização do marketplace não sobrescreve uma foto existente. A galeria inicial oferece silhuetas masculina e feminina, sem voltar a cadastrar os modelos antigos.
- Galeria e associação de mídia recusam os seis itens antigos identificados pelas chaves de catálogo. Uploads pessoais ou da unidade permanecem disponíveis.

## Correção Dos Dados Persistidos

Migration `20261015030000_retire_legacy_professional_photos`, somente de dados, sem alteração de schema:

1. Substitui os seis caminhos antigos e as versões processadas desses seis itens globais por uma silhueta baseada no sexo cadastrado.
2. Corrige silhueta masculina/feminina divergente quando o sexo está informado.
3. Remove apenas associações de profissionais com esses itens demonstrativos e os desativa na galeria.

Não muda nomes, sexo, contas, permissões ou fotos enviadas por usuários. Não apaga arquivos físicos do armazenamento, preservando referências de histórico/auditoria. Sexo não informado utiliza silhueta masculina como fallback; deve ser corrigido no cadastro quando necessário.

Executar “Aplicar migrations pendentes” de [COMANDOS.md](COMANDOS.md) e depois reiniciar o serviço `app` para carregar o backend atualizado. A migration altera referências persistidas; manter backup da base antes de aplicá-la. Não requer reset, seed, nova dependência ou geração do Prisma Client, pois não muda o schema.

## Aceite Manual Pelo Usuário

- [ ] Aplicar a migration e carregar a versão atualizada do backend/mobile.
- [ ] Entrar como cliente, abrir Ricosty Emagrecimento e selecionar agendamento. Conferir Juliana com silhueta feminina quando `sexo = FEMININO`.
- [ ] Conferir que fotos reais enviadas anteriormente, como a de Shis, continuam iguais.
- [ ] Cadastrar profissionais de ambos os sexos sem enviar foto e conferir equipe, agendamento e perfil público na web/mobile.
- [ ] Abrir a galeria de fotos profissionais: os seis modelos antigos não devem estar disponíveis.
- [ ] Trocar uma foto por upload e depois escolher “Usar padrão”; conferir o retorno à silhueta correspondente.

Somente revisão estática nesta entrega. Não foram executados testes, builds, typecheck, lint, chamadas à API, migrations, seeds ou reinícios. A conferência em aparelho e a aplicação da migration ficam com o usuário.
