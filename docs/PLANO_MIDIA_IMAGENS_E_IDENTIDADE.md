# Plano — Imagens, Upload E Identidade Multissegmento

## Objetivo

Permitir que clientes e responsáveis escolham imagens visualmente ou enviem fotos do aparelho, eliminando a necessidade de digitar caminhos como `/servicos/combo.jpg`. Dar ao perfil uma apresentação neutra e profissional e adaptar o fundo da Home ao segmento do estabelecimento.

Este plano cobre web e mobile, incluindo serviços, profissionais, foto pessoal e capa do estabelecimento. O logo UniFlow ABS e os temas existentes são preservados.

## Situação Identificada

- Serviços e profissionais têm formulários que expõem caminhos/URLs de imagem.
- O perfil pessoal utiliza um avatar fixo; o modelo atual de usuário não possui um campo específico para foto.
- A capa do estabelecimento é configurada por caminho na web; no formulário mobile esse recurso ainda não está disponível.
- A Home escura do mobile usa uma imagem de barbearia; o tema claro já possui uma composição branca com detalhes da marca.
- Existem imagens de serviços e capas por segmento que podem compor a primeira galeria.
- Não foi identificado um fluxo de upload no backend na inspeção inicial. A implementação deve confirmar armazenamento e entrega das imagens antes de construir os seletores.

## Experiência Prevista

Em qualquer campo de imagem, mostrar uma prévia com ações “Escolher imagem”, “Enviar foto” e “Usar padrão”. A galeria apresenta miniaturas e nomes compreensíveis, organizada por segmento e finalidade. Caminhos e URLs ficam internos à aplicação.

Nos serviços, selecionar uma sugestão do catálogo traz sua imagem; o responsável pode trocar pela galeria ou enviar sua própria foto. Serviços personalizados usam o mesmo seletor. No mobile, a seleção inicial usa a biblioteca de fotos; acesso à câmera pode ser oferecido como opção adicional na fase mobile.

Para o perfil pessoal, oferecer “Minha foto” a todos os usuários autenticados, inclusive clientes e superadmin. A foto do estabelecimento fica em “Configurações do estabelecimento”, com permissão própria de gestão. Foto pessoal, imagem do profissional e capa da unidade são campos diferentes, mesmo quando uma pessoa acumula esses papéis.

O padrão pessoal será um avatar neutro com iniciais do nome e cores azul/violeta da marca. A capa padrão do estabelecimento será pertinente ao segmento, sem utilizar foto de uma pessoa como identidade genérica.

## Fase 1 — Domínio, Armazenamento E Contratos

- [x] Definir mídia própria do usuário, mídia do estabelecimento e imagens globais da galeria, com permissões por finalidade.
- [x] Adicionar foto pessoal ao domínio/contratos de usuário e propagação pelo refresh da sessão web/mobile.
- [x] Criar catálogo de imagens com identificador, título, segmento, finalidade, dimensões e referência do arquivo.
- [x] Criar consulta da galeria, upload autenticado e associação da mídia ao registro escolhido.
- [x] Validar tamanho máximo inicial de 5 MB e formatos JPEG, PNG e WebP pelo conteúdo do arquivo.
- [x] Normalizar orientação, gerar versões adequadas para avatar, miniatura e capa e remover metadados da foto, incluindo localização.
- [x] Definir comportamento para HEIC/HEIF do iPhone: conversão no dispositivo antes do upload na Fase 3.
- [x] Gerar nomes de arquivo pelo servidor e validar propriedade da mídia ao associá-la a usuário ou estabelecimento.
- [x] Configurar volume persistente no Docker e isolar armazenamento em serviço para futura troca por armazenamento de objetos.
- [x] Implementar resposta padronizada com identificador da mídia e URLs das versões geradas, sem expor caminho do disco.
- [x] Definir cache e versionamento; arquivo ausente retorna 404 para o componente aplicar fallback nas Fases 2–3.
- [x] Criar migration e seed idempotente da galeria, preservando imagens já escolhidas pelos usuários.

Uploads concluídos e ainda não associados precisam de limpeza por prazo definido. Arquivos associados ou compartilhados não devem ser apagados ao remover uma referência isolada. Atualizar a foto somente após upload e associação bem-sucedidos.

### Contratos Implementados

| Operação | Rota | Acesso |
| --- | --- | --- |
| Galeria e uploads disponíveis | `GET /midias/galeria?finalidade=SERVICO&segmentoSlug=barbearia` | Autenticado; galeria global e imagens da própria conta/unidade |
| Enviar foto | `POST /midias/upload` | Autenticado; imagens da unidade exigem `CONFIGURACOES_GERENCIAR` |
| Associar imagem ou voltar ao padrão | `PUT /midias/associacao` | Proprietário da foto pessoal ou gestor autorizado da unidade |
| Entregar imagem | `GET /midias/arquivos/:id/:versao` | Público, URL opaca e estável; apenas imagem processada |
| Simular limpeza | `POST /midias/limpar-orfas` | Superadmin; simulação por padrão |

