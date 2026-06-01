# CLAUDE_DEPLOY.md — Runbook de Deploy (PatheticHooks)

Guia operacional para buildar e publicar o PatheticHooks no Firebase (Hosting + Cloud Functions gen2 + Firestore). Escrito para retomar o deploy sem redescobrir os detalhes.

---

## Visão geral

- **App:** Nuxt 4 (Vue 3) + Nitro, deployado como **uma única Cloud Function gen2** (`server`, Node 22, região `us-central1`) atrás do **Firebase Hosting**.
- **Persistência:** Cloud Firestore via `firebase-admin` (Application Default Credentials).
- **Tempo real:** cliente faz **Firebase Anonymous Auth** + `onSnapshot` no documento do webhook (owner-gated). **Não usar SSE** (o Hosting faz buffer de streaming — ver Gotchas).
- **Projeto Firebase:** `pathetichooks` (default em `.firebaserc`). URL: https://pathetichooks.web.app
- **Function URL direta (Cloud Run):** `https://server-tpgzdbx34q-uc.a.run.app`

---

## Pré-requisitos

1. **Node.js 22** e **pnpm** (`package.json` fixa `engines.node: 22`).
2. **Firebase CLI** instalado e autenticado: `firebase login` (verifique com `firebase projects:list`).
3. **Plano Blaze** (pay-as-you-go) no projeto — obrigatório para Cloud Functions gen2. Há free tier generoso.
4. **Anonymous Auth habilitado** no Console (Authentication → Get started → Sign-in method → Anonymous → Enable). Sem isso, o feed em tempo real fica inerte (`CONFIGURATION_NOT_FOUND` na signup anônima). O resto da app funciona.
5. Firestore `(default)` provisionado (já existe).

---

## Deploy (caminho feliz)

Um comando faz tudo:

```bash
pnpm run deploy
```

> Use `pnpm run deploy` (e não `pnpm deploy`) — `deploy` é um comando embutido do pnpm e teria precedência sobre o script.

Que executa (`package.json` → script `deploy`):

```
nuxt build
  && node scripts/patch-firebase-build.mjs
  && npm --prefix .output/server install
  && firebase deploy --only firestore:rules,firestore:indexes,functions:server,hosting
```

### O que cada etapa faz

1. **`nuxt build`** — gera `.output/public` (assets/CDN) e `.output/server` (a função Nitro, preset `firebase`).
2. **`scripts/patch-firebase-build.mjs`** — prepara `.output/server` para o `npm install`:
   - Remove o `node_modules` e o `package-lock.json` pré-populados pelo Nitro (eles fixam resoluções que furam os overrides).
   - Copia `stubs/` e injeta um **override de `@vue/devtools-api`** (stub vazio) em `package.json`. Sem isso, a resolução aninhada do `pinia` quebra o bundle da função.
3. **`npm --prefix .output/server install`** — instala as deps de runtime da função (incl. `firebase-admin`, `firebase-functions`). Resolve o stub do devtools.
4. **`firebase deploy`** — publica regras + índices do Firestore, a função `server` e o Hosting.

---

## Deploy manual (passo a passo, para depurar)

```bash
# 1. build limpo
rm -rf .output
pnpm nuxt build         # ou: npx nuxt build

# 2. patch do output da função
node scripts/patch-firebase-build.mjs

# 3. deps de runtime da função
npm --prefix .output/server install

# 4. deploy (alvos explícitos)
firebase deploy --only functions:server,hosting,firestore:rules,firestore:indexes --project pathetichooks
```

> Para iterar só na função+hosting (regras/índices inalterados): `--only functions:server,hosting`.
> O build da função gen2 roda Cloud Build na nuvem (~2–3 min) — é a etapa mais lenta.

---

## Verificação pós-deploy (smoke test)

