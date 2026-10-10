# UniFlow ABS Mobile

Aplicativo Expo/React Native com navegação por React Navigation.

> **Roadmap legado congelado em 2026-10-09.** A Fase 3 esta protegida pelo checkpoint `docs/MOBILE_PHASE_3_CHECKPOINT.md`. Novas funcionalidades devem seguir `docs/ROADMAP_MULTISSEGMENTO.md`; neste fluxo antigo entram apenas correcoes de defeito, seguranca e compatibilidade.

## Desenvolvimento com Docker

Na raiz do monorepo, substitua `SEU_IP` pelo endereço IPv4 atual do computador:

```bash
EXPO_PACKAGER_HOSTNAME=SEU_IP \
API_URL=http://SEU_IP:4000 \
docker compose up --force-recreate app
```

O celular e o computador precisam estar na mesma rede local. O Metro fica disponível na porta `8081` e a API na porta `4000`.

## Localização

A descoberta de barbearias usa o módulo oficial `expo-location` para solicitar somente a localização em primeiro plano. Depois de atualizar o código, pare o serviço e instale as dependências declaradas no monorepo:

```bash
docker compose stop app
docker compose run --rm --no-deps app yarn install --network-timeout 600000
```

Confirme que o módulo está disponível no volume do Docker:

```bash
docker compose run --rm --no-deps app node -p "require.resolve('expo-location/package.json')"
```

Não é utilizada localização em segundo plano. O mapa nativo será adicionado em uma etapa posterior.

## Tenant selecionado

A barbearia escolhida pelo cliente é persistida no AsyncStorage. As requisições do fluxo público de agendamento enviam o tenant selecionado pelo header `x-barbearia-slug`. O header `x-barbearia-id` fica reservado ao contexto operacional da barbearia do usuário.

O marketplace e o fluxo de agendamento ficam disponíveis para todos os perfis autenticados. Assim, um `BARBER`, `BARBERSHOP_OWNER`, `SUPER_ADMIN` ou `APP_OWNER` também pode utilizar o aplicativo como cliente sem misturar a barbearia selecionada com seu tenant operacional.

## Validação manual — Fase 3

### 1. Preparar e subir o ambiente

1. Confirme que `expo-location` está instalado usando o comando da seção anterior.
2. Descubra o IPv4 atual do computador. No macOS:

```bash
ipconfig getifaddr en0
```

3. Suba o ambiente em uma única linha para evitar problemas com espaços depois de `\`:

```bash
EXPO_PACKAGER_HOSTNAME=SEU_IP API_URL=http://SEU_IP:4000 docker compose up app
```

Evite `--force-recreate` depois de autenticar o Expo CLI dentro do container, pois a recriação pode remover essa sessão.

4. Aguarde o terminal mostrar `Metro waiting on exp://SEU_IP:8081`.
5. No iPhone, confirme que o Expo Go possui permissão de **Rede Local** e está na mesma rede Wi-Fi do computador.
6. Abra o QR code pelo Expo Go.

Resultado esperado: o aplicativo abre sem erro de plugin, exibe o login da UniFlow ABS e permite entrar com qualquer perfil autenticado.

Contas do seed para validação:

```text
Cliente:       cliente.barber-flow-mooca@barberflowabs.app / #Senha123
Barbeiro:      dono.barber-flow-mooca@barberflowabs.app / #Senha123
```

Para validar `SUPER_ADMIN`, use uma conta administrativa existente no ambiente. Caso o slug do seed seja diferente, consulte os usuários `cliente.<slug>@barberflowabs.app` e `dono.<slug>@barberflowabs.app` criados em `apps/backend/prisma/seed.ts`. O seed redefine a senha apenas dessas contas de demonstração, sem alterar a senha de usuários reais já existentes.

Se as contas de demonstração ainda não existirem ou tiverem sido criadas por um seed antigo, atualize somente os dados locais de demonstração antes do teste:

```bash
docker compose exec app yarn --cwd apps/backend prisma db seed
```

### 2. Validar a lista pública

