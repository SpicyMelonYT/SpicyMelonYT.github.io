(function () {
  // ============================
  // Super Notes (v2) - Hosted App
  // ============================
  if (window.__SUPER_NOTES_APP__) return;
  window.__SUPER_NOTES_APP__ = true;

  const HOST = location.hostname || "unknown";
  const KEY = "super-notes:v2:" + HOST;

  const DEFAULT = {
    ui: {
      x: null,
      y: null,
      w: 600,
      h: 600,
      sidebar: true,
      pageSize: 15,
    },
    data: {
      folders: [{ id: "inbox", name: "Inbox", createdAt: Date.now() }],
      notes: [], // {id, folderId, name:null|string, body, createdAt, updatedAt}
      selFolder: "inbox",
      selNote: null,
    }
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function now() { return Date.now(); }
  function uid(prefix) { return (prefix || "id") + "_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16); }

  function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
  function load() {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? safeParse(raw) : null;
    if (!parsed) return structuredClone(DEFAULT);

    // merge with defaults
    const st = structuredClone(DEFAULT);
    st.ui = Object.assign({}, st.ui, parsed.ui || {});
    st.data = Object.assign({}, st.data, parsed.data || {});

    if (!Array.isArray(st.data.folders) || st.data.folders.length === 0) st.data.folders = structuredClone(DEFAULT.data.folders);
    if (!Array.isArray(st.data.notes)) st.data.notes = [];
    if (!st.data.selFolder) st.data.selFolder = "inbox";

    // ensure inbox exists
    if (!st.data.folders.some(f => f.id === "inbox")) {
      st.data.folders.unshift({ id: "inbox", name: "Inbox", createdAt: now() });
    }

    return st;
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  let state = load();

  function getFolder(id) { return state.data.folders.find(f => f.id === id) || null; }
  function getNote(id) { return state.data.notes.find(n => n.id === id) || null; }

  function ensureSelection() {
    if (!getFolder(state.data.selFolder)) state.data.selFolder = "inbox";
    if (state.data.selNote && !getNote(state.data.selNote)) state.data.selNote = null;
  }

  function deriveNameFromBody(body) {
    const t = (body || "").trim().replace(/\r/g, "");
    if (!t) return "Untitled";
    const first = (t.split("\n")[0] || "").trim();
    const s = first || t.slice(0, 60);
    return s.length > 60 ? s.slice(0, 57) + "…" : s;
  }
  function displayNoteName(note) {
    const n = note && typeof note.name === "string" ? note.name.trim() : "";
    return n ? n : deriveNameFromBody(note.body || "");
  }

  // ==============
  // Styles (safe)
  // ==============
  if (!document.getElementById("super-notes-style")) {
    const style = document.createElement("style");
    style.id = "super-notes-style";
    style.textContent = `
#super-notes-root{
  position:fixed; inset:0; z-index:2147483647;
  background:rgba(0,0,0,.38);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
#super-notes-root[hidden]{ display:none !important; }

#super-notes-window{
  position:absolute;
  background:#0b0f14;
  color:#e8eef7;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.12);
  box-shadow: 0 18px 90px rgba(0,0,0,.62);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.sn-header{
  height:44px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 10px 0 12px;
  background: rgba(255,255,255,.04);
  border-bottom:1px solid rgba(255,255,255,.10);
  user-select:none;
  cursor:move;
}
.sn-title{
  display:flex; align-items:center; gap:10px;
  font-size:13px; font-weight:650;
}
.sn-dot{
  width:10px;height:10px;border-radius:50%;
  background:#5b8cff; box-shadow:0 0 0 4px rgba(91,140,255,.12);
}
.sn-sub{ opacity:.65; font-weight:500; }
.sn-actions{ display:flex; gap:8px; align-items:center; }

.sn-btn{
  height:30px; padding:0 10px; border-radius:10px;
  border:1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.07);
  color:#e8eef7; font-size:12px;
  cursor:pointer;
}
.sn-btn:hover{ background: rgba(255,255,255,.10); }
.sn-ghost{ background: transparent; }
.sn-danger{ color:#ffb4b4; border-color: rgba(255,180,180,.22); }
.sn-danger:hover{ background: rgba(255,80,80,.10); }

.sn-body{ flex:1; display:flex; min-height:0; }
.sn-sidebar{
  width:260px;
  border-right:1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.02);
  display:flex; flex-direction:column;
  min-width:220px;
}
.sn-sidebar[hidden]{ display:none !important; }

.sn-sb-top{ padding:10px; display:flex; flex-direction:column; gap:10px; }
.sn-input{
  width:100%; height:32px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.05);
  color:#e8eef7;
  padding:0 10px;
  outline:none;
  font-size:12px;
  box-sizing:border-box;
}
.sn-input::placeholder{ color: rgba(232,238,247,.55); }
.sn-row{ display:flex; gap:8px; align-items:center; }

.sn-sb-section{ padding:0 10px 10px; overflow:auto; min-height:0; }
.sn-sb-title{
  padding:6px 2px;
  font-size:11px;
  opacity:.7;
  letter-spacing:.6px;
  text-transform:uppercase;
}

.sn-list{ display:flex; flex-direction:column; gap:6px; }
.sn-item{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:8px 10px;
  border-radius:10px;
  border:1px solid transparent;
  background: rgba(255,255,255,.03);
  cursor:pointer;
}
.sn-item:hover{ background: rgba(255,255,255,.06); }
.sn-item.active{ border-color: rgba(91,140,255,.55); background: rgba(91,140,255,.14); }
.sn-item-name{
  font-size:12px; font-weight:650;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.sn-item-meta{ font-size:10px; opacity:.65; white-space:nowrap; }

.sn-main{ flex:1; display:flex; flex-direction:column; min-width:320px; min-height:0; }
.sn-main-top{
  padding:10px 12px;
  display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid rgba(255,255,255,.10);
}
.sn-crumbs{ font-size:12px; opacity:.85; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sn-main-actions{ display:flex; gap:8px; align-items:center; }
.sn-main-content{ flex:1; overflow:auto; padding:12px; min-height:0; }

.sn-panel{
  border:1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius:14px;
  padding:12px;
}
.sn-panel-title{ font-weight:750; font-size:12px; margin-bottom:8px; opacity:.92; }
.sn-split{ display:flex; gap:12px; height:100%; min-height:0; }
.sn-leftcol{ width:340px; min-width:260px; max-width:440px; display:flex; flex-direction:column; gap:12px; min-height:0; }
.sn-rightcol{ flex:1; display:flex; flex-direction:column; gap:12px; min-width:320px; min-height:0; }

.sn-notearea{
  width:100%; flex:1; min-height:260px;
  resize:none;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.25);
  color:#e8eef7;
  padding:12px;
  outline:none;
  font-size:13px;
  line-height:1.45;
  box-sizing:border-box;
}
.sn-notearea::placeholder{ color: rgba(232,238,247,.55); }
.sn-mini{ font-size:11px; opacity:.75; }
.sn-kbd{
  border:1px solid rgba(255,255,255,.14);
  padding:2px 6px;
  border-radius:8px;
  background: rgba(255,255,255,.05);
  font-size:11px;
}

.sn-pager{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  padding-top:8px;
}
.sn-highlight{
  background: rgba(91,140,255,.25);
  border: 1px solid rgba(91,140,255,.35);
  padding: 0 3px;
  border-radius: 6px;
}

.sn-menu{
  position:fixed;
  z-index:2147483647;
  background:#0b0f14;
  border:1px solid rgba(255,255,255,.14);
  border-radius:12px;
  box-shadow: 0 18px 70px rgba(0,0,0,.65);
  padding:6px;
  min-width:180px;
}
.sn-menu button{
  width:100%;
  text-align:left;
  background: transparent;
  border:0;
  color:#e8eef7;
  padding:8px 10px;
  border-radius:10px;
  cursor:pointer;
  font-size:12px;
}
.sn-menu button:hover{ background: rgba(255,255,255,.08); }
.sn-menu .danger{ color:#ffb4b4; }
`;
    document.head.appendChild(style);
  }

  // =========
  // DOM util
  // =========
  function el(tag, props, children) {
    const n = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (k === "class") n.className = v;
        else if (k === "style") Object.assign(n.style, v);
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else if (v !== undefined && v !== null) n.setAttribute(k, v);
      }
    }
    if (children != null) {
      const arr = Array.isArray(children) ? children : [children];
      for (const c of arr) {
        if (c == null) continue;
        n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return n;
  }

  // ==========
  // Root + win
  // ==========
  const root = el("div", { id: "super-notes-root" });
  const win = el("div", { id: "super-notes-window", role: "dialog", "aria-modal": "true" });
  root.appendChild(win);
  document.body.appendChild(root);

  // expose toggles for loader
  window.__SUPER_NOTES_SHOW__ = show;
  window.__SUPER_NOTES_HIDE__ = hide;

  // ==========
  // UI state
  // ==========
  const ui = {
    scene: "notes",      // notes | grep | settings
    nameSearch: "",
    grepQuery: "",
    foldersPage: 1,
    notesPage: 1,
    grepPage: 1,
  };

  // ==========
  // Geometry
  // ==========
  function applyGeom() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    state.ui.w = clamp(parseInt(state.ui.w, 10) || 600, 360, Math.max(360, vw - 24));
    state.ui.h = clamp(parseInt(state.ui.h, 10) || 600, 280, Math.max(280, vh - 24));

    win.style.width = state.ui.w + "px";
    win.style.height = state.ui.h + "px";

    if (state.ui.x == null || state.ui.y == null) {
      // default position
      win.style.left = Math.round((vw - state.ui.w) / 2) + "px";
      win.style.top = "40px";
    } else {
      state.ui.x = clamp(state.ui.x, 8, vw - state.ui.w - 8);
      state.ui.y = clamp(state.ui.y, 8, vh - state.ui.h - 8);
      win.style.left = state.ui.x + "px";
      win.style.top = state.ui.y + "px";
    }
  }

  function show() {
    root.hidden = false;
    applyGeom();
    bringToFront();
  }
  function hide() {
    root.hidden = true;
    closeMenu();
    save();
  }
  function bringToFront() {
    // keep at max z-index regardless
    root.style.zIndex = "2147483647";
  }

  // Drag (fixed: uses DOM rect baseline)
  let drag = null;
  function onDragStart(e) {
    // don't drag from buttons/inputs
    if (e.target.closest("button") || e.target.closest("input")) return;

    const rect = win.getBoundingClientRect();
    drag = { mx: e.clientX, my: e.clientY, ox: rect.left, oy: rect.top };
    e.preventDefault();
  }
  function onDragMove(e) {
    if (!drag) return;
    state.ui.x = drag.ox + (e.clientX - drag.mx);
    state.ui.y = drag.oy + (e.clientY - drag.my);
    applyGeom();
  }
  function onDragEnd() {
    if (!drag) return;
    drag = null;
    save();
  }

  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd);

  window.addEventListener("resize", () => {
    applyGeom();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !root.hidden) hide();
  }, true);

  // ==========
  // Context menu
  // ==========
  let menuEl = null;
  function closeMenu() {
    if (menuEl) menuEl.remove();
    menuEl = null;
  }
  document.addEventListener("click", () => closeMenu(), true);
  document.addEventListener("scroll", () => closeMenu(), true);

  function openMenu(x, y, items) {
    closeMenu();
    menuEl = el("div", { class: "sn-menu" });
    for (const it of items) {
      const b = el("button", { class: it.danger ? "danger" : "", onclick: (e) => {
        e.stopPropagation();
        closeMenu();
        it.onClick();
      }}, it.label);
      menuEl.appendChild(b);
    }
    document.body.appendChild(menuEl);

    const r = menuEl.getBoundingClientRect();
    const px = clamp(x, 8, window.innerWidth - r.width - 8);
    const py = clamp(y, 8, window.innerHeight - r.height - 8);
    menuEl.style.left = px + "px";
    menuEl.style.top = py + "px";
  }

  // ==========
  // Actions
  // ==========
  function createFolder() {
    const name = prompt("Folder name:", "New Folder");
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = uid("f");
    state.data.folders.push({ id, name: trimmed, createdAt: now() });
    state.data.selFolder = id;
    state.data.selNote = null;
    save();
    renderAll();
  }

  function renameFolder(folderId) {
    const f = getFolder(folderId);
    if (!f) return;
    const name = prompt("Rename folder:", f.name);
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    f.name = trimmed;
    save();
    renderAll();
  }

  function deleteFolder(folderId) {
    if (folderId === "inbox") { alert("Inbox cannot be deleted."); return; }
    const f = getFolder(folderId);
    if (!f) return;

    const ok = confirm(`Delete folder "${f.name}"?\nNotes inside will be moved to Inbox.`);
    if (!ok) return;

    // move notes to inbox
    for (const n of state.data.notes) {
      if (n.folderId === folderId) n.folderId = "inbox";
    }
    state.data.folders = state.data.folders.filter(x => x.id !== folderId);

    if (state.data.selFolder === folderId) {
      state.data.selFolder = "inbox";
      state.data.selNote = null;
    }

    save();
    renderAll();
  }

  function createNote() {
    ensureSelection();
    const folderId = state.data.selFolder || "inbox";
    const id = uid("n");
    const t = now();
    const n = {
      id,
      folderId,
      name: null,      // null/"" => auto-name mode
      body: "",
      createdAt: t,
      updatedAt: t,
    };
    state.data.notes.unshift(n);
    state.data.selNote = id;
    ui.scene = "notes";
    save();
    renderAll();
    focusEditorSoon();
  }

  function renameNote(noteId) {
    const n = getNote(noteId);
    if (!n) return;
    const current = (typeof n.name === "string" && n.name.trim()) ? n.name.trim() : "";
    const suggestion = current || displayNoteName(n);
    const name = prompt("Note name (empty = auto):", suggestion);
    if (name == null) return;

    const trimmed = name.trim();
    if (!trimmed) {
      // revert to auto mode
      n.name = null;
    } else {
      n.name = trimmed;
    }
    n.updatedAt = now();
    save();
    renderAll();
  }

  function deleteNote(noteId) {
    const n = getNote(noteId);
    if (!n) return;

    const label = displayNoteName(n);
    const ok = confirm(`Delete note "${label}"?`);
    if (!ok) return;

    state.data.notes = state.data.notes.filter(x => x.id !== noteId);
    if (state.data.selNote === noteId) state.data.selNote = null;

    save();
    renderAll();
  }

  function selectFolder(folderId) {
    state.data.selFolder = folderId;
    state.data.selNote = null;
    ui.notesPage = 1;
    ui.scene = "notes";
    save();
    renderAll();
  }

  function selectNote(noteId) {
    state.data.selNote = noteId;
    ui.scene = "notes";
    save();
    renderAll();
    focusEditorSoon();
  }

  function focusEditorSoon() {
    setTimeout(() => {
      const ta = win.querySelector("#sn-editor");
      if (ta) ta.focus();
    }, 0);
  }

  // ==========
  // Filtering + pagination
  // ==========
  function pageSize() {
    return clamp(parseInt(state.ui.pageSize, 10) || 15, 5, 100);
  }
  function paginate(items, page) {
    const ps = pageSize();
    const pages = Math.max(1, Math.ceil(items.length / ps));
    const p = clamp(page, 1, pages);
    const start = (p - 1) * ps;
    return { slice: items.slice(start, start + ps), page: p, pages, total: items.length };
  }

  function nameSearchLower() {
    return (ui.nameSearch || "").trim().toLowerCase();
  }

  function folderMatchesSearch(folder) {
    const q = nameSearchLower();
    if (!q) return true;
    if ((folder.name || "").toLowerCase().includes(q)) return true;
    // also match if any note in folder matches by name
    return state.data.notes.some(n => n.folderId === folder.id && displayNoteName(n).toLowerCase().includes(q));
  }

  function notesInSelectedFolderFiltered() {
    ensureSelection();
    const folderId = state.data.selFolder || "inbox";
    const q = nameSearchLower();

    let notes = state.data.notes.filter(n => n.folderId === folderId);
    notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (q) notes = notes.filter(n => displayNoteName(n).toLowerCase().includes(q));
    return notes;
  }

  function grepMatches() {
    const q = (ui.grepQuery || "").trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const n of state.data.notes) {
      const body = (n.body || "");
      const idx = body.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(body.length, idx + q.length + 80);
        const snippet = body.slice(start, end).replace(/\s+/g, " ").trim();
        out.push({ noteId: n.id, folderId: n.folderId, snippet });
      }
    }
    return out;
  }

  function escapeHtml(s) {
    return (s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  }

  function highlightSnippet(snippet, q) {
    const safe = escapeHtml(snippet);
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(esc, "ig");
    return safe.replace(re, (mm) => `<span class="sn-highlight">${escapeHtml(mm)}</span>`);
  }

  // ==========
  // Build UI
  // ==========
  const header = el("div", { class: "sn-header", onmousedown: onDragStart });

  const title = el("div", { class: "sn-title" }, [
    el("span", { class: "sn-dot" }),
    "Super Notes",
    el("span", { class: "sn-sub" }, `— ${HOST}`)
  ]);

  const headerActions = el("div", { class: "sn-actions" }, [
    el("button", { class: "sn-btn sn-ghost", title: "Toggle sidebar", onclick: () => {
      state.ui.sidebar = !state.ui.sidebar;
      save();
      renderLayout();
    }}, "☰"),
    el("button", { class: "sn-btn", title: "New note", onclick: () => createNote() }, "+ Note"),
    el("button", { class: "sn-btn sn-ghost", title: "Close (Esc)", onclick: () => hide() }, "✕"),
  ]);

  header.append(title, headerActions);

  const body = el("div", { class: "sn-body" });

  // Sidebar
  const sidebar = el("div", { class: "sn-sidebar" });

  const sbSearch = el("input", {
    class: "sn-input",
    placeholder: "Search folder/note names…",
    oninput: () => {
      ui.nameSearch = sbSearch.value;
      ui.foldersPage = 1;
      ui.notesPage = 1;
      renderAll();
    }
  });

  const sbButtons = el("div", { class: "sn-row" }, [
    el("button", { class: "sn-btn sn-ghost", onclick: () => createFolder() }, "+ Folder"),
    el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.scene = "grep"; ui.grepPage = 1; renderAll(); } }, "Grep"),
    el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.scene = "settings"; renderAll(); } }, "Settings"),
  ]);

  const sbTop = el("div", { class: "sn-sb-top" }, [sbSearch, sbButtons]);

  const sbFoldersSection = el("div", { class: "sn-sb-section" });
  const sbFoldersTitle = el("div", { class: "sn-sb-title" }, "Folders");
  const sbFoldersList = el("div", { class: "sn-list" });

  sbFoldersSection.append(sbFoldersTitle, sbFoldersList);

  const sbNotesSection = el("div", { class: "sn-sb-section" });
  const sbNotesTitle = el("div", { class: "sn-sb-title" }, "Notes");
  const sbNotesList = el("div", { class: "sn-list" });

  sbNotesSection.append(sbNotesTitle, sbNotesList);

  sidebar.append(sbTop, sbFoldersSection, sbNotesSection);

  // Main
  const main = el("div", { class: "sn-main" });
  const mainTop = el("div", { class: "sn-main-top" });
  const crumbs = el("div", { class: "sn-crumbs" }, "");
  const mainActions = el("div", { class: "sn-main-actions" });

  const btnBackNotes = el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.scene = "notes"; renderAll(); } }, "Notes");
  const btnBackGrep = el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.scene = "grep"; renderAll(); } }, "Grep");
  const btnBackSettings = el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.scene = "settings"; renderAll(); } }, "Settings");

  // We'll show the correct one based on scene.
  mainActions.append(btnBackNotes, btnBackGrep, btnBackSettings);

  mainTop.append(crumbs, mainActions);

  const mainContent = el("div", { class: "sn-main-content" });

  main.append(mainTop, mainContent);

  body.append(sidebar, main);
  win.append(header, body);

  // ==========
  // Renderers
  // ==========
  function renderLayout() {
    sidebar.hidden = !state.ui.sidebar;
  }

  function renderSidebar() {
    // update search input value
    sbSearch.value = ui.nameSearch || "";

    // Folders list (filtered + paginated)
    const q = nameSearchLower();
    const folders = state.data.folders.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const filteredFolders = folders.filter(folderMatchesSearch);

    const fp = paginate(filteredFolders, ui.foldersPage);
    ui.foldersPage = fp.page;

    sbFoldersList.innerHTML = "";

    for (const f of fp.slice) {
      const count = state.data.notes.filter(n => n.folderId === f.id).length;

      const item = el("div", {
        class: "sn-item" + (state.data.selFolder === f.id ? " active" : ""),
        onclick: () => selectFolder(f.id),
        oncontextmenu: (e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY, [
            { label: "Rename folder…", onClick: () => renameFolder(f.id) },
            { label: "Delete folder", danger: true, onClick: () => deleteFolder(f.id) },
          ]);
        }
      }, [
        el("div", { style: { minWidth: 0 } }, [
          el("div", { class: "sn-item-name", title: f.name }, f.name),
          el("div", { class: "sn-item-meta" }, `${count} note${count === 1 ? "" : "s"}`)
        ]),
      ]);

      sbFoldersList.appendChild(item);
    }

    // Notes list for selected folder (filtered by name search + paginated)
    const notes = notesInSelectedFolderFiltered();
    const np = paginate(notes, ui.notesPage);
    ui.notesPage = np.page;

    sbNotesList.innerHTML = "";

    for (const n of np.slice) {
      const item = el("div", {
        class: "sn-item" + (state.data.selNote === n.id ? " active" : ""),
        onclick: () => selectNote(n.id),
        oncontextmenu: (e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY, [
            { label: "Rename note…", onClick: () => renameNote(n.id) },
            { label: "Delete note", danger: true, onClick: () => deleteNote(n.id) },
          ]);
        }
      }, [
        el("div", { style: { minWidth: 0 } }, [
          el("div", { class: "sn-item-name", title: displayNoteName(n) }, displayNoteName(n)),
          el("div", { class: "sn-item-meta" }, new Date(n.updatedAt || n.createdAt).toLocaleString())
        ])
      ]);
      sbNotesList.appendChild(item);
    }

    // Add pagination controls into titles (simple + clean)
    sbFoldersTitle.textContent = `Folders (Page ${fp.page}/${fp.pages})`;
    sbNotesTitle.textContent = `Notes (Page ${np.page}/${np.pages})`;

    // Right-click works, but also provide paging with small buttons in the sidebar top row:
    // (We keep it minimal; paging is still fully available via mouse wheel + list size)
  }

  function setCrumbs() {
    ensureSelection();
    const f = getFolder(state.data.selFolder);
    const n = state.data.selNote ? getNote(state.data.selNote) : null;

    if (ui.scene === "settings") {
      crumbs.textContent = "Settings";
      return;
    }
    if (ui.scene === "grep") {
      crumbs.textContent = "Grep content";
      return;
    }

    const folderName = f ? f.name : "Folder";
    crumbs.textContent = n ? `${folderName} / ${displayNoteName(n)}` : folderName;
  }

  function renderSceneButtons() {
    btnBackNotes.hidden = ui.scene === "notes";
    btnBackGrep.hidden = ui.scene === "grep";
    btnBackSettings.hidden = ui.scene === "settings";
  }

  function renderNotesScene() {
    mainContent.innerHTML = "";

    const notes = notesInSelectedFolderFiltered();
    const np = paginate(notes, ui.notesPage);
    ui.notesPage = np.page;

    const layout = el("div", { class: "sn-split" });

    // Left column: list + pager
    const left = el("div", { class: "sn-leftcol" });
    const listPanel = el("div", { class: "sn-panel" }, [
      el("div", { class: "sn-panel-title" }, "Notes (in folder)"),
    ]);

    const list = el("div", { class: "sn-list" });
    for (const n of np.slice) {
      list.appendChild(el("div", {
        class: "sn-item" + (state.data.selNote === n.id ? " active" : ""),
        onclick: () => selectNote(n.id),
        oncontextmenu: (e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY, [
            { label: "Rename note…", onClick: () => renameNote(n.id) },
            { label: "Delete note", danger: true, onClick: () => deleteNote(n.id) },
          ]);
        }
      }, [
        el("div", { style: { minWidth: 0 } }, [
          el("div", { class: "sn-item-name", title: displayNoteName(n) }, displayNoteName(n)),
          el("div", { class: "sn-item-meta" }, new Date(n.updatedAt || n.createdAt).toLocaleString())
        ])
      ]));
    }

    const pager = el("div", { class: "sn-pager" }, [
      el("div", { class: "sn-mini" }, `${np.total} total • Page ${np.page}/${np.pages}`),
      el("div", { class: "sn-row" }, [
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.notesPage = 1; renderAll(); } }, "⟪"),
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.notesPage = clamp(ui.notesPage - 1, 1, np.pages); renderAll(); } }, "‹"),
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.notesPage = clamp(ui.notesPage + 1, 1, np.pages); renderAll(); } }, "›"),
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.notesPage = np.pages; renderAll(); } }, "⟫"),
      ])
    ]);

    listPanel.append(list, pager);

    const tips = el("div", { class: "sn-panel" }, [
      el("div", { class: "sn-panel-title" }, "Tips"),
      el("div", { class: "sn-mini" }, [
        "Right-click folders/notes to rename/delete. ",
        "Empty note name switches back to auto-name (first line of content). ",
        "Press ",
        el("span", { class: "sn-kbd" }, "Esc"),
        " to close."
      ])
    ]);

    left.append(listPanel, tips);

    // Right column: editor
    const right = el("div", { class: "sn-rightcol" });
    const editorPanel = el("div", { class: "sn-panel", style: { height: "100%", display: "flex", flexDirection: "column", gap: "10px" } });

    const selected = state.data.selNote ? getNote(state.data.selNote) : null;

    if (!selected) {
      editorPanel.append(
        el("div", { class: "sn-panel-title" }, "Editor"),
        el("div", { class: "sn-mini" }, "No note selected. Create one or click a note.")
      );
    } else {
      const headRow = el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" } }, [
        el("div", { class: "sn-panel-title", style: { margin: 0 } }, displayNoteName(selected)),
        el("div", { class: "sn-mini" }, `Updated ${new Date(selected.updatedAt || selected.createdAt).toLocaleString()}`)
      ]);

      const ta = el("textarea", { id: "sn-editor", class: "sn-notearea", placeholder: "Write here…" });
      ta.value = selected.body || "";

      ta.addEventListener("input", () => {
        selected.body = ta.value;
        selected.updatedAt = now();
        save();
        // refresh name-based lists if note is auto-named
        renderSidebar();
        setCrumbs();
      });

      editorPanel.append(headRow, ta);
    }

    right.append(editorPanel);

    layout.append(left, right);
    mainContent.appendChild(layout);
  }

  function renderGrepScene() {
    mainContent.innerHTML = "";

    const panel = el("div", { class: "sn-panel" }, [
      el("div", { class: "sn-panel-title" }, "Grep (search inside note content)"),
    ]);

    const row = el("div", { class: "sn-row", style: { marginBottom: "10px" } });

    const input = el("input", {
      class: "sn-input",
      placeholder: "Type to search note content…",
      value: ui.grepQuery || "",
      oninput: () => {
        ui.grepQuery = input.value;
        ui.grepPage = 1;
        renderAll();
      }
    });

    row.append(input);
    panel.appendChild(row);

    const q = (ui.grepQuery || "").trim().toLowerCase();
    if (!q) {
      panel.appendChild(el("div", { class: "sn-mini" }, "Enter a query. This searches across all notes on this site."));
      mainContent.appendChild(panel);
      return;
    }

    const matches = grepMatches();
    const gp = paginate(matches, ui.grepPage);
    ui.grepPage = gp.page;

    const list = el("div", { class: "sn-list" });

    for (const m of gp.slice) {
      const note = getNote(m.noteId);
      if (!note) continue;
      const folder = getFolder(m.folderId);
      const name = displayNoteName(note);

      const item = el("div", {
        class: "sn-item",
        onclick: () => {
          state.data.selFolder = note.folderId;
          state.data.selNote = note.id;
          ui.scene = "notes";
          save();
          renderAll();
          focusEditorSoon();
        }
      }, [
        el("div", { style: { minWidth: 0 } }, [
          el("div", { class: "sn-item-name", title: name }, name),
          el("div", { class: "sn-item-meta" }, `${folder ? folder.name : "Folder"} • match`)
        ])
      ]);

      const preview = el("div", { class: "sn-mini", style: { marginTop: "6px", opacity: ".85" } });
      preview.innerHTML = highlightSnippet(m.snippet, q);
      item.appendChild(preview);

      list.appendChild(item);
    }

    const pager = el("div", { class: "sn-pager" }, [
      el("div", { class: "sn-mini" }, `${gp.total} matches • Page ${gp.page}/${gp.pages}`),
      el("div", { class: "sn-row" }, [
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.grepPage = 1; renderAll(); } }, "⟪"),
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.grepPage = clamp(ui.grepPage - 1, 1, gp.pages); renderAll(); } }, "‹"),
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.grepPage = clamp(ui.grepPage + 1, 1, gp.pages); renderAll(); } }, "›"),
        el("button", { class: "sn-btn sn-ghost", onclick: () => { ui.grepPage = gp.pages; renderAll(); } }, "⟫"),
      ])
    ]);

    panel.append(list, pager);
    mainContent.appendChild(panel);
  }

  function renderSettingsScene() {
    mainContent.innerHTML = "";

    const panel = el("div", { class: "sn-panel" }, [
      el("div", { class: "sn-panel-title" }, "Settings"),
    ]);

    const form = el("div", { style: { display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px", alignItems: "center" } });

    const wInput = el("input", { class: "sn-input", type: "number", min: "360", max: "2000", value: String(state.ui.w) });
    const hInput = el("input", { class: "sn-input", type: "number", min: "280", max: "2000", value: String(state.ui.h) });
    const xInput = el("input", { class: "sn-input", type: "number", value: String(state.ui.x ?? "") });
    const yInput = el("input", { class: "sn-input", type: "number", value: String(state.ui.y ?? "") });
    const psInput = el("input", { class: "sn-input", type: "number", min: "5", max: "100", value: String(state.ui.pageSize) });

    form.append(
      el("div", { class: "sn-mini" }, "Width"), wInput,
      el("div", { class: "sn-mini" }, "Height"), hInput,
      el("div", { class: "sn-mini" }, "X (left)"), xInput,
      el("div", { class: "sn-mini" }, "Y (top)"), yInput,
      el("div", { class: "sn-mini" }, "Page size"), psInput,
    );

    const actions = el("div", { class: "sn-row", style: { marginTop: "12px" } }, [
      el("button", { class: "sn-btn", onclick: () => {
        state.ui.w = clamp(parseInt(wInput.value, 10) || 600, 360, 2000);
        state.ui.h = clamp(parseInt(hInput.value, 10) || 600, 280, 2000);

        const xv = xInput.value.trim();
        const yv = yInput.value.trim();
        state.ui.x = xv === "" ? null : parseInt(xv, 10);
        state.ui.y = yv === "" ? null : parseInt(yv, 10);

        state.ui.pageSize = clamp(parseInt(psInput.value, 10) || 15, 5, 100);

        applyGeom();
        save();
        renderAll();
      }}, "Apply"),
      el("button", { class: "sn-btn sn-ghost", onclick: () => {
        // reset UI only
        state.ui.x = null;
        state.ui.y = null;
        state.ui.w = 600;
        state.ui.h = 600;
        state.ui.sidebar = true;
        state.ui.pageSize = 15;
        applyGeom();
        save();
        renderAll();
      }}, "Reset defaults"),
      el("button", { class: "sn-btn sn-ghost", onclick: () => {
        state.ui.sidebar = !state.ui.sidebar;
        save();
        renderLayout();
      }}, state.ui.sidebar ? "Hide sidebar" : "Show sidebar"),
    ]);

    const info = el("div", { class: "sn-mini", style: { marginTop: "10px" } }, [
      "Leave X/Y empty to use default positioning. ",
      "Press ",
      el("span", { class: "sn-kbd" }, "Esc"),
      " to close."
    ]);

    panel.append(form, actions, info);
    mainContent.appendChild(panel);
  }

  function renderMain() {
    setCrumbs();
    renderSceneButtons();

    if (ui.scene === "settings") renderSettingsScene();
    else if (ui.scene === "grep") renderGrepScene();
    else renderNotesScene();
  }

  function renderAll() {
    ensureSelection();
    renderLayout();
    renderSidebar();
    renderMain();
  }

  // ==========
  // Initial
  // ==========
  applyGeom();
  renderAll();
  show();

})();
