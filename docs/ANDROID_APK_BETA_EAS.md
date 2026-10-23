# Android — APK beta com API de produção

Preparação local entregue. Após autorização explícita, foram confirmados login e associação EAS, geradas credenciais Android e enviado o primeiro build beta após o cadastro da chave Maps. Consultar os registros abaixo e o link EAS para o resultado remoto; submissão não equivale a compilação concluída ou homologação no aparelho.

## Configuração

- `apps/mobile/eas.json`, perfil `beta`: release interno em APK, sem development client, ambiente EAS `production` e incremento remoto de versão.
- `EXPO_PUBLIC_API_BASE_URL=https://api.uniflowabs.top` identifica o destino solicitado. O código atual consome `API_URL`; o perfil define também essa variável com o mesmo destino para preservar login, chamadas e mídias sem refatorar o app.
- O APK não precisa de Expo Go, Metro ou Docker rodando. A API HTTPS de produção precisa estar disponível e aceitar as rotas atuais diretamente nesse subdomínio, sem `/api` adicional. O endereço não foi testado pelo agente.
- `eas-build-post-install` compila somente `@uniflowabs/core` na nuvem, pois `packages/core/dist` está ignorado pelo Git e não deve depender de saída gerada localmente.
- `app.config.js` preserva `app.json` e injeta a chave Android Maps do ambiente `GOOGLE_MAPS_API_KEY`, quando disponível. Sem chave válida o mapa do APK não deve ser considerado funcional, mesmo que funcione no Expo Go.
- Slug `barber-flow-abs`, pacote Android `com.barberflowabs.app`, esquema e versão base foram preservados. Não trocar esses identificadores só para gerar uma beta.

## Passos

Comandos completos também estão catalogados em `COMANDOS.md`, seção **APK Android beta pelo EAS**. Neste ambiente, não executar o npx diretamente no macOS. Na raiz do repositório no Mac, abrir um shell Docker interativo já dentro de `apps/mobile`:

```bash
docker compose run --rm --no-deps \
  --workdir /workspace/barberFlowABS/apps/mobile \
  --volume uniflowabs_expo_home:/root/.expo \
  -e API_URL=https://api.uniflowabs.top \
  -e EXPO_PUBLIC_API_BASE_URL=https://api.uniflowabs.top \
  app bash
```

Não usar `-T`, pois o CLI faz perguntas. O comando substitui a inicialização padrão por bash, sem iniciar backend/Metro ou publicar portas. Requer a imagem/dependências existentes do serviço app. O volume dedicado preserva o login em `/root/.expo`, como nos projetos Autoflow e Saiu do Forno; contém sessão de acesso ao Expo e não deve ser compartilhado. O bind mount preserva alterações de configuração no Mac. Não foi necessário alterar/reiniciar o Compose.

Executar todos os passos seguintes **dentro desse mesmo terminal Docker**, não no terminal do Mac:

1. Entrar na conta Expo correta com `npx eas-cli@latest login`.
2. Associar com `npx eas-cli@latest init`. Usar o projeto UniFlow da conta correta (ou criar um novo para este app); não reutilizar o projectId do Saiu do Forno. Se o CLI não conseguir editar a configuração dinâmica automaticamente, inserir o ID real informado em `expo.extra.eas.projectId` de `app.json`, preservando os demais campos. Conferir essa associação antes do build.
3. Configurar Google Maps: habilitar **Maps SDK for Android** no projeto Google Cloud com faturamento quando exigido. Criar uma chave restrita a esse SDK e ao pacote `com.barberflowabs.app` + SHA-1 do certificado de assinatura EAS.
4. Para obter/criar a assinatura antes do build, executar `npx eas-cli@latest credentials -p android` e escolher o perfil beta/keystore. Se já houver assinatura deste app, reutilizá-la; não substituir um keystore existente sem necessidade. Consultar o SHA-1 apresentado pelo EAS e restringir a chave Google com ele.
5. Cadastrar `GOOGLE_MAPS_API_KEY` no ambiente EAS `production` conforme comando catalogado. A chave vai para o aplicativo Android: não é segredo inacessível ao usuário; restrições de pacote/certificado/SDK são essenciais. Não cadastrar JWT_SECRET, DATABASE_URL ou segredos do backend no app.
6. Gerar com `npx eas-cli@latest build --platform android --profile beta` e aguardar o link. O comando envia o código ao Expo, cria um build remoto e pode consumir a cota/plano da conta.
7. Abrir o link EAS no Android, baixar o APK e autorizar a instalação por essa origem quando solicitado. Conferir login, mapa, contatos, câmera/galeria e uploads. A beta usa dados reais de produção: evitar reservas, campanhas ou alterações administrativas de teste sem intenção.

