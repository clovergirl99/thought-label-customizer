// src/model.ts
var DEFAULT_WORDS = {
  active: "Thinking",
  complete: "Thought"
};
function normalizeWord(value, fallback) {
  if (typeof value !== "string")
    return fallback;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || fallback;
}
function parseNativeReasoningLabel(text) {
  const value = text.trim();
  const completed = /^Thought\s+for\s+(.+)$/i.exec(value);
  if (completed)
    return { state: "complete", duration: completed[1].trim() };
  const activeTimed = /^Thinking\s+for\s+(.+)$/i.exec(value);
  if (activeTimed)
    return { state: "active-timed", duration: activeTimed[1].trim() };
  if (/^Thinking$/i.test(value))
    return { state: "active", duration: "" };
  return null;
}
function formatReasoningLabel(parsed, words) {
  if (parsed.state === "complete")
    return `${words.complete} for ${parsed.duration}`;
  if (parsed.state === "active-timed")
    return `${words.active} for ${parsed.duration}`;
  return words.active;
}

// src/frontend.ts
var ACTIVE_SETTING = "labels:active";
var COMPLETE_SETTING = "labels:complete";
var CSS = `
  .tlc-settings{margin:12px 0;padding:14px;border:1px solid var(--lumiverse-border);border-radius:12px;background:var(--lumiverse-bg-elevated);color:var(--lumiverse-text)}
  .tlc-heading{margin:0 0 4px;font-size:14px;font-weight:650}.tlc-help{margin:0 0 13px;color:var(--lumiverse-text-muted);font-size:11.5px;line-height:1.45}
  .tlc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tlc-field{display:flex;flex-direction:column;gap:5px;min-width:0}.tlc-field span{font-size:11px;font-weight:600;color:var(--lumiverse-text-muted)}
  .tlc-input{box-sizing:border-box;width:100%;min-width:0;height:38px;padding:8px 10px;border:1px solid var(--lumiverse-border);border-radius:8px;background:var(--lumiverse-bg);color:var(--lumiverse-text);font:inherit;font-size:13px;outline:none}.tlc-input:focus{border-color:var(--lumiverse-primary);box-shadow:0 0 0 2px var(--lumiverse-primary-020)}
  .tlc-preview{margin-top:10px;padding-top:10px;border-top:1px solid var(--lumiverse-border);color:var(--lumiverse-text-dim);font-size:11px}.tlc-preview strong{color:var(--lumiverse-text-muted);font-weight:600}
  @media(max-width:520px){.tlc-grid{grid-template-columns:1fr}}
`;
function directLabel(toggle) {
  const spans = [...toggle.children].filter((child) => child instanceof HTMLSpanElement);
  return spans.at(-1) ?? null;
}
function savedState(label) {
  const state = label.dataset.tlcState;
  if (state !== "active" && state !== "active-timed" && state !== "complete")
    return null;
  return { state, duration: label.dataset.tlcDuration ?? "" };
}
function setup(ctx) {
  const disposers = [ctx.dom.addStyle(CSS)];
  const settings = ctx.settings;
  const words = { ...DEFAULT_WORDS };
  let saveTimer = null;
  let stopped = false;
  const settingsRoot = ctx.ui.mount("settings_extensions");
  const card = document.createElement("section");
  card.className = "tlc-settings";
  card.setAttribute("aria-label", "Thought label customizer settings");
  card.innerHTML = `
    <h3 class="tlc-heading">Thought label wording</h3>
    <p class="tlc-help">Change the wording shown on reasoning blocks. Leave a field blank to use Lumiverse's original word.</p>
    <div class="tlc-grid">
      <label class="tlc-field"><span>While thinking</span><input class="tlc-input" data-tlc-input="active" type="text" maxlength="60" placeholder="Thinking" autocomplete="off"></label>
      <label class="tlc-field"><span>When finished</span><input class="tlc-input" data-tlc-input="complete" type="text" maxlength="60" placeholder="Thought" autocomplete="off"></label>
    </div>
    <div class="tlc-preview">Preview: <strong data-tlc-preview></strong></div>
  `;
  settingsRoot.appendChild(card);
  const activeInput = card.querySelector('[data-tlc-input="active"]');
  const completeInput = card.querySelector('[data-tlc-input="complete"]');
  const preview = card.querySelector("[data-tlc-preview]");
  const applyLabel = (label) => {
    const current = label.textContent ?? "";
    const native = parseNativeReasoningLabel(current);
    const parsed = native ?? savedState(label);
    if (!parsed)
      return;
    label.dataset.tlcState = parsed.state;
    label.dataset.tlcDuration = parsed.duration;
    const next = formatReasoningLabel(parsed, words);
    if (current !== next)
      label.textContent = next;
  };
  const applyAll = () => {
    document.querySelectorAll('button[data-reasoning-toggle="true"]').forEach((toggle) => {
      const label = directLabel(toggle);
      if (label)
        applyLabel(label);
    });
  };
  const renderPreview = () => {
    preview.textContent = `${words.active} · ${words.active} for 4s · ${words.complete} for 12s`;
  };
  const save = () => {
    if (!settings)
      return;
    if (saveTimer !== null)
      window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      Promise.allSettled([
        settings.set(ACTIVE_SETTING, words.active),
        settings.set(COMPLETE_SETTING, words.complete)
      ]);
    }, 180);
  };
  const readInputs = () => {
    words.active = normalizeWord(activeInput.value, DEFAULT_WORDS.active);
    words.complete = normalizeWord(completeInput.value, DEFAULT_WORDS.complete);
    renderPreview();
    applyAll();
    save();
  };
  activeInput.addEventListener("input", readInputs);
  completeInput.addEventListener("input", readInputs);
  const observer = new MutationObserver((records) => {
    if (stopped)
      return;
    const toggles = new Set;
    for (const record of records) {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      const ownToggle = target?.closest('button[data-reasoning-toggle="true"]');
      if (ownToggle)
        toggles.add(ownToggle);
      if (record.type === "childList") {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element))
            continue;
          if (node.matches('button[data-reasoning-toggle="true"]'))
            toggles.add(node);
          node.querySelectorAll('button[data-reasoning-toggle="true"]').forEach((toggle) => toggles.add(toggle));
        }
      }
    }
    for (const toggle of toggles) {
      const label = directLabel(toggle);
      if (label)
        applyLabel(label);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  if (settings)
    disposers.push(settings.watch(ACTIVE_SETTING, (value) => {
      if (typeof value !== "string")
        return;
      words.active = normalizeWord(value, DEFAULT_WORDS.active);
      if (activeInput.value !== value)
        activeInput.value = value;
      renderPreview();
      applyAll();
    }), settings.watch(COMPLETE_SETTING, (value) => {
      if (typeof value !== "string")
        return;
      words.complete = normalizeWord(value, DEFAULT_WORDS.complete);
      if (completeInput.value !== value)
        completeInput.value = value;
      renderPreview();
      applyAll();
    }));
  if (settings) {
    Promise.all([
      settings.get(ACTIVE_SETTING),
      settings.get(COMPLETE_SETTING)
    ]).then(([active, complete]) => {
      if (stopped)
        return;
      activeInput.value = typeof active === "string" ? active : "";
      completeInput.value = typeof complete === "string" ? complete : "";
      words.active = normalizeWord(active, DEFAULT_WORDS.active);
      words.complete = normalizeWord(complete, DEFAULT_WORDS.complete);
      renderPreview();
      applyAll();
    }).catch(() => {
      renderPreview();
      applyAll();
    });
  }
  renderPreview();
  applyAll();
  return () => {
    stopped = true;
    observer.disconnect();
    if (saveTimer !== null)
      window.clearTimeout(saveTimer);
    card.remove();
    for (const dispose of disposers.reverse()) {
      try {
        dispose();
      } catch {}
    }
  };
}
export {
  setup
};