- [ ] Entrar como cliente.
- [ ] Confirmar que a primeira aba é **Descobrir**.
- [ ] Entrar como barbeiro e confirmar que **Descobrir**, **Início** e **Agendar** continuam disponíveis junto da área operacional.
- [ ] Entrar como administrador e confirmar que o marketplace continua disponível junto da área administrativa.
- [ ] Confirmar que aparecem somente barbearias públicas aprovadas.
- [ ] Conferir em cada card: nome, localização, status, avaliação, distância quando disponível e serviços.
- [ ] Confirmar que tocar no card abre o perfil correto.

Resultado esperado: a lista apresenta barbearias como `Barber Flow Mooca` e não fica presa à barbearia configurada no `.env.local`.

### 3. Validar busca

Teste individualmente, limpando o campo anterior antes do próximo teste:

- [ ] Buscar pelo nome `Barber Flow Mooca`.
- [ ] Buscar pelo bairro `Mooca` no campo principal.
- [ ] Abrir **Filtros** e buscar pela cidade `Sao Paulo` ou `São Paulo`.
- [ ] Buscar pelo serviço `barba`.
- [ ] Informar um texto inexistente e conferir o estado vazio.

Resultado esperado: a quantidade encontrada é atualizada e somente resultados compatíveis permanecem na lista.

### 4. Validar filtros

- [ ] Ativar **Aberta agora** e conferir que barbearias fechadas desaparecem.
- [ ] Selecionar avaliação mínima de `4 estrelas`.
- [ ] Selecionar avaliação mínima de `4.5 estrelas`.
- [ ] Voltar para **Qualquer** e conferir que os resultados retornam.

Resultado esperado: os filtros podem ser combinados com nome, cidade e serviço sem travar a tela.

### 5. Validar localização e distância

1. Tocar em **Usar localização**.
2. Permitir acesso à localização durante o uso do aplicativo.
3. Testar os raios de `2 km`, `5 km`, `10 km` e `25 km`.

- [ ] O botão mostra `Localizando...` durante a leitura.
- [ ] Os cards próximos exibem a distância em quilômetros.
- [ ] Reduzir o raio atualiza a lista.
- [ ] Negar a permissão apresenta uma mensagem clara e mantém a busca manual funcionando.

Observação: se o aparelho estiver longe das coordenadas das barbearias de demonstração em São Paulo, uma lista vazia ao usar raios pequenos é o resultado esperado.

### 6. Validar o perfil público

Abra `Barber Flow Mooca` e confira:

- [ ] nome, descrição, endereço, telefone e status de funcionamento;
- [ ] nota média e quantidade de avaliações;
- [ ] serviços com preço e duração;
- [ ] profissionais e suas avaliações;
- [ ] horários de funcionamento;
- [ ] comentários de clientes;
- [ ] botão **Agendar nesta barbearia**.

Resultado esperado: todos os blocos carregam sem misturar dados de outra barbearia.

### 7. Validar denúncia de perfil

1. Tocar em **Reportar informações deste perfil**.
2. Tentar enviar uma mensagem com menos de 10 caracteres.
3. Confirmar que a validação impede o envio.
4. Selecionar um motivo e enviar uma mensagem válida claramente identificada como teste.

Resultado esperado: aparece `Denúncia recebida para revisão.` e múltiplos toques não geram envios duplicados.

Atenção: o envio válido cria um registro real de denúncia no ambiente atual.

### 8. Validar seleção e tenant do agendamento

1. No perfil da Mooca, tocar em **Agendar nesta barbearia**.
2. Confirmar que o aplicativo abre a aba **Agendar**.
3. Conferir o bloco `AGENDANDO EM` com o nome `Barber Flow Mooca`.
4. Conferir que serviços e profissionais pertencem à unidade Mooca.
5. Selecionar profissional, serviços, data e horário.
6. Avançar para o resumo e confirmar que a barbearia correta aparece.
7. Finalizar o agendamento.

Resultado esperado: o agendamento é criado usando o `x-barbearia-slug` da barbearia selecionada, inclusive quando o usuário autenticado também possui perfil operacional em outra barbearia.

### 8.1 Validar duração e blocos do agendamento