Para novos APKs, reabrir o shell Docker com o mesmo volume e repetir somente o comando de build, salvo alteração de conta/projeto/chave ou sessão expirada. A URL é incorporada no bundle: mudar a API exige novo build neste fluxo (OTA não foi configurado). O perfil não publica na Play Store. Para atualizar uma instalação existente, pacote e assinatura precisam coincidir; não desinstalar automaticamente, pois isso pode apagar dados locais.

Não usar `eas build:configure` por cima do perfil pronto nem `expo prebuild --clean` como pré-requisito. Não copiar `.env.prod` do backend para o mobile. Conferir que os arquivos de configuração preparados estão salvos e que somente arquivos autorizados serão enviados ao EAS; `.env` privados continuam ignorados pelo Git.

## Registro da execução autorizada — 22/10/2026

- Sessão confirmada como `milicofelix` no container `app`, após login executado pelo responsável com Expo CLI. Essa sessão não é a do volume do container temporário: não presumir que estará disponível após recriar `app`.
- Criado/associado projeto [@milicofelix/barber-flow-abs](https://expo.dev/accounts/milicofelix/projects/barber-flow-abs), ID `2cdbc4be-4595-4b28-92d1-297cf33d5612`. O EAS gravou `owner` e `extra.eas.projectId` em `app.json`.
- Gerado keystore remoto padrão `UniFlow ABS Android Beta` para `com.barberflowabs.app`, pois o projeto novo ainda não possuía assinatura. Nenhum keystore existente foi substituído ou baixado.
- SHA-1 público para restringir a chave Maps Android: `F7:86:5F:FD:84:59:EB:94:85:22:A8:FA:26:32:B0:D6:39:95:25:B5`.
- Consulta de ambiente EAS production confirmou ausência de `GOOGLE_MAPS_API_KEY`; nenhum valor de variável foi impresso. Falta o responsável configurar a chave Google e cadastrá-la como sensitive no projeto EAS para o mapa nativo.
- Build **ainda não enviado**. Nenhum APK ou URL de build gerado; nenhum teste ou alteração de banco executado. A execução parou na configuração externa do Google Maps, antes de consumir um build.

## Envio autorizado do APK beta — 22/10/2026

- Após cadastro pelo responsável, EAS carregou `GOOGLE_MAPS_API_KEY` do ambiente production e as duas variáveis de API do perfil beta, sem exposição do valor da chave.
- A variável foi cadastrada com escopo global da conta, conforme imagem enviada pelo responsável; isso também pode atingir outros projetos. Não foi alterado o escopo automaticamente. Recomenda-se uma variável específica por projeto quando as restrições Android diferirem.
- Build Android enviado pelo container `app` autenticado, perfil beta, versão 1.0.0, versionCode incrementado de 1 para 2, reutilizando o keystore `UniFlow ABS Android Beta`.
- [Build EAS 119c8fdd-9be4-4d84-9dea-0faccf4d608d](https://expo.dev/accounts/milicofelix/projects/barber-flow-abs/builds/119c8fdd-9be4-4d84-9dea-0faccf4d608d).
- O comando de envio concluiu com código 0 usando `--no-wait`: confirma submissão, não conclusão da compilação. O resultado/APK deve ser conferido no link EAS; não houve publicação na Play Store, deploy de backend ou alteração de banco.

## Correção do primeiro build — 22/10/2026

O build `119c8fdd-9be4-4d84-9dea-0faccf4d608d` terminou como **ERRORED**. O log final do Gradle confirmou o bloqueio em `react-native-reanimated/android/build.gradle.kts`: **react-native-worklets library not found**. Expo Doctor também encontrou seis grupos de problemas, mas seu código de saída não foi o erro final: o EAS chegou ao prebuild e ao Gradle.

Correções preparadas para a nova tentativa:

- Dependência direta `react-native-worklets` 0.10.1, versão indicada pelo SDK/Reanimated instalados.
- Patches do SDK 57 alinhados aos relatados pelo Doctor, sem migração para outro SDK ou mudança do pacote Android/assinatura.
- Remoção de `android.edgeToEdgeEnabled` e da configuração legada `splash`, campos não aceitos pelo schema atual do Expo. A mesma imagem/cores de abertura permanecem no plugin `expo-splash-screen` já configurado.
- Metro usando `getDefaultConfig(__dirname)` sem os overrides de monorepo antigos.
- `nohoist` restrito ao workspace mobile no Yarn Classic, mantendo sua árvore React 19/React Native isolada da web React 18; não foi criada resolução global que force todos os apps para React 19.
- `.easignore` explícito para excluir dependências/cache locais, ambientes/credenciais privadas e `package-lock.json` do arquivo enviado ao EAS. O lock npm legado foi preservado no repositório; o build remoto usa somente `yarn.lock`.

A reinstalação Docker para sincronizar o lock usa `--ignore-scripts`, sem rodar postinstall/Prisma do backend. A instalação limpa do EAS mantém seu ciclo normal de scripts, incluindo o hook de compilação do core. Não apagar `node_modules`/volumes ou o lock do usuário como tentativa de correção. Não ignorar os checks do Doctor para esconder problemas: reavaliar os resultados após instalar as dependências corrigidas.

Validação executada no Docker durante a correção autorizada:

- `yarn install --ignore-scripts --non-interactive --network-timeout 300000`: concluído com código 0 e `yarn.lock` atualizado. Não foram executados os scripts de instalação do backend.
- `expo-doctor --verbose` após todas as correções: **20/21 checks passaram**. Schema da configuração, Metro, peers obrigatórios, versões SDK e ausência de duplicação nativa aprovados.
- O único check local restante é a presença do `package-lock.json` legado. O arquivo não foi apagado do repositório; `.easignore` exclui-o do arquivo remoto. Foi conferido no código do EAS CLI instalado que `.easignore` é lido da raiz do repositório e substitui as regras `.gitignore` no empacotamento. O Doctor remoto ainda deve ser conferido na nova tentativa.
- Não foram executados testes unitários, reset, migrations, seed, publicação Play Store ou deploy da API. A aprovação do Doctor não equivale a compilação Gradle concluída nem teste do APK no aparelho.

Nova tentativa enviada com código de submissão 0, mesma assinatura, perfil beta e versão **1.0.0 / versionCode 3**:

[Build EAS 3cc26e99-f16d-490e-b448-071fb2e7b087](https://expo.dev/accounts/milicofelix/projects/barber-flow-abs/builds/3cc26e99-f16d-490e-b448-071fb2e7b087).

A conclusão/artefato deve ser verificada no painel EAS. O envio com `--no-wait` não declara o APK aprovado.

## Referências oficiais (configuração e dependências)

- [Expo — APK instalável e distribuição interna](https://docs.expo.dev/build-reference/apk/).
- [Expo — monorepos e compilação de dependências compartilhadas](https://docs.expo.dev/build-reference/build-with-monorepos/).
- [Expo — ambientes EAS](https://docs.expo.dev/eas/environment-variables/usage/).
- [react-native-maps — chave Google Maps Android](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md).
- [Expo — configuração automática do monorepo/Metro](https://docs.expo.dev/guides/monorepos/).
- [Expo — Reanimated e Worklets](https://docs.expo.dev/versions/latest/sdk/reanimated/).
- [Yarn Classic — isolamento com nohoist](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/).
