/* models.js — 61-model catalog, 14 providers (mula sa backend lib/chat/config.js).
   FREE-ONLY = model id na may ":free" suffix o provider-level free tier. */

export const PROVIDERS = [
  {
    id: "gemini",
    label: "Gemini",
    keyHint: "GEMINI_API_KEY",
    freeTier: true,
    models: [{ id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", free: true }],
  },
  {
    id: "cloudflare",
    label: "Cloudflare",
    keyHint: "CLOUDFLARE_API_TOKEN",
    freeTier: true,
    models: [
      { id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash", free: true },
      { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 120B", free: true },
      { id: "@cf/openai/gpt-oss-120b", name: "GPT OSS 120B", free: true },
      { id: "@cf/qwen/qwen3.8-27b", name: "Qwen 3.8 27B", free: true },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    keyHint: "GROQ_API_KEY",
    freeTier: true,
    models: [
      { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", free: true },
      { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B", free: true },
      { id: "groq/compound", name: "Groq Compound", free: true },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyHint: "OPENROUTER_API_KEY",
    freeTier: true,
    models: [
      { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 Ultra 550B (Free)", free: true },
      { id: "poolside/laguna-s-2.1:free", name: "Laguna S 2.1 (Free)", free: true },
      { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B (Free)", free: true },
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    keyHint: "MISTRAL_API_KEY",
    freeTier: true,
    models: [
      { id: "mistral-small-latest", name: "Mistral Small", free: true },
      { id: "codestral-latest", name: "Codestral", free: true },
    ],
  },
  {
    id: "cohere",
    label: "Cohere",
    keyHint: "COHERE_API_KEY",
    freeTier: true,
    models: [
      { id: "command-a-plus-05-2026", name: "Command A+", free: true },
      { id: "command-a-reasoning-08-2025", name: "Command A Reasoning", free: true },
    ],
  },
  {
    id: "aihorde",
    label: "AI Horde",
    keyHint: "AI_HORDE_API_KEY (opsyonal)",
    freeTier: true,
    models: [{ id: "auto", name: "Auto (crowdsourced)", free: true }],
  },
  {
    id: "unorouter",
    label: "UnoRouter",
    keyHint: "UNOROUTER_API_KEY",
    freeTier: true,
    models: [{ id: "auto", name: "Auto", free: true }],
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    keyHint: "NVIDIA_API_KEY",
    freeTier: true,
    models: [
      { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B", free: true },
      { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super 120B", free: true },
    ],
  },
  {
    id: "codecraft",
    label: "CodeCraft API",
    keyHint: "CODECRAFT_API_KEY",
    freeTier: true,
    models: [
      { id: "deepseek-v4-pro-max", name: "DeepSeek V4 Pro Max", free: true },
      { id: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash", free: true },
      { id: "deepseek-v4-pro-0813", name: "DeepSeek V4 Pro", free: true },
      { id: "gemma-2-2b", name: "Gemma 2 2B", free: true },
      { id: "qwen3.8-max", name: "Qwen 3.8 Max", free: true },
      { id: "qwen3.8-27b", name: "Qwen 3.8 27B", free: true },
      { id: "qwen3.7-max", name: "Qwen 3.7 Max", free: true },
      { id: "glm-5.3", name: "GLM 5.3", free: true },
      { id: "glm-5.2", name: "GLM 5.2", free: true },
      { id: "muse-spark-1.1", name: "Muse Spark 1.1", free: true },
      { id: "seed-2.1-pro", name: "Seed 2.1 Pro", free: true },
      { id: "seed-2.1-turbo", name: "Seed 2.1 Turbo", free: true },
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", free: true },
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", free: true },
      { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", free: true },
      { id: "grok-4.5", name: "Grok 4.5", free: true },
      { id: "grok-4.6", name: "Grok 4.6", free: true },
      { id: "kimi-k3", name: "Kimi K3", free: true },
      { id: "kimi-k2.6", name: "Kimi K2.6", free: true },
      { id: "gpt-5.5", name: "GPT 5.5", free: true },
      { id: "gpt-5.5-pro", name: "GPT 5.5 Pro", free: true },
      { id: "gpt-5.6-luna", name: "GPT 5.6 Luna", free: true },
      { id: "gpt-5.6-terra", name: "GPT 5.6 Terra", free: true },
      { id: "gpt-5.6-sol", name: "GPT 5.6 Sol", free: true },
      { id: "claude-mythos-preview", name: "Claude Mythos Preview", free: true },
      { id: "claude-opus-4.6", name: "Claude Opus 4.6", free: true },
      { id: "claude-opus-5.5", name: "Claude Opus 5.5", free: true },
      { id: "claude-fable-5.1", name: "Claude Fable 5.1", free: true },
    ],
  },
  {
    id: "agentrouter",
    label: "AgentRouter",
    keyHint: "AGENTROUTER_API_KEY",
    freeTier: true,
    models: [{ id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", free: true }],
  },
  {
    id: "hcnsec",
    label: "HCNSEC",
    keyHint: "HCNSEC_API_KEY",
    freeTier: true,
    models: [
      { id: "DeepSeek-V4-Flash", name: "DeepSeek V4 Flash", free: true },
      { id: "DeepSeek-V4.1-Flash", name: "DeepSeek V4.1 Flash", free: true },
      { id: "glm-5.3-flash", name: "GLM 5.3 Flash", free: true },
      { id: "sensenova-6.8-flash-lite", name: "SenseNova 6.8 Flash Lite", free: true },
      { id: "step-3.7-flash", name: "Step 3.7 Flash", free: true },
    ],
  },
  {
    id: "bailucode",
    label: "Bailucode",
    keyHint: "BAILUCODE_API_KEY",
    freeTier: true,
    models: [
      { id: "bailu-apex", name: "Bailu Apex", free: true },
      { id: "bailu-2.8-lite", name: "Bailu 2.8 Lite", free: true },
    ],
  },
  {
    id: "seekai",
    label: "SEEKAI",
    keyHint: "SEEKAI_API_KEY",
    freeTier: true,
    models: [
      { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", free: true },
      { id: "glm-5.3-flash", name: "GLM 5.3 Flash", free: true },
      { id: "mimo-v2.6-flash", name: "MiMo V2.6 Flash", free: true },
      { id: "deepseek-ai/DeepSeek-V4-Flash-0731", name: "DeepSeek V4 Flash 0731", free: true },
      { id: "qwen3.8-flash", name: "Qwen 3.8 Flash", free: true },
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", free: true },
    ],
  },
];

export const DEFAULT_MODEL = { provider: "codecraft", id: "deepseek-v4-flash-0731" };

export function providerById(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}

export function modelLabel(providerId, modelId) {
  const p = providerById(providerId);
  const m = p?.models.find((x) => x.id === modelId);
  return m?.name || modelId;
}

export function totalModelCount() {
  return PROVIDERS.reduce((n, p) => n + p.models.length, 0);
}

/* Availability gating — ang custom API keys ay nasa Credential Vault (Phase 3).
   Dito: kung ang provider ay may naka-configure na key (localStorage flag mula
   sa vault), enabled ang models; kung wala, disabled na may key hint. */
const KEY_FLAG_PREFIX = "jai_key_configured_";

export function isProviderConfigured(providerId) {
  try {
    return localStorage.getItem(KEY_FLAG_PREFIX + providerId) === "1";
  } catch {
    return false;
  }
}

export function setProviderConfigured(providerId, on = true) {
  try {
    if (on) localStorage.setItem(KEY_FLAG_PREFIX + providerId, "1");
    else localStorage.removeItem(KEY_FLAG_PREFIX + providerId);
  } catch {
    /* storage unavailable */
  }
}
