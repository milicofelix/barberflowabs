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
- Miniatura: até 256 × 256; principal: 800 × 800 para avatar/profissional e 1600 × 900 para capa, com recorte central. Serviços preservam a proporção em ambas as versões, limitados a 800 × 800 na principal, sem ampliar.
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

- [x] Criar seletor compartilhado com prévia, miniaturas, filtros por segmento, upload, progresso, erro e opção de padrão.
- [x] Integrar aos serviços manuais, serviços sugeridos, profissionais e capa do estabelecimento.
- [x] Incluir “Minha foto” nas configurações pessoais, disponível para todos os perfis autenticados.
- [x] Atualizar foto no menu e na configuração pessoal, substituindo o avatar fixo.
- [x] Oferecer enquadramento com proporção adequada para foto ou capa, mantendo prévia antes de salvar.
- [x] Manter suporte aos caminhos antigos no carregamento das imagens existentes.
- [x] Retirar os campos técnicos de caminho/URL da experiência comum.
- [ ] Validar navegação por teclado, rótulos, contraste nos dois temas e feedback de envio.

Implementação: seletor compartilhado em `components/midia/SeletorImagem.tsx`, com diálogo nativo (foco/ESC), seleção de miniaturas, envio multipart com progresso e enquadramento horizontal/vertical. As capas usam proporção 16:9 e avatares/profissionais usam proporção quadrada. Serviços agora preservam a imagem inteira e usam área de exibição 16:9. O envio cria uma mídia; a associação ocorre ao salvar o registro. Se o registro foi criado e a associação falhar, a mensagem informa a pendência e a edição mantém o ID para evitar recriação.

“Configurações → Minha foto” está disponível para clientes, gestores e superadmin. Após salvar, o refresh atualiza o avatar do menu sem novo login. Sem foto, são exibidas iniciais em azul/violeta. Configurações operacionais continuam disponíveis apenas para os responsáveis da unidade.

A rota web `/midias/arquivos/:id/:versao` entrega as mídias do backend para componentes existentes, inclusive `next/image`, mantendo compatibilidade com caminhos antigos. É necessária a preparação da Fase 1 (migration, volume e seed). Esta fase não adiciona migration ou dependência.

Verificação: checagem TypeScript completa da web passou. Os dois erros de tipagem registrados anteriormente foram corrigidos com anotação do retorno e proteção de índice indefinido. `git diff --check` passou. Aceite visual e interação de upload no navegador permanecem pendentes; a ferramenta de automação do navegador não está disponível nesta sessão.

### Aceite Manual Da Fase 2

1. Entrar como responsável e abrir Gestão → Serviços; conferir prévia e “Escolher imagem ou enviar foto”.
2. Escolher uma imagem da galeria, salvar e conferir no fluxo de agendamento.
3. Enviar JPEG/PNG/WebP, ajustar enquadramento, confirmar envio e salvar o serviço; conferir progresso e imagem persistida.
4. Repetir para profissional e em Configurações → Perfil público → Imagem de capa.
5. Selecionar uma sugestão de serviço e personalizar a imagem antes da importação.
6. Entrar como cliente e superadmin; abrir Configurações → Minha foto, salvar e conferir o avatar atualizado no menu.
7. Testar “Usar padrão”, arquivo acima de 5 MB, formato incompatível e falha de conexão.
8. Navegar com Tab e ESC no seletor, conferir retorno do foco e repetir nos temas claro/escuro.

## Fase 3 — Galeria Visual E Upload No Mobile

- [x] Replicar galeria e seleção visual em serviços, profissionais, perfil pessoal e configuração da capa.
- [x] Integrar seletor nativo da biblioteca com autorização solicitada somente ao usar o recurso.
- [x] Tratar cancelamento da seleção, acesso limitado a fotos e permissão negada sem bloquear o formulário.
- [x] Oferecer câmera como opção, se compatível com o fluxo definido, com permissão específica.
- [x] Comprimir/converter fotos antes do envio quando apropriado e suportar orientação e formatos do aparelho.
- [x] Criar envio multipart no cliente da API, evitando headers JSON no upload.
- [x] Mostrar progresso, erro recuperável, repetição segura e prévia da foto selecionada.
- [x] Atualizar sessão e componentes após salvar, sem exigir novo login.
- [ ] Validar Android/iOS, teclado, rolagem, fotos grandes e conexão instável.

Se forem necessárias dependências ou configurações nativas, registrar em `docs/COMANDOS.md` os comandos e a necessidade de novo development build. Reiniciar o Docker não substitui esse build.

Implementação: `SeletorImagem` compartilhado no mobile, com galeria por finalidade, filtros de segmento, fotos do aparelho, câmera, prévia e retorno ao padrão. Serviços manuais e sugeridos usam o mesmo componente. Profissionais existentes têm ação própria de salvar foto. A capa está em Configurações → Identidade pública; a foto pessoal está em Perfil → Minha foto para todos os perfis e também nas configurações operacionais. O refresh da sessão propaga `fotoURL` sem novo login.