O upload usa `multipart/form-data`: campo `arquivo` e campo `finalidade` (`AVATAR`, `SERVICO`, `PROFISSIONAL` ou `CAPA`). A resposta contém `id`, título, finalidade e `versoes`, com URLs relativas à API, largura, altura e bytes. Os clientes devem resolver as URLs relativas usando a base do backend, inclusive na web. Nenhum caminho de disco ou nome original é exposto.

Exemplo de associação:

```json
{ "midiaId": "ID_RETORNADO_NO_UPLOAD", "entidade": "SERVICO", "entidadeId": 123 }
```

Para foto pessoal, usar `entidade: "USUARIO"`; a conta é resolvida pela autenticação e outro usuário não pode ser informado. Para retornar ao padrão, enviar `midiaId: null`. O retorno informa `imagemURL` e a entidade atualizada. Para refletir `fotoURL` na sessão, usar o refresh de autenticação existente; o JWT atualizado já inclui o novo campo. Os contratos compartilhados estão em `packages/core/src/midia`.

### Armazenamento E Processamento

- Arquivos novos são normalizados para WebP estático, com correção automática da orientação e remoção dos metadados.
- Miniatura: 256 × 256; principal: 800 × 800 para avatar/serviço/profissional e 1600 × 900 para capa, com recorte central.
- Limites: 5 MB por upload e 20 milhões de pixels na decodificação. O formato é identificado pelo conteúdo, independentemente do nome ou MIME enviado.
- HEIC/HEIF não é aceito neste contrato inicial. A Fase 3 deve converter para JPEG antes do envio, evitando dependência de decodificador HEIC específico no servidor.
- Volume Docker `uniflow_midias`, montado em `/var/lib/uniflow/midias`. `MIDIA_STORAGE_DIR` configura o armazenamento; `MIDIA_GALERIA_DIR` aponta para os arquivos iniciais da galeria.
- Cada substituição usa outro identificador/URL; as URLs retornadas têm cache imutável por um ano. Trocar o vínculo não remove o arquivo anterior.
- As imagens são públicas para exibição no app, inclusive foto pessoal. Não enviar documentos ou imagens privadas neste fluxo. Listagem, upload e associação permanecem autenticados.
- Limpeza considera uploads sem vínculo com mais de sete dias, preserva galeria global e referências gravadas nos campos legados. `{ "executar": true }` realiza a limpeza; sem essa opção apenas apresenta a quantidade candidata. A limpeza é limitada a 100 itens por execução e registra auditoria; não há exclusão automática agendada nesta fase.
- O seeder específico gera 23 imagens iniciais, reutilizando serviços, capas por segmento e profissionais existentes. Ele preserva registros já cadastrados e não altera imagens escolhidas pelas unidades.

### Preparação E Aceite Da Fundação

1. Instalar as dependências atualizadas pelo Yarn.
2. Aplicar a migration `20261014010000_add_media_domain` e gerar o Prisma Client.
3. Recriar o serviço `app` para montar o volume novo. Reiniciar apenas o processo não adiciona o volume.
4. Executar `prisma/seeds/galeria-midias.seed.ts` dentro de `apps/backend`.
5. Consultar a galeria por finalidade e segmento; conferir miniaturas e versão principal pela URL do backend.
6. Enviar JPEG/PNG/WebP e confirmar dimensões e leitura sem EXIF. Arquivo inválido ou acima de 5 MB deve ser recusado.
7. Associar à própria foto ou a um serviço da unidade; testar rejeição de uma mídia de outro usuário/unidade.
8. Renovar o token e confirmar `fotoURL` na sessão; testar retorno ao padrão com `midiaId: null`.
9. Recriar o container e confirmar que as imagens persistem. Backup deve abranger banco e volume de mídia conjuntamente.

Os comandos específicos ficam em `docs/COMANDOS.md`. Galeria visual, upload nos formulários e atualização imediata da sessão pela interface pertencem às Fases 2–3.

## Fase 2 — Galeria Visual E Upload Na Web

- [ ] Criar seletor compartilhado com prévia, miniaturas, filtros por segmento, upload, progresso, erro e opção de padrão.
- [ ] Integrar aos serviços manuais, serviços sugeridos, profissionais e capa do estabelecimento.
- [ ] Incluir “Minha foto” nas configurações pessoais, disponível para todos os perfis autenticados.
- [ ] Atualizar foto no menu, perfil e demais lugares que hoje exibem avatar fixo.
- [ ] Oferecer enquadramento com proporção adequada para foto ou capa, mantendo prévia antes de salvar.
- [ ] Manter suporte aos caminhos antigos no carregamento das imagens existentes.
- [ ] Retirar os campos técnicos de caminho/URL da experiência comum.
- [ ] Validar navegação por teclado, rótulos, contraste nos dois temas e feedback de envio.

## Fase 3 — Galeria Visual E Upload No Mobile

