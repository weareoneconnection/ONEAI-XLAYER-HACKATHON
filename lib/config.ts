export const appConfig = {
  oneaiBaseUrl:
    process.env.ONEAI_BASE_URL ||
    "https://oneai-api-production.up.railway.app",

  oneaiApiKey:
    process.env.ONEAI_API_KEY ||
    "admin_key_1",

  oneaiPlanEndpoint:
    process.env.ONEAI_PLAN_ENDPOINT ||
    "/v1/generate",

  oneaiModel:
    process.env.ONEAI_MODEL ||
    "auto",

  oneclawBaseUrl:
    process.env.ONECLAW_BASE_URL ||
    process.env.ONECLAW_API_BASE_URL ||
    "https://oneclaw-production.up.railway.app",

  oneclawToken:
    process.env.ONECLAW_INTERNAL_TOKEN ||
    process.env.ONECLAW_ADMIN_TOKEN ||
    "",

  oneclawRunEndpoint:
    process.env.ONECLAW_RUN_ENDPOINT ||
    "/v1/tasks/run",

  xlayerRpcUrl:
    process.env.XLAYER_RPC_URL ||
    "",

  xlayerChainId:
    Number(process.env.XLAYER_CHAIN_ID || 196),

  xlayerExplorerBaseUrl:
    process.env.XLAYER_EXPLORER_BASE_URL ||
    "",

  proofContractAddress:
    process.env.PROOF_CONTRACT_ADDRESS ||
    "",

  proofSignerPrivateKey:
    process.env.PROOF_SIGNER_PRIVATE_KEY ||
    "",
};