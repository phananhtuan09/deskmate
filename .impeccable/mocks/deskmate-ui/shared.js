// Shared mock data, Paseo theme approximation, icons, and interactions for the Deskmate UI mockups.
// All data is synthetic.

const THEMES = {
  dark: {
    surface0: "#121315", surface1: "#191a1d", surface2: "#232428", border: "#2e3035",
    foreground: "#ececed", foregroundMuted: "#9c9da4", accent: "#7c93ff", accentForeground: "#0d1020",
    statusSuccess: "#4cc38a", statusWarning: "#e3a948", statusDanger: "#f0716b",
  },
  light: {
    surface0: "#ffffff", surface1: "#f5f5f6", surface2: "#eaeaec", border: "#dcdce0",
    foreground: "#17171a", foregroundMuted: "#5f6068", accent: "#3653d4", accentForeground: "#ffffff",
    statusSuccess: "#1c8a52", statusWarning: "#9a6411", statusDanger: "#c83a36",
  },
};

const TODAY = new Date(2026, 9, 31, 14, 20);

const STATE = {
  sessions: [
    { id: "ag_7f3c91", label: "fix-flaky-e2e", provider: "claude", workspace: "paseo-app", registered: "Oct 28", status: "permission", since: 6, detail: "Run npm run e2e -- --retries 0?" },
    { id: "ag_2b81d4", label: "auth-refactor", provider: "codex", workspace: "deskmate-api", registered: "Oct 30", status: "finished", since: 18, detail: "Refactor done; asks whether to also drop the legacy token path." },
    { id: "ag_c40e77", label: "docs-sweep", provider: "claude", workspace: "deskmate", registered: "Oct 31", status: "running", since: 2, detail: "Working" },
  ],
  tasks: [
    { id: "t1", title: "Write release notes for 0.12", project: "paseo-app", due: "2026-10-30", status: "Todo", sessions: [] },
    { id: "t2", title: "Reply to Minh about the plugin RPC question", project: null, due: "2026-10-31", status: "Todo", sessions: [] },
    { id: "t3", title: "Try Deskmate on the phone build", project: "deskmate", due: "2026-11-03", status: "Todo", sessions: [] },
    { id: "t4", title: "Review auth refactor PR", project: "deskmate-api", due: "2026-10-31", status: "Doing", sessions: ["ag_2b81d4"], note: "Check the token migration path before merging." },
    { id: "t5", title: "Fix flaky e2e in CI", project: "paseo-app", due: "2026-10-29", status: "Doing", sessions: ["ag_7f3c91"] },
    { id: "t6", title: "Wait for design feedback from Lan", project: "deskmate", due: "2026-10-28", status: "Pending", sessions: [] },
    { id: "t7", title: "Bootstrap Deskmate docs", project: "deskmate", due: "2026-10-30", status: "Done", sessions: [] },
    { id: "t8", title: "Old spike: Herdr bridge", project: "foreman", due: "2026-10-12", status: "Closed", sessions: [] },
    { id: "t9", title: "Archive Foreman issues", project: "foreman", due: "2026-10-20", status: "Closed", sessions: [] },
  ],
};

const COLUMNS = ["Todo", "Doing", "Done", "Pending", "Closed"];

const REASONS = {
  permission: { short: "Permission", long: "Waiting for your permission", tone: "warning", icon: "shield" },
  finished: { short: "Your turn", long: "Finished, waiting for your reply", tone: "accent", icon: "message" },
  failed: { short: "Failed", long: "Turn failed", tone: "danger", icon: "alert" },
  closed: { short: "Closed", long: "Session closed", tone: "muted", icon: "x-circle" },
  running: { short: "Running", long: "Working, nothing needed", tone: "muted", icon: "activity" },
};

const ICONS = {
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  kanban: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  bell: '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/>',
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
};

