(function () {
  if (window.__SUPER_NOTES_APP__) return;
  window.__SUPER_NOTES_APP__ = true;

  const HOST = location.hostname || "unknown";
  const KEY = "super-notes:" + HOST;

  const DEFAULT = {
    x: null,
    y: null,
    w: 600,
    h: 600,
    notes: [],
    selected: null,
    pageSize: 15
  };

  function load() {
    try {
      return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      return Object.assign({}, DEFAULT);
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  const state = load();

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function autoName(t) {
    return (t || "").trim().split("\n")[0] || "Untitled";
  }

  /* ---------- Styles (SAFE) ---------- */

  if (!document.getElementById("super-notes-style")) {
    const style = document.createElement("style");
    style.id = "super-notes-style";
    style.textContent = `
#super-notes-root{
  position:fixed;
  inset:0;
  z-index:2147483647;
  background:rgba(0,0,0,.4);
  font-family:system-ui,-apple-system,Segoe UI,Roboto
}
#super-notes-window{
  position:absolute;
  background:#0d1117;
  color:#e6edf3;
  border-radius:14px;
  border:1px solid #30363d;
  box-shadow:0 20px 80px rgba(0,0,0,.6);
  display:flex;
  flex-direction:column;
  overflow:hidden
}
.sn-header{
  height:42px;
  background:#161b22;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 12px;
  cursor:move;
  user-select:none
}
.sn-body{flex:1;display:flex}
.sn-list{
  width:220px;
  border-right:1px solid #30363d;
  background:#010409;
  padding:10px;
  overflow:auto
}
.sn-item{
  padding:8px 10px;
  border-radius:8px;
  background:#161b22;
  margin-bottom:6px;
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
.sn-btn{
  background:#21262d;
  border:1px solid #30363d;
  color:#e6edf3;
  padding:4px 8px;
  border-radius:8px;
  cursor:pointer;
  font-size:12px
}
    `;
    document.head.appendChild(style);
  }

  /* ---------- DOM ---------- */

  const root = document.createElement("div");
  root.id = "super-notes-root";

  const win = document.createElement("div");
  win.id = "super-notes-window";

  root.appendChild(win);
  document.body.appendChild(root);

  /* ---------- Geometry ---------- */

  function applyGeom() {
    const w = state.w;
    const h = state.h;
    win.style.width = w + "px";
    win.style.height = h + "px";
    win.style.left = (state.x ?? (innerWidth - w) / 2) + "px";
    win.style.top = (state.y ?? 40) + "px";
  }

  /* ---------- Drag ---------- */

  let drag = null;
  win.addEventListener("mousedown", e => {
    if (!e.target.closest(".sn-header")) return;
    drag = { x: e.clientX, y: e.clientY, ox: state.x ?? 0, oy: state.y ?? 40 };
  });

  window.addEventListener("mousemove", e => {
    if (!drag) return;
    state.x = drag.ox + e.clientX - drag.x;
    state.y = drag.oy + e.clientY - drag.y;
    applyGeom();
  });

  window.addEventListener("mouseup", () => {
    if (drag) save();
    drag = null;
  });

  /* ---------- Header ---------- */

  const header = document.createElement("div");
  header.className = "sn-header";
  header.innerHTML = `
    <div>Super Notes — ${HOST}</div>
    <div>
      <button class="sn-btn" id="sn-new">+</button>
      <button class="sn-btn" id="sn-close">✕</button>
    </div>
  `;

  /* ---------- Body ---------- */

  const body = document.createElement("div");
  body.className = "sn-body";

  const list = document.createElement("div");
  list.className = "sn-list";

  const editor = document.createElement("textarea");
  editor.className = "sn-editor";
  editor.placeholder = "Write…";

  body.append(list, editor);
  win.append(header, body);

  /* ---------- Logic ---------- */

  function newNote() {
    const n = { id: uid(), body: "" };
    state.notes.unshift(n);
    state.selected = n.id;
    save();
    render();
    editor.focus();
  }

  function render() {
    list.innerHTML = "";
    state.notes.slice(0, state.pageSize).forEach(n => {
      const d = document.createElement("div");
      d.className = "sn-item" + (n.id === state.selected ? " active" : "");
      d.textContent = autoName(n.body);
      d.onclick = () => {
        state.selected = n.id;
        save();
        render();
      };
      list.appendChild(d);
    });

    const n = state.notes.find(n => n.id === state.selected);
    editor.value = n ? n.body : "";
  }

  editor.oninput = () => {
    const n = state.notes.find(n => n.id === state.selected);
    if (!n) return;
    n.body = editor.value;
    save();
    render();
  };

  /* ---------- Events ---------- */

  document.getElementById("sn-new").onclick = newNote;
  document.getElementById("sn-close").onclick = () => root.remove();

  applyGeom();
  render();

})();
