# Vitrines Compactas Da Home E Exploração Do Marketplace

## Objetivo

Evitar que a Home pública cresça conforme o catálogo das unidades. A Home apresenta uma seleção curta; serviços e profissionais completos ficam em páginas públicas próprias. A Home operacional de donos/equipes permanece separada, sem essas vitrines.

## Fase 1 — Consulta Limitada E Critérios De Destaque

- [x] Criar consultas públicas específicas, preservando os endpoints legados utilizados no agendamento/mobile.
- [x] Aplicar os mesmos critérios de publicação dos estabelecimentos e exigir vínculo profissional/serviço ativo.
- [x] Limitar cada vitrine a seis registros e distribuir os itens entre unidades.
- [x] Permitir filtro pelo segmento cadastrado da unidade, sem lista fixa no frontend.
- [x] Aplicar limites de consulta e validar parâmetros no backend.

Contratos: `GET /public/catalogo/servicos`, `GET /public/catalogo/profissionais` e `GET /public/catalogo/segmentos`. Consulta padrão: `pagina=1&limite=12`; limite máximo 24 e página máxima 1000. Busca `q` tem até 120 caracteres e considera nome/descrição do item e nome público/interno da unidade. `segmento` recebe o slug de uma classificação ativa da unidade. Essa classificação não afirma que cada serviço individual possui uma especialidade específica.

`vitrine=true` fixa o resultado em até seis itens. O backend seleciona no máximo seis unidades elegíveis, alternando o ponto inicial diariamente em UTC. Consulta até seis candidatos por unidade (no máximo 36) e intercala as unidades antes de retornar seis cartões. Se houver poucas unidades, preenche as posições restantes com outros itens delas. Não carrega todos os serviços/profissionais para depois esconder no navegador, não usa sorteio a cada render e não depende de ranking pago. A rotação é de unidades, não de todos os serviços internos; a ordem dos candidatos dentro de cada unidade é nome + ID.

## Fase 2 — Vitrines Compactas Na Home

- [x] Mostrar até seis serviços e seis profissionais em grades responsivas, sem novo carrossel.
- [x] Adicionar seleção de segmento e botão **Ver todos** em cada seção.
- [x] Identificar a unidade e permitir abrir seu perfil público em ambos os tipos de cartão.
- [x] Reduzir a altura das fotos de profissionais e limitar visualmente descrições extensas.
- [x] Usar **Encontre o cuidado que você procura** como título de serviços.
- [x] Preservar a Home operacional sem vitrines públicas.

`CatalogoPublico` compartilha apresentação/filtros entre vitrines e páginas completas. `useCatalogoPublico` concentra consulta, debounce de busca, carregamento, erro, vazio e descarte de respostas antigas. Os componentes anteriores da Home agora são entradas pequenas para esse componente comum; os hooks antigos de profissionais/serviços foram preservados para não mudar contratos de outros fluxos.

Cartões usam cores de tema, identificam o estabelecimento e limitam linhas de título/descrição. Ícones de redes sociais sem links reais foram removidos dos cartões de profissionais para reduzir ruído visual. O perfil público continua sendo o destino para conferir os detalhes antes de agendar.

## Fase 3 — Páginas Completas De Exploração

- [x] Criar `/servicos` e `/profissionais` fora da área autenticada.
- [x] Incluir busca, filtro de segmento, paginação de 12 itens, contagem e navegação de retorno.
- [x] Preservar o segmento ao seguir o botão **Ver todos**.
- [x] Manter ordenação estável por nome e ID no catálogo completo.

A paginação limita os resultados no banco, não somente no frontend. Busca/filtro reiniciam na primeira página. Essas páginas não exigem login nem selecionam outra unidade globalmente; os links levam ao perfil da unidade correspondente. As buscas posteriores são estado local da tela; não há persistência dos filtros de exploração ao sair e voltar pelo navegador nesta entrega.

## Estado Da Entrega

Implementado em 15/10/2026. Foram escritos testes isolados de limites/validação, política de publicação, paginação no banco e distribuição limitada entre unidades; não executados. Não foram executados testes, builds, typecheck, lint, verificações de API, migrations ou reinícios. Não há mudança de schema, seed ou dependência. As novas rotas exigem carregar o backend atualizado com o restart já registrado em `docs/COMANDOS.md`.

## Aceite Manual Pendente

- [ ] Abrir a Home deslogado e como cliente, nos temas claro/escuro e em tela pequena; conferir no máximo seis cartões por seção.
- [ ] Com múltiplas unidades publicadas, conferir intercalação e a identificação correta de cada unidade. Com uma só unidade, conferir preenchimento até seis quando houver dados.
- [ ] Filtrar cada vitrine por segmento e usar **Ver todos**; conferir manutenção do filtro e retorno ao início.
- [ ] Nas páginas completas, buscar por item/unidade, paginar, limpar filtros e conferir carregamento/erro/vazio sem resultados antigos sobrescrevendo uma consulta mais recente.
- [ ] Conferir ausência de unidades suspensas/não aprovadas e de itens sem vínculo ativo. Conferir que o estabelecimento selecionado anteriormente no agendamento não limita o catálogo global.
- [ ] Abrir dois cartões com o mesmo nome em unidades diferentes e conferir o destino correto pelo nome da unidade.
- [ ] Conferir a rotação de unidades com datas controladas em ambiente de teste e catálogo com mais de seis unidades, sem mudar o relógio real do servidor.
- [ ] Entrar como dono/equipe e confirmar que a Home continua operacional; conferir que a escolha de profissional/serviço do agendamento mantém seu comportamento anterior.