function icon(name, size = 16, cls = "") {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function parseDue(iso) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }
function isOverdue(t) {
  if (t.status === "Done" || t.status === "Closed") return false;
  const end = parseDue(t.due); end.setHours(23, 59, 59, 999);
  return end < TODAY;
}
function daysLate(t) { return Math.round((TODAY - parseDue(t.due)) / 86400000) - 0; }
function dueLabel(t) {
  const d = parseDue(t.due);
  const diff = Math.round((d - new Date(2026, 9, 31)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function dueShort(t) { const d = parseDue(t.due); return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }); }
function sinceLabel(min) { return min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60}m`; }
function session(id) { return STATE.sessions.find((s) => s.id === id); }
function needsYou(s) { return s && s.status !== "running" && !s.dismissed; }
function attentionSessions() { return STATE.sessions.filter(needsYou); }
function overdueTasks() { return STATE.tasks.filter(isOverdue); }
function reminderCount() { return attentionSessions().length + overdueTasks().length; }
function tasksIn(col) { return STATE.tasks.filter((t) => t.status === col); }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }

function applyTheme(name) {
  const t = THEMES[name];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t)) root.style.setProperty(`--${k}`, v);
  root.dataset.theme = name;
  document.querySelectorAll("[data-theme-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeBtn === name)));
}

// Paseo-like host shell; the Deskmate screen renders into .dm-screen.
function shell(compact, inner) {
  const count = reminderCount();
  if (compact) {
    return `<div class="host host-compact">
      <header class="host-top">${icon("menu", 18)}<span class="host-title">Deskmate</span><span class="host-count" aria-label="${count} reminders">${count}</span></header>
      <div class="dm-screen">${inner}</div></div>`;
  }
  const ws = ["paseo-app", "deskmate-api", "deskmate"];
  return `<div class="host">
    <aside class="host-side">
      <div class="host-brand">Paseo</div>
      <div class="host-search">${icon("search", 14)}<span>Search</span></div>
      <div class="host-label">Workspaces</div>
      ${ws.map((w) => `<div class="host-row">${icon("terminal", 15)}<span>${w}</span></div>`).join("")}
      <div class="host-sep"></div>
      <div class="host-row host-row-active">${icon("kanban", 15)}<span>Deskmate</span><span class="host-count" aria-label="${count} reminders">${count}</span></div>
    </aside>
    <main class="dm-screen">${inner}</main></div>`;
}

const HOST_CSS = `
.host{display:flex;height:100%;background:var(--surface0);color:var(--foreground);font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
.host-side{width:216px;flex:none;background:var(--surface1);border-right:1px solid var(--border);padding:14px 10px;display:flex;flex-direction:column;gap:2px}
.host-brand{font-weight:650;font-size:14px;padding:4px 8px 12px}
.host-search{display:flex;gap:8px;align-items:center;color:var(--foregroundMuted);border:1px solid var(--border);border-radius:7px;padding:6px 8px;margin-bottom:14px;font-size:13px}
.host-label{color:var(--foregroundMuted);font-size:12px;padding:4px 8px}
.host-row{display:flex;align-items:center;gap:9px;padding:6px 8px;border-radius:7px;color:var(--foregroundMuted);font-size:13px}
.host-row-active{background:var(--surface2);color:var(--foreground)}
.host-sep{height:1px;background:var(--border);margin:10px 4px}
.host-count{margin-left:auto;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--accent);color:var(--accentForeground);font-size:11px;font-weight:650;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.dm-screen{flex:1;min-width:0;overflow:auto;position:relative}
.host-compact{flex-direction:column}
.host-top{display:flex;align-items:center;gap:12px;height:48px;padding:0 14px;border-bottom:1px solid var(--border);background:var(--surface1);flex:none}
.host-title{font-weight:600}
.host-top .host-count{margin-left:auto}
.ic{flex:none}
`;

// Drag tasks between columns: draggable [data-task] onto [data-col].
function wireDrag(root) {
  root.querySelectorAll("[data-task]").forEach((el) => {
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", el.dataset.task); el.classList.add("is-dragging"); document.body.classList.add("dragging"); });
    el.addEventListener("dragend", () => { el.classList.remove("is-dragging"); document.body.classList.remove("dragging"); });
  });
  root.querySelectorAll("[data-col]").forEach((zone) => {
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("is-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault(); zone.classList.remove("is-over");
      const t = STATE.tasks.find((x) => x.id === e.dataTransfer.getData("text/plain"));
      if (t && t.status !== zone.dataset.col) { t.status = zone.dataset.col; t.moved = true; window.renderAll(); }
    });
  });
  root.querySelectorAll("[data-dismiss]").forEach((b) => b.addEventListener("click", () => { session(b.dataset.dismiss).dismissed = true; window.renderAll(); }));
  root.querySelectorAll("[data-clear-closed]").forEach((b) => b.addEventListener("click", () => { STATE.tasks = STATE.tasks.filter((t) => t.status !== "Closed"); window.renderAll(); }));
  root.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { window.MOBILE_TAB = b.dataset.tab; window.renderAll(); }));
}

window.MOBILE_TAB = "attention";

function boot(render, extraCss) {
  const style = document.createElement("style");
  style.textContent = HOST_CSS + extraCss;
  document.head.appendChild(style);
  window.renderAll = () => {
    for (const el of document.querySelectorAll("[data-frame]")) {
      const compact = el.dataset.frame === "mobile";
      el.innerHTML = shell(compact, render(compact));
      wireDrag(el);
    }
  };
  document.querySelectorAll("[data-theme-btn]").forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.themeBtn)));
  applyTheme("dark");
  window.renderAll();
}
