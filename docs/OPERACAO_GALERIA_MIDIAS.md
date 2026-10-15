# Operação Da Galeria De Mídias

## Curadoria

Somente SUPER_ADMIN/APP_OWNER mantêm imagens globais. Na web: Admin SaaS → Galeria global — curadoria. No mobile: Administração → Curadoria da galeria global. Abrir a seção carrega até 200 imagens e as 30 últimas ações de curadoria. A seleção comum continua limitada a 200 imagens ativas por finalidade; paginação para volumes maiores é evolução futura.

Enviar imagem cria um novo ID/arquivo global, disponível imediatamente. Revisar título, segmento e ativação após upload; arquivos devem ter direito de uso adequado e não conter documentos, dados clínicos ou imagens privadas. Não é permitido promover um upload particular de cliente/unidade: o upload global é uma ação explícita separada. Finalidade é definida no envio e fica fixa; substituição ou finalidade diferente exige outra imagem. Título, segmento e ativação podem ser editados sem alterar bytes/URL.

Desativar não exclui arquivos: retira a imagem das novas seleções da galeria, mas mantém a entrega pública para vínculos e URLs existentes. Sugestões do catálogo já vinculadas e serviços já adotados continuam funcionando; revise o template separadamente se quiser trocar sua imagem. Não há exclusão de imagem global pela interface.

Curadoria de serviços na web usa o seletor global de finalidade SERVICO. Salvar registra a URL interna e `MidiaVinculo` do tipo SERVICO_SUGERIDO. API rejeita imagens particulares, de outra finalidade ou inativas para novos vínculos, inclusive quando informadas diretamente como URL. Edição sem trocar a imagem preserva referências antigas. Trocar a imagem do template não substitui a foto dos serviços já adotados pelas unidades.

Rotas autenticadas: `GET /midias/admin`, `POST /midias/admin/upload` e `PUT /midias/admin/:id`. Upload/associação/curadoria têm autor, data, finalidade e destino em auditoria. Não registrar binários, nome original do arquivo, EXIF ou payloads pessoais nos logs. A tela administrativa não lista uploads privados.

## Armazenamento E Cache

Volume Docker `uniflow_midias`, montado em `/var/lib/uniflow/midias`; banco guarda metadados e vínculos. Alterar o diretório ou recriar o volume sem migrar os arquivos quebra referências. Nunca limpar o volume para resolver erro de imagem.

### Correção Do Repasse De Ambiente — 15/10/2026

`MIDIA_STORAGE_DIR` e `MIDIA_GALERIA_DIR` devem constar em `globalEnv` no `turbo.json`. O Docker pode ter essas variáveis corretamente configuradas, mas o Turborepo filtra o ambiente entregue aos subprocessos. Sem esse repasse, o backend usa o fallback `./storage/midias` e retorna **Arquivo de imagem não encontrado** para registros cujos arquivos estão no volume persistente.

A correção inclui as duas variáveis na lista explícita, mantendo o filtro de ambiente e sem mudar URLs, arquivos ou registros. Reiniciar `app` pelo comando já catalogado em `docs/COMANDOS.md`; o processo Turbo precisa ser reiniciado para ler a configuração atualizada. Não exige rebuild da imagem Docker, migration, seed, novo upload ou limpeza de volumes. O reinício interrompe temporariamente backend, frontend e Metro hospedados nesse serviço.

Aceite pelo responsável após o reinício: reabrir a URL de miniatura que retornava 404, conferir a versão principal e atualizar a galeria administrativa. A correção é do backend compartilhado e atende web e app. Não foram executados testes, builds, chamadas de API ou reinício nesta entrega.

IDs são opacos e os arquivos são reprocessados para WebP sem EXIF. URLs de imagem são públicas e imutáveis por um ano; a listagem e a escrita são autenticadas. A galeria não é um armazenamento de documentos privados. Não sobrescrever bytes de um ID existente: para substituir, criar mídia nova e trocar o vínculo. Metadados não alteram o cache da imagem.

## Backup E Recuperação

1. Planejar janela de manutenção, suspender uploads/escritas e limpeza de órfãs; confirmar ambiente e database correto.
2. Fazer backup consistente do database `uniflow_abs`, abrangendo mídias, vínculos, usuários, serviços, sugestões e auditoria. Usar ferramenta operacional com credenciais protegidas, sem senhas em histórico de terminal ou arquivos versionados.
3. Arquivar o conteúdo do volume `uniflow_midias` da mesma janela, preservando estrutura de UUIDs. Para galerias legadas com `arquivoOrigem`, preservar também os assets referenciados do frontend.
4. Identificar o par banco/arquivos com data, versão da aplicação e checksums. Guardar em destino restrito, com retenção definida e cópia fora do host. Não incluir backups em Git.
5. Testar restauração em ambiente isolado: restaurar banco e arquivos do mesmo par, configurar montagem/permissões do volume e conferir principais/miniaturas por amostragem, inclusive imagens globais desativadas ainda referenciadas.
6. Só retomar tráfego após verificar vínculos, avatars/capas/serviços, isolamento e auditoria. Não recriar o banco, apagar volume ou rodar seed geral como substituto de recuperação. Recuperação de produção exige alvo validado e autorização específica.

Backup/restauração reais não foram executados nesta fase. Falta validar esse procedimento com a infraestrutura que será usada em produção.

## Órfãs

`POST /midias/limpar-orfas` é exclusivo de superadmin e apenas simula por padrão. Uploads não globais, sem vínculo e com mais de sete dias podem ser candidatos (até 100 por chamada). Antes de execução, o backend trava e revalida referências, incluindo campos legados e sugestões de serviços. Arquivos globais ou associados não são apagados por esse fluxo.

O retorno da simulação é uma quantidade candidata, não garantia de exclusão: revalidação pode preservar mídias. Após conferir ambiente e backup, a execução exige `{ "executar": true }`. Não há limpeza automática agendada nesta fase. Se falhar a remoção física após a marcação EXCLUIDA, a próxima execução pode repetir a tentativa; registrar e investigar falhas sem despejar informações pessoais.

## Padronização Inicial Do Catálogo

Após o seed da galeria, `prisma/seeds/vincular-catalogo-midias.seed.ts` mapeia somente caminhos de serviços conhecidos para IDs globais. Simula por padrão; `--aplicar` escreve os vínculos e registra auditoria. Reexecução não sobrescreve imagens personalizadas nem modifica serviços adotados. Caminhos desconhecidos ficam preservados para revisão manual.

Os comandos ficam em `docs/COMANDOS.md`. Não executar seed geral nem reset para atualizar referências de imagem.

## Aceite Manual

1. Como superadmin, criar imagem global, editar título/segmento e conferir a galeria comum na finalidade correspondente.
2. Associar a serviço/sugestão, desativar a imagem e confirmar: some das novas seleções, mas o serviço e a URL já salva continuam exibindo-a.
3. Reativar; conferir retorno sem novo upload. Tentar mudar finalidade/escopo no PUT: ambos permanecem fixos.
4. Como cliente/gestor, tentar as rotas admin: acesso recusado. Unidade B não pode listar ou associar upload da unidade A; cliente não pode alterar foto de outra conta.
5. Conferir autor/data em auditoria sem binário, nome de arquivo ou metadados da foto.
6. Simular padronização de sugestões; conferir candidatos antes de aplicar. Imagens personalizadas e serviços adotados devem permanecer intactos.
7. Validar backup/restauração isolada e falha/retentativa da limpeza antes de homologar produção.

Implementação concluída não representa aceite visual ou homologação operacional. Essas verificações permanecem pendentes.
