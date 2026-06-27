/**
 * ui.js — PromptCraft
 * Modal, toast, status, key management UI
 */

const UI = (() => {

  /* ── Key Modal ── */
  function openKeyModal() {
    const provId = Providers.getCurrent();
    updateModalForProvider(provId);
    const stored = localStorage.getItem(`pc_key_${provId}`) || "";
    document.getElementById("keyInput").value = stored;
    document.getElementById("modalOverlay").classList.add("open");
    setTimeout(() => document.getElementById("keyInput").focus(), 220);
  }

  function closeKeyModal() {
    document.getElementById("modalOverlay").classList.remove("open");
  }

  function handleOverlay(e) {
    if (e.target === document.getElementById("modalOverlay")) closeKeyModal();
  }

  function updateModalForProvider(id) {
    const prov = PROVIDERS[id];
    if (!prov) return;
    const el = document.getElementById("modalTitle");
    const sub = document.getElementById("modalSub");
    const note = document.getElementById("modalNote");
    const inp = document.getElementById("keyInput");
    const customField = document.getElementById("customUrlField");

    if (el)  el.textContent = `Connect ${prov.name}`;
    if (sub) sub.textContent = "Your key is stored in localStorage and never sent to any server except the AI provider.";
    if (note) note.innerHTML = prov.note || "";
    if (inp) inp.placeholder = prov.keyPlaceholder || "Paste your API key…";

    if (customField) {
      customField.style.display = id === "custom" ? "flex" : "none";
    }
  }

  function toggleKeyVis() {
    const inp = document.getElementById("keyInput");
    inp.type = inp.type === "password" ? "text" : "password";
  }

  function saveKey() {
    const val  = document.getElementById("keyInput").value.trim();
    const provId = Providers.getCurrent();
    const prov = PROVIDERS[provId];

    if (!val && provId !== "custom") {
      toast("⚠ Please paste your API key", "error");
      return;
    }

    if (prov.keyPrefix && val && !val.startsWith(prov.keyPrefix)) {
      toast(`⚠ Key should start with "${prov.keyPrefix}"`, "error");
      return;
    }

    if (val) {
      localStorage.setItem(`pc_key_${provId}`, val);
    }

    // Save custom URL if present
    const customUrl = document.getElementById("customUrl")?.value?.trim();
    if (customUrl) localStorage.setItem("pc_custom_url", customUrl);

    closeKeyModal();
    refreshKeyStatus();
    toast(`✓ ${prov.name} connected`, "success");

    const provConf = Providers.getCurrent();
    const hasKey = !!localStorage.getItem(`pc_key_${provConf}`);
    setStatus("", hasKey ? "Ready — describe your goal and generate" : "Connect an API key to get started");
  }

  function clearKey() {
    const provId = Providers.getCurrent();
    localStorage.removeItem(`pc_key_${provId}`);
    document.getElementById("keyInput").value = "";
    closeKeyModal();
    refreshKeyStatus();
    toast("Key removed", "");
  }

  function refreshKeyStatus() {
    const provId  = Providers.getCurrent();
    const hasKey  = !!localStorage.getItem(`pc_key_${provId}`);
    const dot     = document.getElementById("keyDot");
    const txt     = document.getElementById("keyBtnText");
    dot.classList.toggle("on", hasKey);
    txt.textContent = hasKey ? "API Connected" : "Connect API";
  }

  /* ── Status ── */
  function setStatus(state, text) {
    const dot = document.getElementById("statusDot");
    dot.className = "status-dot" + (state ? " " + state : "");
    document.getElementById("statusText").textContent = text;
  }

  /* ── Toast ── */
  let toastTimer;
  function toast(msg, type = "") {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.className = "toast", 2800);
  }

  /* ── Init ── */
  function init() {
    refreshKeyStatus();

    // Restore custom URL
    const saved = localStorage.getItem("pc_custom_url");
    if (saved) {
      const el = document.getElementById("customUrl");
      if (el) el.value = saved;
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    openKeyModal, closeKeyModal, handleOverlay,
    toggleKeyVis, saveKey, clearKey,
    updateModalForProvider, refreshKeyStatus,
    setStatus, toast,
  };
})();
