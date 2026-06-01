const ptBR = {
  app: {
    title: "Pathetic Hooks",
    tagline: "inspetor de webhooks",
    pageTitle: "Pathetic Hooks · inspetor de webhooks",
  },
  header: {
    session: "sessão",
    github: "GitHub",
    language: "Idioma",
  },
  sidebar: {
    title: "Seus webhooks",
    newWebhook: "Novo webhook",
    searchPlaceholder: "Buscar por nome ou token...",
    clearSearch: "Limpar busca",
    empty: "Nenhum webhook ainda. Crie o primeiro para começar a receber requisições.",
    sessionInfo: "Sem login. Dados ficam em memória e expiram após",
    sevenDays: "7 dias",
    waitingFirst: "aguardando primeira request",
    last: "último",
  },
  requestList: {
    title: "Requests",
    clearHistory: "Limpar histórico",
    filterPlaceholder: "Filtrar por método, path...",
    waiting: "Aguardando requisições",
    waitingDesc:
      "Envie qualquer requisição HTTP para a URL acima — aparecerá aqui em tempo real.",
    historyCleared: "Histórico limpo",
    removeRequest: "Remover request",
    error: "Erro",
  },
  requestDetail: {
    emptyTitle: "Inspetor de requests",
    emptyDesc:
      "Selecione uma requisição na lista para ver headers, body e detalhes. Novas requisições aparecem aqui em tempo real.",
    contentType: "Content-Type",
    sourceIp: "IP de origem",
    userAgent: "User-Agent",
    tabBody: "Body",
    tabHeaders: "Headers",
    tabQuery: "Query",
    tabRaw: "Raw",
    jsonBadge: "JSON",
    rawBadge: "raw",
    autoFormatted: "formatado automaticamente",
    rawBody: "corpo bruto",
    noBody: "sem corpo",
    copy: "Copiar",
    noBodyText: "Esta requisição não possui body.",
    columnName: "Nome",
    columnValue: "Valor",
    columnParam: "Parâmetro",
    noQuery: "Sem query string.",
    httpRebuild: "Reconstrução estilo HTTP/1.1",
    bodyCopied: "Body copiado",
    rawCopied: "Raw copiado",
    copyFailed: "Falha ao copiar",
  },
  webhookHeader: {
    selectOrCreate: "Selecione ou crie um webhook para começar.",
    live: "live",
    cURL: "cURL",
    response: "Resposta",
    removeWebhook: "Remover webhook",
    openNewTab: "Abrir em nova aba",
    copyUrl: "Copiar URL",
    urlCopied: "URL copiada para o clipboard",
    curlCopied: "Comando cURL copiado",
    copyFailed: "Falha ao copiar",
    noDescription: "sem descrição",
    requestsCaptured: "requests capturadas",
    responds: "responde",
    contentType: "content-type",
  },
  createDialog: {
    title: "Novo webhook",
    description: "Geramos uma URL única ({used}/{limit} usados nesta sessão).",
    nameLabel: "Nome (opcional)",
    namePlaceholder: "Auto gerado se vazio",
    descriptionLabel: "Descrição (opcional)",
    descriptionPlaceholder: "Para que serve?",
    cancel: "Cancelar",
    create: "Criar webhook",
    limitReached: "Limite de {limit} webhooks atingido",
    created: "Webhook criado",
    error: "Erro",
  },
  configDialog: {
    title: "Configurações do webhook",
    description:
      "Personalize nome, descrição e a resposta HTTP que será retornada a quem chamar este endpoint.",
    nameLabel: "Nome",
    namePlaceholder: "silent-panda-42",
    descriptionLabel: "Descrição",
    descriptionPlaceholder: "Para que este webhook é usado?",
    statusLabel: "Status HTTP",
    contentTypeLabel: "Content-Type",
    bodyLabel: "Body de resposta",
    save: "Salvar",
    cancel: "Cancelar",
    saved: "Configuração salva",
    saveError: "Erro ao salvar",
  },
  deleteDialog: {
    title: "Remover este webhook?",
    description:
      "O endpoint {name} deixará de receber requisições e o histórico capturado será apagado. Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    remove: "Remover",
    removed: "Webhook removido",
    error: "Erro",
  },
  home: {
    mobileWebhooks: "Webhooks",
    mobileNew: "novo",
    heroTitle: "Inspecione webhooks em tempo real",
    heroDescription:
      "Crie até {limit} endpoints únicos. Envie requisições e veja headers, body e metadados ao vivo — sem login, sem configuração.",
    createFirst: "Criar primeiro webhook",
    limitReachedToast: "Limite de {limit} webhooks atingido",
    createdToast: "Webhook criado",
    errorToast: "Erro ao criar webhook",
  },
  format: {
    now: "agora",
    secondsAgo: "{n}s atrás",
    minutesAgo: "{n}m atrás",
    hoursAgo: "{n}h atrás",
    daysAgo: "{n}d atrás",
    bytes: "{n} B",
    kilobytes: "{n} KB",
    megabytes: "{n} MB",
  },
  errors: {
    generic: "Algo deu errado. Tente novamente.",
    network: "Sem conexão com o servidor.",
    "webhook.not_found": "Webhook não encontrado.",
    "webhook.limit_reached": "Limite de {limit} webhooks por sessão atingido.",
    "webhook.token_missing": "Token ausente na URL.",
    "session.invalid": "Sessão inválida. Recarregue a página.",
    "request.not_found": "Requisição não encontrada.",
  },
} as const;

// pt-BR is the canonical locale: its key structure is the contract every other
// locale must satisfy. DeepStringify loosens the `as const` literal types to
// plain `string` so translations can supply their own values while TypeScript
// still enforces that no key is missing or extra.
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Messages = DeepStringify<typeof ptBR>;

export default ptBR;