O seletor de biblioteca usa o acesso pontual do sistema, sem solicitar acesso amplo antecipado. Câmera pede permissão somente ao tocar em “Tirar foto”; recusa oferece galeria e atalho para permissões. Cancelar não altera o registro. Avatares/profissionais são recortados em 1:1 e capas em 16:9. Serviços não são recortados. As fotos são redimensionadas para até 800/1600 pixels e convertidas para JPEG antes do envio, inclusive as fotos HEIC que o dispositivo conseguir decodificar. O backend continua validando e removendo metadados. Compatibilidade real de formatos e acesso limitado precisa do aceite no aparelho.

Upload cria mídia sem alterar o registro; salvar realiza a associação. Erros de associação após criação de serviço/profissional informam que o registro já foi salvo e permitem corrigir pela edição, evitando repetir a criação. O upload usa multipart sem `Content-Type` JSON, progresso e timeout recuperável. A navegação mantém os caminhos legados. Não há nova migration nesta fase; a preparação da Fase 1 continua necessária.

Dependências nativas: `expo-image-picker` e `expo-image-manipulator`, instaladas com `expo install`. O plugin configura as mensagens de câmera/fotos e não solicita microfone. Um development build antigo pode continuar exibindo a galeria, mas precisa ser reconstruído para disponibilizar os módulos novos. Comandos em `docs/COMANDOS.md`.

### Aceite Manual Da Fase 3

1. Instalar o novo development build em Android/iOS e entrar como responsável.
2. Em Gestão diária → Serviços, criar e editar usando galeria, aparelho e “Usar padrão”. Repetir em Serviços sugeridos antes de importar.
3. Em Equipe, adicionar profissional com foto e trocar a foto de um profissional existente; conferir no agendamento.
4. Em Configurações → Identidade pública, salvar a capa; conferir na listagem e detalhes após atualizar os dados.
5. Em Perfil → Minha foto, testar cliente, gestor e superadmin; salvar e conferir atualização sem refazer login.
6. Cancelar o seletor, recusar câmera, permitir acesso limitado a fotos e retornar das configurações do aparelho. O formulário deve continuar utilizável.
7. Testar foto HEIC no iPhone, foto grande/vertical, câmera, rotação, teclados e rolagem nos dois temas.
8. Interromper conexão durante upload e tentar novamente. Um registro já criado não deve ser duplicado ao corrigir sua foto.
9. Testar conta sem permissão de configuração: backend deve rejeitar associação/upload de imagem da unidade; foto pessoal permanece permitida.

Aceite Android/iOS e validação visual permanecem pendentes. Não declarar paridade visual final antes desses testes.

Instalação concluída com sucesso: `expo-image-picker@57.0.20` e `expo-image-manipulator@57.0.21`, com manifesto e lockfile atualizados. A consulta `expo config --type public --json` concluiu com sucesso e reconheceu o plugin.

Verificação técnica: `git diff --check` passou. A checagem TypeScript com os módulos novos disponíveis não apontou erros nas integrações de mídia; o projeto ainda tem três erros anteriores em `AgendamentoAssistido` (data possivelmente nula), `useOperacao` (conversão do mapa de períodos) e `PerfilEstabelecimento` (tipo de capa exige `distanciaKm`). A checagem completa não está aprovada enquanto essas pendências existirem.

## Fase 4 — Padrões Sociais E Fundos Dinâmicos Da Home

### Ajuste de proporção das imagens de serviços (após Fase 3)

Serviços preservam a proporção original em upload web/mobile e nas versões do backend: principal limitada a 800 × 800 e miniatura a 256 × 256, sem recorte nem ampliação. Fotos horizontais e verticais são exibidas inteiras (`contain`) em áreas 16:9 nos seletores e na escolha de serviços. O fundo da web usa a superfície do tema, não branco fixo no tema escuro. Avatares/profissionais continuam quadrados e capas continuam 16:9 com recorte.

Não há migration nem necessidade de reduzir manualmente os arquivos. Imagens anteriormente recortadas não podem ser recuperadas por CSS: reenviar o original e salvar a nova associação. O seed existente não sobrescreve mídias antigas. Testar imagem horizontal, vertical e pequena, conferindo as bordas no agendamento e nos dois temas.

Verificação do ajuste: 11 testes de mídia passaram, incluindo proporção horizontal/vertical e ausência de ampliação de imagens pequenas. TypeScript da web e `git diff --check` passaram. Mobile continua com os mesmos três erros anteriores de agenda/perfil, sem erros novos neste ajuste. Aceite visual no navegador/aparelho permanece pendente.

