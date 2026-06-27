/**
 * app.js — PromptCraft
 * Core generation logic, chip handling, keyboard shortcuts
 */

const App = (() => {
  let generating = false;

  /* ── System prompt template ── */
  function buildSystemPrompt(provider, model, tone, detail) {
    return `You are an expert prompt engineer. Your job is to write highly effective, immediately usable prompts for AI language models.

Output ONLY valid JSON — no markdown fences, no preamble, no commentary — in exactly this structure:
{
  "mainPrompt": "The complete, polished, ready-to-use prompt string",
  "variations": [
    { "label": "Variation A", "text": "..." },
    { "label": "Variation B", "text": "..." }
  ]
}

Rules:
- mainPrompt must be complete, specific, and ready to paste directly into any AI
- Tailor phrasing and structure for the target model: ${model} by ${provider}
- Apply tone: ${tone}
- Apply detail level: ${detail}
- Variations must be meaningfully different approaches (e.g. one with role-play framing, one shorter and more direct, one with structured output requirements)
- If the type is "Image Gen", write a visual prompt with style, lighting, composition, and mood descriptors
- Output pure JSON only — no backticks, no markdown, no extra text before or after`;
  }

  /* ── Main generate function ── */
  async function generate() {
    if (generating) return;

    const goal = document.getElementById("goalInput").value.trim();
    if (!goal) {
      const el = document.getElementById("goalInput");
      el.style.borderColor = "var(--red)";
      el.focus();
      setTimeout(() => el.style.borderColor = "", 1600);
      UI.toast("⚠ Please describe your goal first", "error");
      return;
    }

    const provId   = Providers.getCurrent();
    const provConf = Providers.getConfig();
    const apiKey   = localStorage.getItem(`pc_key_${provId}`) || "";

    if (!apiKey && provId !== "custom") {
      UI.toast("Connect your API key first", "error");
      UI.openKeyModal();
      return;
    }

    const model     = document.getElementById("modelSelect").value;
    const type      = getChip("typeChips");
    const tone      = getChip("toneChips");
    const detail    = getChip("detailChips");
    const ctx       = document.getElementById("ctxInput").value.trim();
    const customUrl = document.getElementById("customUrl")?.value?.trim() || "";

    generating = true;
    setLoadingState(true);
    UI.setStatus("running", "Generating your prompt…");
    showOutput();

    const systemPrompt = buildSystemPrompt(provConf.name, model, tone, detail);
    const userMsg = [
      `Goal: ${goal}`,
      `Prompt type: ${type}`,
      `Tone: ${tone}`,
      `Detail level: ${detail}`,
      `Target AI model: ${model}`,
      ctx ? `Extra context: ${ctx}` : "",
    ].filter(Boolean).join("\n");

    try {
      const req = provConf.buildRequest(apiKey, model, systemPrompt, userMsg, customUrl);

      const res = await fetch(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(req.body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message ||
          errData?.error?.error?.message ||
          `HTTP ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();
      const raw  = provConf.parseResponse(data);
      const clean = raw.replace(/```json|```/gi, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Fallback: treat full response as the main prompt
        parsed = { mainPrompt: raw, variations: [] };
      }

      await typeText("mainText", parsed.mainPrompt || raw);

      if (parsed.variations?.length) {
        const grid = document.getElementById("varGrid");
        grid.innerHTML = "";
        parsed.variations.forEach((v, i) => {
          const card = document.createElement("div");
          card.className = "var-card";
          card.innerHTML = `
            <div class="var-card-lbl">${v.label || `Variation ${i + 1}`}</div>
            <div class="var-card-text">${v.text}</div>
          `;
          card.addEventListener("click", () => {
            navigator.clipboard.writeText(v.text).catch(() => {});
            card.classList.add("copied");
            const lbl = card.querySelector(".var-card-lbl");
            const orig = lbl.textContent;
            lbl.textContent = "✓ Copied!";
            setTimeout(() => { card.classList.remove("copied"); lbl.textContent = orig; }, 1500);
          });
          grid.appendChild(card);
        });
        document.getElementById("varSection").style.display = "block";
      }

      UI.setStatus("ok", "Prompt ready — click a variation to copy");
      UI.toast("✓ Prompt generated!", "success");

    } catch (err) {
      const msg = err.message || "Something went wrong";
      document.getElementById("mainText").textContent = `⚠ Error: ${msg}`;
      UI.setStatus("err", "Error — " + msg.slice(0, 60));
      UI.toast("⚠ " + msg.slice(0, 80), "error");
      console.error("[PromptCraft]", err);
    } finally {
      generating = false;
      setLoadingState(false);
    }
  }

  /* ── Copy main prompt ── */
  function copyMain() {
    const text = document.getElementById("mainText").textContent;
    if (!text || text.startsWith("⚠")) return;
    navigator.clipboard.writeText(text).catch(() => {});
    const btn = document.getElementById("mainCopy");
    const orig = btn.textContent;
    btn.textContent = "✓ Copied!";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = orig; btn.classList.remove("copied"); }, 1500);
    UI.toast("✓ Copied to clipboard", "success");
  }

  /* ── Clear output ── */
  function clear() {
    document.getElementById("placeholder").style.display = "flex";
    document.getElementById("result").style.display = "none";
    document.getElementById("mainText").innerHTML = "";
    document.getElementById("varGrid").innerHTML = "";
    document.getElementById("varSection").style.display = "none";
    document.getElementById("outputActions").style.display = "none";
    const provId = Providers.getCurrent();
    const hasKey = !!localStorage.getItem(`pc_key_${provId}`);
    UI.setStatus("", hasKey ? "Ready — describe your goal and generate" : "Connect an API key to get started");
  }

  /* ── Helpers ── */
  function showOutput() {
    document.getElementById("placeholder").style.display = "none";
    document.getElementById("result").style.display = "block";
    document.getElementById("mainText").innerHTML = '<span class="cur"></span>';
    document.getElementById("varSection").style.display = "none";
    document.getElementById("varGrid").innerHTML = "";
    document.getElementById("outputActions").style.display = "flex";
  }

  function setLoadingState(on) {
    const btn = document.getElementById("genBtn");
    const txt = document.getElementById("genBtnText");
    btn.disabled = on;
    txt.textContent = on ? "⏳ Generating…" : "✦ Generate Prompt";
  }

  function getChip(groupId) {
    const el = document.querySelector(`#${groupId} .chip.active`);
    return el ? el.dataset.v : "";
  }

  async function typeText(elId, text) {
    return new Promise(resolve => {
      const el = document.getElementById(elId);
      el.innerHTML = "";
      const cur = document.createElement("span");
      cur.className = "cur";
      el.appendChild(cur);
      let i = 0;
      const speed = Math.max(5, Math.min(20, Math.round(3200 / (text.length || 1))));
      const iv = setInterval(() => {
        el.insertBefore(document.createTextNode(text[i] || ""), cur);
        i++;
        if (i >= text.length) { clearInterval(iv); cur.remove(); resolve(); }
      }, speed);
    });
  }

  return { generate, copyMain, clear };
})();

/* ── Chip single-select ── */
document.addEventListener("DOMContentLoaded", () => {
  ["typeChips", "toneChips", "detailChips"].forEach(id => {
    document.getElementById(id)?.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.getElementById(id).querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      });
    });
  });

  // Init default provider
  Providers.select("claude", document.querySelector('.prov-btn[data-provider="claude"]'));

  // Keyboard shortcut
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") App.generate();
    if (e.key === "Escape") UI.closeKeyModal();
  });
});