```bash
BASE=https://pathetichooks.web.app
# app + headers de segurança
curl -s -o /dev/null -D - "$BASE/" | grep -iE '^HTTP/|x-frame-options|x-content-type-options'
# fluxo: criar -> capturar -> detalhe
JAR=$(mktemp)
TOKEN=$(curl -s -c "$JAR" -X POST "$BASE/api/webhooks" -H 'content-type: application/json' -d '{"name":"smoke"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s -o /dev/null -X POST "$BASE/hook/$TOKEN?x=1" -H 'content-type: application/json' -d '{"ok":1}'
curl -s -b "$JAR" "$BASE/api/webhooks/$TOKEN" | python3 -c 'import sys,json;print("requests:",len(json.load(sys.stdin)["requests"]))'
curl -s -b "$JAR" -X DELETE "$BASE/api/webhooks/$TOKEN" -o /dev/null   # limpa
# regras Firestore deployadas (leitura não-auth deve negar)
curl -s "https://firestore.googleapis.com/v1/projects/pathetichooks/databases/(default)/documents/webhooks/$TOKEN" | grep -q PERMISSION_DENIED && echo "rules OK"
```

Realtime (requer Anonymous Auth ligado): sign-up anônimo via apiKey pública deve retornar `idToken`; ler o próprio doc após `/listen` → 200; doc de outro uid → 403; `list` da coleção → 403.

---

## Gotchas (importante)

- **Firebase Hosting faz buffer de streaming.** SSE funciona na URL direta do Cloud Run, mas pelo CDN do Hosting o cliente recebe 0 bytes até timeout. Por isso o feed usa `onSnapshot` (Firestore direto), **não** SSE. Não reintroduzir SSE atrás do Hosting.
- **Anonymous Auth precisa estar habilitado** no Console; é passo manual (não há comando CLI estável). Sintoma se faltar: feed não atualiza ao vivo (degrada para carga inicial).
- **`firebase-admin` usa ADC** — nenhuma chave de service account embarcada. A SA de runtime da função tem as permissões. Não commitar chaves.
- **`@nuxt/image` foi removido** dos módulos para tirar `sharp`/`ipx`/`svgo` do bundle da função (cold start menor, deploy mais confiável). Não readicionar sem necessidade.
- **Config da função** vive em `nuxt.config.ts` (`nitro.firebase.httpsOptions`): `region us-central1`, `maxInstances: 5`, `memory: 512MiB`. A função **escala a zero** (sem `minInstances`) — parada = sem custo.
- **Headers de segurança** vêm de `nitro.routeRules` (app/API) + `firebase.json` (Hosting). A rota `/hook` define os próprios headers de sandbox no handler.
- **`firebase-functions/v2/https` "could not be resolved"** no log do build é benigno (resolvido no `npm install` da função).
- **Aviso de sourcemap do Tailwind/Browserslist** no build é cosmético.

---

## Custo (referência rápida)

- Free tier diário: ~50k leituras / 20k escritas Firestore; ~2M invocações de função/mês; 10 GB transfer Hosting/mês; Auth anônimo grátis.
- Feed `onSnapshot` = 0 leitura ociosa e **não invoca a função**. Função só é chamada em: carregar página (SSR), ações do usuário (API) e **cada captura `/hook`**.
- Uso pessoal ≈ R$ 0/mês. Único vetor de custo: flood no `/hook` público (escritas/invocações). Recomendado criar **alerta de orçamento** no Google Cloud Billing.

---

## Domínio personalizado (status)

`pathetichooks.com` (Hostinger) está **sob verification hold** (`ns*.verification-hold.dns-suspended.com`). Antes de conectar no Firebase, é preciso **concluir a verificação de contato/e-mail da Hostinger** para reativar o domínio. Depois: Console → Hosting → Add custom domain → registros A no DNS Zone Editor da Hostinger. Nenhuma mudança de código é necessária.

---

## Segurança

Ver `SECURITY_AUDIT.md` (auditoria 2026-05-31: 0 vazamentos, 2 hardenings opcionais pendentes). Regras Firestore (`firestore.rules`): `get` do webhook só se `auth.uid == ownerUid`; `list`/`write` negados; `requests`/`sessions` negados ao cliente.
