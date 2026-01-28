(() => {
  /* ===============================
     Super Notes – Remote Bookmarklet App
     =============================== */

  if (window.__SUPER_NOTES_APP__) return;
  window.__SUPER_NOTES_APP__ = true;

  const HOST = location.hostname || "unknown";
  const KEY = `super-notes:${HOST}`;

  const DEFAULT = {
    ui: {
      x: null,
      y: null,
      w: 600,
      h: 600,
      sidebar: true,
      pageSize: 15
    },
    data: {
      folders: [{ id: "inbox", name: "Inbox" }],
      notes: [],
      selFolder: "inbox",
      selNote: null
    }
  };

  const $ = (t, p = {}, c) => {
    const e = document.createElement(t);
    for (const k in p) {
      if (k === "style") Object.assign(e.style, p[k]);
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), p[k]);
      else e[k] = p[k];
    }
    if (c) (Array.isArray(c) ? c : [c]).forEach(x =>
      e.append(x.nodeType ? x : document.createTextNode(x))
    );
    return e;
  };

  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      return s ? { ...DEFAULT, ...s } : structuredClone(DEFAULT);
    } catch {
      return structuredClone(DEFAULT);
    }
  };

  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const autoName = t => (t || "").trim().split("\n")[0]?.slice(0, 60) || "Untitled";

  let state = load();
  let page = 1;
  let grepQ = "";

  /* ===============================
     Root + Window
     =============================== */

  const root = $("div", { id: "sn-root" });
  const modal = $("div", { className: "sn-win" });

  root.append(modal);
  document.body.append(root);

  /* ===============================
     Styles
     =============================== */

  $("style", {
    textContent: `
#sn-root{
  position:fixed;inset:0;z-index:2147483647;
  background:rgba(0,0,0,.4);
  font-family:system-ui,-apple-system,Segoe UI,Roboto
}
.sn-win{
  position:absolute;
  background:#0d1117;
  color:#e6edf3;
  border-radius:14px;
  border:1px solid #30363d;
  box-shadow:0 20px 80px rgba(0,0,0,.6);
  overflow:hidden;
  display:flex;
  flex-direction:column
}
.sn-header{
  height:42px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 12px;
  background:#161b22;
  cursor:move;
  user-select:none
}
.sn-body{flex:1;display:flex}
.sn-sidebar{
  width:220px;
  border-right:1px solid #30363d;
  background:#0d1117;
  padding:10px;
  overflow:auto
}
.sn-main{flex:1;display:flex;flex-direction:column}
.sn-list{display:flex;flex-direction:column;gap:6px}
.sn-item{
  padding:8px 10px;
  border-radius:8px;
  background:#161b22;
  cursor:pointer;
  font-size:13px
}
.sn-item.active{background:#1f6feb}
.sn-editor{
  flex:1;
  margin:10px;
  background:#010409;
  border:1px solid #30363d;
  border-radius:10px;
  padding:10px;
  color:#e6edf3;
  resize:none
}
.sn-row{display:flex;gap:6px;margin-bottom:6px}
.sn-btn{
  background:#21262d;
  border:1px solid #30363d;
  color:#e6edf3;
  padding:4px 8px;
  border-radius:8px;
  cursor:pointer;
  font-size:12px
}
.sn-btn:hover{background:#30363d}
.sn-search{
  width:100%;
  padding:6px;
  border-radius:8px;
  border:1px solid #30363d;
  background:#010409;
  color:#e6edf3;
  margin-bottom:8px
}
.sn-footer{
  display:flex;
  justify-content:space-between;
  padding:8px;
  border-top:1px solid #30363d
}
    `
  }, document.head);

  /* ===============================
     Geometry + Drag
     =============================== */

  const applyGeom = () => {
    const w = state.ui.w;
    const h = state.ui.h;
    modal.style.width = w + "px";
    modal.style.height = h + "px";
    modal.style.left = (state.ui.x ?? (innerWidth - w) / 2) + "px";
    modal.style.top = (state.ui.y ?? 40) + "px";
  };

  let drag;
  modal.addEventListener("mousedown", e => {
    if (!e.target.closest(".sn-header")) return;
    drag = { x: e.clientX, y: e.clientY, ox: state.ui.x ?? 0, oy: state.ui.y ?? 40 };
  });

  window.addEventListener("mousemove", e => {
    if (!drag) return;
    state.ui.x = drag.ox + (e.clientX - drag.x);
    state.ui.y = drag.oy + (e.clientY - drag.y);
    applyGeom();
  });

  window.addEventListener("mouseup", () => {
    if (drag) save();
    drag = null;
  });

  /* ===============================
     Header
     =============================== */

  const header = $("div", { className: "sn-header" }, [
    $("div", {}, `Super Notes — ${HOST}`),
    $("div", {}, [
      $("button", { className: "sn-btn", onclick: () => newNote() }, "+"),
      $("button", { className: "sn-btn", onclick: () => root.remove() }, "✕")
    ])
  ]);

  /* ===============================
     Sidebar
     =============================== */

  const sidebar = $("div", { className: "sn-sidebar" });
  const search = $("input", {
    className: "sn-search",
    placeholder: "Search names…",
    oninput: () => render()
  });

  sidebar.append(search);

  /* ===============================
     Main
     =============================== */

  const main = $("div", { className: "sn-main" });
  const editor = $("textarea", {
    className: "sn-editor",
    placeholder: "Write…",
    oninput: () => {
      const n = note();
      if (!n) return;
      n.body = editor.value;
      save();
      render();
    }
  });

  /* ===============================
     Logic
     =============================== */

  const folder = () => state.data.folders.find(f => f.id === state.data.selFolder);
  const note = () => state.data.notes.find(n => n.id === state.data.selNote);

  const newNote = () => {
    const n = { id: uid(), folder: state.data.selFolder, body: "" };
    state.data.notes.unshift(n);
    state.data.selNote = n.id;
    save();
    render();
    editor.focus();
  };

  /* ===============================
     Render
     =============================== */

  function render() {
    sidebar.innerHTML = "";
    sidebar.append(search);

    const q = search.value.toLowerCase();

    const notes = state.data.notes
      .filter(n => n.folder === state.data.selFolder)
      .filter(n => autoName(n.body).toLowerCase().includes(q));

    const pages = Math.max(1, Math.ceil(notes.length / state.ui.pageSize));
    page = Math.min(page, pages);

    notes
      .slice((page - 1) * state.ui.pageSize, page * state.ui.pageSize)
      .forEach(n => {
        sidebar.append(
          $("div", {
            className: "sn-item" + (n.id === state.data.selNote ? " active" : ""),
            onclick: () => {
              state.data.selNote = n.id;
              save();
              render();
            }
          }, autoName(n.body))
        );
      });

    main.innerHTML = "";
    main.append(editor);

    const n = note();
    editor.value = n ? n.body : "";
  }

  /* ===============================
     Init
     =============================== */

  modal.append(header, $("div", { className: "sn-body" }, [sidebar, main]));
  applyGeom();
  render();

})();
