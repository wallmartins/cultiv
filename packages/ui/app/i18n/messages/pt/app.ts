export const app = {
  loading: "Carregando…",
  reload: "Recarregar",
  loadFailed: "Não foi possível carregar o app",
  loadFailedBody: "Provavelmente é uma atualização nova — recarregar costuma resolver.",

  // Full-screen error copy, keyed by what actually went wrong. describe-error.ts maps the backend's
  // technical failure onto one of these so the reader never sees raw "Failed to fetch"/HTTP 500.
  error: {
    offline: {
      title: "Sem conexão",
      body: "A internet parece ter caído. Verifique a conexão e tente de novo."
    },
    timeout: {
      title: "Está demorando demais",
      body: "A resposta não chegou a tempo. Tente de novo em instantes."
    },
    denied: {
      title: "Sua sessão expirou",
      body: "Entre de novo para continuar de onde você parou."
    },
    notFound: {
      title: "Não encontramos isso",
      body: "O que você abriu não está mais aqui."
    },
    rateLimited: {
      title: "Muitas tentativas seguidas",
      body: "Espere alguns segundos e tente de novo."
    },
    server: {
      title: "Algo saiu do lugar",
      body: "O erro é do nosso lado, não seu. Já estamos de olho — tente de novo em instantes."
    },
    generic: {
      title: "Algo não saiu como esperado",
      body: "Tente de novo. Se continuar, a gente resolve."
    }
  }
};