- [ ] Replicar galeria e seleção visual em serviços, profissionais, perfil pessoal e configuração da capa.
- [ ] Integrar seletor nativo da biblioteca com autorização solicitada somente ao usar o recurso.
- [ ] Tratar cancelamento da seleção, acesso limitado a fotos e permissão negada sem bloquear o formulário.
- [ ] Oferecer câmera como opção, se compatível com o fluxo definido, com permissão específica.
- [ ] Comprimir/converter fotos antes do envio quando apropriado e suportar orientação e formatos do aparelho.
- [ ] Criar envio multipart no cliente da API, evitando headers JSON no upload.
- [ ] Mostrar progresso, erro recuperável, repetição segura e prévia da foto selecionada.
- [ ] Atualizar sessão e componentes após salvar, sem exigir novo login.
- [ ] Validar Android/iOS, teclado, rolagem, fotos grandes e conexão instável.

Se forem necessárias dependências ou configurações nativas, registrar em `docs/COMANDOS.md` os comandos e a necessidade de novo development build. Reiniciar o Docker não substitui esse build.

## Fase 4 — Padrões Sociais E Fundos Dinâmicos Da Home

- [ ] Substituir o avatar genérico atual por iniciais estilizadas, com possibilidade de foto própria.
- [ ] Centralizar resolução de foto, capa e imagem padrão para web e mobile.
- [ ] Definir o fundo da Home operacional pelo segmento principal da unidade: barbearia, salão, manicure, estética, spa ou beleza.
- [ ] Manter o fundo atual como opção para barbearia e reutilizar as capas existentes nos outros segmentos quando sua composição for adequada.
- [ ] Usar composição neutra multissegmento quando não houver segmento principal, houver classificação indefinida ou o usuário estiver na Home pessoal da plataforma.
- [ ] Para cliente, usar identidade neutra na Home pessoal; no contexto explícito de uma unidade, usar a identidade daquela unidade.
- [ ] Para superadmin, usar identidade neutra da plataforma.
- [ ] Manter a Home clara legível e branca; imagens por segmento podem aparecer em uma área de destaque, sem substituir todo o fundo claro.
- [ ] Aplicar sobreposição e contraste no tema escuro para preservar leitura de “Próximos agendamentos” e cartões.
- [ ] Priorizar imagem personalizada da unidade quando houver opção própria de capa para a Home, com fallback para segmento.
- [ ] Cachear e pré-carregar as imagens utilizadas; mudança de imagem não pode remontar mapas, perder filtros ou recarregar listas completas.

As regras devem usar classificação estruturada do estabelecimento, e não palavras contidas no nome do negócio. A mesma regra de precedência deve ser documentada e reutilizada pelas duas plataformas.

## Fase 5 — Curadoria E Operação Da Galeria

- [ ] Permitir ao superadmin manter imagens globais, títulos, segmentos, finalidade e ativação.
- [ ] Registrar autoria e auditoria de uploads e associações, sem registrar arquivos ou metadados sensíveis nos logs.
- [ ] Desativar imagens globais para novas seleções sem quebrar referências existentes.
- [ ] Padronizar as referências internas do catálogo de serviços sugeridos com a galeria.
- [ ] Documentar armazenamento persistente, backup, recuperação, cache e tratamento de mídias órfãs.
- [ ] Validar isolamento de arquivos e associações entre estabelecimentos.

## Fase 6 — Aceite Web/Mobile

- [ ] Criar e editar serviços usando galeria e upload, sem digitar caminho de arquivo.
- [ ] Alterar foto pessoal e confirmar atualização no menu/perfil dos dois clientes.
- [ ] Alterar capa da unidade e confirmar listagem, detalhes e Home conforme as regras de contexto.
- [ ] Verificar que um cliente só altera sua foto e um membro só altera mídias da unidade com a permissão necessária.
- [ ] Validar imagens de cada segmento nos temas claro/escuro e fallback quando a imagem estiver indisponível.
- [ ] Testar seleção cancelada, arquivos inválidos, limite de tamanho, upload interrompido e nova tentativa.
- [ ] Reiniciar/recriar o container e confirmar que as fotos persistem.
- [ ] Confirmar que trocar uma imagem não quebra agendamentos, mapa, catálogo ou fotos já existentes.
- [ ] Registrar testes automatizados, resultados manuais e pendências reais antes de declarar aceite final.

## Sequência E Estado

Executar as fases na ordem 1 → 2 → 3 → 4 → 5 → 6. A fundação de upload e entrega persistente precede os seletores. A galeria inicial reutiliza os arquivos pertinentes já disponíveis; novas artes poderão ser criadas durante a curadoria, quando necessárias.

Status: Fase 1 implementada. O Sharp foi instalado, o schema Prisma validado, o client gerado e a checagem TypeScript do backend passou. Os 10 testes de processamento, permissões, associação e limpeza segura passaram. A migration, a carga da galeria e a recriação do container com o volume novo devem ser feitas antes do uso da API. As telas e a validação visual serão tratadas nas Fases 2–3. Próximo passo: Fase 2 — Galeria visual e upload na web.

Referências de implementação: [upload multipart no NestJS](https://docs.nestjs.com/techniques/file-upload) e [processamento e remoção de metadados no Sharp](https://sharp.pixelplumbing.com/api-output/).
