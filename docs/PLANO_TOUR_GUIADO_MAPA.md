# Plano — Tour Guiado Do Mapa

## Objetivo

Criar um tour contextual para ensinar a experiência pública de descoberta no mapa, priorizando o mobile e entregando a versão web somente depois da homologação no aplicativo.

O tour deve apresentar os recursos enquanto eles estão visíveis na tela real: alternância entre lista e mapa, categorias, filtros, localização, marcadores e abertura do perfil de um estabelecimento. Ele não deve simular ações, alterar filtros silenciosamente nem solicitar permissões do aparelho sem uma decisão explícita do usuário.

## Princípios Da Experiência

- aparecer automaticamente apenas na primeira entrada relevante;
- permitir **Pular**, **Voltar**, **Próximo** e **Concluir** em todas as etapas aplicáveis;
- oferecer **Ver tour novamente** em Perfil/Ajuda;
- preservar a escolha de quem pulou ou concluiu;
- não bloquear permanentemente a tela caso um elemento não esteja disponível;
- explicar a localização antes de abrir a permissão nativa;
- adaptar textos e posições a telas pequenas, orientação, tema claro/escuro e acessibilidade;
- não exibir o tour operacional para proprietário, gestor, membro da equipe ou superadmin;
- não coletar pesquisa, endereço, coordenadas ou nome de estabelecimento nas métricas do tour.

## Jornada Proposta

| Passo | Alvo | Mensagem principal |
| --- | --- | --- |
| 1 | Cabeçalho da descoberta | “Encontre serviços e estabelecimentos perto de você.” |
| 2 | Alternador Lista/Mapa | “Alterne entre cartões e localização no mapa sem perder seus filtros.” |
| 3 | Carrossel de categorias | “Escolha barbearia, beleza, manicure, spa e outros segmentos.” |
| 4 | Botão Filtros | “Refine por cidade, especialidade, preço, avaliação, disponibilidade e distância.” |
| 5 | Opção Sem limite | “Use uma distância específica ou veja todos os resultados.” |
| 6 | Botão Localizar | “Se desejar, autorize sua localização para ordenar e limitar resultados próximos.” |
| 7 | Marcadores do mapa | “Cada ícone representa o segmento do estabelecimento.” |
| 8 | Marcador/cartão selecionado | “Toque para consultar serviços, preços, horários e iniciar um agendamento.” |

Se não houver estabelecimentos, localização ou marcador visível, o passo correspondente deve usar uma explicação geral e avançar normalmente. O tour não deve fabricar dados nem alterar a região escolhida pelo usuário.

## Persistência E Versionamento

No mobile, persistir localmente com `AsyncStorage`; na web, usar `localStorage`. O estado mínimo será:

```ts
type EstadoTourMapa = {
  versao: number
  status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PULADO'
  passoAtual: number
  atualizadoEm: string
}
```

Chaves sugeridas:

- mobile: `@uniflowabs/tour_mapa:v1`;
- web: `uniflowabs:tour-mapa:v1`.

Uma mudança relevante na experiência incrementa a versão. Uma nova versão não deve reaparecer automaticamente para todos sem decisão de produto; o padrão será disponibilizá-la em **Ver tour novamente** e reiniciar automaticamente apenas quando houver mudança essencial de navegação ou segurança.

Inicialmente, a preferência será do dispositivo e funcionará inclusive para visitantes sem login. Sincronização entre dispositivos e conta poderá ser avaliada posteriormente, sem bloquear esta entrega.

## Arquitetura Compartilhável

Definir um contrato independente da interface:

- identificador e versão do tour;
- lista ordenada de passos;
- chave semântica do alvo, sem depender de coordenadas fixas;
- título, descrição e posição preferencial;
- regra para pular um passo indisponível;
- eventos de início, avanço, retorno, conclusão e abandono.

Os componentes visuais permanecem específicos de cada plataforma. O mobile deve usar uma camada em `Modal`/portal acima do `MapView`, com recorte de destaque e âncora medida em tempo real. A web deve usar portal acima do Leaflet. Não compartilhar cálculos de posição entre React Native e DOM.

A escolha de uma biblioteca de terceiros só deve ocorrer após uma prova com Expo, React Native, `react-native-maps`, tema dinâmico e leitores de tela. Se a biblioteca não suportar esses pontos, implementar uma camada pequena própria com registro de âncoras por chave semântica.

## Fase 1 — Contratos E Fundação Mobile

- [ ] Definir contrato dos passos, versão e estado persistido.
- [ ] Criar o controlador do tour com iniciar, avançar, voltar, pular, concluir e reiniciar.
- [ ] Criar componente de sobreposição com destaque, cartão explicativo e indicador de progresso.
- [ ] Registrar alvos por chave semântica e medir novamente após rotação, rolagem ou mudança de layout.
- [ ] Garantir fallback quando o alvo não estiver montado ou sair da viewport.
- [ ] Integrar tema claro/escuro e respeitar preferência de redução de movimento.
- [ ] Cobrir controlador, persistência, versão e passos indisponíveis com testes.