1. Escolher um serviço cuja duração seja de 45 minutos, como **Corte social**.
2. Selecionar um horário livre, por exemplo `10:00`.
3. Confirmar que `10:00`, `10:15` e `10:30` ficam destacados como um único período.
4. Confirmar que um início sem três blocos consecutivos aparece como **Indisponível**.
5. Confirmar que um horário inicial cujo período alcance um bloco ocupado também fica indisponível.
6. Selecionar um horário e, em outro cliente, ocupar um dos blocos do período; ao atualizar a ocupação, confirmar que a seleção antiga é removida.
7. Finalizar o agendamento e voltar ao mesmo profissional e dia.
8. Confirmar que os três blocos aparecem como ocupados e não podem ser selecionados novamente.
9. Abrir o mesmo dia na web e confirmar que o período ocupado é idêntico.

Resultado esperado: mobile, web e backend calculam a quantidade de blocos pela duração real do serviço, usando blocos consecutivos de 15 minutos.

### 8.2 Validar agendamento ativo do cliente

1. Entre com um cliente que já possua um agendamento ativo para hoje ou para uma data futura.
2. Tente finalizar um novo agendamento, no mesmo estabelecimento ou em outro.
3. Confirme que nenhuma reserva anterior é cancelada automaticamente.
4. Confirme a mensagem: `Você já possui um agendamento ativo. Cancele o agendamento anterior antes de criar outro.`
5. Cancele o agendamento anterior e tente novamente.

Resultado esperado: cada cliente mantém somente um agendamento futuro ativo por unidade. Agendamentos em unidades diferentes são permitidos, mas permanecem visíveis na área **Ativos** para evitar conflito de horários.

Quando a API informar que já existe um agendamento ativo na mesma unidade, o resumo exibe o botão **Ver e cancelar meu agendamento**. A aba **Início** possui os filtros **Ativos** e **Histórico**, mostra estabelecimento, unidade e status, e permite cancelar reservas futuras após confirmação. Reservas vencidas são mantidas no histórico para o estabelecimento classificá-las como **Concluído**, **Cancelado** ou **Não compareceu**.

Se houver uma reserva ativa em outra unidade, o resumo apresenta apenas um lembrete para conferir datas e horários; a nova reserva continua permitida.

### 9. Validar troca e persistência

1. Na aba **Agendar**, tocar em **Trocar barbearia**.
2. Abrir outra barbearia e tocar em **Agendar nesta barbearia**.
3. Confirmar que profissional, serviços e horários foram recarregados para o novo tenant.
4. Fechar e abrir novamente o Expo Go.
5. Voltar à aba **Descobrir**.

Resultado esperado: a última barbearia continua marcada como `Selecionada` e nenhuma seleção antiga do formulário permanece após a troca.

### 10. Critério final da fase

- [ ] O cliente encontra uma barbearia por busca ou filtros.
- [ ] O cliente consulta perfil, serviços, profissionais, horários e avaliações.
- [ ] A barbearia selecionada sobrevive à reabertura do aplicativo.
- [ ] O agendamento usa serviços e profissionais do tenant selecionado.
- [ ] Um usuário operacional consegue agendar em outra barbearia sem usar o próprio `barbeariaId`.
- [ ] A denúncia apresenta validação e confirmação.
- [ ] Erros de rede, localização negada e resultados vazios possuem feedback visual.
- [ ] O mapa exibe um marcador compatível com o tipo de cada estabelecimento.

### 11. Validar marcadores personalizados no mapa

1. Garanta que existam estabelecimentos aprovados, com latitude e longitude, em tipos diferentes.
2. Na aba **Descobrir**, alterne de **Lista** para **Mapa**.
3. Confira os pins de barbearia, salão, esmalteria/manicure, clínica estética e spa.
4. Confirme que estúdio, profissional autônomo e tipos desconhecidos usam o marcador geral de beleza.
5. Toque em cada pin, confira nome e especialidades e abra o perfil pelo balão.
6. Repita a conferência no mapa da descoberta web.

Resultado esperado: os pins possuem fundo transparente, ficam ancorados pela ponta nas coordenadas e usam o mesmo padrão azul/violeta, sem círculo luminoso no chão.
