import type { LegalDocument } from "../types.js";

export const privacyPt: LegalDocument = {
  title: "Política de Privacidade",
  sections: [
    {
      heading: "Dados coletados",
      body: "Ao criar conta, coletamos email e dados de perfil necessários para o serviço. Ao usar o produto, processamos exemplos de voz e textos gerados conforme descrito nesta política."
    },
    {
      heading: "Finalidade",
      body: "Usamos seus dados para operar o serviço, autenticar sua conta e comunicar atualizações do Cultiv. Não vendemos seus dados."
    },
    {
      heading: "Processadores",
      body: "Autenticação é gerenciada pelo Auth0. Pagamentos são processados por Stripe ou Asaas conforme sua região."
    },
    {
      heading: "Seus direitos",
      body: "Você pode solicitar acesso, correção ou exclusão dos seus dados entrando em contato em contato@cultiv.app."
    }
  ]
};
