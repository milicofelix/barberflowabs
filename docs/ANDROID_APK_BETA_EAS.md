# Android — APK beta com API de produção

Preparação local entregue. Após autorização explícita, foram confirmados login e associação EAS e geradas credenciais Android; consultar o registro abaixo. O APK ainda não foi compilado: falta configurar Google Maps. A compatibilidade do build com o SDK/dependências atuais ainda depende da execução.

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

## Referências oficiais

- [Expo — APK instalável e distribuição interna](https://docs.expo.dev/build-reference/apk/).
- [Expo — monorepos e compilação de dependências compartilhadas](https://docs.expo.dev/build-reference/build-with-monorepos/).
- [Expo — ambientes EAS](https://docs.expo.dev/eas/environment-variables/usage/).
- [react-native-maps — chave Google Maps Android](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md).
