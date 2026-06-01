# Security Audit — PatheticHooks

> **Data:** 2026-05-31 · **Escopo:** somente leakage (vazamento de tokens/segredos) e exposição de dados de usuário · **Tipo:** read-only (nenhuma alteração de código/config/regras) · **Proibido:** DoS/DDoS e qualquer geração de custo.

## Veredito

✅ **Nenhum token/segredo vazado. Nenhuma vulnerabilidade que exponha um usuário a outro.**

Auditoria com 5 agentes (scan estático + pentest ao vivo) e verificação adversarial dos achados: **0 vulnerabilidades de vazamento/exposição confirmadas**. Apenas 2 observações informativas de hardening (não são vulnerabilidades).

## Metodologia

- **Estático:** varredura do repositório, do bundle do cliente (`.output/public`), do bundle da função (`.output/server`), de arquivos de config e do histórico git, em busca de private keys, service accounts, `.env`, tokens e segredos.
- **Ao vivo (footprint mínimo, sem volume/custo):** ~30 requests de leitura + 2 webhooks descartáveis (apagados). Testes de IDOR/auth bypass, regras do Firestore, CORS, headers, source maps e info disclosure contra `https://pathetichooks.web.app`, a URL direta do Cloud Run e a REST do Firestore.

## Vazamento de segredos — nada vazou

| Verificação | Resultado |
| --- | --- |
| Private keys / service-account / `.env` no repo | ❌ nenhum |
| Credenciais embutidas na função (`.output/server`) | ❌ nenhuma — `firebase-admin` usa **ADC** (`initializeApp()` sem chave) |
| Segredos no bundle do cliente | ❌ apenas a **apiKey web do Firebase** (pública por design) |
| Source maps (`.js.map`) servidos ao browser | ❌ 404 — não expostos |
| Path traversal para o código-fonte da função | ❌ 404 |
| `sessionId` real / token no HTML SSR | ❌ não — fica só no cookie `httpOnly` |
| Tokens de webhook embutidos no JS | ❌ nenhum |
| Histórico git | ✔ sem arquivos com segredo |

## Exposição de dados do usuário — isolamento íntegro

| Teste (ao vivo) | Resultado |
| --- | --- |
| Ler webhook de outro usuário via API | **404** |
| Modificar/deletar webhook não-próprio | **404** (checa `sessionId` do dono) |
| Acesso sem cookie | só `{sessionId:null, webhooks:[]}` |
| `/listen` reivindicar webhook alheio | **404** (exige cookie do dono **+** ID token válido) |
| Firestore direto (anon) ler doc de outro | **403 PERMISSION_DENIED** |
| Listar a coleção `webhooks` (enumerar) | **403** |
| Ler subcoleção `requests` (bodies/headers/IPs) | **403** — nunca legível pelo cliente |
| Ler `sessions` | **403** |
| CORS roubo cross-site (Origin malicioso) | sem `Access-Control-Allow-Origin` → navegador bloqueia |
| Cookie `__session` | `HttpOnly; Secure; SameSite=Lax` ✔ |
| Mensagens de erro | genéricas, sem stack trace / paths internos |
| Resposta pública `/hook` (XSS) | `CSP: sandbox` + `nosniff` + `Content-Type` inerte |

O documento que o cliente lê em tempo real (`onSnapshot`) expõe **somente metadados** (`recent`: método/path/size/contentType/createdAt). Corpo, headers e IP vivem em subcoleção server-only e só são lidos via API autenticada por cookie.

## Observações informativas (hardening — NÃO são vulnerabilidades)

Ambas com `leaksSecret=false`, `exposesUserData=false`:

1. **Header `x-powered-by: Nuxt`** — fingerprint do framework. Cosmético. *Fix:* remover via header/`routeRules`.
2. **`sessionId` no documento do webhook legível pelo dono** (`server/utils/storage.ts:229`). É o `sessionId` **do próprio dono**, entregue ao **próprio navegador** — **não é cross-user**. Ponto fino: como o cookie é `httpOnly`, duplicar o `sessionId` num doc legível por JS enfraquece um pouco essa proteção **caso surja um XSS** (não há hoje). Impacto baixo (sessão anônima/efêmera). *Fix:* não incluir `sessionId` no doc lido pelo cliente.

## Conclusão

A postura de segurança está **sólida**: credenciais via ADC, regras Firestore owner-gated (somente `get` do próprio doc, sem `list`, subcoleção/sessions negadas), cookie `httpOnly`/`secure`/`lax`, sem CORS aberto, sem source maps, payloads sensíveis server-only e resposta pública sandboxed. Os 2 itens acima são melhorias opcionais de defense-in-depth, **deixados para depois**.