### Critério De Saída

O tour de demonstração deve funcionar sobre componentes comuns, sobreviver ao reinício do app e não reaparecer depois de concluído ou pulado.

## Fase 2 — Integração Com O Mapa Mobile

- [ ] Instrumentar cabeçalho, Lista/Mapa, categorias, filtros, Sem limite, Localizar e área do mapa.
- [ ] Iniciar automaticamente ao abrir o mapa pela primeira vez, depois de a interface estar estável.
- [ ] Manter filtros e posição da lista ao entrar e sair do tour.
- [ ] Nunca disparar `requestForegroundPermissionsAsync` apenas por avançar no tour.
- [ ] Explicar permissão negada sem insistência e permitir continuar sem localização.
- [ ] Destacar marcador real quando existir; usar explicação geral quando o resultado estiver vazio.
- [ ] Permitir tocar no marcador apenas quando o passo solicitar interação, sem perder o estado.
- [ ] Adicionar **Ver tour do mapa novamente** em Perfil/Ajuda.
- [ ] Validar Android e iOS, aparelhos pequenos, notch, teclado e temas claro/escuro.

### Critério De Saída

Um visitante deve concluir ou pular o tour, continuar usando lista/mapa normalmente e conseguir reiniciá-lo manualmente sem limpar dados do aplicativo.

## Fase 3 — Qualidade, Acessibilidade E Métricas Mobile

- [ ] Mover foco de acessibilidade para título, descrição e ação atual.
- [ ] Fornecer rótulos claros para progresso, fechar, voltar e avançar.
- [ ] Garantir contraste, área mínima de toque e leitura sem depender apenas de cor.
- [ ] Pausar o tour se o app for para segundo plano e restaurar o passo com segurança.
- [ ] Impedir sobreposição com seletor de tema, sino, navegação inferior e áreas seguras.
- [ ] Medir início, conclusão, abandono e passo de saída sem dados pessoais ou localização.
- [ ] Medir se usuários que concluíram conseguem abrir um estabelecimento, sem atribuição invasiva.
- [ ] Homologar o texto e a quantidade de passos antes de começar a versão web.

## Fase 4 — Paridade Web

- [ ] Reutilizar contrato, ordem e linguagem homologados no mobile.
- [ ] Criar overlay por portal compatível com Leaflet, responsividade e navegação por teclado.
- [ ] Instrumentar Lista/Mapa, categorias, filtros, localização, marcadores e perfil público.
- [ ] Persistir versão e conclusão no navegador.
- [ ] Adicionar **Ver tour do mapa novamente** no menu/ajuda pública.
- [ ] Preservar busca, filtros, posição do mapa e histórico de navegação.
- [ ] Validar desktop, tablet, viewport mobile, zoom do navegador e os dois temas.
- [ ] Garantir que Escape feche o tour e que Tab permaneça dentro do diálogo enquanto aberto.

## Fase 5 — Governança E Aceite Final

- [ ] Centralizar textos para futura tradução e revisão sem alterar os componentes.
- [ ] Definir responsável por aprovar mudanças de versão e reexibição automática.
- [ ] Documentar eventos, retenção e finalidade das métricas.
- [ ] Confirmar ausência de coordenadas, pesquisas e identificação pessoal nos eventos.
- [ ] Comparar abandono e conclusão entre mobile e web.
- [ ] Remover passos com baixo valor ou alto abandono antes da publicação geral.
- [ ] Liberar gradualmente e manter opção remota de desativar o início automático.

## Cenários Obrigatórios De Aceite

1. Primeiro acesso ao mapa apresenta o tour depois que a tela estiver pronta.
2. Pular no segundo passo impede nova abertura automática.
3. Concluir e reiniciar o app não exibe o tour novamente.
4. **Ver tour novamente** reinicia no primeiro passo.
5. Negar localização não bloqueia filtros, lista, mapa nem conclusão.
6. Resultado vazio não prende o usuário no passo de marcador.
7. Alterar categoria durante uma interação permitida não reinicia o tour.
8. Alternar tema mantém o passo, o contraste e o alvo correto.
9. Rotacionar ou redimensionar reposiciona destaque e cartão.
10. Leitor de tela anuncia conteúdo e ações na ordem correta.
11. Proprietário, equipe e superadmin não recebem o tour público automaticamente.
12. Mobile homologado e web apresentam a mesma jornada, sem exigir implementação visual idêntica.

## Fora Do Escopo Inicial

- tour completo de todas as áreas do aplicativo;
- criação de dados fictícios para demonstrar marcadores;
- solicitação automática de localização;
- sincronização do progresso entre dispositivos;
- campanhas, gamificação ou recompensa por concluir o tour;
- gravação da tela, mapa de calor ou coleta de coordenadas do usuário.

## Ordem Recomendada

Executar as Fases 1, 2 e 3 no mobile e homologar em Android e iOS. Somente depois iniciar a Fase 4 na web. A Fase 5 encerra a entrega nas duas plataformas e define como futuras versões do tour serão publicadas.
