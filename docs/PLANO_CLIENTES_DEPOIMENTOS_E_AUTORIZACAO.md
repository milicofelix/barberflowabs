# Plano — Clientes, Depoimentos E Autorização De Imagem

Status: planejado; a seção pública da Home web mantém apenas título e descrição. Fotos e depoimentos do catálogo demonstrativo foram retirados da renderização, sem apagar arquivos ou fotos pessoais.

## Regras De Produto

- Participação voluntária, desativada por padrão, sem efeito sobre agendamento, atendimento ou acesso à conta.
- Foto de perfil e autorização para comunicação não autorizam automaticamente divulgação na Home. Não reutilizar `fotoURL` nem contatos importados para esse fim.
- O cliente escolhe uma imagem específica e, opcionalmente, escreve seu depoimento. Oferecer publicação sem foto e com nome de exibição reduzido, por exemplo, primeiro nome.
- Mostrar prévia exata, público-alvo e locais de exibição antes de confirmar. Autorização inicial limitada à Home da plataforma; publicidade externa ou página da unidade exige escopo separado.
- Não publicar e-mail, telefone, endereço, histórico de atendimento, nome de procedimento ou informações clínicas. A moderação não pode inventar opiniões nem transformar um atendimento em endosso.
- Não apresentar exemplos como avaliações reais. Avaliações de atendimento e depoimentos promocionais são recursos distintos.
- Cliente pode retirar a autorização e solicitar remoção sem depender de aprovação do estabelecimento. Publicação depende de autorização vigente e revisão administrativa.
- Conteúdo de menores fica fora do lançamento inicial. Revisão de privacidade/jurídica e das políticas de publicação será necessária antes de produção; este documento não representa aprovação legal.

## Fase 1 — Domínio E Contratos

- [ ] Criar submissão com proprietário, texto, nome de exibição, mídia específica, escopo e estados RASCUNHO/PENDENTE/APROVADO/REJEITADO/RETIRADO.
- [ ] Registrar autorização explícita, versão do texto exibido, escopo e datas de concessão/retirada. Separar autorização de aprovação editorial.
- [ ] API autenticada para criar, consultar e retirar a própria participação; API administrativa para revisão; API pública retorna somente conteúdo aprovado com autorização vigente.
- [ ] Definir armazenamento privado para rascunhos/submissões e promoção controlada da versão publicada. Não usar diretamente o upload atual de mídia pública para documentos ou imagens ainda privadas.
- [ ] Definir retenção, auditoria mínima e exclusão segura sem afetar fotos de perfil ou outras referências.

## Fase 2 — Participação Web E Mobile

- [ ] Em Perfil/Configurações, oferecer “Participar com um depoimento”, sem ativação automática ou caixa pré-marcada.
- [ ] Escolher foto específica, texto e nome de exibição; exibir prévia e opção sem foto.
- [ ] Confirmar autorização para o escopo apresentado e enviar para revisão.
- [ ] Mostrar situação e permitir editar antes da aprovação e retirar a qualquer momento. Mudanças em foto/texto/nome exigem nova revisão e confirmação da prévia.

## Fase 3 — Moderação E Publicação

- [ ] Superadmin revisa conteúdo, imagem, autorização e escopo; estabelecimento não pode autorizar em nome do cliente.
- [ ] Registrar aprovação/rejeição e motivo; não alterar silenciosamente conteúdo autorizado.
- [ ] Publicar cartões leves e acessíveis, com imagem opcional, nome de exibição e texto; evitar o mosaico de altura fixa anterior.
- [ ] Usar identidade neutra quando não há foto. Sem participações aprovadas, manter somente a descrição atual, sem dados demonstrativos.
- [ ] Replicar a exibição no mobile apenas se houver uma seção pública equivalente e escopo aprovado para ela.

## Fase 4 — Retirada, Segurança E Aceite

- [ ] Retirada bloqueia novas entregas públicas e remove o cartão das interfaces; invalidar caches, remover derivados publicados e revisar a retenção do original.
- [ ] Avaliar o cache imutável de mídia existente: não reutilizá-lo sem uma estratégia de retirada. Cópias já baixadas, capturas e caches de terceiros não têm remoção garantida; explicar essa limitação ao participante.
- [ ] Validar isolamento entre contas, aprovação sem autorização, autorização retirada, edição pendente e tentativas de publicar dados pessoais.
- [ ] Testar nome/texto longos, imagem ausente, contraste, leitores de tela, retirada web/mobile e ausência de conteúdo aprovado.
- [ ] Registrar testes e revisão de privacidade antes de liberar para produção.

Nenhuma dessas fases foi implementada neste ajuste. O próximo passo depende de aprovar o fluxo e o escopo de exibição; não há coleta nova de autorização ou publicação automática.
