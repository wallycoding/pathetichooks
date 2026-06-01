# Pathetic Hooks

> Inspetor de webhooks em tempo real — sem login, sem configuração.

**Pathetic Hooks** gera URLs únicas que capturam qualquer requisição HTTP enviada a elas
e mostram, ao vivo, os **headers, body, query string e metadados** de cada chamada.
É a ferramenta certa para depurar integrações, inspecionar callbacks de serviços de
terceiros (Stripe, GitHub, Mercado Pago, etc.) ou simplesmente entender o que um cliente
HTTP está realmente enviando.

Pense nele como um RequestBin/webhook.site enxuto: você cria um endpoint, aponta o
serviço para ele e observa as requisições aparecerem na tela em tempo real.

## Como funciona

1. **Crie um webhook** — uma URL única (`/hook/<token>`) é gerada para você.
2. **Aponte qualquer cliente para ela** — `curl`, Postman, ou o serviço que você quer depurar.
3. **Veja ao vivo** — cada request aparece instantaneamente com método, path, headers,
   body (com formatação automática de JSON), query, IP de origem e User-Agent.
4. **Personalize a resposta** — defina o status HTTP, o `Content-Type` e o body que o
   endpoint devolve a quem o chamar.

```bash
curl -X POST https://pathetichooks.web.app/hook/<seu-token> \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'
```

Sem cadastro: a sessão é anônima (cookie) e os dados **expiram automaticamente após 7 dias**.

## Recursos

- ⚡ **Tempo real** — requisições aparecem na hora, via listener do Firestore (sem refresh).
- 🔍 **Inspetor completo** — body, headers, query e visão "raw" estilo HTTP/1.1.
- 🎛️ **Resposta configurável** — status, `Content-Type` e body por webhook.
- 🧹 **Gerenciável** — renomeie, limpe o histórico ou remova webhooks e requests.
- 🌐 **Internacionalização** — interface em Português (pt-BR).
- 🔒 **Privado por padrão** — bodies, headers e IPs nunca trafegam pelo Firestore do
  cliente; só são lidos via API autenticada por cookie.

## Limites por sessão

| Limite                       | Valor      |
| ---------------------------- | ---------- |
| Webhooks por sessão          | 10         |
| Requests armazenadas por hook| 100        |
| Tamanho máximo de body       | 256 KB     |
| Expiração da sessão / dados  | 7 dias     |

## Arquitetura

- **Frontend** — Nuxt 4 + Vue 3, Tailwind CSS 4 e componentes shadcn-nuxt, estado com Pinia.
- **Backend** — rotas de servidor Nitro (preset `firebase`, Cloud Functions gen2).
- **Persistência** — Firestore (com TTL automático nos documentos para expiração).
- **Tempo real** — o cliente faz auth anônima no Firebase e escuta um único documento do
  webhook via `onSnapshot`. Apenas um resumo leve de cada request (`recent`) fica visível
  ao cliente; o payload completo vive numa subcoleção server-only e é buscado sob demanda
  pela API autenticada.
- **Segurança** — a resposta configurada pelo dono é reproduzida pelo endpoint público com
  CSP `sandbox`, `nosniff` e `Content-Type` restrito a tipos inertes, evitando execução de
  conteúdo ativo na origem da aplicação. Headers e nomes de campos são sanitizados antes de
  serem armazenados.

## Stack

| Camada     | Tecnologia                                            |
| ---------- | ----------------------------------------------------- |
| Framework  | [Nuxt 4](https://nuxt.com) / Vue 3                     |
| Estilo     | Tailwind CSS 4 + [shadcn-nuxt](https://www.shadcn-vue.com) |
| Estado     | Pinia                                                  |
| Backend    | Nitro (Firebase preset, Cloud Functions gen2)         |
| Banco      | Cloud Firestore + firebase-admin                      |
| Ícones     | lucide-vue-next                                        |
| Toasts     | vue-sonner                                             |

## Desenvolvimento

Requer **Node.js 22** e `pnpm`.

```bash
# Instalar dependências
pnpm install

# Servidor de desenvolvimento em http://localhost:3000
pnpm dev

# Build de produção
pnpm build

# Preview do build de produção
pnpm preview
```

## Deploy

O deploy vai para o Firebase Hosting + Cloud Functions (gen2). O script faz o build do
Nuxt, ajusta o output para o runtime do Firebase e publica regras, índices, função e hosting:

```bash
pnpm run deploy
```

> Use `pnpm run deploy` (e não `pnpm deploy`) — o pnpm reserva `deploy` para um
> comando interno de workspace, então a forma sem `run` não executa este script.

> É necessário ter o [Firebase CLI](https://firebase.google.com/docs/cli) instalado e
> autenticado, além de acesso ao projeto Firebase configurado em `.firebaserc`.

## Licença

MIT