- [x] Substituir o avatar genérico atual por iniciais estilizadas, com possibilidade de foto própria.
- [x] Centralizar resolução de foto, capa e imagem padrão para web e mobile.
- [x] Definir o fundo da Home operacional pelo segmento principal da unidade: barbearia, salão, manicure, estética, spa ou beleza.
- [x] Manter o fundo atual como opção para barbearia e reutilizar as capas existentes nos outros segmentos quando sua composição for adequada.
- [x] Usar composição neutra multissegmento quando não houver segmento principal, houver classificação indefinida ou o usuário estiver na Home pessoal da plataforma.
- [x] Para cliente, usar identidade neutra na Home pessoal; no contexto explícito de uma unidade, usar a identidade daquela unidade.
- [x] Para superadmin, usar identidade neutra da plataforma.
- [x] Manter a Home clara legível e branca; imagens por segmento podem aparecer em uma área de destaque, sem substituir todo o fundo claro.
- [x] Aplicar sobreposição e contraste no tema escuro para preservar leitura de “Próximos agendamentos” e cartões.
- [x] Priorizar imagem personalizada da unidade quando houver opção própria de capa para a Home, com fallback para segmento.
- [x] Cachear e pré-carregar as imagens utilizadas; mudança de imagem não pode remontar mapas, perder filtros ou recarregar listas completas.

As regras devem usar classificação estruturada do estabelecimento, e não palavras contidas no nome do negócio. A mesma regra de precedência deve ser documentada e reutilizada pelas duas plataformas.

### Implementação E Precedência Da Fase 4

Regras compartilhadas em `packages/core/src/midia/identidade.ts`. A capa personalizada tem prioridade, exceto os banners legados genéricos. Na ausência ou falha da capa, usar segmento marcado `principal`; se não houver principal, usar o tipo estruturado; sem tipo reconhecido, aceitar somente um segmento reconhecido. Principal desconhecido ou classificação ambígua resultam em visual neutro. Nomes do negócio e nomes livres de segmentos não participam da decisão.

A Home pessoal de cliente/visitante e superadmin é neutra e ignora a seleção anterior persistida. No contexto explícito de unidade (lista/detalhes), aplica-se sua identidade. A Home operacional consulta apenas a unidade da sessão e confere o ID antes de usar a resposta. O perfil público autenticado agora inclui tipo e segmentos para essa leitura, sem mudança de permissões e sem migration.

Mobile: fundo antigo reservado à barbearia, capas existentes para outros segmentos e composição neutra azul-escura sem fotografia quando indefinido. Modo claro permanece branco com orbes azul/violeta. Modo escuro tem sobreposição escura; capas novas são pré-carregadas e usam cache por URL. Retornar à Home atualiza a identidade, sem trocar a árvore de conteúdo. Web: a área superior usa a mesma regra, com imagem discreta no claro e fundo escurecido no dark; capa ausente usa identidade multissegmento. URLs versionadas reutilizam o cache do navegador; imagem da Home é pré-carregada. Listas, mapas e filtros não foram remontados nem tiveram seu estado alterado.

Foto pessoal usa componentes próprios nas duas plataformas: foto salva primeiro, iniciais estilizadas azul/violeta quando ausente ou indisponível. Iniciais e resolução de URLs de mídia são compartilhadas. O logo e arquivos da marca não foram editados.

### Aceite Manual Da Fase 4

1. Conferir Home operacional de cada um dos seis tipos, sem capa própria, nos dois temas.
2. Salvar capa própria, voltar à Home e conferir a prioridade; testar URL indisponível e fallback para segmento.
3. Entrar como cliente e superadmin após visitar uma unidade: a Home pessoal não deve mostrar o fundo daquela unidade.
4. Conferir unidade sem classificação e multissegmento sem principal/tipo reconhecido: visual neutro.
5. Trocar foto pessoal, renovar sessão e conferir iniciais em caso de foto ausente/indisponível, inclusive nome vazio.
6. Voltar ao mapa e à listagem após alterar foto/capa: filtros e seleção devem continuar preservados. Repetir após sair/entrar em outra conta.

Verificação técnica: build do core, checagem TypeScript web/backend e 15 testes de mídia/identidade passaram. Mobile não tem erros novos desta fase; restam dois erros anteriores em `AgendamentoAssistido` e no mapa de períodos de `useOperacao`. O contrato de capas corrigiu o erro anterior de `distanciaKm` no perfil público. `git diff --check` passou. Aceite visual no navegador/Android/iOS permanece pendente; não foi realizado build nativo ou publicação nesta fase.

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

Status: Fases 1–4 implementadas; aceite visual e de dispositivo pendente. O backend passou nos 10 testes de mídia e na checagem de tipos; a web também passou na checagem completa de tipos. A preparação do ambiente da Fase 1 continua necessária. Próximo desenvolvimento: Fase 5 — Curadoria e operação da galeria.

Referências de implementação: [upload multipart no NestJS](https://docs.nestjs.com/techniques/file-upload) e [processamento e remoção de metadados no Sharp](https://sharp.pixelplumbing.com/api-output/).

Referências mobile: [seletor e configuração nativa do Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) e [conversão/recorte com ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/).
