/**
 * providers.js — PromptCraft
 * All AI provider configurations: endpoints, models, headers, notes
 */

const PROVIDERS = {
  claude: {
    name: "Claude (Anthropic)",
    baseUrl: "https://api.anthropic.com/v1/messages",
    keyPlaceholder: "sk-ant-api03-…",
    keyPrefix: "sk-ant-",
    models: [
      { id: "claude-sonnet-4-6",    label: "Claude Sonnet 4.6 (recommended)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fast + cheap)" },
      { id: "claude-opus-4-6",      label: "Claude Opus 4.6 (most capable)" },
    ],
    note: `🔐 Get your key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>. New accounts receive $5 free credit.<br/><br/>Your key is stored locally and never sent to any server except Anthropic's API.`,
    buildRequest(apiKey, model, systemPrompt, userMsg) {
      return {
        url: this.baseUrl,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: { model, max_tokens: 1024, system: systemPrompt, messages: [{ role: "user", content: userMsg }] },
      };
    },
    parseResponse(data) {
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.content?.map(b => b.text || "").join("") || "";
    },
  },

  gemini: {
    name: "Gemini (Google)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    keyPlaceholder: "AIza…",
    keyPrefix: "AIza",
    models: [
      { id: "gemini-2.0-flash",         label: "Gemini 2.0 Flash (free, fast)" },
      { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash Preview" },
      { id: "gemini-1.5-pro",           label: "Gemini 1.5 Pro" },
    ],
    note: `🆓 <strong>Completely free</strong> — no credit card needed!<br/>Get your key at <a href="https://aistudio.google.com" target="_blank">aistudio.google.com</a> in under 60 seconds.`,
    buildRequest(apiKey, model, systemPrompt, userMsg) {
      const url = this.baseUrl.replace("{model}", model) + `?key=${apiKey}`;
      return {
        url,
        headers: { "Content-Type": "application/json" },
        body: {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: { maxOutputTokens: 1024 },
        },
      };
    },
    parseResponse(data) {
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    },
  },

  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    keyPlaceholder: "gsk_…",
    keyPrefix: "gsk_",
    models: [
      { id: "llama-3.3-70b-versatile",    label: "Llama 3.3 70B (free, powerful)" },
      { id: "llama-3.1-8b-instant",       label: "Llama 3.1 8B (free, fastest)" },
      { id: "mixtral-8x7b-32768",         label: "Mixtral 8x7B (free)" },
      { id: "gemma2-9b-it",               label: "Gemma 2 9B (free)" },
    ],
    note: `🆓 <strong>Free forever</strong> — no credit card needed!<br/>Get your key at <a href="https://console.groq.com" target="_blank">console.groq.com</a>. Groq uses custom LPU chips for ultra-fast inference.`,
    buildRequest(apiKey, model, systemPrompt, userMsg) {
      return {
        url: this.baseUrl,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: {
          model, max_tokens: 1024,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
        },
      };
    },
    parseResponse(data) {
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices?.[0]?.message?.content || "";
    },
  },

  openai: {
    name: "OpenAI / GPT",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    keyPlaceholder: "sk-proj-…",
    keyPrefix: "sk-",
    models: [
      { id: "gpt-4o-mini",  label: "GPT-4o Mini (cheap, fast)" },
      { id: "gpt-4o",       label: "GPT-4o (most capable)" },
      { id: "gpt-4-turbo",  label: "GPT-4 Turbo" },
      { id: "gpt-3.5-turbo",label: "GPT-3.5 Turbo (cheapest)" },
    ],
    note: `OpenAI requires a paid account with credits.<br/>Get your key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a>.<br/><br/>💡 For free access try <strong>Groq</strong> or <strong>Gemini</strong> instead.`,
    buildRequest(apiKey, model, systemPrompt, userMsg) {
      return {
        url: this.baseUrl,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: {
          model, max_tokens: 1024,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
        },
      };
    },
    parseResponse(data) {
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices?.[0]?.message?.content || "";
    },
  },

  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    keyPlaceholder: "sk-or-v1-…",
    keyPrefix: "sk-or-",
    models: [
      { id: "deepseek/deepseek-chat",               label: "DeepSeek Chat (free)" },
      { id: "meta-llama/llama-3.3-70b-instruct",    label: "Llama 3.3 70B (free)" },
      { id: "google/gemma-3-27b-it",                label: "Gemma 3 27B (free)" },
      { id: "mistralai/mistral-7b-instruct",        label: "Mistral 7B (free)" },
      { id: "anthropic/claude-sonnet-4-6",          label: "Claude Sonnet 4.6 (paid)" },
      { id: "openai/gpt-4o",                        label: "GPT-4o (paid)" },
    ],
    note: `OpenRouter gives one key for 200+ models including many <strong>free</strong> tiers.<br/>Get your key at <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a>. Free models have rate limits.`,
    buildRequest(apiKey, model, systemPrompt, userMsg) {
      return {
        url: this.baseUrl,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "PromptCraft",
        },
        body: {
          model, max_tokens: 1024,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
        },
      };
    },
    parseResponse(data) {
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices?.[0]?.message?.content || "";
    },
  },

  custom: {
    name: "Custom API",
    baseUrl: "",
    keyPlaceholder: "Your API key…",
    keyPrefix: "",
    models: [
      { id: "custom-model", label: "Custom model (edit below)" },
    ],
    note: `Enter any OpenAI-compatible API endpoint. Works with Ollama, LM Studio, Together AI, Mistral, Fireworks, Anyscale, and more.<br/><br/>Base URL example: <code>http://localhost:11434/v1</code> for Ollama.`,
    buildRequest(apiKey, model, systemPrompt, userMsg, customUrl) {
      const url = (customUrl || "http://localhost:11434/v1") + "/chat/completions";
      return {
        url,
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
        },
        body: {
          model, max_tokens: 1024,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
        },
      };
    },
    parseResponse(data) {
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices?.[0]?.message?.content
        || data.content?.map?.(b => b.text || "").join("")
        || "";
    },
  },
};

/* ── Provider UI controller ── */
const Providers = (() => {
  let current = "claude";

  function select(id, btn) {
    current = id;
    document.body.dataset.provider = id;

    // Update buttons
    document.querySelectorAll(".prov-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    // Update model dropdown
    const sel = document.getElementById("modelSelect");
    sel.innerHTML = "";
    const prov = PROVIDERS[id];
    prov.models.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id; opt.textContent = m.label;
      sel.appendChild(opt);
    });

    // Show/hide custom URL
    const customField = document.getElementById("customUrlField");
    if (customField) customField.style.display = id === "custom" ? "flex" : "none";

    // Update modal info
    UI.updateModalForProvider(id);
  }

  function getCurrent() { return current; }
  function getConfig()  { return PROVIDERS[current]; }

  return { select, getCurrent, getConfig };
})();
